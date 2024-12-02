import { Injectable, Logger } from '@nestjs/common'
import { BaseRelationProcessor } from './base/relation-processor.base'
import { ICertificate } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Title } from 'src/entities/title.entity'
import { CertificateEntityService } from '../../entity/certificate-entity.service'
import { Certificate } from 'src/entities/certificate.entity'
import { EntityMode } from './base/types/entity-mode.type'

@Injectable()
export class CertificateRelationProcessor extends BaseRelationProcessor<
    Title,
    ICertificate[]
> {
    protected readonly logger = new Logger(CertificateRelationProcessor.name)

    constructor(private readonly certificateSerice: CertificateEntityService) {
        super()
    }

    shouldProcess(certificates: ICertificate[]): boolean {
        return Boolean(certificates?.length)
    }

    async processData(
        title: Title,
        certificates: ICertificate[],
        mode: EntityMode,
    ): Promise<Certificate[] | void> {
        return mode === 'create'
            ? await this.certificateSerice.createMany(title, certificates)
            : await this.certificateSerice.updateMany(title, certificates)
    }
}
