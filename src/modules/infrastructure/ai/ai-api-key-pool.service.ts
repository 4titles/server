import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AiApiKeyInfo } from './types/ai-api-key-info.types'

@Injectable()
export class AiApiKeyPoolService {
    private readonly logger = new Logger(AiApiKeyPoolService.name)
    private apiKeys: AiApiKeyInfo[] = []

    private readonly BASE_BACKOFF_MS = this.config.get<number>(
        'BASE_BACKOFF_MS',
        60000,
    )
    private readonly MAX_BACKOFF_MS = this.config.get<number>(
        'MAX_BACKOFF_MS',
        3600000,
    )

    constructor(private readonly config: ConfigService) {
        this.loadKeys()
    }

    private loadKeys(): void {
        const raw = [
            this.config.get<string>('OPEN_ROUTER_API_KEY'),
            ...Array.from({ length: 15 }, (_, i) =>
                this.config.get<string>(`OPEN_ROUTER_API_KEY_${i + 1}`),
            ),
        ]
        const keys = raw.filter(
            (k): k is string => typeof k === 'string' && k.trim() !== '',
        )

        this.apiKeys = keys.map((key) => ({
            key,
            isBlocked: false,
            lastError: null,
            backoffUntil: null,
        }))

        this.logger.log(`Loaded ${this.apiKeys.length} API keys`)
    }

    getAllKeys(): AiApiKeyInfo[] {
        const now = Date.now()
        return this.apiKeys.filter(
            (info) =>
                !info.isBlocked &&
                (!info.backoffUntil || info.backoffUntil < now),
        )
    }

    markKeyAsRateLimited(apiKey: string): void {
        const info = this.apiKeys.find((i) => i.key === apiKey)
        if (!info) return
        const now = Date.now()
        const prevBackoff =
            info.backoffUntil && info.lastError
                ? info.backoffUntil - info.lastError
                : 0
        const nextBackoff = prevBackoff
            ? Math.min(prevBackoff * 2, this.MAX_BACKOFF_MS)
            : this.BASE_BACKOFF_MS
        info.lastError = now
        info.backoffUntil = now + nextBackoff
        this.logger.warn(
            `Key ${apiKey.slice(-4)} backoff set to ${nextBackoff}ms until ${new Date(
                info.backoffUntil,
            ).toISOString()}`,
        )
    }

    markKeyAsBlocked(apiKey: string): void {
        const info = this.apiKeys.find((i) => i.key === apiKey)
        if (!info) return
        info.isBlocked = true
        this.logger.error(`Key ${apiKey.slice(-4)} blocked permanently`)
    }

    resetKeyBackoff(apiKey: string): void {
        const info = this.apiKeys.find((i) => i.key === apiKey)
        if (!info) return
        info.lastError = null
        info.backoffUntil = null
        this.logger.debug(`Backoff reset for key ${apiKey.slice(-4)}`)
    }
}
