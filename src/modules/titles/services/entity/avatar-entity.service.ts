import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Avatar } from 'src/entities/avatar.entity'
import { Name } from 'src/entities/name.entity'
import { IAvatar } from 'src/modules/imdb/interfaces/imdb-graphql.interface'

@Injectable()
export class AvatarEntityService {
    private readonly logger = new Logger(AvatarEntityService.name)

    constructor(
        @InjectRepository(Avatar)
        private readonly avatarRepository: Repository<Avatar>,
    ) {}

    async createMany(name: Name, avatars: IAvatar[]): Promise<Avatar[]> {
        const avatarEntities = await Promise.all(
            avatars.map(async (avatar) => {
                const exists = await this.avatarRepository.findOne({
                    where: {
                        name: { id: name.id },
                        url: avatar.url,
                    },
                })

                if (exists) {
                    this.logger.debug(
                        `Avatar ${avatar.url} already exists for name ${name.imdbId}`,
                    )
                    return exists
                }

                const avatarEntity = this.avatarRepository.create({
                    name,
                    url: avatar.url,
                    width: avatar.width,
                    height: avatar.height,
                })

                return this.avatarRepository.save(avatarEntity)
            }),
        )

        return avatarEntities.filter(Boolean)
    }

    async updateMany(name: Name, avatars: IAvatar[]): Promise<void> {
        const existingAvatars = await this.avatarRepository.find({
            where: { name: { id: name.id } },
        })

        const avatarsToDelete = existingAvatars.filter(
            (existing) =>
                !avatars.some((avatar) => avatar.url === existing.url),
        )

        const avatarsToCreate = avatars.filter(
            (avatar) =>
                !existingAvatars.some(
                    (existing) => existing.url === avatar.url,
                ),
        )

        await Promise.all([
            avatarsToDelete.length &&
                this.avatarRepository.remove(avatarsToDelete),
            avatarsToCreate.length && this.createMany(name, avatarsToCreate),
        ])
    }

    async deleteByNameId(nameId: number): Promise<void> {
        await this.avatarRepository.delete({ name: { id: nameId } })
    }

    async findByNameId(nameId: number): Promise<Avatar[]> {
        return this.avatarRepository.find({
            where: { name: { id: nameId } },
        })
    }

    async deleteByUrl(nameId: number, url: string): Promise<void> {
        await this.avatarRepository.delete({
            name: { id: nameId },
            url,
        })
    }

    async deleteAll(nameId: number): Promise<void> {
        await this.avatarRepository.delete({
            name: { id: nameId },
        })
    }
}
