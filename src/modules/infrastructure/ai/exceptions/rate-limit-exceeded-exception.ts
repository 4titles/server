export class RateLimitExceededException extends Error {
    constructor(message: string = 'API Rate Limit Exceeded') {
        super(message)
        this.name = 'RateLimitExceededException'
    }
}
