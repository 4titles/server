import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Name } from 'src/entities/name.entity'
import { INameDetails } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Repository, In } from 'typeorm'
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
        const existing = await this.findByImdbId(nameData.id, relations)

        if (existing) {
            return existing
        }

        return this.create(nameData)
    }

    async create(nameData: INameDetails): Promise<Name> {
        try {
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

            const savedName = await this.nameRepository.save(name)

            if (nameData.avatars?.length) {
                await this.avatarService.createMany(savedName, nameData.avatars)
            }

            if (nameData.known_for?.length) {
                this.logger.log(
                    `Processing knownFor titles for name ${savedName.imdbId}`,
                )
                await this.processKnownForTitles(savedName, nameData.known_for)
            }

            return savedName
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
            Object.assign(existing, {
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

            this.logger.log(
                `Updating knownFor titles for name ${savedName.imdbId}`,
            )
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

    private async processKnownForTitles(
        name: Name,
        knownForTitles: { id: string; primary_title: string }[],
    ): Promise<void> {
        try {
            this.logger.log(
                `Processing knownFor titles for name ${name.imdbId}`,
            )

            const newTitles = await this.titleService.findByImdbIds(
                knownForTitles.map((t) => t.id),
            )

            const existingRelations = await this.nameRepository.findOne({
                where: {
                    id: name.id,
                    knownFor: {
                        id: In(newTitles.map((t) => t.id)),
                    },
                },
                relations: ['knownFor'],
            })

            const existingTitleIds = new Set(
                existingRelations?.knownFor?.map((t) => t.id) || [],
            )
            const titlesToAdd = newTitles.filter(
                (title) => title && !existingTitleIds.has(title.id),
            )

            if (!titlesToAdd.length) {
                return
            }

            name.knownFor = [
                ...(existingRelations?.knownFor || []),
                ...titlesToAdd,
            ]
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
