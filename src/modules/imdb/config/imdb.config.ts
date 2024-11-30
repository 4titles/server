import { registerAs } from '@nestjs/config'

export interface IIMDBConfig {
    timeout: number
    graphql: {
        endpoint: string
    }
    top100: {
        rapidApiHost: string
        rapidApiKey: string
        moviesEndpoint: string
        tvSeriesEndpoint: string
        headers: {
            'x-rapidapi-host': string
            'x-rapidapi-key': string
        }
    }
}

const RAPID_API_IMBD_TOP_100_HOST = process.env.RAPID_API_IMDB_TOP_100_HOST
const RAPID_API_IMDB_TOP_100_KEY = process.env.RAPID_API_IMDB_TOP_100_KEY

export default registerAs(
    'imdb',
    (): IIMDBConfig => ({
        timeout: 30000,
        graphql: {
            endpoint: process.env.IMDB_GRAPHQL_API_URL,
        },
        top100: {
            rapidApiHost: RAPID_API_IMBD_TOP_100_HOST,
            rapidApiKey: RAPID_API_IMDB_TOP_100_KEY,
            moviesEndpoint: 'https://imdb-top-100-movies.p.rapidapi.com/',
            tvSeriesEndpoint:
                'https://imdb-top-100-movies.p.rapidapi.com/series/',
            get headers() {
                return {
                    'x-rapidapi-host': this.rapidApiHost,
                    'x-rapidapi-key': this.rapidApiKey,
                }
            },
        },
    }),
)
