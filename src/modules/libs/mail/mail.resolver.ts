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
            '<b style="color: blue; font-size: 4em;">Sup from 4Titles</b>',
            '12345',
        )
    }
}
