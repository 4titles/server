export interface PaginatedResult<T> {
    items: T[]
    total: number
    hasNextPage: boolean
    hasPreviousPage: boolean
}

export interface SearchOptions {
    from?: number
    size?: number
}
