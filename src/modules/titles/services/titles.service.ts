import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Title, TitleType } from '../../../entities/title.entity'
import { CacheService } from '../../cache/cache.service'
import { IMDBService } from '../../imdb/services/imdb.service'
import {
    ICertificate,
    ICountry,
    ICriticReview,
    IIMDbTitle,
    ILanguage,
    INameDetails,
    IPoster,
    IRating,
} from '../../imdb/interfaces/imdb-graphql.interface'
import { Name } from '../../../entities/name.entity'
import { Credit, CreditCategory } from '../../../entities/credit.entity'
import { Country } from '../../../entities/country.entity'
import { Language } from '../../../entities/language.entity'
import { Certificate } from '../../../entities/certificate.entity'
import { Poster } from '../../../entities/poster.entity'
import { CriticReview } from '../../../entities/critic-review.entity'
import { Avatar } from '../../../entities/avatar.entity'
import { Rating } from '../../../entities/rating.entity'
import { IMDBTop100Service } from 'src/modules/imdb/services/imdb-top100.service'
import { RawTitle } from 'src/entities/raw_title.entity'
import { ITitle } from 'src/modules/imdb/interfaces/imdb-top100.interface'

@Injectable()
export class TitlesService {
    private readonly RAW_TITLES_CACHE_PREFIX = 'raw_titles'
    private readonly CACHE_TTL = 3600 * 24 * 90 // 3 months
    private readonly TITLES_CACHE_PREFIX = 'titles'

    private readonly logger = new Logger(TitlesService.name)

    constructor(
        @InjectRepository(Title)
        private titlesRepository: Repository<Title>,
        @InjectRepository(Rating)
        private ratingsRepository: Repository<Rating>,
        @InjectRepository(Name)
        private namesRepository: Repository<Name>,
        @InjectRepository(Credit)
        private creditsRepository: Repository<Credit>,
        @InjectRepository(Country)
        private countriesRepository: Repository<Country>,
        @InjectRepository(Language)
        private languagesRepository: Repository<Language>,
        @InjectRepository(Certificate)
        private certificatesRepository: Repository<Certificate>,
        @InjectRepository(Poster)
        private postersRepository: Repository<Poster>,
        @InjectRepository(CriticReview)
        private criticReviewsRepository: Repository<CriticReview>,
        @InjectRepository(Avatar)
        private avatarsRepository: Repository<Avatar>,
        @InjectRepository(RawTitle)
        private rawTitlesRepository: Repository<RawTitle>,

        private readonly imdbService: IMDBService,
        private readonly cacheService: CacheService,
        private readonly top100Service: IMDBTop100Service,
    ) {}

    async refreshCache(): Promise<void> {
        try {
            const rawTitles = await this.getOrUpdateRawTitles()
            await this.processRawTitles(rawTitles)
            this.logger.log('Titles cache was refreshed')
        } catch (error) {
            this.logger.error('Failed to refresh cache:', error)
        }
    }

    private async getOrUpdateRawTitles(): Promise<RawTitle[]> {
        const cachedRawTitles = await this.getRawTitlesFromCache()
        if (cachedRawTitles?.length) {
            this.logger.log('Using cached raw titles')
            return cachedRawTitles
        }

        const dbRawTitles = await this.getRawTitlesFromDB()
        if (dbRawTitles?.length) {
            this.logger.log('Using raw titles from database')
            await this.cacheRawTitles(dbRawTitles)
            return dbRawTitles
        }

        this.logger.log('Fetching new raw titles from IMDB TOP 100 API')
        return await this.fetchAndSaveRawTitles()
    }

    private async getRawTitlesFromCache(): Promise<RawTitle[] | null> {
        try {
            return await this.cacheService.get<RawTitle[]>(
                this.RAW_TITLES_CACHE_PREFIX,
            )
        } catch (error) {
            this.logger.error('Failed to get raw titles from cache:', error)
            return null
        }
    }

    private async getRawTitlesFromDB(): Promise<RawTitle[] | null> {
        try {
            const rawTitles = await this.rawTitlesRepository.find()
            return rawTitles.length > 0 ? rawTitles : null
        } catch (error) {
            this.logger.error('Failed to get raw titles from database:', error)
            return null
        }
    }

    private async fetchAndSaveRawTitles(): Promise<RawTitle[]> {
        const savedRawTitles: RawTitle[] = []

        try {
            const [movies, tvSeries] = await Promise.all([
                this.top100Service.fetchTop100Movies(),
                this.top100Service.fetchTop100TVSeries(),
            ])

            for (const movie of movies) {
                const rawTitle = await this.saveRawTitle(movie, TitleType.MOVIE)
                savedRawTitles.push(rawTitle)
            }

            for (const series of tvSeries) {
                const rawTitle = await this.saveRawTitle(
                    series,
                    TitleType.TV_SERIES,
                )
                savedRawTitles.push(rawTitle)
            }

            await this.cacheRawTitles(savedRawTitles)
            return savedRawTitles
        } catch (error) {
            this.logger.error('Failed to fetch and save raw titles:', error)
            throw error
        }
    }

    private async saveRawTitle(
        data: ITitle,
        type: TitleType,
    ): Promise<RawTitle> {
        try {
            let rawTitle = await this.rawTitlesRepository.findOne({
                where: { imdbId: data.imdbid },
            })

            if (!rawTitle) {
                rawTitle = this.rawTitlesRepository.create()
            }

            rawTitle.imdbId = data.imdbid
            rawTitle.type = type
            rawTitle.data = data

            return await this.rawTitlesRepository.save(rawTitle)
        } catch (error) {
            this.logger.error(`Failed to save raw title ${data.imdbid}:`, error)
            throw error
        }
    }

    private async cacheRawTitles(rawTitles: RawTitle[]): Promise<void> {
        try {
            await this.cacheService.set(
                this.RAW_TITLES_CACHE_PREFIX,
                rawTitles,
                this.CACHE_TTL,
            )
        } catch (error) {
            this.logger.error('Failed to cache raw titles:', error)
        }
    }

    private async processRawTitles(rawTitles: RawTitle[]): Promise<void> {
        try {
            const processedTitles: Title[] = []
            const imdbIds = rawTitles.map((rt) => rt.imdbId)

            const titlesDetails =
                await this.imdbService.getTitlesDetails(imdbIds)

            for (const titleDetails of titlesDetails) {
                try {
                    const title = await this.createOrUpdateTitle(titleDetails)
                    processedTitles.push(title)

                    this.logger.debug(
                        `Processed title ${titleDetails.id} (${processedTitles.length}/${titlesDetails.length})`,
                    )
                } catch (error) {
                    this.logger.error(
                        `Failed to process title ${titleDetails.id}:`,
                        error,
                    )
                    continue
                }
            }

            if (processedTitles.length > 0) {
                await this.cacheTitlesByType(processedTitles)
                this.logger.log(
                    `Successfully processed ${processedTitles.length}/${titlesDetails.length} titles`,
                )
            }
        } catch (error) {
            this.logger.error('Failed to process titles:', error)
            throw error
        }
    }

    private async createOrUpdateTitle(titleData: IIMDbTitle): Promise<Title> {
        try {
            let title = await this.titlesRepository.findOne({
                where: { imdbId: titleData.id },
                relations: [
                    'rating',
                    'posters',
                    'certificates',
                    'certificates.country',
                    'spokenLanguages',
                    'originCountries',
                    'criticReview',
                    'credits',
                    'credits.name',
                    'credits.name.avatars',
                ],
            })

            if (!title) {
                this.logger.debug(`Creating new title: ${titleData.id}`)
                title = this.titlesRepository.create()
            } else {
                this.logger.debug(`Updating existing title: ${titleData.id}`)
            }

            title.imdbId = titleData.id
            title.type = titleData.type as TitleType
            title.isAdult = titleData.is_adult
            title.primaryTitle = titleData.primary_title
            title.originalTitle = titleData.original_title
            title.startYear = titleData.start_year
            title.endYear = titleData.end_year
            title.runtimeMinutes = titleData.runtime_minutes
            title.plot = titleData.plot
            title.genres = titleData.genres

            const savedTitle = await this.titlesRepository.save(title)

            await Promise.all([
                this.updateTitleRating(savedTitle, titleData.rating),
                this.createOrUpdatePosters(savedTitle, titleData.posters),
                this.createOrUpdateCertificates(
                    savedTitle,
                    titleData.certificates,
                ),
                this.createOrUpdateCriticReview(
                    savedTitle,
                    titleData.critic_review,
                ),
                this.createOrUpdateCredits(savedTitle, titleData),
                this.createOrUpdateCountriesForTitle(
                    savedTitle,
                    titleData.origin_countries,
                ),
                this.createOrUpdateLanguagesForTitle(
                    savedTitle,
                    titleData.spoken_languages,
                ),
            ])

            return this.titlesRepository.findOne({
                where: { id: savedTitle.id },
                relations: [
                    'rating',
                    'posters',
                    'certificates',
                    'certificates.country',
                    'spokenLanguages',
                    'originCountries',
                    'criticReview',
                    'credits',
                    'credits.name',
                    'credits.name.avatars',
                ],
            })
        } catch (error) {
            this.logger.error(
                `Failed to create/update title ${titleData.id}:`,
                error,
            )
            throw error
        }
    }

    private async updateTitleRating(
        title: Title,
        ratingData: IRating,
    ): Promise<void> {
        if (!ratingData) return

        try {
            this.logger.debug(
                `Updating rating for title ${title.id} (${ratingData.aggregate_rating})`,
            )
            let rating = await this.ratingsRepository.findOne({
                where: { title: { id: title.id } },
            })

            if (!rating) {
                rating = this.ratingsRepository.create({
                    title: title,
                })
            }

            rating.aggregateRating = ratingData.aggregate_rating
            rating.votesCount = ratingData.votes_count

            const savedRating = await this.ratingsRepository.save(rating)

            if (!title.rating || title.rating.id !== savedRating.id) {
                title.rating = savedRating
                await this.titlesRepository.save(title)
            }
        } catch (error) {
            this.logger.error(
                `Failed to update rating for title ${title.id}:`,
                error,
            )
            throw error
        }
    }

    private async createOrUpdatePosters(
        title: Title,
        posters: IPoster[],
    ): Promise<void> {
        if (!posters) return

        try {
            this.logger.debug(
                `Updating posters for title ${title.id} (${posters.length})`,
            )
            const existingPosters = await this.postersRepository.find({
                where: { title: { id: title.id } },
                relations: ['language'],
            })

            const languageCodes = posters
                .map((p) => p.language_code)
                .filter((code) => code !== null && code !== undefined)

            const languages =
                languageCodes.length > 0
                    ? await this.languagesRepository.find({
                          where: { code: In(languageCodes) },
                      })
                    : []

            const languageMap = new Map(
                languages.map((lang) => [lang.code, lang]),
            )

            const posterEntities = await Promise.all(
                posters.map(async (poster) => {
                    const language = poster.language_code
                        ? languageMap.get(poster.language_code) || null
                        : null

                    const existingPoster = existingPosters.find(
                        (p) =>
                            p.url === poster.url &&
                            p.language?.code === poster.language_code,
                    )

                    if (existingPoster) {
                        existingPoster.width = poster.width
                        existingPoster.height = poster.height
                        return existingPoster
                    }

                    return this.postersRepository.create({
                        url: poster.url,
                        width: poster.width,
                        height: poster.height,
                        language,
                        title,
                    })
                }),
            )

            await this.postersRepository.save(posterEntities)

            const newUrls = new Set(posters.map((p) => p.url))
            const outdatedPosters = existingPosters.filter(
                (p) => !newUrls.has(p.url),
            )
            if (outdatedPosters.length > 0) {
                await this.postersRepository.remove(outdatedPosters)
            }
        } catch (error) {
            this.logger.error(
                `Failed to update posters for title ${title.id}:`,
                error,
            )
            throw error
        }
    }

    private async createOrUpdateCountriesForTitle(
        title: Title,
        countries: ICountry[],
    ): Promise<void> {
        if (!countries) return

        try {
            this.logger.debug(
                `Updating countries for title ${title.id} (${countries.length})`,
            )
            const existingCountries = await this.countriesRepository.find({
                where: { code: In(countries.map((c) => c.code)) },
            })

            const countryMap = new Map(
                existingCountries.map((country) => [country.code, country]),
            )

            const countryEntities = await Promise.all(
                countries.map(async (country) => {
                    let countryEntity = countryMap.get(country.code)

                    if (!countryEntity) {
                        countryEntity = this.countriesRepository.create({
                            code: country.code,
                            name: country.name,
                        })
                        countryEntity =
                            await this.countriesRepository.save(countryEntity)
                    }

                    return countryEntity
                }),
            )

            title.originCountries = countryEntities
            await this.titlesRepository.save(title)
        } catch (error) {
            this.logger.error(
                `Failed to update countries for title ${title.id}:`,
                error,
            )
            throw error
        }
    }

    private async createOrUpdateLanguagesForTitle(
        title: Title,
        languages: ILanguage[],
    ): Promise<void> {
        if (!languages) return

        try {
            this.logger.debug(
                `Updating languages for title ${title.id} (${languages.length})`,
            )
            const existingLanguages = await this.languagesRepository.find({
                where: { code: In(languages.map((l) => l.code)) },
            })

            const languageMap = new Map(
                existingLanguages.map((lang) => [lang.code, lang]),
            )

            const languageEntities = await Promise.all(
                languages.map(async (language) => {
                    let languageEntity = languageMap.get(language.code)

                    if (!languageEntity) {
                        languageEntity = this.languagesRepository.create({
                            code: language.code,
                            name: language.name,
                        })
                        languageEntity =
                            await this.languagesRepository.save(languageEntity)
                    }

                    return languageEntity
                }),
            )

            title.spokenLanguages = languageEntities
            await this.titlesRepository.save(title)
        } catch (error) {
            this.logger.error(
                `Failed to update languages for title ${title.id}:`,
                error,
            )
            throw error
        }
    }

    private async createOrUpdateCertificates(
        title: Title,
        certificates: ICertificate[],
    ): Promise<void> {
        if (!certificates) return

        try {
            this.logger.debug(
                `Updating certificates for title ${title.id} (${certificates.length})`,
            )
            const existingCertificates = await this.certificatesRepository.find(
                {
                    where: { title: { id: title.id } },
                    relations: ['country'],
                },
            )

            const countryCodes = certificates.map((cert) => cert.country.code)
            const countries = await this.countriesRepository.find({
                where: { code: In(countryCodes) },
            })

            const countryMap = new Map(
                countries.map((country) => [country.code, country]),
            )

            const certificateEntities = await Promise.all(
                certificates.map(async (cert) => {
                    let country = countryMap.get(cert.country.code)

                    if (!country) {
                        country = this.countriesRepository.create({
                            code: cert.country.code,
                            name: cert.country.name,
                        })
                        country = await this.countriesRepository.save(country)
                    }

                    const existingCertificate = existingCertificates.find(
                        (c) => c.country.code === cert.country.code,
                    )

                    if (existingCertificate) {
                        existingCertificate.rating = cert.rating
                        return existingCertificate
                    }

                    return this.certificatesRepository.create({
                        rating: cert.rating,
                        country,
                        title,
                    })
                }),
            )

            await this.certificatesRepository.save(certificateEntities)

            const newCountryCodes = new Set(
                certificates.map((c) => c.country.code),
            )
            const outdatedCertificates = existingCertificates.filter(
                (c) => !newCountryCodes.has(c.country.code),
            )
            if (outdatedCertificates.length > 0) {
                await this.certificatesRepository.remove(outdatedCertificates)
            }
        } catch (error) {
            this.logger.error(
                `Failed to update certificates for title ${title.id}:`,
                error,
            )
            throw error
        }
    }

    private async createOrUpdateCriticReview(
        title: Title,
        criticReview: ICriticReview,
    ): Promise<void> {
        if (!criticReview) return

        try {
            this.logger.debug(`Updating critic review for title ${title.id}`)
            let reviewEntity = await this.criticReviewsRepository.findOne({
                where: { title: { id: title.id } },
            })

            if (reviewEntity) {
                this.logger.debug(
                    `Updating existing critic review for title ${title.id}`,
                )
                reviewEntity.score = criticReview.score
                reviewEntity.reviewCount = criticReview.review_count
            } else {
                this.logger.debug(
                    `Creating new critic review for title ${title.id}`,
                )
                reviewEntity = this.criticReviewsRepository.create({
                    score: criticReview.score,
                    reviewCount: criticReview.review_count,
                    title,
                })
            }

            await this.criticReviewsRepository.save(reviewEntity)
        } catch (error) {
            this.logger.error(
                `Failed to update critic review for title ${title.id}:`,
                error,
            )
            throw error
        }
    }

    private async createOrUpdateName(nameData: INameDetails): Promise<Name> {
        if (!nameData) return

        try {
            this.logger.debug(`Updating name ${nameData.id}`)
            let name = await this.namesRepository.findOne({
                where: { imdbId: nameData.id },
                relations: ['avatars', 'knownFor'],
            })

            if (!name) {
                name = this.namesRepository.create({
                    imdbId: nameData.id,
                })
            }

            name.displayName = nameData.display_name
            name.alternateNames = nameData.alternate_names
            name.birthYear = nameData.birth_year
            name.birthLocation = nameData.birth_location
            name.deathYear = nameData.death_year
            name.deathLocation = nameData.death_location
            name.deadReason = nameData.dead_reason

            name = await this.namesRepository.save(name)

            if (nameData.avatars?.length) {
                await this.avatarsRepository.delete({ name: { id: name.id } })

                const avatarEntities = nameData.avatars.map((avatar) =>
                    this.avatarsRepository.create({
                        url: avatar.url,
                        width: avatar.width,
                        height: avatar.height,
                        name,
                    }),
                )

                await this.avatarsRepository.save(avatarEntities)
            }

            return name
        } catch (error) {
            this.logger.error(`Failed to update name ${nameData.id}:`, error)
            throw error
        }
    }

    private async createOrUpdateCredits(
        title: Title,
        titleData: IIMDbTitle,
    ): Promise<void> {
        if (!titleData) return
        this.logger.debug(
            `Updating credits for title ${JSON.stringify(titleData)}`,
        )
        try {
            this.logger.debug(`Updating credits for title ${title.id}`)
            const existingCredits = await this.creditsRepository.find({
                where: { title: { id: title.id } },
                relations: ['name'],
            })

            const creditEntities = []
            if (titleData.directors?.length) {
                for (const director of titleData.directors) {
                    const name = await this.createOrUpdateName(director.name)
                    const existingCredit = existingCredits.find(
                        (credit) =>
                            credit.category === CreditCategory.DIRECTOR &&
                            credit.name.imdbId === director.name.id,
                    )

                    if (existingCredit) {
                        creditEntities.push(existingCredit)
                    } else {
                        creditEntities.push(
                            this.creditsRepository.create({
                                category: CreditCategory.DIRECTOR,
                                name,
                                title,
                                episodesCount: director.episodes_count,
                            }),
                        )
                    }
                }
            }

            if (titleData.writers?.length) {
                for (const writer of titleData.writers) {
                    const name = await this.createOrUpdateName(writer.name)
                    const existingCredit = existingCredits.find(
                        (credit) =>
                            credit.category === CreditCategory.WRITER &&
                            credit.name.imdbId === writer.name.id,
                    )

                    if (existingCredit) {
                        creditEntities.push(existingCredit)
                    } else {
                        creditEntities.push(
                            this.creditsRepository.create({
                                category: CreditCategory.WRITER,
                                name,
                                title,
                                episodesCount: writer.episodes_count,
                            }),
                        )
                    }
                }
            }

            if (titleData.casts?.length) {
                for (const cast of titleData.casts) {
                    const name = await this.createOrUpdateName(cast.name)
                    const existingCredit = existingCredits.find(
                        (credit) =>
                            credit.category === CreditCategory.ACTOR &&
                            credit.name.imdbId === cast.name.id,
                    )

                    if (existingCredit) {
                        existingCredit.characters = cast.characters
                        creditEntities.push(existingCredit)
                    } else {
                        creditEntities.push(
                            this.creditsRepository.create({
                                category: CreditCategory.ACTOR,
                                name,
                                title,
                                characters: cast.characters,
                                episodesCount: cast.episodes_count,
                            }),
                        )
                    }
                }
            }

            if (creditEntities.length > 0) {
                await this.creditsRepository.save(creditEntities)
            }

            const newCreditsMap = new Set(
                creditEntities.map(
                    (credit) => `${credit.category}_${credit.name.imdbId}`,
                ),
            )

            const outdatedCredits = existingCredits.filter(
                (credit) =>
                    !newCreditsMap.has(
                        `${credit.category}_${credit.name.imdbId}`,
                    ),
            )

            if (outdatedCredits.length > 0) {
                await this.creditsRepository.remove(outdatedCredits)
            }
        } catch (error) {
            this.logger.error(
                `Failed to update credits for title ${title.id}:`,
                error,
            )
            throw error
        }
    }

    private async cacheTitlesByType(titles: Title[]): Promise<void> {
        try {
            const titlesByType = titles.reduce(
                (acc, title) => {
                    if (!acc[title.type]) {
                        acc[title.type] = []
                    }
                    acc[title.type].push(title)
                    return acc
                },
                {} as Record<TitleType, Title[]>,
            )

            await Promise.all(
                Object.entries(titlesByType).map(([type, typeTitles]) =>
                    this.cacheService.set(
                        this.getCacheKeyForType(type as TitleType),
                        typeTitles,
                        this.CACHE_TTL,
                    ),
                ),
            )

            this.logger.log(`Cached ${titles.length} titles by type`)
        } catch (error) {
            this.logger.error('Failed to cache titles by type:', error)
        }
    }

    private getCacheKeyForType(type: TitleType): string {
        return `${this.TITLES_CACHE_PREFIX}_${type.toLowerCase()}`
    }

    async getTitlesByType(type: TitleType): Promise<Title[]> {
        try {
            const cacheKey = this.getCacheKeyForType(type)
            const cachedTitles = await this.cacheService.get<Title[]>(cacheKey)

            if (cachedTitles?.length) {
                this.logger.log(`Using cached titles for type: ${type}`)
                return cachedTitles
            }

            const titles = await this.titlesRepository.find({
                where: { type },
                relations: [
                    'rating',
                    'posters',
                    'certificates',
                    'certificates.country',
                    'spokenLanguages',
                    'originCountries',
                    'criticReview',
                    'credits',
                    'credits.name',
                    'credits.name.avatars',
                ],
            })

            if (titles.length > 0) {
                await this.cacheService.set(cacheKey, titles, this.CACHE_TTL)
            }

            return titles
        } catch (error) {
            this.logger.error(`Failed to get titles by type ${type}:`, error)
            throw error
        }
    }
}
