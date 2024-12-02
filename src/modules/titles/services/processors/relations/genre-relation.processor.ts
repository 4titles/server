import { Injectable, Logger } from '@nestjs/common'
import { Title } from 'src/entities/title.entity'
import { BaseRelationProcessor } from './base/relation-processor.base'
import { GenreEntityService } from '../../entity/genre-entity.service'
import { Genre } from 'src/entities/genre.entity'
import { EntityMode } from './base/types/entity-mode.type'

@Injectable()
export class GenreRelationProcessor extends BaseRelationProcessor<
    Title,
    string[]
> {
    protected readonly logger = new Logger(GenreRelationProcessor.name)

    constructor(private readonly genreService: GenreEntityService) {
        super()
    }

    shouldProcess(genres: string[]): boolean {
        return Boolean(genres?.length)
    }

    async processData(
        title: Title,
        genres: string[],
        mode: EntityMode,
    ): Promise<Genre[] | void> {
        return mode === 'create'
            ? await this.genreService.findOrCreateMany(title, genres)
            : await this.genreService.updateMany(title, genres)
    }
}
