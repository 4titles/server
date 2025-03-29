export function dateReviver(dateKeys: string[], key: string, value: any): any {
    if (dateKeys.includes(key) && value) {
        try {
            const date = new Date(value)
            if (!isNaN(date.getTime())) {
                return date
            }
            console.warn(`Invalid date format for key "${key}": ${value}`)
        } catch (e) {
            console.error(`Error parsing date for key "${key}": ${value}`, e)
        }
    }

    return value
}
