import { nameFragment } from '../fragments/name.fragment'
import { ratingFragment } from '../fragments/rating.fragment'
import { posterFragment } from '../fragments/poster.fragment'
import { certificateFragment } from '../fragments/certificate.fragment'
import { countryFragment } from '../fragments/country.fragment'
import { languageFragment } from '../fragments/language.fragment'
import { criticReviewFragment } from '../fragments/critic-review.fragment'
import { creditFragment } from '../fragments/credit.fragment'

export const getTitlesByIdsQuery = `
    ${nameFragment}
    ${ratingFragment}
    ${posterFragment}
    ${certificateFragment}
    ${countryFragment}
    ${languageFragment}
    ${criticReviewFragment}
    ${creditFragment}
    
    query fetchTitlesByIds($ids: [String!]!) {
        titles(ids: $ids) {
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
                ...RatingFields
            }
            genres
            posters {
                ...PosterFields
            }
            certificates {
                ...CertificateFields
            }
            spoken_languages {
                ...LanguageFields
            }
            origin_countries {
                ...CountryFields
            }
            critic_review {
                ...CriticReviewFields
            }
            directors: credits(first: 5, categories: ["director"]) {
                ...CreditFields
            }
            writers: credits(first: 5, categories: ["writer"]) {
                ...CreditFields
            }
            casts: credits(first: 5, categories: ["actor", "actress"]) {
                ...CreditFields
            }
        }
    }
`
