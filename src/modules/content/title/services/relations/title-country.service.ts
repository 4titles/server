import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { titleCountries } from '@/modules/infrastructure/drizzle/schema/title-countries.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable } from '@nestjs/common'
import { CountryService } from '../../modules/country/country.service'
import { CountryRelation } from '../../modules/country/enums/country-relation.enum'
import { TmdbCountry } from '../../modules/tmdb/models/tmdb-country.model'

@Injectable()
export class TitleCountryService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly countryService: CountryService,
    ) {}

    async linkTitleToCountries(
        tx: DrizzleDB,
        titleId: string,
        productionCountries: TmdbCountry[],
        originCountries: string[],
    ): Promise<void> {
        const isoCodes = [
            ...(productionCountries?.map((c) => c.iso_3166_1) || []),
            ...(originCountries || []),
        ].filter(Boolean) as string[]

        if (!isoCodes.length) return

        const dbCountries = await this.countryService.findManyByISO(isoCodes)
        const countryMap = new Map(dbCountries.map((c) => [c.iso, c.id]))

        const relations = [
            ...this.mapCountriesToRelations(
                titleId,
                countryMap,
                productionCountries,
                CountryRelation.PRODUCTION,
            ),
            ...this.mapCountriesToRelations(
                titleId,
                countryMap,
                originCountries,
                CountryRelation.ORIGIN,
            ),
        ].filter(
            (relation, index, self) =>
                self.findIndex(
                    (r) =>
                        r.countryId === relation.countryId &&
                        r.type === relation.type,
                ) === index,
        )

        if (relations.length) {
            await tx.insert(titleCountries).values(relations)
        }
    }

    private mapCountriesToRelations(
        titleId: string,
        countryMap: Map<string, string>,
        countries?: TmdbCountry[] | string[],
        type?: CountryRelation,
    ) {
        return (countries || [])
            .map((country) => {
                const iso =
                    typeof country === 'string' ? country : country.iso_3166_1
                const countryId = countryMap.get(iso)
                return countryId ? { titleId, countryId, type } : null
            })
            .filter(Boolean)
    }
}
