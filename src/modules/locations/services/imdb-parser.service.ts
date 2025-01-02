import * as puppeteer from 'puppeteer'
import { Injectable, Logger } from '@nestjs/common'
import { RawLocation } from '../interfaces/raw-location.interface'
import { ConfigService } from '@nestjs/config'
import { IImdbConfig } from '@/config/imdb/imdb-config.interface'
import { chunkArray } from '@/modules/titles/services/utils/chunk-array.utils'
import { delay } from '@/modules/titles/services/utils/delay.utils'

@Injectable()
export class ImdbParserService {
    private readonly logger = new Logger(ImdbParserService.name)
    private readonly config: IImdbConfig

    constructor(private readonly configService: ConfigService) {
        this.config = this.configService.get('imdb')
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
            this.logger.log(`Browser acquired, processing IMDb ID ${imdbId}...`)
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
        const chunks = chunkArray(imdbIds, this.config.processing.chunkSize)
        const failedIds = new Set<string>()

        this.logger.log(
            `Processing ${imdbIds.length} IDs in ${chunks.length} chunks`,
        )

        try {
            await this.initializeBrowserPool(this.config.browser.pool.maxSize)
            for (
                let i = 0;
                i < chunks.length;
                i += this.config.browser.pool.concurrentPages
            ) {
                const currentChunks = chunks.slice(
                    i,
                    i + this.config.browser.pool.concurrentPages,
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

                if (
                    i + this.config.browser.pool.concurrentPages <
                    chunks.length
                ) {
                    await delay(this.config.timing.delay.chunks)
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
        minBrowsers: number = this.config.browser.pool.minSize,
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
                    args: this.config.browser.args as string[],
                    timeout: this.config.timing.timeout.browser,
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

            if (attempts === maxAttempts - 1) {
                await this.recreateBrowserPool()
            }

            await delay(this.config.timing.timeout.browserWait)
            attempts++
        }

        throw new Error('No available browsers')
    }

    private async recreateBrowserPool(): Promise<void> {
        await this.cleanupBrowsers()
        await this.initializeBrowserPool(this.config.browser.pool.maxSize)
    }

    private async processImdbId(
        imdbId: string,
        browser: puppeteer.Browser,
    ): Promise<RawLocation[]> {
        let page: puppeteer.Page | null = null

        try {
            page = await this.setupPage(browser)

            await Promise.all([
                page.waitForNavigation({
                    timeout: this.config.timing.timeout.page,
                }),
                page.goto(`${this.config.baseUrl}/${imdbId}/locations`),
            ])

            const noLocations = await this.checkForNoLocations(page)
            if (noLocations) return []

            await page.waitForSelector(
                this.config.selectors.locations.section,
                {
                    timeout: this.config.timing.timeout.element,
                },
            )

            await this.expandLocationsList(page)
            return await this.parseLocations(page)
        } catch (error) {
            const browserInfo = this.browserPool.find(
                (b) => b.browser === browser,
            )
            if (browserInfo) browserInfo.errors++

            if (error.name === this.config.timing.timeout.error) {
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
            while (retries < this.config.processing.maxRetries) {
                try {
                    const browser = await this.getAvailableBrowser()
                    const locations = await this.processImdbId(id, browser)
                    this.releaseBrowser(browser)
                    return { id, locations, success: true }
                } catch {
                    retries++
                    await delay(this.config.timing.delay.requests * retries)
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
        const retryChunks = chunkArray(
            failedIds,
            Math.ceil(this.config.processing.chunkSize / 2),
        )

        for (const chunk of retryChunks) {
            const chunkResults = await this.processChunkWithRetries(chunk)
            chunkResults
                .filter(({ success }) => success)
                .forEach(({ id, locations }) => results.set(id, locations))

            await delay(this.config.timing.delay.chunks * 2)
        }

        return results
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
            this.config.selectors.locations.noContentSection,
            this.config.noLocationsMessage,
        )
    }

    private async expandLocationsList(page: puppeteer.Page): Promise<void> {
        const seeMoreButton = await page.$(
            this.config.selectors.locations.expandButton,
        )
        if (seeMoreButton) {
            const initialCount = await page.$$eval(
                this.config.selectors.locations.card,
                (cards) => cards.length,
            )

            await seeMoreButton.click()
            await page.waitForFunction(
                (selector, count) => {
                    const cards = document.querySelectorAll(selector)
                    return cards.length > count
                },
                {},
                this.config.selectors.locations.card,
                initialCount,
            )

            await delay(1000)
        }
    }

    private async parseLocations(page: puppeteer.Page): Promise<RawLocation[]> {
        return page.evaluate(({ locations }) => {
            function countCommas(str: string): number {
                return (
                    str.split(',').filter((part) => part.trim().length > 0)
                        .length - 1
                )
            }

            const locationCards = document.querySelectorAll(locations.card)
            const allLocations = Array.from(locationCards)
                .map((card) => {
                    const linkElement = card.querySelector(locations.link)
                    const descriptionElement = card.querySelector(
                        locations.description,
                    )

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
                        loc.address !== 'location' &&
                        loc.address.length > 0,
                )

            return allLocations.length <= 2
                ? allLocations
                : allLocations.filter((loc) => countCommas(loc.address) >= 2)
        }, this.config.selectors)
    }

    private releaseBrowser(browser: puppeteer.Browser): void {
        this.logger.log('Releasing browser...')
        const browserInfo = this.browserPool.find((b) => b.browser === browser)
        if (browserInfo) {
            browserInfo.pages = Math.max(0, browserInfo.pages - 1)
            browserInfo.available =
                browserInfo.pages < this.config.browser.pool.concurrentPages

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
                args: this.config.browser.args as string[],
                timeout: this.config.timing.timeout.browser,
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
}
