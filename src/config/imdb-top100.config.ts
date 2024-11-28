import { registerAs } from '@nestjs/config'

export interface IIMDBTop100Config {
    rapidApiHost: string
    rapidApiKey: string
    topMoviesEndPoint: string
    topTvSeriesEndPoint: string
    headers: { 'x-rapidapi-host': string; 'x-rapidapi-key': string }
}

const RAPID_API_IMBD_TOP_100_HOST = process.env.RAPID_API_IMDB_TOP_100_HOST
const RAPID_API_IMDB_TOP_100_KEY = process.env.RAPID_API_IMDB_TOP_100_KEY

export default registerAs(
    'imdb-top100',
    (): IIMDBTop100Config => ({
        rapidApiHost: RAPID_API_IMBD_TOP_100_HOST,
        rapidApiKey: RAPID_API_IMDB_TOP_100_KEY,
        topMoviesEndPoint: 'https://imdb-top-100-movies.p.rapidapi.com/',
        topTvSeriesEndPoint:
            'https://imdb-top-100-movies.p.rapidapi.com/series/',
        headers: {
            'x-rapidapi-host': RAPID_API_IMBD_TOP_100_HOST,
            'x-rapidapi-key': RAPID_API_IMDB_TOP_100_KEY,
        },
    }),
)
