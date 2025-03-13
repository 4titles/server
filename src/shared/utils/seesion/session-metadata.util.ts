/* eslint-disable @typescript-eslint/no-require-imports */
import { SessionMetadata } from '@/shared/types/session-metadata.types'
import type { FastifyRequest } from 'fastify'
import { lookup } from 'geoip-lite'
import * as countries from 'i18n-iso-countries'
import { IS_DEV_ENV } from '../common/is-dev.util'

import DeviceDetector = require('device-detector-js')
countries.registerLocale(require('i18n-iso-countries/langs/en.json'))

export const DEFAULT_IP = '175.45.177.217'
export function getSessionMetadata(
    req: FastifyRequest,
    userAgent: string,
): SessionMetadata {
    const connectingIpHeader = req.headers['cf-connecting-ip']

    const ip = IS_DEV_ENV
        ? DEFAULT_IP
        : Array.isArray(connectingIpHeader)
          ? connectingIpHeader[0]
          : connectingIpHeader ||
            (typeof req.headers['x-forwared-for'] === 'string'
                ? req.headers['x-forwared-for'].split(',')[0]
                : req.ip)

    const location = lookup(ip)
    const deviceDetector = new DeviceDetector().parse(userAgent)

    return {
        location: {
            country: {
                ru: countries.getName(location.country, 'ru') || 'N/A',
                en: countries.getName(location.country, 'en') || 'N/A',
            },
            city: location.city || 'N/A',
            region: location.region || 'N/A',
            timezone: location.timezone || 'N/A',
            latidute: location.ll[0] || 0.0,
            longitude: location.ll[1] || 0.0,
        },
        device: {
            browser: deviceDetector.client.name,
            os: deviceDetector.os.name,
            type: deviceDetector.device.type,
            brand: deviceDetector.device.brand,
        },
        ip,
    }
}
