import { delay } from '@/shared/utils/time/delay.utils'
import { Injectable, Logger } from '@nestjs/common'
import { IBrowserPoolEntry, IImdbConfig } from '../config/imdb-config.interface'
import { getImdbConfig } from '../config/imdb.config'
import { RawLocation } from '../interfaces/raw-location.interface'

import * as fs from 'fs/promises'
import * as path from 'path'
import * as puppeteer from 'puppeteer'

@Injectable()
export class FilmingLocationParserService {
    private readonly logger = new Logger(FilmingLocationParserService.name)
    private readonly config: IImdbConfig
    private readonly screenshotsDir: string

    private browserPool: IBrowserPoolEntry[] = []

    constructor() {
        this.config = getImdbConfig()
        this.screenshotsDir = path.join(process.cwd(), 'screenshots')
        this.ensureScreenshotsDirExists()
        process.on('beforeExit', async () => {
            await this.cleanupBrowsers()
        })
    }

    async getFilmingLocations(imdbId: string): Promise<RawLocation[]> {
        return this.processWithRetry(async () => {
            await this.initializeBrowserPool()
            const browser = await this.getAvailableBrowser()

            try {
                const page = await this.setupPage(browser)
                const locations = await this.processPage(page, imdbId)
                return locations
            } finally {
                this.releaseBrowser(browser)
            }
        })
    }

    private async processWithRetry<T>(
        fn: () => Promise<T>,
        retries: number = this.config.processing.maxRetries,
    ): Promise<T> {
        try {
            return await fn()
        } catch (error) {
            if (retries > 0) {
                this.logger.debug(
                    `Retry attempt ${this.config.processing.maxRetries - retries + 1} after error: ${error.message}`,
                )
                await delay(
                    this.config.timing.delay.requests *
                        (this.config.processing.maxRetries - retries + 1),
                )
                return this.processWithRetry(fn, retries - 1)
            }
            throw error
        }
    }

    private async processPage(
        page: puppeteer.Page,
        imdbId: string,
    ): Promise<RawLocation[]> {
        try {
            await page.goto(`${this.config.baseUrl}/${imdbId}/locations`, {
                waitUntil: 'domcontentloaded',
                timeout: this.config.timing.timeout.page,
            })

            if (await this.checkForNoLocations(page)) {
                this.logger.debug(`No locations section found for ${imdbId}`)
                return []
            }

            try {
                await page.waitForSelector(
                    this.config.selectors.locations.section,
                    {
                        visible: true,
                        timeout: this.config.timing.timeout.element,
                    },
                )
            } catch {
                this.logger.debug(
                    `Section selector not found for ${imdbId}, checking fallback selectors`,
                )
                await page.waitForSelector(
                    this.config.selectors.locations.noContentSection,
                    {
                        visible: true,
                        timeout: this.config.timing.timeout.element / 2,
                    },
                )
                return []
            }

            await this.expandLocationsList(page)
            return await this.parseLocations(page)
        } catch (error) {
            this.logger.warn(
                `Processing failed for ${imdbId}: ${error.message}`,
            )
            await this.takeFailureScreenshot(page, imdbId, error.message)
            return []
        } finally {
            await page.close().catch((error) => {
                this.logger.warn(`Failed to close page: ${error.message}`)
            })
        }
    }

    private async initializeBrowserPool(): Promise<void> {
        this.browserPool = (
            await Promise.all(
                this.browserPool.map(async (browserInfo) => {
                    try {
                        if (browserInfo.browser.isConnected())
                            return browserInfo
                        await browserInfo.browser.close().catch(() => {})
                    } catch (error) {
                        this.logger.warn(
                            `Error checking browser connection: ${error.message}`,
                        )
                    }
                    return null
                }),
            )
        ).filter(Boolean)

        while (this.browserPool.length < this.config.browser.pool.minSize) {
            try {
                const browser = await puppeteer.launch({
                    headless: true,
                    args: this.config.browser.args,
                    timeout: this.config.timing.timeout.browser,
                })

                this.browserPool.push({
                    browser,
                    available: true,
                    pages: 0,
                    lastUsed: Date.now(),
                    errors: 0,
                })
                this.logger.debug(
                    `Added new browser to pool. Current size: ${this.browserPool.length}`,
                )
            } catch (error) {
                this.logger.error('Browser initialization failed:', error)
                await delay(1000)
            }
        }
    }

    private async parseLocations(page: puppeteer.Page): Promise<RawLocation[]> {
        try {
            return await page.evaluate(({ locations }) => {
                const locationCards = Array.from(
                    document.querySelectorAll(locations.card),
                )

                if (locationCards.length === 0) {
                    return []
                }

                return locationCards
                    .map((card) => {
                        const link = card
                            .querySelector(locations.link)
                            ?.textContent?.trim()
                        const desc = card
                            .querySelector(locations.description)
                            ?.textContent?.trim()

                        if (
                            !link ||
                            link === 'Create account' ||
                            link.toLowerCase() === 'location'
                        )
                            return null

                        if (desc?.toLowerCase() === 'location') return null

                        return {
                            address: link.replace(/\s+/g, ' '),
                            description: desc?.replace(/^\(|\)$/g, '') || '',
                        }
                    })
                    .filter(Boolean)
                    .filter(({ address }) => {
                        const parts = address.split(',').filter((p) => p.trim())
                        return parts.length >= 2
                    })
            }, this.config.selectors)
        } catch (error) {
            this.logger.warn(`Error parsing locations: ${error.message}`)
            return []
        }
    }

    private releaseBrowser(browser: puppeteer.Browser): void {
        const browserInfo = this.browserPool.find((b) => b.browser === browser)
        if (!browserInfo) return

        browserInfo.pages = Math.max(0, browserInfo.pages - 1)
        browserInfo.available = true
        browserInfo.lastUsed = Date.now()

        if (
            browserInfo.errors > 2 ||
            Date.now() - browserInfo.lastUsed > 30 * 60 * 1000
        ) {
            this.replaceBrowserInstance(browserInfo)
        }
    }

    private async replaceBrowserInstance(
        browserInfo: IBrowserPoolEntry,
    ): Promise<void> {
        try {
            this.logger.debug('Replacing browser instance due to errors or age')
            await browserInfo.browser.close().catch((err) => {
                this.logger.warn(`Error closing browser: ${err.message}`)
            })

            const newBrowser = await puppeteer.launch({
                headless: true,
                args: this.config.browser.args,
                timeout: this.config.timing.timeout.browser,
            })

            Object.assign(browserInfo, {
                browser: newBrowser,
                errors: 0,
                pages: 0,
                lastUsed: Date.now(),
            })
        } catch (error) {
            this.logger.error('Failed to replace browser:', error)
        }
    }

    private async getAvailableBrowser(): Promise<puppeteer.Browser> {
        const maxAttempts = this.config.browser.pool.retrieveAttempts
        let attempts = 0

        while (attempts < maxAttempts) {
            const availableBrowser = this.browserPool
                .filter((b) => b.available && b.errors < 3)
                .sort((a, b) => {
                    if (a.pages === b.pages) return a.lastUsed - b.lastUsed
                    return a.pages - b.pages
                })[0]

            if (availableBrowser) {
                availableBrowser.pages++
                availableBrowser.lastUsed = Date.now()

                if (
                    availableBrowser.pages >=
                    this.config.browser.pool.concurrentPages
                ) {
                    availableBrowser.available = false
                }

                return availableBrowser.browser
            }

            if (this.browserPool.length < this.config.browser.pool.maxSize) {
                this.logger.debug('Adding additional browser to pool')
                const browser = await puppeteer.launch({
                    headless: true,
                    args: this.config.browser.args,
                    timeout: this.config.timing.timeout.browser,
                })

                const newBrowserInfo = {
                    browser,
                    available: true,
                    pages: 1,
                    lastUsed: Date.now(),
                    errors: 0,
                }

                this.browserPool.push(newBrowserInfo)
                return browser
            }

            if (attempts === maxAttempts - 1) {
                await this.recreateBrowserPool()
            }

            await delay(this.config.timing.timeout.browserWait)
            attempts++
        }

        throw new Error('No available browsers after multiple attempts')
    }

    private async recreateBrowserPool(): Promise<void> {
        this.logger.debug('Recreating entire browser pool')
        await this.cleanupBrowsers()
        await this.initializeBrowserPool()
    }

    private async setupPage(
        browser: puppeteer.Browser,
    ): Promise<puppeteer.Page> {
        const page = await browser.newPage()

        await Promise.all([
            page.setUserAgent(this.config.browser.userAgent),
            page.setViewport(this.config.browser.viewport),
            page.setRequestInterception(true),
            page.setCacheEnabled(true),
            page.setDefaultNavigationTimeout(this.config.timing.timeout.page),
            page.setDefaultTimeout(this.config.timing.timeout.element),
        ])

        page.on('request', (request) => {
            const resourceType = request.resourceType()
            if (
                ['image', 'stylesheet', 'font', 'media'].includes(resourceType)
            ) {
                request.abort()
            } else {
                request.continue()
            }
        })

        return page
    }

    private async checkForNoLocations(page: puppeteer.Page): Promise<boolean> {
        try {
            return await page.evaluate(
                (selector, substring) => {
                    const element = document.querySelector(selector)
                    return element?.textContent?.includes(substring) ?? false
                },
                this.config.selectors.locations.noContentSection,
                this.config.noLocationsMessagePattern,
            )
        } catch (error) {
            this.logger.debug(
                `Error checking for no locations: ${error.message}`,
            )
            return false
        }
    }

    private async expandLocationsList(page: puppeteer.Page): Promise<void> {
        try {
            let expansionAttempts = 0
            const maxExpansionAttempts = 5
            const expansionTimeout = 6000

            while (expansionAttempts < maxExpansionAttempts) {
                await page.evaluate(() => window.scrollBy(0, 300))
                await delay(500)

                const moreBtn = await page.$(
                    this.config.selectors.locations.expandButtons.more,
                )
                const allBtn = await page.$(
                    this.config.selectors.locations.expandButtons.all,
                )

                if (!moreBtn && !allBtn) {
                    this.logger.debug(
                        'No more expansion buttons found, list is fully expanded',
                    )
                    break
                }

                const seeMoreButton = moreBtn || allBtn

                this.logger.debug(
                    `Found "See more" button, expanding list (attempt ${expansionAttempts + 1})`,
                )

                const initialCount = await page.$$eval(
                    this.config.selectors.locations.card,
                    (cards) => cards.length,
                )

                await page.evaluate((btn) => {
                    btn.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }, seeMoreButton)

                await delay(1000)

                const buttonBox = await seeMoreButton.boundingBox()
                if (!buttonBox) {
                    this.logger.debug('Button is not visible, skipping click')
                    expansionAttempts++
                    continue
                }

                await page.mouse.click(
                    buttonBox.x + buttonBox.width / 2,
                    buttonBox.y + buttonBox.height / 2,
                    { delay: 100 },
                )

                await delay(1000)

                try {
                    await page.waitForFunction(
                        (selector, oldCount) => {
                            const cards = document.querySelectorAll(selector)
                            return cards.length > oldCount
                        },
                        { timeout: expansionTimeout },
                        this.config.selectors.locations.card,
                        initialCount,
                    )

                    await delay(1500)

                    const newCount = await page.$$eval(
                        this.config.selectors.locations.card,
                        (cards) => cards.length,
                    )

                    if (newCount <= initialCount) {
                        this.logger.debug(
                            `List did not expand as expected. Old count: ${initialCount}, New count: ${newCount}`,
                        )
                        await this.takeScreenshot(
                            page,
                            `expansion_failed_${expansionAttempts}_${Date.now()}`,
                        )
                    } else {
                        this.logger.debug(
                            `Successfully expanded list, now have ${newCount} cards`,
                        )
                    }
                } catch (expandError) {
                    this.logger.debug(
                        `List expansion timeout: ${expandError.message}`,
                    )
                    await this.takeScreenshot(
                        page,
                        `expansion_timeout_${expansionAttempts}_${Date.now()}`,
                    )

                    try {
                        await seeMoreButton.click({ delay: 100 })
                        await delay(2000)
                    } catch (clickError) {
                        this.logger.debug(
                            `Failed to click button: ${clickError.message}`,
                        )
                    }
                }

                expansionAttempts++
            }

            if (expansionAttempts >= maxExpansionAttempts) {
                this.logger.debug(
                    `Reached max expansion attempts (${maxExpansionAttempts})`,
                )
            }
        } catch (error) {
            this.logger.debug(
                `Error expanding locations list: ${error.message}`,
            )
            await this.takeScreenshot(page, `expansion_error_${Date.now()}`)
        }
    }

    private async cleanupBrowsers(): Promise<void> {
        this.logger.log('Cleaning up browser pool...')
        await Promise.allSettled(
            this.browserPool.map(async ({ browser }) => {
                try {
                    await browser.close()
                } catch (error) {
                    this.logger.warn(`Error closing browser: ${error.message}`)
                }
            }),
        )
        this.browserPool = []
    }

    private async ensureScreenshotsDirExists(): Promise<void> {
        try {
            await fs.mkdir(this.screenshotsDir, { recursive: true })
            this.logger.log(
                `Screenshots directory created at: ${this.screenshotsDir}`,
            )
        } catch (error) {
            this.logger.error(
                `Failed to create screenshots directory: ${error.message}`,
            )
        }
    }

    private async takeFailureScreenshot(
        page: puppeteer.Page,
        imdbId: string,
        errorMessage: string,
    ): Promise<void> {
        try {
            const screenshotPath = path.join(
                this.screenshotsDir,
                `${imdbId}_error_${imdbId}.png`,
            )
            await page.screenshot({ path: screenshotPath, fullPage: true })
            this.logger.log(
                `Error screenshot saved to ${screenshotPath} (${errorMessage})`,
            )
        } catch (error) {
            this.logger.warn(
                `Failed to take error screenshot: ${error.message}`,
            )
        }
    }

    private async takeScreenshot(
        page: puppeteer.Page,
        imdbId: string,
    ): Promise<void> {
        try {
            const section = await page.$(
                this.config.selectors.locations.section,
            )
            if (section) {
                const screenshotPath = path.join(
                    this.screenshotsDir,
                    `${imdbId}.png`,
                )
                await section.screenshot({ path: screenshotPath })
                this.logger.debug(`Screenshot saved to ${screenshotPath}`)
            } else {
                const fullScreenshotPath = path.join(
                    this.screenshotsDir,
                    `${imdbId}_full.png`,
                )
                await page.screenshot({
                    path: fullScreenshotPath,
                    fullPage: true,
                })
                this.logger.debug(
                    `Full page screenshot saved to ${fullScreenshotPath}`,
                )
            }
        } catch (error) {
            this.logger.warn(`Failed to take screenshot: ${error.message}`)
        }
    }
}
