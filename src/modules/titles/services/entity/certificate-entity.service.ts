import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Certificate } from 'src/entities/certificate.entity'
import { Country } from 'src/entities/country.entity'
import { Title } from 'src/entities/title.entity'
import {
    ICertificate,
    ICountry,
} from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Repository } from 'typeorm'

@Injectable()
export class CertificateEntityService {
    private readonly logger = new Logger(CertificateEntityService.name)

    constructor(
        @InjectRepository(Certificate)
        private readonly certificateRepository: Repository<Certificate>,
        @InjectRepository(Country)
        private readonly countryRepository: Repository<Country>,
    ) {}

    async createMany(
        title: Title,
        certificates: ICertificate[],
    ): Promise<Certificate[]> {
        const certificateEntities = await Promise.all(
            certificates.map(async (cert) => {
                const country = await this.findOrCreateCountry(cert.country)

                const exists = await this.certificateRepository.findOne({
                    where: {
                        title: { id: title.id },
                        country: { id: country.id },
                    },
                })

                if (exists) {
                    this.logger.debug(
                        `Certificate for country ${country.code} already exists for title ${title.id}`,
                    )
                    return exists
                }

                const certificate = this.certificateRepository.create({
                    title,
                    country,
                    rating: cert.rating,
                })

                return this.certificateRepository.save(certificate)
            }),
        )

        return certificateEntities.filter(Boolean)
    }

    async updateMany(
        title: Title,
        certificates: ICertificate[],
    ): Promise<void> {
        const existingCertificates = await this.certificateRepository.find({
            where: { title: { id: title.id } },
            relations: ['country'],
        })

        const certificatesToDelete = existingCertificates.filter(
            (existing) =>
                !certificates.some(
                    (cert) => cert.country.code === existing.country.code,
                ),
        )

        const certificatesToCreate = certificates.filter(
            (cert) =>
                !existingCertificates.some(
                    (existing) => existing.country.code === cert.country.code,
                ),
        )

        await Promise.all([
            certificatesToDelete.length &&
                this.certificateRepository.remove(certificatesToDelete),
            certificatesToCreate.length &&
                this.createMany(title, certificatesToCreate),
        ])
    }

    private async findOrCreateCountry(countryData: ICountry): Promise<Country> {
        const existing = await this.countryRepository.findOne({
            where: { code: countryData.code },
        })

        if (existing) {
            return existing
        }

        const country = this.countryRepository.create({
            code: countryData.code,
            name: countryData.name,
        })

        return this.countryRepository.save(country)
    }

    async deleteByTitleId(titleId: number): Promise<void> {
        await this.certificateRepository.delete({ title: { id: titleId } })
    }
}
