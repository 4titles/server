export const nameFragment = `
    fragment NameFields on Name {
        id
        display_name
        alternate_names
        birth_year
        birth_location
        death_year
        death_location
        dead_reason
        avatars {
            url
            width
            height
        }
        known_for {
            id
            primary_title
        }
    }
`
