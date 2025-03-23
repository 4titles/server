import { createHash } from 'crypto'

export class HashUtils {
    static hashData(data: any): string {
        const stringified = JSON.stringify(data, (key, value) => {
            if (value instanceof Date) return value.toISOString()
            if (Array.isArray(value)) return value.sort()
            return value
        })

        return createHash('sha256').update(stringified).digest('hex')
    }

    static areArraysChanged<T>(cached: T[] | null, newData: T[]): boolean {
        if (!cached || cached.length !== newData.length) return true
        return this.hashData(cached) !== this.hashData(newData)
    }

    static areObjectsChanged<T>(cached: T | null, newData: T): boolean {
        if (!cached) return true
        return this.hashData(cached) !== this.hashData(newData)
    }
}
