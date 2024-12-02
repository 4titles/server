import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Name } from 'src/entities/name.entity'
import { INameDetails } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Repository } from 'typeorm'
import { TitleEntityService } from './title-entity.service'
import { NameRelationProcessorService } from '../processors/relations/name/name-relation.processor.service'

@Injectable()
export class NameEntityService {
    private readonly logger = new Logger(NameEntityService.name)

    constructor(
        @InjectRepository(Name)
        private readonly nameRepository: Repository<Name>,
        @Inject(forwardRef(() => TitleEntityService))
        private readonly titleService: TitleEntityService,
        private readonly nameRelationProcessor: NameRelationProcessorService,
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

            return await this.create(nameData)
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
            let existing = await this.findByImdbId(nameData.id)

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

            existing = name

            try {
                const savedName = await this.nameRepository.save(name)
                await this.nameRelationProcessor.processAll(
                    savedName,
                    nameData,
                    'create',
                )

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
            const updatedName = Object.assign(existing, {
                displayName: nameData.display_name,
                alternateNames: nameData.alternate_names,
                birthYear: nameData.birth_year,
                birthLocation: nameData.birth_location,
                deathYear: nameData.death_year,
                deathLocation: nameData.death_location,
                deadReason: nameData.dead_reason,
            })

            const savedName = await this.nameRepository.save(updatedName)

            await this.nameRelationProcessor.processAll(
                savedName,
                nameData,
                'update',
            )

            return this.findByImdbId(savedName.imdbId)
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
