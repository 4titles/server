import { registerAs } from '@nestjs/config'

export default registerAs('geocoding', () => ({
    apiKey: process.env.GEOAPIFY_KEY,
    baseUrl: 'https://api.geoapify.com/v1/geocode/search',
}))
