import { EntityMode } from './base/types/entity-mode.type'

export interface IRelationProcessor<T, D> {
    process(entity: T, data: D, mode: EntityMode): Promise<void>
    shouldProcess(data: D): boolean
    processData(entity: T, data: D, mode: EntityMode): Promise<any>
    handleError(error: Error, entity: T, mode: EntityMode): void
}
