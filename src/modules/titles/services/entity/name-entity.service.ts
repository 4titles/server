import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Name } from 'src/entities/name.entity'
import { INameDetails } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Repository } from 'typeorm'
import { AvatarEntityService } from './avatar-entity.service'

@Injectable()
export class NameEntityService {
    private readonly logger = new Logger(NameEntityService.name)

    constructor(
        @InjectRepository(Name)
        private readonly nameRepository: Repository<Name>,
        private readonly avatarService: AvatarEntityService,
    ) {}

    async findOrCreate(nameData: INameDetails): Promise<Name> {
        const existing = await this.nameRepository.findOne({
            where: { imdbId: nameData.id },
        })

        if (existing) {
            return existing
        }

        return this.create(nameData)
    }

    async create(nameData: INameDetails): Promise<Name> {
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

        return savedName
    }

    async update(existing: Name, nameData: INameDetails): Promise<Name> {
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

        return savedName
    }
}
