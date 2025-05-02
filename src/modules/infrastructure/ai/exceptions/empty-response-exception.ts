export class EmptyResponseException extends Error {
    constructor(message: string = 'Empty API Response') {
        super(message)
        this.name = 'EmptyResponseException'
    }
}
