import { isDev } from '@/shared/utils/common/is-dev.util'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { ApolloDriverConfig } from '@nestjs/apollo'
import { ConfigService } from '@nestjs/config'

import { GraphQLUploadScalar } from '@/shared/scalars/gql-upload.scalar'
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js'

export default function getGraphQLConfig(
    configService: ConfigService,
): ApolloDriverConfig {
    return {
        autoSchemaFile: true,
        plugins: [
            isDev(configService)
                ? ApolloServerPluginLandingPageLocalDefault()
                : undefined,
        ],
        playground: false,
        context: ({ req }) => ({ req }),
        buildSchemaOptions: {
            scalarsMap: [{ type: GraphQLUpload, scalar: GraphQLUploadScalar }],
        },
    }
}
