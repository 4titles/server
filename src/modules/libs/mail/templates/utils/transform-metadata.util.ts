import type { SessionMetadata } from '@/shared/types/session-metadata.types'

export interface TransformedLocationInfo {
    location: string
    os: string | null
    browser: string | null
    device: string | null
    ip: string | null
}

const hasValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string' && (value.trim() === '' || value === 'N/A'))
        return false
    return true
}

export const transformMetadata = (
    metadata: SessionMetadata,
): TransformedLocationInfo => {
    const locationParts = [
        metadata.location.country.ru,
        metadata.location.region,
        metadata.location.city,
    ]
        .filter(hasValue)
        .join(', ')

    return {
        location: locationParts || null,
        os: hasValue(metadata.device.os) ? metadata.device.os : null,
        browser: hasValue(metadata.device.browser)
            ? metadata.device.browser
            : null,
        device: hasValue(metadata.device.brand) ? metadata.device.brand : null,
        ip: hasValue(metadata.ip) ? metadata.ip : null,
    }
}
