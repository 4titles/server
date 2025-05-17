export function generateSlug(
    text: string,
    fallbackId?: string | number,
    options?: {
        prefix?: string
        alwaysAppendId?: boolean
        separator?: string
        ensureUnique?: boolean
    },
): string {
    const prefix = options?.prefix || ''
    const separator = options?.separator || '-'
    const alwaysAppendId = options?.alwaysAppendId || false
    const ensureUnique = options?.ensureUnique || false

    let baseSlug = ''
    if (text) {
        baseSlug = text
            .toLowerCase()
            .replace(/[^a-zа-яё0-9\s-]/g, '')
            .replace(/[\s-]+/g, separator)
            .replace(new RegExp(`(${separator})\\1+`, 'g'), '$1')
            .trim()
            .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '')
    }

    if ((!baseSlug || baseSlug === separator) && fallbackId) {
        return prefix ? `${prefix}${separator}${fallbackId}` : `${fallbackId}`
    }

    if (fallbackId && (alwaysAppendId || ensureUnique)) {
        baseSlug = baseSlug
            ? `${baseSlug}${separator}${fallbackId}`
            : `${fallbackId}`
    } else if (ensureUnique) {
        const timestamp = Date.now().toString()
        baseSlug = `${baseSlug}${separator}${timestamp}`
    }

    return prefix ? `${prefix}${separator}${baseSlug}` : baseSlug
}
