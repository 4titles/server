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

    async findByNameId(nameId: number): Promise<Avatar[]> {
        return await this.avatarRepository.find({
            where: { name: { id: nameId } },
        })
    }

    async findOrCreateMany(name: Name, avatars: IAvatar[]): Promise<Avatar[]> {
        if (!avatars?.length) return []

        try {
            const existingAvatars = await this.findByNameId(name.id)
            const existingAvatarsMap = new Map(
                existingAvatars.map((avatar) => [avatar.url, avatar]),
            )

            const avatarsToCreate = avatars.filter(
                (avatar) => !existingAvatarsMap.has(avatar.url),
            )

            if (!avatarsToCreate.length) {
                return Array.from(existingAvatarsMap.values())
            }

            const newAvatars = await Promise.all(
                avatarsToCreate.map(async (avatar) => {
                    try {
                        const avatarEntity = this.avatarRepository.create({
                            name,
                            url: avatar.url,
                            width: avatar.width,
                            height: avatar.height,
                        })
                        return await this.avatarRepository.save(avatarEntity)
                    } catch {
                        return existingAvatarsMap.get(avatar.url)
                    }
                }),
            )

            return [...existingAvatars, ...newAvatars.filter(Boolean)]
        } catch (error) {
            this.logger.error(
                `Failed to create avatars for name ${name.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }

    async updateMany(name: Name, avatars: IAvatar[]): Promise<Avatar[]> {
        if (!avatars?.length) return []

        try {
            const currentAvatars = await this.findByNameId(name.id)
            const updatedAvatars = await this.findOrCreateMany(name, avatars)
            const updatedAvatarUrls = new Set(updatedAvatars.map((a) => a.url))
            const avatarsToRemove = currentAvatars.filter(
                (a) => !updatedAvatarUrls.has(a.url),
            )

            if (avatarsToRemove.length) {
                name.avatars =
                    name.avatars?.filter(
                        (a) => !avatarsToRemove.some((ra) => ra.url === a.url),
                    ) || []
            }

            const updates = updatedAvatars.map((existing) => {
                const newData = avatars.find((a) => a.url === existing.url)
                if (newData) {
                    existing.width = newData.width
                    existing.height = newData.height
                }
                return existing
            })

            return updates
        } catch (error) {
            this.logger.error(
                `Failed to update avatars for name ${name.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }
}
