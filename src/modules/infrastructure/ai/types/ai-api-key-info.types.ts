export interface AiApiKeyInfo {
    key: string
    isBlocked: boolean
    lastError: number | null
    backoffUntil: number | null
}
