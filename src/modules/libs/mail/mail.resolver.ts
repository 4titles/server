import { Authorization } from '@/shared/decorators/auth.decorator'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { MailService } from './mail.service'

@Resolver()
export class MailResolver {
    constructor(private readonly mailService: MailService) {}

    @Authorization()
    @Mutation(() => Boolean)
    async testEmail(@Args('email') email: string) {
        return await this.mailService.sendMail(
            email,
            'Test email',
            '<b>12345</b>',
            '12345',
        )
    }
}
