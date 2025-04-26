export function generateSlug(
    text: string,
    fallbackId?: string | number,
    options?: {
        prefix?: string
        alwaysAppendId?: boolean
        separator?: string
    },
): string {
    const prefix = options?.prefix || ''
    const separator = options?.separator || '-'
    const alwaysAppendId = options?.alwaysAppendId || false

    let baseSlug = ''
    if (text) {
        baseSlug = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, separator)
            .replace(new RegExp(`${separator}+`, 'g'), separator)
            .trim()
    }

    if ((!baseSlug || baseSlug === separator) && fallbackId) {
        return prefix ? `${prefix}${separator}${fallbackId}` : `${fallbackId}`
    }

    if (fallbackId && (alwaysAppendId || options?.alwaysAppendId)) {
        baseSlug = baseSlug
            ? `${baseSlug}${separator}${fallbackId}`
            : `${fallbackId}`
    }

    return prefix ? `${prefix}${separator}${baseSlug}` : baseSlug
}
