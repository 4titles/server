import { Logger } from '@nestjs/common'
import { IRelationProcessor } from '../title/relation-processor.interface'
import { EntityMode } from './types/entity-mode.type'

export abstract class BaseRelationProcessor<T, D>
    implements IRelationProcessor<T, D>
{
    protected abstract readonly logger: Logger

    async process(entity: T, data: D, mode: EntityMode): Promise<void> {
        try {
            if (!this.shouldProcess(data)) return

            await this.processData(entity, data, mode)
        } catch (error) {
            this.handleError(error, entity, mode)
            throw error
        }
    }

    abstract shouldProcess(data: D): boolean
    abstract processData(entity: T, data: D, mode: EntityMode): Promise<any>

    handleError(error: Error, entity: T, mode: EntityMode): void {
        this.logger.error(
            `Failed to ${mode} relation for entity: ${entity}`,
            error.stack,
        )
    }
}
