import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class GraphQLHealthService {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    async check(key: string): Promise<Record<string, any>> {
        const url = `${this.configService.getOrThrow<string>('BACKEND_URL')}/graphql`
        const query = { query: '{ __typename }' }

        try {
            const response = await lastValueFrom(
                this.httpService.post(url, query),
            )

            if (response.data && response.data.data) {
                return { [key]: { status: 'up' } }
            }

            return {
                [key]: {
                    status: 'down',
                    message: 'Invalid response from GraphQL',
                },
            }
        } catch (error) {
            return { [key]: { status: 'down', message: error.message } }
        }
    }
}
