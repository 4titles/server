export const bigIntSerializer = {
    stringify: (obj: any): string => {
        return JSON.stringify(obj, (_, value) =>
            typeof value === 'bigint' ? value.toString() : value,
        )
    },
    parse: (str: string): any => {
        return JSON.parse(str, (_, value) => {
            if (typeof value === 'string' && /^\d+n$/.test(value)) {
                return BigInt(value.slice(0, -1))
            }
            return value
        })
    },
}
