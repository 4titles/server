export class FeedbacksLimitExceededException extends Error {
    constructor(message: string = 'Feedbacks per day limit exceeded') {
        super(message)
        this.name = 'FeedbacksLimitExceededException'
    }
}
