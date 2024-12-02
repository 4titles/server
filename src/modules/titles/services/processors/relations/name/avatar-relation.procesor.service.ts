import { Injectable, Logger } from '@nestjs/common'
import { Avatar, Name } from 'src/entities'
import { IAvatar } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { BaseRelationProcessor } from '../base/relation-processor.base'
import { EntityMode } from '../base/types/entity-mode.type'
import { AvatarEntityService } from '../../../entity'

@Injectable()
export class AvatarRelationProcessorService extends BaseRelationProcessor<
    Name,
    IAvatar[]
> {
    protected readonly logger = new Logger(AvatarRelationProcessorService.name)

    constructor(private readonly avatarService: AvatarEntityService) {
        super()
    }

    shouldProcess(avatars: IAvatar[]): boolean {
        return Boolean(avatars?.length)
    }

    async processData(
        name: Name,
        avatars: IAvatar[],
        mode: EntityMode,
    ): Promise<Avatar[] | void> {
        return mode === 'create'
            ? await this.avatarService.findOrCreateMany(name, avatars)
            : await this.avatarService.updateMany(name, avatars)
    }
}
