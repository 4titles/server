import * as winston from 'winston'
import 'winston-daily-rotate-file'

import { COMPANY_NAME } from '@/shared/constants/company.constants'
import { ConfigService } from '@nestjs/config'
import { utilities, WinstonModuleOptions } from 'nest-winston'
import LogstashTransport from 'winston-logstash/lib/winston-logstash-latest.js'

export default function getWinstonConfig(
    configService: ConfigService,
): WinstonModuleOptions {
    const consoleFormat = winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.ms(),
        utilities.format.nestLike(COMPANY_NAME, {
            colors: true,
            prettyPrint: true,
        }),
    )

    const jsonFormat = winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    )

    const transports: winston.transport[] = [
        new winston.transports.Console({
            format: consoleFormat,
            level: 'info',
        }),
    ]

    transports.push(
        new winston.transports.DailyRotateFile({
            filename: 'logs/backend-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: jsonFormat,
        }),
    )

    const logstashHost = configService.get<string>('LOGSTASH_HOST')
    const logstashPort = configService.get<number>('LOGSTASH_PORT')

    if (logstashHost && logstashPort) {
        try {
            transports.push(
                new LogstashTransport({
                    host: logstashHost,
                    port: logstashPort,
                    node_name: COMPANY_NAME,
                    max_connect_retries: 10,
                    timeout_connect_retries: 5000,
                    ssl_enable: false,
                    format: jsonFormat,
                }),
            )
            console.log(
                `Logstash transport configured: ${logstashHost}:${logstashPort}`,
            )
        } catch (error) {
            console.error('Failed to initialize Logstash transport:', error)
        }
    } else {
        console.warn('Logstash transport not configured - missing host or port')
    }

    return {
        transports,
        handleExceptions: true,
        exitOnError: false,
    }
}
