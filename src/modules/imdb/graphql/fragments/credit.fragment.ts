export const creditFragment = `
    fragment CreditFields on Credit {
        name {
            ...NameFields
        }
        characters
        episodes_count
    }
`
