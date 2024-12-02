import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Name } from 'src/entities/name.entity'
import { INameDetails } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Repository } from 'typeorm'
import { AvatarEntityService } from './avatar-entity.service'
import { TitleEntityService } from './title-entity.service'

@Injectable()
export class NameEntityService {
    private readonly logger = new Logger(NameEntityService.name)

    constructor(
        @InjectRepository(Name)
        private readonly nameRepository: Repository<Name>,
        @Inject(forwardRef(() => TitleEntityService))
        private readonly titleService: TitleEntityService,
        private readonly avatarService: AvatarEntityService,
    ) {}

    async findByImdbId(
        imdbId: string,
        relations: string[] = [],
    ): Promise<Name | null> {
        return this.nameRepository.findOne({
            where: { imdbId },
            relations,
        })
    }

    async findOrCreate(
        nameData: INameDetails,
        relations: string[] = [],
    ): Promise<Name> {
        try {
            const existing = await this.findByImdbId(nameData.id, relations)

            if (existing) {
                return existing
            }

            return this.create(nameData)
        } catch (error) {
            this.logger.error(
                `Failed to find or create name ${nameData.id}:`,
                error.stack,
            )
            throw error
        }
    }

    async create(nameData: INameDetails): Promise<Name> {
        try {
            const existing = await this.findByImdbId(nameData.id)
            if (existing) {
                return existing
            }

            const name = this.nameRepository.create({
                imdbId: nameData.id,
                displayName: nameData.display_name,
                alternateNames: nameData.alternate_names,
                birthYear: nameData.birth_year,
                birthLocation: nameData.birth_location,
                deathYear: nameData.death_year,
                deathLocation: nameData.death_location,
                deadReason: nameData.dead_reason,
            })

            try {
                const savedName = await this.nameRepository.save(name)

                if (nameData.avatars?.length) {
                    await this.avatarService.findOrCreateMany(
                        savedName,
                        nameData.avatars,
                    )
                }

                if (nameData.known_for?.length) {
                    await this.processKnownForTitles(
                        savedName,
                        nameData.known_for,
                    )
                }

                return savedName
            } catch {
                return existing
            }
        } catch (error) {
            this.logger.error(
                `Failed to create name ${nameData.id}:`,
                error.stack,
            )
            throw error
        }
    }

    async update(existing: Name, nameData: INameDetails): Promise<Name> {
        try {
            const existingName = await this.nameRepository.findOne({
                where: { id: existing.id },
                relations: ['knownFor', 'avatars'],
            })

            if (!existingName) {
                return existing
            }

            Object.assign(existingName, {
                displayName: nameData.display_name,
                alternateNames: nameData.alternate_names,
                birthYear: nameData.birth_year,
                birthLocation: nameData.birth_location,
                deathYear: nameData.death_year,
                deathLocation: nameData.death_location,
                deadReason: nameData.dead_reason,
            })

            const savedName = await this.nameRepository.save(existing)

            if (nameData.avatars?.length) {
                await this.avatarService.updateMany(savedName, nameData.avatars)
            }

            if (nameData.known_for?.length) {
                await this.processKnownForTitles(savedName, nameData.known_for)
            }

            return savedName
        } catch (error) {
            this.logger.error(
                `Failed to update name ${nameData.id}:`,
                error.stack,
            )
            throw error
        }
    }

    async processKnownForTitles(
        name: Name,
        knownForTitles: { id: string; primary_title: string }[],
    ): Promise<void> {
        try {
            const newTitles = await this.titleService.findByImdbIds(
                knownForTitles.map((t) => t.id),
            )
            const existingName = await this.findByImdbId(name.imdbId, [
                'knownFor',
            ])
            const existingTitleIds = new Set(
                existingName?.knownFor?.map((t) => t.imdbId) || [],
            )
            const titlesToAdd = newTitles.filter(
                (title) => title && !existingTitleIds.has(title.imdbId),
            )

            if (
                !titlesToAdd.length &&
                existingName?.knownFor?.length === knownForTitles.length
            ) {
                return
            }

            name.knownFor = [...(existingName?.knownFor || []), ...titlesToAdd]
            await this.nameRepository.save(name)
        } catch (error) {
            this.logger.error(
                `Failed to process knownFor titles for name ${name.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }
}
