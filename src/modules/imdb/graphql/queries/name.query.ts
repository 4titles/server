export const getNameByIdQuery = `
    query fetchNameById($id: ID!) {
        name(id: $id) {
            id
            display_name
            avatars {
                url
                width
                height
            }
            alternate_names
            birth_year
            birth_location
            death_year
            death_location
            dead_reason
            known_for {
                id
                primary_title
            }
        }
    }
`
