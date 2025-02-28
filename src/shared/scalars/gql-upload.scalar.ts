import { GraphQLScalarType, Kind } from 'graphql'

export const GraphQLUploadScalar = new GraphQLScalarType({
    name: 'Upload',
    description: 'Upload custom scalar type',
    parseValue(value) {
        return value
    },
    serialize(value) {
        return value
    },
    parseLiteral(ast) {
        return ast.kind === Kind.STRING ? ast.value : null
    },
})
