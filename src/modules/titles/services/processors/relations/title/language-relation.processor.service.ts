import { Injectable, Logger } from '@nestjs/common'
import { Title } from 'src/entities/title.entity'
import { ILanguage } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { BaseRelationProcessor } from '../base/relation-processor.base'
import { LanguageEntityService } from '../../../entity/language-entity.service'
import { Language } from 'src/entities/language.entity'
import { EntityMode } from '../base/types/entity-mode.type'

@Injectable()
export class LanguageRelationProcessorService extends BaseRelationProcessor<
    Title,
    ILanguage[]
> {
    protected readonly logger = new Logger(
        LanguageRelationProcessorService.name,
    )

    constructor(private readonly languageService: LanguageEntityService) {
        super()
    }

    shouldProcess(languages: ILanguage[]): boolean {
        return Boolean(languages?.length)
    }

    async processData(
        title: Title,
        languages: ILanguage[],
        mode: EntityMode,
    ): Promise<Language[] | void> {
        return mode === 'create'
            ? await this.languageService.findOrCreateMany(languages)
            : await this.languageService.updateMany(title, languages)
    }
}
