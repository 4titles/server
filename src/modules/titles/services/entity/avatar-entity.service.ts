import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
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

    async findByNameId(nameId: number): Promise<Avatar[]> {
        return this.avatarRepository.find({
            where: { name: { id: nameId } },
        })
    }

    async findByUrl(url: string): Promise<Avatar[]> {
        return this.avatarRepository.find({
            where: { url },
        })
    }

    async findByNameIdAndUrls(
        nameId: number,
        urls: string[],
    ): Promise<Avatar[]> {
        return this.avatarRepository.find({
            where: { name: { id: nameId }, url: In(urls) },
        })
    }

    async createMany(name: Name, avatars: IAvatar[]): Promise<Avatar[]> {
        try {
            const existingAvatars =
                (await this.findByNameIdAndUrls(
                    name.id,
                    avatars.map((avatar) => avatar.url),
                )) || []

            const existingAvatarsMap = new Map(
                existingAvatars.map((avatar) => [avatar.url, avatar]),
            )
            const avatarPromises = avatars.map(async (avatar) => {
                const existing = existingAvatarsMap.get(avatar.url)

                if (existing) {
                    return existing
                }

                const avatarEntity = this.avatarRepository.create({
                    name,
                    url: avatar.url,
                    width: avatar.width,
                    height: avatar.height,
                })

                return this.avatarRepository.save(avatarEntity)
            })

            const results = await Promise.all(avatarPromises)
            return results.filter(Boolean)
        } catch (error) {
            this.logger.error(
                `Failed to create name ${name.imdbId} avatars:`,
                error.stack,
            )
            throw error
        }
    }

    async updateMany(name: Name, avatars: IAvatar[]): Promise<void> {
        try {
            const existingAvatars = await this.findByNameIdAndUrls(
                name.id,
                avatars.map((avatar) => avatar.url),
            )

            if (!existingAvatars?.length) {
                return
            }

            const updatePromises = existingAvatars.map(async (existing) => {
                const newData = avatars.find(
                    (avatar) => avatar.url === existing.url,
                )
                if (newData) {
                    existing.width = newData.width
                    existing.height = newData.height
                    return this.avatarRepository.save(existing)
                }
            })

            const avatarsToCreate = avatars.filter(
                (avatar) =>
                    !existingAvatars.some(
                        (existing) => existing.url === avatar.url,
                    ),
            )

            await Promise.all([
                ...updatePromises,
                avatarsToCreate.length &&
                    this.createMany(name, avatarsToCreate),
            ])
        } catch (error) {
            this.logger.error(
                `Failed to update name ${name.imdbId} avatars:`,
                error.stack,
            )
            throw error
        }
    }
}
