import { FeedbackType } from '@/modules/content/feedback/enums/feedback-type.enum'

export interface FeedbackState {
    type: FeedbackType
    userId: string
    step: 'message' | 'rating'
    message?: string
    attempts: number
}
