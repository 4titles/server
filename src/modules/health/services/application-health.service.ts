import { Injectable } from '@nestjs/common'
import { HealthIndicatorResult } from '@nestjs/terminus'
import * as os from 'os'
import * as process from 'process'

@Injectable()
export class ApplicationHealthService {
    private startTime: number

    constructor() {
        this.startTime = Date.now()
    }

    async check(key: string): Promise<HealthIndicatorResult> {
        const uptime = Date.now() - this.startTime
        const freeMemory = os.freemem()
        const totalMemory = os.totalmem()
        const memoryUsage = process.memoryUsage()
        const cpuUsage = os.loadavg()

        return {
            [key]: {
                status: 'up',
                uptime: `${Math.floor(uptime / 1000)}s`,
                memoryUsage: {
                    free: `${Math.round(freeMemory / 1024 / 1024)}MB`,
                    total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
                    freePercentage: `${Math.round((freeMemory / totalMemory) * 100)}%`,
                    process: {
                        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    },
                },
                cpu: {
                    load1: cpuUsage[0].toFixed(2),
                    load5: cpuUsage[1].toFixed(2),
                    load15: cpuUsage[2].toFixed(2),
                    cores: os.cpus().length,
                },
            },
        }
    }
}
