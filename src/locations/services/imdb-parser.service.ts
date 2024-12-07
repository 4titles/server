import * as puppeteer from 'puppeteer'
import { Injectable, Logger } from '@nestjs/common'
import { RawLocation } from '../interfaces/raw-location.interface'

@Injectable()
export class ImdbParserService {
    private readonly logger = new Logger(ImdbParserService.name)
    private browser: puppeteer.Browser | null = null

    private readonly CONFIG = {
        BROWSER_POOL_SIZE: 5,
        CONCURRENT_PAGES: 3,
        CHUNK_SIZE: 10,
        MAX_RETRIES: 2,
        TIMEOUT: {
            BROWSER: 20000,
            PAGE: 12000,
            ELEMENT: 5000,
            WAIT_FOR_BROWSER: 5000,
        },
        DELAY: {
            BETWEEN_REQUESTS: 1500,
            BETWEEN_CHUNKS: 3000,
        },
        VIEWPORT: { width: 1920, height: 1080 },
        USER_AGENT:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        BROWSER_ARGS: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
        ],
        RETRY: {
            ATTEMPTS: 2,
            DELAY: 2000,
        },
        SELECTORS: {
            LOCATIONS_SECTION: '[data-testid="sub-section-flmg_locations"]',
            SEE_MORE_BUTTON: 'button.ipc-see-more__button',
            LOCATION_CARD: '.ipc-list-card',
            LOCATION_LINK: '.ipc-link',
            LOCATION_DESCRIPTION: '[data-testid="item-attributes"]',
            NO_LOCATIONS_SECTION: '.ipc-page-section--base',
            LOCATIONS_LIST: '#filming_locations .ipc-metadata-list__item',
        },
        NO_LOCATIONS_MESSAGE:
            "It looks like we don't have any filming & production for this title yet.",
        TIMEOUT_ERROR: 'TimeoutError',
        BASE_URL: 'https://www.imdb.com/title',
    }

    constructor() {
        process.on('beforeExit', async () => {
            await this.cleanupBrowsers()
        })
    }

    private browserPool: Array<{
        browser: puppeteer.Browser
        available: boolean
        pages: number
        lastUsed: number
        errors: number
    }> = []

    async getFilmingLocations(imdbId: string): Promise<RawLocation[]> {
        await this.initializeBrowserPool()
        let browser: puppeteer.Browser | null = null

        try {
            this.logger.log('Getting available browser...')
            browser = await this.getAvailableBrowser()
            this.logger.log('Browser acquired, processing IMDb ID...')
            return await this.processImdbId(imdbId, browser)
        } finally {
            if (browser) {
                this.releaseBrowser(browser)
            }
        }
    }

    async batchGetFilmingLocations(
        imdbIds: string[],
    ): Promise<Map<string, RawLocation[]>> {
        const results = new Map<string, RawLocation[]>()
        const chunks = this.chunkArray(imdbIds, this.CONFIG.CHUNK_SIZE)
        const failedIds = new Set<string>()

        this.logger.log(
            `Processing ${imdbIds.length} IDs in ${chunks.length} chunks`,
        )

        try {
            await this.initializeBrowserPool(this.CONFIG.BROWSER_POOL_SIZE)
            for (
                let i = 0;
                i < chunks.length;
                i += this.CONFIG.CONCURRENT_PAGES
            ) {
                const currentChunks = chunks.slice(
                    i,
                    i + this.CONFIG.CONCURRENT_PAGES,
                )
                const chunkPromises = currentChunks.map((chunk) =>
                    this.processChunkWithRetries(chunk),
                )

                const chunkResults = await Promise.all(chunkPromises)

                chunkResults.flat().forEach(({ id, locations, success }) => {
                    if (success) {
                        results.set(id, locations)
                    } else {
                        failedIds.add(id)
                    }
                })

                if (i + this.CONFIG.CONCURRENT_PAGES < chunks.length) {
                    await this.delay(this.CONFIG.DELAY.BETWEEN_CHUNKS)
                }
            }

            if (failedIds.size > 0) {
                const retryResults = await this.retryFailedIds(
                    Array.from(failedIds),
                )
                retryResults.forEach((locations, id) =>
                    results.set(id, locations),
                )
            }
        } finally {
            await this.cleanupBrowsers()
        }

        return results
    }

    private async initializeBrowserPool(
        minBrowsers: number = 1,
    ): Promise<void> {
        this.browserPool = this.browserPool.filter(({ browser }) => {
            try {
                return !browser.process()?.killed
            } catch {
                return false
            }
        })

        if (this.browserPool.length >= minBrowsers) return

        const browsersToInit = minBrowsers - this.browserPool.length

        for (let i = 0; i < browsersToInit; i++) {
            try {
                const browser = await puppeteer.launch({
                    headless: true,
                    args: this.CONFIG.BROWSER_ARGS,
                    timeout: this.CONFIG.TIMEOUT.BROWSER,
                })

                this.browserPool.push({
                    browser,
                    available: true,
                    pages: 0,
                    lastUsed: Date.now(),
                    errors: 0,
                })
            } catch (error) {
                this.logger.error('Failed to initialize browser:', error)
            }
        }
    }

    private async getAvailableBrowser(): Promise<puppeteer.Browser> {
        const maxAttempts = 5
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

                if (availableBrowser.pages >= this.CONFIG.CONCURRENT_PAGES) {
                    availableBrowser.available = false
                }

                return availableBrowser.browser
            }

            if (attempts === maxAttempts - 1) {
                await this.recreateBrowserPool()
            }

            await this.delay(this.CONFIG.TIMEOUT.WAIT_FOR_BROWSER)
            attempts++
        }

        throw new Error('No available browsers')
    }

    private async recreateBrowserPool(): Promise<void> {
        await this.cleanupBrowsers()
        await this.initializeBrowserPool(this.CONFIG.BROWSER_POOL_SIZE)
    }

    private async processImdbId(
        imdbId: string,
        browser: puppeteer.Browser,
    ): Promise<RawLocation[]> {
        let page: puppeteer.Page | null = null

        try {
            page = await this.setupPage(browser)

            await Promise.all([
                page.waitForNavigation({ timeout: this.CONFIG.TIMEOUT.PAGE }),
                page.goto(`${this.CONFIG.BASE_URL}/${imdbId}/locations`),
            ])

            const noLocations = await this.checkForNoLocations(page)
            if (noLocations) return []

            await page.waitForSelector(
                this.CONFIG.SELECTORS.LOCATIONS_SECTION,
                {
                    timeout: this.CONFIG.TIMEOUT.ELEMENT,
                },
            )

            await this.expandLocationsList(page)
            return await this.parseLocations(page)
        } catch (error) {
            const browserInfo = this.browserPool.find(
                (b) => b.browser === browser,
            )
            if (browserInfo) browserInfo.errors++

            if (error.name === this.CONFIG.TIMEOUT_ERROR) {
                this.logger.warn(`Timeout while processing IMDb ID ${imdbId}`)
            } else {
                this.logger.error(
                    `Failed to parse locations for IMDb ID ${imdbId}:`,
                    error,
                )
            }
            return []
        } finally {
            if (page) {
                try {
                    await page.close()
                } catch (error) {
                    this.logger.error(
                        `Error closing page for IMDb ID ${imdbId}:`,
                        error,
                    )
                }
            }
        }
    }

    private async processChunkWithRetries(
        chunk: string[],
    ): Promise<
        Array<{ id: string; locations: RawLocation[]; success: boolean }>
    > {
        const browserPromises = chunk.map(async (id) => {
            let retries = 0
            while (retries < this.CONFIG.MAX_RETRIES) {
                try {
                    const browser = await this.getAvailableBrowser()
                    const locations = await this.processImdbId(id, browser)
                    this.releaseBrowser(browser)
                    return { id, locations, success: true }
                } catch {
                    retries++
                    await this.delay(
                        this.CONFIG.DELAY.BETWEEN_REQUESTS * retries,
                    )
                }
            }
            return { id, locations: [], success: false }
        })

        return await Promise.all(browserPromises)
    }

    private async retryFailedIds(
        failedIds: string[],
    ): Promise<Map<string, RawLocation[]>> {
        const results = new Map<string, RawLocation[]>()
        const retryChunks = this.chunkArray(
            failedIds,
            Math.ceil(this.CONFIG.CHUNK_SIZE / 2),
        )

        for (const chunk of retryChunks) {
            const chunkResults = await this.processChunkWithRetries(chunk)
            chunkResults
                .filter(({ success }) => success)
                .forEach(({ id, locations }) => results.set(id, locations))

            await this.delay(this.CONFIG.DELAY.BETWEEN_CHUNKS * 2)
        }

        return results
    }

    private async setupPage(
        browser: puppeteer.Browser,
    ): Promise<puppeteer.Page> {
        const page = await browser.newPage()

        await Promise.all([
            page.setUserAgent(this.CONFIG.USER_AGENT),
            page.setViewport(this.CONFIG.VIEWPORT),
            page.setRequestInterception(true),
            page.setCacheEnabled(true),
        ])

        page.on('request', (request) => {
            if (
                ['image', 'stylesheet', 'font', 'media'].includes(
                    request.resourceType(),
                )
            ) {
                request.abort()
            } else {
                request.continue()
            }
        })

        return page
    }

    private async checkForNoLocations(page: puppeteer.Page): Promise<boolean> {
        return page.evaluate(
            (selector, message) => {
                const element = document.querySelector(selector)
                return element?.textContent?.includes(message) ?? false
            },
            this.CONFIG.SELECTORS.NO_LOCATIONS_SECTION,
            this.CONFIG.NO_LOCATIONS_MESSAGE,
        )
    }

    private async expandLocationsList(page: puppeteer.Page): Promise<void> {
        const seeMoreButton = await page.$(
            this.CONFIG.SELECTORS.SEE_MORE_BUTTON,
        )
        if (seeMoreButton) {
            const initialCount = await page.$$eval(
                this.CONFIG.SELECTORS.LOCATION_CARD,
                (cards) => cards.length,
            )

            await seeMoreButton.click()
            await page.waitForFunction(
                (selector, count) => {
                    const cards = document.querySelectorAll(selector)
                    return cards.length > count
                },
                {},
                this.CONFIG.SELECTORS.LOCATION_CARD,
                initialCount,
            )

            await this.delay(1000)
        }
    }

    private async parseLocations(page: puppeteer.Page): Promise<RawLocation[]> {
        return page.evaluate(
            ({ LOCATION_CARD, LOCATION_LINK, LOCATION_DESCRIPTION }) => {
                function countCommas(str: string): number {
                    return (
                        str.split(',').filter((part) => part.trim().length > 0)
                            .length - 1
                    )
                }

                const locationCards = document.querySelectorAll(LOCATION_CARD)
                const allLocations = Array.from(locationCards)
                    .map((card) => {
                        const linkElement = card.querySelector(LOCATION_LINK)
                        const descriptionElement =
                            card.querySelector(LOCATION_DESCRIPTION)

                        return {
                            address: linkElement?.textContent?.trim() || '',
                            description:
                                descriptionElement?.textContent
                                    ?.trim()
                                    ?.replace(/^\(|\)$/g, '') || '',
                        }
                    })
                    .filter(
                        (loc) =>
                            loc.address &&
                            loc.address !== 'Create account' &&
                            loc.address.length > 0,
                    )

                return allLocations.length <= 2
                    ? allLocations
                    : allLocations.filter(
                          (loc) => countCommas(loc.address) >= 2,
                      )
            },
            this.CONFIG.SELECTORS,
        )
    }

    private releaseBrowser(browser: puppeteer.Browser): void {
        this.logger.log('Releasing browser...')
        const browserInfo = this.browserPool.find((b) => b.browser === browser)
        if (browserInfo) {
            browserInfo.pages = Math.max(0, browserInfo.pages - 1)
            browserInfo.available =
                browserInfo.pages < this.CONFIG.CONCURRENT_PAGES

            if (browserInfo.errors >= 3) {
                this.replaceBrowser(browserInfo)
            }
        }
    }

    private async replaceBrowser(
        browserInfo: (typeof this.browserPool)[0],
    ): Promise<void> {
        try {
            await browserInfo.browser.close()
        } catch {}

        try {
            const newBrowser = await puppeteer.launch({
                headless: true,
                args: this.CONFIG.BROWSER_ARGS,
                timeout: this.CONFIG.TIMEOUT.BROWSER,
            })

            Object.assign(browserInfo, {
                browser: newBrowser,
                available: true,
                pages: 0,
                errors: 0,
                lastUsed: Date.now(),
            })
        } catch (error) {
            this.logger.error('Failed to replace browser:', error)
        }
    }

    private async cleanupBrowsers(): Promise<void> {
        this.logger.log('Cleaning up browsers...')
        await Promise.all(
            this.browserPool.map(async ({ browser }) => {
                try {
                    await browser.close()
                } catch (error) {
                    this.logger.error('Error closing browser:', error)
                }
            }),
        )
        this.browserPool = []
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
            array.slice(i * size, i * size + size),
        )
    }

    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}
