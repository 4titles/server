export class NoAvailableApiKeysException extends Error {
    constructor(message: string = 'No Available API Keys') {
        super(message)
        this.name = 'NoAvailableApiKeysException'
    }
}
