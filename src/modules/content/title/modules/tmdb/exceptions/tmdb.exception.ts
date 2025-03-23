export class TmdbException extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'TmdbException'
    }
}
