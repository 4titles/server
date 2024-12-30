export class TitleFetchException extends Error {
    constructor(message: string = 'Failed to fetch titles.') {
        super(message)
        this.name = TitleFetchException.name
    }
}
