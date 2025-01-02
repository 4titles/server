import { registerAs } from '@nestjs/config'

export default registerAs('tmdb', () => ({
    apiKey: process.env.TMDB_API_KEY,
    defaultLanguage: 'ru-RU',
    defaultRegion: 'RU',
    headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_API_ACCESS__KEY}`,
    },
}))
