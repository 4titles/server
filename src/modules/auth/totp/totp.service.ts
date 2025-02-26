import { COMPANY_NAME } from '@/shared/constants/company.constants'
import { BadRequestException, Injectable } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { encode } from 'hi-base32'
import { TOTP } from 'otpauth'
import * as qrCode from 'qrcode'
import { AccountService } from '../account/account.service'
import { User } from '../account/models/user.model'
import { EnableTotpInput } from './inputs/enable-totp.input'
import { TotpModel } from './models/totp.model'

@Injectable()
export class TotpService {
    constructor(private readonly accountService: AccountService) {}

    async generate(user: User): Promise<TotpModel> {
        const secret = encode(randomBytes(15))
            .replace(/=/g, '')
            .substring(0, 24)

        const totp = new TOTP({
            issuer: COMPANY_NAME,
            label: user.email,
            algorithm: 'SHA1',
            digits: 6,
            secret,
        })

        const otpauthUrl = totp.toString()
        const qrCodeUrl = await qrCode.toDataURL(otpauthUrl)

        return { qrCodeUrl, secret }
    }

    async enable(user: User, input: EnableTotpInput): Promise<boolean> {
        const { secret, pin } = input

        const totp = new TOTP({
            issuer: COMPANY_NAME,
            label: user.email,
            algorithm: 'SHA1',
            digits: 6,
            secret,
        })

        const delta = totp.validate({ token: pin })

        if (delta === null) {
            throw new BadRequestException('Invalid code was provided')
        }

        await this.accountService.enableTotp(user, input)

        return true
    }

    async disable(user: User): Promise<boolean> {
        return await this.accountService.disableTotp(user)
    }
}
