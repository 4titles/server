import { registerAs } from '@nestjs/config'

export default registerAs('tmdb', () => ({
    apiKey: process.env.TMDB_API_KEY,
    baseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    defaultLanguage: process.env.TMDB_DEFAULT_LANGUAGE || 'ru-RU',
    supportedLanguages: (
        process.env.TMDB_SUPPORTED_LANGUAGES || 'ru-RU,en-EN'
    ).split(','),
    maxPopularPages: parseInt(process.env.TMDB_MAX_POPULAR_PAGES || '5', 10),
    maxTopRatedPages: parseInt(
        process.env.TMDB_MAX_TOP_RATED_PAGES || '100',
        10,
    ),
    maxAiringPages: parseInt(process.env.TMDB_MAX_AIRING_PAGES || '5', 10),
    maxRecommendationsPages: parseInt(
        process.env.TMDB_MAX_RECOMMENDATIONS_PAGES || '3',
        10,
    ),
    maxSimilarPages: parseInt(process.env.TMDB_MAX_SIMILAR_PAGES || '3', 10),
    headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.TMDB_API_ACCESS__KEY}`,
    },
}))
