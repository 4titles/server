export class InvalidTitleCategoryException extends Error {
    constructor(message: string = 'Invalid title category provided.') {
        super(message)
        this.name = InvalidTitleCategoryException.name
    }
}
