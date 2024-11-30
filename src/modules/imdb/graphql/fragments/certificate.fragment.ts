export const certificateFragment = `
    fragment CertificateFields on Certificate {
        rating
        country {
            ...CountryFields
        }
    }
`
