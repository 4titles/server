export class InvalidResponseFormatException extends Error {
    constructor(message: string = 'Invalid API Response Format') {
        super(message)
        this.name = 'InvalidResponseFormatException'
    }
}
