import * as puppeteer from 'puppeteer'
import { Injectable, Logger } from '@nestjs/common'
import { RawLocation } from '../interfaces/raw-location.interface'

@Injectable()
export class ImdbParserService {
    private readonly logger = new Logger(ImdbParserService.name)
    private browser: puppeteer.Browser | null = null

    private async initBrowser() {
        if (!this.browser) {
            try {
                this.logger.log('Initializing browser')

                this.browser = await puppeteer.launch({
                    headless: true,
                    defaultViewport: {
                        width: 1920,
                        height: 1080,
                    },
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-web-security',
                    ],
                    protocolTimeout: 30000,
                })

                this.logger.log('Browser initialized')
            } catch (error) {
                this.logger.error('Failed to initialize browser:', error)
                throw error
            }
        }

        return this.browser
    }

    async getFilmingLocations(imdbId: string): Promise<RawLocation[]> {
        try {
            const browser = await this.initBrowser()
            const page = await browser.newPage()

            page.setDefaultTimeout(2 * 60 * 1000)
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            )

            await Promise.all([
                page.waitForNavigation(),
                page.goto(`https://www.imdb.com/title/${imdbId}/locations`),
            ])

            this.logger.log('Waiting for locations section')

            await page.waitForSelector(
                '[data-testid="sub-section-flmg_locations"]',
            )

            const seeMoreButton = await page.$('button.ipc-see-more__button')
            if (seeMoreButton) {
                const initialCount = await page.$$eval(
                    '.ipc-list-card',
                    (cards) => cards.length,
                )

                await seeMoreButton.click()

                await Promise.all([
                    page.waitForFunction(
                        (initialCount) => {
                            const currentCards =
                                document.querySelectorAll('.ipc-list-card')
                            return currentCards.length > initialCount
                        },
                        {},
                        initialCount,
                    ),
                    new Promise((resolve) => setTimeout(resolve, 1000)),
                ])
            }

            const locations = await page.evaluate(() => {
                function countCommas(str: string): number {
                    return (
                        str.split(',').filter((part) => part.trim().length > 0)
                            .length - 1
                    )
                }

                const locationCards =
                    document.querySelectorAll('.ipc-list-card')
                const allLocations = Array.from(locationCards)
                    .map((card) => {
                        const linkElement = card.querySelector('.ipc-link')
                        const descriptionElement = card.querySelector(
                            '[data-testid="item-attributes"]',
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
                            loc.address.length > 0,
                    )

                if (allLocations.length <= 2) {
                    return allLocations
                }

                return allLocations.filter(
                    (loc) => countCommas(loc.address) >= 2,
                )
            })

            this.logger.log(
                `Found ${locations.length} locations for IMDb ID: ${imdbId}, locations: ${JSON.stringify(
                    locations,
                )}`,
            )

            return locations
        } catch (error) {
            this.logger.error(
                `Failed to parse filming locations for IMDb ID ${imdbId}:`,
                error,
            )
            throw error
        } finally {
            await this.cleanUp()
        }
    }

    async cleanUp(): Promise<void> {
        if (this.browser) {
            await this.browser.close()
            this.browser = null
        }
    }
}
