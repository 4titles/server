import { nameFragment } from '../fragments/name.fragment'

export const getTitleByIdQuery = `
    ${nameFragment}
    
    query fetchTitleById($id: ID!) {
        title(id: $id) {
            id
            type
            is_adult
            primary_title
            original_title
            start_year
            end_year
            runtime_minutes
            plot
            rating {
                aggregate_rating
                votes_count
            }
            genres
            posters {
                url
                width
                height
            }
            certificates {
                country {
                    code
                    name
                }
                rating
            }
            spoken_languages {
                code
                name
            }
            origin_countries {
                code
                name
            }
            critic_review {
                score
                review_count
            }
            directors: credits(first: 5, categories: ["director"]) {
                name {
                    ...NameFields
                }
            }
            writers: credits(first: 5, categories: ["writer"]) {
                name {
                    ...NameFields
                }
            }
            casts: credits(first: 5, categories: ["actor", "actress"]) {
                name {
                    ...NameFields
                }
                characters
                episodes_count
            }
        }
    }
`
