import { Injectable, Logger } from '@nestjs/common'
import { Name } from 'src/entities'
import { INameDetails } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { EntityMode } from '../base/types/entity-mode.type'
import { AvatarRelationProcessorService } from './avatar-relation.procesor.service'
import { KnownForRelationProcessorService } from './known-for-relation.processor.service'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'

@Injectable()
export class NameRelationProcessorService {
    private readonly logger = new Logger(NameRelationProcessorService.name)

    constructor(
        private readonly avatarProcessor: AvatarRelationProcessorService,
        private readonly knownForProcessor: KnownForRelationProcessorService,
        @InjectRepository(Name)
        private readonly nameRepository: Repository<Name>,
    ) {}

    async processAll(
        name: Name,
        nameData: INameDetails,
        mode: EntityMode,
    ): Promise<void> {
        try {
            const [avatars, knownFor] = await Promise.all([
                this.avatarProcessor.processData(name, nameData.avatars, mode),
                this.knownForProcessor.processData(name, nameData.known_for),
            ])

            if (avatars) name.avatars = avatars
            if (knownFor) name.knownFor = knownFor

            await this.nameRepository.save(name)
        } catch (error) {
            this.logger.error(
                `Failed to process name relations for ${name.imdbId}`,
                error,
            )
        }
    }
}
