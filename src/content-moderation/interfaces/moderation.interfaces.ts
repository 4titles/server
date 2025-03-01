import * as nsfw from 'nsfwjs'
import { ModerationCategory } from '../enums/moderation-category.enum'

export interface ModerationThresholds {
    [ModerationCategory.PORN]: number
    [ModerationCategory.SEXY]: number
    [ModerationCategory.HENTAI]: number
}

export interface ModerationResult {
    isSafe: boolean
    predictions: nsfw.PredictionType[]
    flaggedCategories?: { category: string; probability: number }[]
}
