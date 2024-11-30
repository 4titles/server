import { nameFragment } from '../fragments/name.fragment'

export const getNamesByIdsQuery = `
    ${nameFragment}
    
    query fetchNamesByIds($ids: [String!]!) {
        names(ids: $ids) {
            ...NameFields
        }
    }
`
