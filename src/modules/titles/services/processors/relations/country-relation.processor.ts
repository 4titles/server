import { Injectable, Logger } from '@nestjs/common'
import { Title } from 'src/entities/title.entity'
import { ICountry } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { BaseRelationProcessor } from './base/relation-processor.base'
import { CountryEntityService } from '../../entity/country-entity.service'
import { Country } from 'src/entities/country.entity'
import { EntityMode } from './base/types/entity-mode.type'

@Injectable()
export class CountryRelationProcessor extends BaseRelationProcessor<
    Title,
    ICountry[]
> {
    protected readonly logger = new Logger(CountryRelationProcessor.name)

    constructor(private readonly countryService: CountryEntityService) {
        super()
    }

    shouldProcess(countries: ICountry[]): boolean {
        return Boolean(countries?.length)
    }

    async processData(
        title: Title,
        countries: ICountry[],
        mode: EntityMode,
    ): Promise<Country[] | void> {
        return mode === 'create'
            ? await this.countryService.findOrCreateMany(countries)
            : await this.countryService.updateMany(countries)
    }
}
