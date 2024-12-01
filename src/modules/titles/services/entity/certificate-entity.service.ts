import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Certificate } from 'src/entities/certificate.entity'
import { Title } from 'src/entities/title.entity'
import { ICertificate } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { In, Repository } from 'typeorm'
import { CountryEntityService } from './country-entity.service'

@Injectable()
export class CertificateEntityService {
    private readonly logger = new Logger(CertificateEntityService.name)

    constructor(
        @InjectRepository(Certificate)
        private readonly certificateRepository: Repository<Certificate>,
        private readonly countryEntityService: CountryEntityService,
    ) {}

    async findByTitleIdAndCountryCodes(
        titleId: number,
        countryCodes: string[] = [],
    ): Promise<Certificate[]> {
        if (!countryCodes?.length) return []

        return this.certificateRepository.find({
            where: {
                title: { id: titleId },
                country: { code: In(countryCodes) },
            },
            relations: ['country'],
        })
    }

    async createMany(
        title: Title,
        certificates: ICertificate[] = [],
    ): Promise<Certificate[]> {
        if (!certificates?.length) return

        try {
            const countries = await this.countryEntityService.findOrCreateMany(
                certificates.map((cert) => cert.country),
            )
            const countryMap = new Map(
                countries.map((country) => [country.code, country]),
            )

            const existingCertificates =
                await this.findByTitleIdAndCountryCodes(
                    title.id,
                    certificates.map((cert) => cert.country.code),
                )
            const existingMap = new Map(
                existingCertificates.map((cert) => [cert.country.code, cert]),
            )

            const certificatePromises = certificates.map(async (cert) => {
                const country = countryMap.get(cert.country.code)
                if (!country) {
                    return null
                }

                const existing = existingMap.get(cert.country.code)
                if (existing) {
                    return existing
                }

                const certificate = this.certificateRepository.create({
                    title,
                    country,
                    rating: cert.rating,
                })

                return this.certificateRepository.save(certificate)
            })

            const results = await Promise.all(certificatePromises)
            return results.filter(Boolean)
        } catch (error) {
            this.logger.error(
                `Failed to create title ${title.imdbId} certificates:`,
                error.stack,
            )
            throw error
        }
    }

    async updateMany(
        title: Title,
        certificates: ICertificate[] = [],
    ): Promise<void> {
        if (!certificates?.length) return

        try {
            const existingCertificates =
                await this.findByTitleIdAndCountryCodes(
                    title.id,
                    certificates.map((cert) => cert.country.code),
                )

            const updatePromises = existingCertificates.map(
                async (existing) => {
                    const newData = certificates.find(
                        (cert) => cert.country.code === existing.country.code,
                    )
                    if (newData) {
                        existing.rating = newData.rating
                        return this.certificateRepository.save(existing)
                    }
                },
            )

            const certificatesToCreate = certificates.filter(
                (cert) =>
                    !existingCertificates.some(
                        (existing) =>
                            existing.country.code === cert.country.code,
                    ),
            )

            await Promise.all(
                [
                    ...updatePromises,
                    certificatesToCreate.length &&
                        this.createMany(title, certificatesToCreate),
                ].filter(Boolean),
            )
        } catch (error) {
            this.logger.error(
                `Failed to update title ${title.imdbId} certificates:`,
                error.stack,
            )
            throw error
        }
    }
}
