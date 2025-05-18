import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import sharp from 'sharp'

import { CollectionType } from '@/modules/content/collection/enums/collection-type.enum'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { collections } from '@/modules/infrastructure/drizzle/schema/collections.schema'
import {
    countries,
    DbCountry,
} from '@/modules/infrastructure/drizzle/schema/countries.schema'
import { locationCollectionItems } from '@/modules/infrastructure/drizzle/schema/location-collection-items.schema'
import { titleCollectionItems } from '@/modules/infrastructure/drizzle/schema/title-collection-items.schema'
import { users } from '@/modules/infrastructure/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { S3Service } from '@/modules/infrastructure/s3/s3.service'
import { generateSlug } from '@/shared/utils/common/slug.utils'
import { faker } from '@faker-js/faker'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { asc, eq } from 'drizzle-orm'
import slug from 'slug'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class CollectionSeeder {
    private readonly logger = new Logger(CollectionSeeder.name)

    private readonly titleCollectionNames: string[] = [
        'Знаковые фильмы всех времен',
        'Скрытые кинематографические жемчужины',
        'Сериалы, которые стоит посмотреть',
        'Фильмы - обладатели наград',
        'Культовое кино',
        'Идеальные фильмы для зимы',
        'Летние блокбастеры',
        'Любимые фильмы праздничного сезона',
        'Рождественская классика',
        'Хэллоуинский марафон ужасов',
        'Фильмы с осенней атмосферой',
        'Весенние романтические фильмы',
        'Фильмы, снятые в Италии',
        'Фильмы, снятые в Париже',
        'Скандинавские нуар-сериалы',
        'Шедевры азиатского кино',
        'Истории Нью-Йорка',
        'Фильмы по всей Европе',
        'Кино-путешествие по Средиземноморью',
        'Фильмы в знаковых американских городах',
        'Фильмы, снятые в Лондоне',
        'Лучшие образцы японского кино',
        'Эпические фэнтези-сериалы',
        'Криминальные триллеры',
        'Научно-фантастические вселенные',
        'Исторические драмы',
        'Добрые комедии',
        'Современные вестерн-сериалы',
        'Романтические комедии',
        'Мир антиутопий',
        'Фильмы для всей семьи',
        'Шпионские триллеры',
        'Фильмы о путешествиях во времени',
        'Захватывающие сериалы-загадки',
        'Фильмы, заставляющие задуматься',
        'Вдохновляющие фильмы на плохой день',
        'Атмосферное медленное кино',
        'Фильмы для ностальгического настроения',
        'Фильмы для дождливого дня',
        'Фильмы для просмотра в полночь',
        'Фильмы для любителей архитектуры',
        'Визуально потрясающее кино',
        'Уютные детективные сериалы',
        'Ностальгия по 80-м',
        'Культовые фильмы 90-х',
        'Классика Голливуда',
        'Шедевры современного кино',
        'Кинореволюция 70-х',
        'Контркультурное кино 60-х',
        'Лучшие триллеры Хичкока',
        'Кинематографическая вселенная Скорсезе',
        'Фильмы с Мерил Стрип',
        'Фильмография Тарантино',
        'Головоломные фильмы Кристофера Нолана',
        'Коллекция Studio Ghibli',
        'Приключения в дороге',
        'Фильмы о еде и кулинарии',
        'Фильмы о создании фильмов',
        'Документальные сериалы о музыке',
        'Спортивные драмы, которые стоит посмотреть',
        'Экранизации литературных произведений',
        'Анимация для взрослых',
        'Фильмы, основанные на реальных событиях',
        'Истории взросления',
        'Фильмы с потрясающими саундтреками',
    ]

    private readonly locationCollectionNames: string[] = [
        'Самые знаковые кинематографические достопримечательности',
        'Знаменитые замки, снятые в кино',
        'Соборы и церкви в кино',
        'Мосты из фильмов, которые можно посетить',
        'Места съемок в национальных парках',
        'Знаменитые здания в кино',
        'Исторические места в кино',
        'Нью-Йорк в кино',
        'Парижские места съемок',
        'Рим на большом экране',
        'Знаменитые места съемок в Лондоне',
        'Токио в кино',
        'Места съемок в Барселоне',
        'Кино-достопримечательности Берлина',
        'Кинотур по Лос-Анджелесу',
        'Знаменитые места съемок в Новом Орлеане',
        'Чикаго в истории кино',
        'Места съемок в Средиземноморье',
        'Кинематографические пейзажи Скандинавии',
        'Места съемок в пустыне',
        'Горные локации в кино',
        'Островные места съемок',
        'Прибрежные кино-локации',
        'Сцены в лесах из фильмов',
        'Городские джунгли в кино',
        'Сельская Америка в кино',
        'Альпийские места съемок',
        'Волшебные места съемок фэнтези',
        'Научно-фантастические декорации, которые можно посетить',
        'Локации исторических драм',
        'Места съемок романтических комедий',
        'Локации трюков из фильмов',
        'Места съемок фильмов ужасов',
        'Локации вестернов',
        'Знаменитые кафе и рестораны из фильмов',
        'Известные отели из кино',
        'Места съемок в киношколах',
        'Обязательные для посещения места кинотуризма',
        'Места съемок фильмов о путешествиях',
        'Бюджетные места съемок',
        'Неизведанные места съемок',
        'Места съемок с потрясающими видами',
        'Места съемок у пляжей',
        'Древний мир в кино',
        'Доступные места съемок',
        'Места съемок для всей семьи',
        'Места съемок "Гарри Поттера"',
        'Путешествие по местам съемок "Игры престолов"',
        'Локации миссий Джеймса Бонда',
        'Тур по Новой Зеландии по местам "Властелина колец"',
        'Локации кинематографической вселенной Marvel',
        'Места съемок "Звездных войн"',
        'Места съемок "Аббатства Даунтон"',
        'Тур по Альбукерке по местам съемок "Во все тяжкие"',
        'Исторические вокзалы в кино',
        'Университетские кампусы в фильмах',
        'Киномузеи и выставки',
        'Киностудии, открытые для посещения',
        'Кинотеатры в фильмах',
        'Рестораны из известных фильмов',
        'Места проведения кинофестивалей',
        'Скрытые городские кино-жемчужины',
        'Парки и сады из фильмов',
        'Места съемок с литературными связями',
    ]

    private readonly countryGenreMapping = {
        'United States': [
            'Голливудская классика',
            'Американские блокбастеры',
            'Фильмы золотой эры Голливуда',
        ],
        Japan: ['Аниме шедевры', 'Японские драмы', 'Фильмы Куросавы'],
        France: [
            'Французская новая волна',
            'Романтические фильмы Парижа',
            'Артхаус по-французски',
        ],
        Italy: [
            'Итальянский неореализм',
            'Шедевры Феллини',
            'Романтические комедии из Италии',
        ],
        'United Kingdom': [
            'Британские детективы',
            'Исторические драмы Англии',
            'Британский юмор в кино',
        ],
        'South Korea': [
            'Корейские триллеры',
            'К-драмы, которые стоит посмотреть',
            'Новая волна корейского кино',
        ],
        Germany: [
            'Немецкий экспрессионизм',
            'Берлинские истории',
            'Современное кино Германии',
        ],
        Spain: [
            'Испанские драмы',
            'Фильмы Альмодовара',
            'Мистические истории Испании',
        ],
        India: [
            'Болливудские хиты',
            'Индийское независимое кино',
            'Музыкальные фильмы Индии',
        ],
        Russia: [
            'Русская классика',
            'Советское кино',
            'Современные российские фильмы',
        ],
    }

    private readonly countryLocationMapping = {
        'United States': [
            'Знаковые места Нью-Йорка',
            'Голливудские локации',
            'Калифорния в кино',
        ],
        Japan: [
            'Токио на киноэкране',
            'Древние храмы Японии в фильмах',
            'Киото как киноплощадка',
        ],
        France: [
            'Романтический Париж',
            'Замки Франции',
            'Лазурный берег в кино',
        ],
        Italy: [
            'Римские каникулы',
            'Венеция в кинематографе',
            'Тосканские пейзажи из фильмов',
        ],
        'United Kingdom': [
            'Лондон как киноплощадка',
            'Английская сельская местность',
            'Шотландские замки в кино',
        ],
        Spain: [
            'Барселона в кинематографе',
            'Андалусия на экране',
            'Мадрид глазами режиссеров',
        ],
        Germany: [
            'Берлинская стена в кино',
            'Баварские замки',
            'Германия послевоенного периода',
        ],
        Australia: [
            'Австралийская пустыня в кино',
            'Сидней как киноплощадка',
            'Природа Австралии на экране',
        ],
        'New Zealand': [
            'По следам "Властелина колец"',
            'Природные красоты Новой Зеландии',
            'Хоббитон и другие локации',
        ],
        Canada: [
            'Канадские Скалистые горы',
            'Торонто в роли американских городов',
            'Ванкувер на киноэкране',
        ],
    }

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly s3Service: S3Service,
    ) {}

    async seed(
        count: number = 50,
        options: {
            titleCollectionsRatio?: number
            locationCollectionsRatio?: number
            maxItemsPerCollection?: number
            privateCollectionRatio?: number
            withCoverImage?: boolean
            withDescription?: boolean
            countryBasedGrouping?: boolean
        } = {
            titleCollectionsRatio: 0.6,
            locationCollectionsRatio: 0.4,
            maxItemsPerCollection: 20,
            privateCollectionRatio: 0.2,
            withCoverImage: true,
            withDescription: true,
            countryBasedGrouping: true,
        },
    ): Promise<number> {
        this.logger.log(`Starting to seed ${count} collections`)

        try {
            const activeUsers = await this.db.query.users.findMany({
                where: eq(users.isDeactivated, false),
                limit: 50,
            })

            if (!activeUsers.length) {
                this.logger.warn('No active users found to seed collections')
                return 0
            }

            const titlesData = await this.db.query.titles.findMany({
                limit: 500,
                with: {
                    countries: {
                        with: {
                            country: true,
                        },
                    },
                },
            })

            const filmingLocationsData =
                await this.db.query.filmingLocations.findMany({
                    limit: 500,
                    with: {
                        country: true,
                        titleFilmingLocations: {
                            with: {
                                title: true,
                            },
                        },
                    },
                })

            const countriesData = await this.db.query.countries.findMany({
                orderBy: asc(countries.englishName),
            })

            if (!titlesData.length && !filmingLocationsData.length) {
                this.logger.warn(
                    'No titles or filming locations found to seed collections',
                )
                return 0
            }

            await this.cleanup()

            const titleCollectionsCount =
                titlesData.length > 0
                    ? Math.floor(count * options.titleCollectionsRatio)
                    : 0

            const locationCollectionsCount =
                filmingLocationsData.length > 0
                    ? count - titleCollectionsCount
                    : 0

            const titlesByCountry = this.groupTitlesByCountry(titlesData)

            const locationsByCountry =
                this.groupLocationsByCountry(filmingLocationsData)

            const createdCollections = []

            const titleCollections = await this.createTitleCollections(
                titleCollectionsCount,
                activeUsers,
                titlesByCountry,
                countriesData,
                titlesData,
                options,
            )
            createdCollections.push(...titleCollections)

            const locationCollections = await this.createLocationCollections(
                locationCollectionsCount,
                activeUsers,
                locationsByCountry,
                countriesData,
                filmingLocationsData,
                options,
            )
            createdCollections.push(...locationCollections)

            this.logger.log(
                `Successfully seeded ${createdCollections.length} collections`,
            )
            return createdCollections.length
        } catch (error) {
            this.logger.error(
                `Failed to seed collections: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    private groupTitlesByCountry(titlesData): Map<string, any[]> {
        const titlesByCountry = new Map<string, any[]>()

        for (const title of titlesData) {
            if (title.countries && title.countries.length > 0) {
                for (const countryRel of title.countries) {
                    const countryName = countryRel.country.englishName
                    if (!titlesByCountry.has(countryName)) {
                        titlesByCountry.set(countryName, [])
                    }
                    titlesByCountry.get(countryName).push(title)
                }
            } else {
                if (!titlesByCountry.has('Unknown')) {
                    titlesByCountry.set('Unknown', [])
                }
                titlesByCountry.get('Unknown').push(title)
            }
        }

        return titlesByCountry
    }

    private groupLocationsByCountry(locationsData): Map<string, any[]> {
        const locationsByCountry = new Map<string, any[]>()

        for (const location of locationsData) {
            if (location.country) {
                const countryName = location.country.englishName
                if (!locationsByCountry.has(countryName)) {
                    locationsByCountry.set(countryName, [])
                }
                locationsByCountry.get(countryName).push(location)
            } else {
                if (!locationsByCountry.has('Unknown')) {
                    locationsByCountry.set('Unknown', [])
                }
                locationsByCountry.get('Unknown').push(location)
            }
        }

        return locationsByCountry
    }

    private async createTitleCollections(
        count: number,
        activeUsers: any[],
        titlesByCountry: Map<string, any[]>,
        countriesData: DbCountry[],
        allTitles: any[],
        options: any,
    ): Promise<any[]> {
        if (count <= 0) return []

        const collections = []
        let countryBasedCount = options.countryBasedGrouping
            ? Math.ceil(count * 0.7)
            : 0
        let randomCount = count - countryBasedCount

        if (countryBasedCount > 0) {
            const validCountries = Array.from(titlesByCountry.entries())
                .filter(([_, titles]) => titles.length >= 5)
                .map(([country, _]) => country)

            for (
                let i = 0;
                i < countryBasedCount && validCountries.length > 0;
                i++
            ) {
                const randomCountryIndex = Math.floor(
                    Math.random() * validCountries.length,
                )
                const countryName = validCountries[randomCountryIndex]

                validCountries.splice(randomCountryIndex, 1)

                const titles = titlesByCountry.get(countryName) || []
                if (titles.length === 0) continue

                let title = ''
                if (this.countryGenreMapping[countryName]) {
                    const countryGenres = this.countryGenreMapping[countryName]
                    title =
                        countryGenres[
                            Math.floor(Math.random() * countryGenres.length)
                        ]
                } else {
                    title = `Лучшие фильмы ${countryName}`
                }

                const randomUserIndex = Math.floor(
                    Math.random() * activeUsers.length,
                )
                const user = activeUsers[randomUserIndex]

                const collection = await this.createCollection(
                    user,
                    title,
                    CollectionType.TITLE,
                    options,
                    `Подборка фильмов из ${countryName}, которые стоит посмотреть каждому киноману.`,
                )

                await this.addTitlesToCollection(
                    collection.id,
                    titles,
                    options.maxItemsPerCollection,
                )

                collections.push(collection)
            }
        }

        for (let i = 0; i < randomCount; i++) {
            const randomUserIndex = Math.floor(
                Math.random() * activeUsers.length,
            )
            const user = activeUsers[randomUserIndex]

            let title = ''
            if (i < this.titleCollectionNames.length) {
                title = this.titleCollectionNames[i]
            } else {
                title = `${faker.word.adjective()} ${faker.word.noun()} Films`
            }

            const collection = await this.createCollection(
                user,
                title,
                CollectionType.TITLE,
                options,
            )

            const shuffledTitles = [...allTitles].sort(
                () => Math.random() - 0.5,
            )
            const selectedTitles = shuffledTitles.slice(
                0,
                Math.min(options.maxItemsPerCollection, allTitles.length),
            )

            await this.addTitlesToCollection(
                collection.id,
                selectedTitles,
                options.maxItemsPerCollection,
            )

            collections.push(collection)
        }

        return collections
    }

    private async createLocationCollections(
        count: number,
        activeUsers: any[],
        locationsByCountry: Map<string, any[]>,
        countriesData: DbCountry[],
        allLocations: any[],
        options: any,
    ): Promise<any[]> {
        if (count <= 0) return []

        const collections = []
        let countryBasedCount = options.countryBasedGrouping
            ? Math.ceil(count * 0.7)
            : 0
        let randomCount = count - countryBasedCount

        if (countryBasedCount > 0) {
            const validCountries = Array.from(locationsByCountry.entries())
                .filter(([_, locations]) => locations.length >= 3)
                .map(([country, _]) => country)

            for (
                let i = 0;
                i < countryBasedCount && validCountries.length > 0;
                i++
            ) {
                const randomCountryIndex = Math.floor(
                    Math.random() * validCountries.length,
                )
                const countryName = validCountries[randomCountryIndex]

                validCountries.splice(randomCountryIndex, 1)

                const locations = locationsByCountry.get(countryName) || []
                if (locations.length === 0) continue

                let title = ''
                if (this.countryLocationMapping[countryName]) {
                    const countryLocations =
                        this.countryLocationMapping[countryName]
                    title =
                        countryLocations[
                            Math.floor(Math.random() * countryLocations.length)
                        ]
                } else {
                    title = `Кинематографические места ${countryName}`
                }

                const randomUserIndex = Math.floor(
                    Math.random() * activeUsers.length,
                )
                const user = activeUsers[randomUserIndex]

                const collection = await this.createCollection(
                    user,
                    title,
                    CollectionType.LOCATION,
                    options,
                    `Известные локации из фильмов в ${countryName}, которые можно посетить.`,
                )

                await this.addLocationsToCollection(
                    collection.id,
                    locations,
                    options.maxItemsPerCollection,
                )

                collections.push(collection)
            }
        }

        for (let i = 0; i < randomCount; i++) {
            const randomUserIndex = Math.floor(
                Math.random() * activeUsers.length,
            )
            const user = activeUsers[randomUserIndex]

            let title = ''
            if (i < this.locationCollectionNames.length) {
                title = this.locationCollectionNames[i]
            } else {
                title = `${faker.location.city()} Movie Locations`
            }

            const collection = await this.createCollection(
                user,
                title,
                CollectionType.LOCATION,
                options,
            )

            const shuffledLocations = [...allLocations].sort(
                () => Math.random() - 0.5,
            )
            const selectedLocations = shuffledLocations.slice(
                0,
                Math.min(options.maxItemsPerCollection, allLocations.length),
            )

            await this.addLocationsToCollection(
                collection.id,
                selectedLocations,
                options.maxItemsPerCollection,
            )

            collections.push(collection)
        }

        return collections
    }

    private async createCollection(
        user: any,
        title: string,
        type: CollectionType,
        options: any,
        defaultDescription?: string,
    ): Promise<any> {
        const isPrivate =
            Math.random() < (options.privateCollectionRatio || 0.2)

        const description = options.withDescription
            ? Math.random() > 0.2
                ? defaultDescription ||
                  faker.lorem.paragraph(1 + Math.floor(Math.random() * 3))
                : null
            : null

        const uniqueId = uuidv4()
        const collectionSlug = slug(`${title + '-' + user.username}`, {
            fallback: true,
        })

        let coverImage = null
        if (options.withCoverImage && Math.random() > 0.3) {
            coverImage = await this.generateCoverImage(
                title,
                collectionSlug,
                type,
            )
        }

        const createdAt = faker.date.past({ years: 2 })
        const updatedAt =
            Math.random() > 0.7
                ? faker.date.between({ from: createdAt, to: new Date() })
                : createdAt

        const collectionData = {
            id: uniqueId,
            title,
            slug: collectionSlug,
            description,
            coverImage,
            isPrivate,
            type,
            userId: user.id,
            createdAt,
            updatedAt,
        }

        try {
            const [insertedCollection] = await this.db
                .insert(collections)
                .values(collectionData)
                .returning()

            return insertedCollection
        } catch (error) {
            if (error.message) {
                const randomSuffix = Math.random().toString(36).substring(2, 10)
                collectionData.slug = `${slug}-${randomSuffix}`

                const [insertedCollection] = await this.db
                    .insert(collections)
                    .values(collectionData)
                    .returning()

                return insertedCollection
            }

            throw error
        }
    }

    private async generateCoverImage(
        title: string,
        slug: string,
        type: CollectionType,
    ): Promise<string> {
        try {
            const tempDir = os.tmpdir()
            const imagePath = path.join(tempDir, `${slug}-${Date.now()}.webp`)

            const width = 800
            const height = 450

            const escapeXml = (unsafe: string): string => {
                return unsafe.replace(/[<>&'"]/g, (c) => {
                    switch (c) {
                        case '<':
                            return '&lt;'
                        case '>':
                            return '&gt;'
                        case '&':
                            return '&amp;'
                        case "'":
                            return '&apos;'
                        case '"':
                            return '&quot;'
                        default:
                            return c
                    }
                })
            }

            const wrapText = (text: string, maxLength: number): string[] => {
                const words = text.split(' ')
                const lines: string[] = []
                let currentLine = ''
                for (const word of words) {
                    if ((currentLine + word).length > maxLength) {
                        if (currentLine) lines.push(currentLine.trim())
                        currentLine = word
                    } else {
                        currentLine += ' ' + word
                    }
                }
                if (currentLine) lines.push(currentLine.trim())
                return lines.slice(0, 2)
            }

            const lines = wrapText(title, 25)
            const safeLines = lines.map((line) => escapeXml(line))

            let textSvg = ''
            if (safeLines.length === 1) {
                textSvg = `<text x="50%" y="50%" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" filter="url(#shadow)">${safeLines[0]}</text>`
            } else if (safeLines.length >= 2) {
                textSvg = `<text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle" filter="url(#shadow)">
                    <tspan x="50%" dy="-0.6em">${safeLines[0]}</tspan>
                    <tspan x="50%" dy="1.2em">${safeLines[1]}</tspan>
                </text>`
            }

            const svgImage = `
                <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#a6b3ff;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#a6e3ff;stop-opacity:1" />
                        </linearGradient>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                            <feOffset dx="2" dy="2" result="offsetblur"/>
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.5"/>
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grad)" />
                    <rect width="${width - 40}" height="${height - 40}" x="20" y="20" fill="#ffffff22" rx="15" />
                    ${textSvg}
                </svg>
            `

            await sharp(Buffer.from(svgImage))
                .toFormat('webp')
                .toFile(imagePath)

            const fileName = `/collections/${slug}-${Date.now()}.webp`
            const fileContent = fs.readFileSync(imagePath)

            await this.s3Service.upload(fileContent, fileName, 'image/webp')

            fs.unlinkSync(imagePath)

            return fileName
        } catch (error) {
            this.logger.error(
                `Failed to generate cover image: ${error.message}`,
            )
            return null
        }
    }

    private async addTitlesToCollection(
        collectionId: string,
        titles: any[],
        maxItemsPerCollection: number,
    ): Promise<void> {
        const existingItems = await this.db.query.titleCollectionItems.findMany(
            {
                where: eq(titleCollectionItems.collectionId, collectionId),
            },
        )
        const existingTitleIds = new Set(
            existingItems.map((item) => item.titleId),
        )

        const itemsCount =
            3 + Math.floor(Math.random() * (maxItemsPerCollection - 2))
        const uniqueTitles = [
            ...new Map(titles.map((title) => [title.id, title])).values(),
        ]

        const shuffledTitles = [...uniqueTitles].sort(() => Math.random() - 0.5)
        const selectedTitles = shuffledTitles
            .filter((title) => !existingTitleIds.has(title.id))
            .slice(0, Math.min(itemsCount, uniqueTitles.length))

        const titleItemsBatch = []

        selectedTitles.forEach((title, index) => {
            titleItemsBatch.push({
                id: uuidv4(),
                collectionId,
                titleId: title.id,
                position: index + 1,
                createdAt: new Date(),
            })
        })

        if (titleItemsBatch.length > 0) {
            await this.db.insert(titleCollectionItems).values(titleItemsBatch)
            this.logger.log(
                `Added ${titleItemsBatch.length} title items to collection ${collectionId}`,
            )
        }
    }

    private async addLocationsToCollection(
        collectionId: string,
        locations: any[],
        maxItemsPerCollection: number,
    ): Promise<void> {
        const existingItems =
            await this.db.query.locationCollectionItems.findMany({
                where: eq(locationCollectionItems.collectionId, collectionId),
            })
        const existingLocationIds = new Set(
            existingItems.map((item) => item.locationId),
        )

        const itemsCount =
            3 + Math.floor(Math.random() * (maxItemsPerCollection - 2))
        const uniqueLocations = [
            ...new Map(
                locations.map((location) => [location.id, location]),
            ).values(),
        ]

        const shuffledLocations = [...uniqueLocations].sort(
            () => Math.random() - 0.5,
        )
        const selectedLocations = shuffledLocations
            .filter((location) => !existingLocationIds.has(location.id))
            .slice(0, Math.min(itemsCount, uniqueLocations.length))

        const locationItemsBatch = []

        selectedLocations.forEach((location, index) => {
            locationItemsBatch.push({
                id: uuidv4(),
                collectionId,
                locationId: location.id,
                position: index + 1,
                createdAt: new Date(),
            })
        })

        if (locationItemsBatch.length > 0) {
            await this.db
                .insert(locationCollectionItems)
                .values(locationItemsBatch)
            this.logger.log(
                `Added ${locationItemsBatch.length} location items to collection ${collectionId}`,
            )
        }
    }

    private async cleanup(): Promise<void> {
        try {
            this.logger.log('Cleaning up existing collection data...')

            await this.db.delete(titleCollectionItems)
            await this.db.delete(locationCollectionItems)

            await this.db.delete(collections)

            this.logger.log('Collection data cleanup completed')
        } catch (error) {
            this.logger.error(
                `Failed to clean up collection data: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    async remove(): Promise<void> {
        try {
            this.logger.log('Removing all seeded collections...')

            const existingCollections =
                await this.db.query.collections.findMany({
                    orderBy: [asc(collections.createdAt)],
                })

            for (const collection of existingCollections) {
                if (collection.coverImage) {
                    try {
                        await this.s3Service.remove(collection.coverImage)
                    } catch (error) {
                        this.logger.warn(
                            `Failed to delete cover image ${collection.coverImage}: ${error.message}`,
                        )
                    }
                }
            }

            await this.db.delete(titleCollectionItems)
            await this.db.delete(locationCollectionItems)

            await this.db.delete(collections)

            this.logger.log(`Successfully removed all seeded collections`)
            return
        } catch (error) {
            this.logger.error(
                `Failed to remove seeded collections: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
