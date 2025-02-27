import { AccountDeletionService } from '@/modules/auth/account/account-deletion.service'
import { Injectable, Logger } from '@nestjs/common'
import { Command, Option } from 'nestjs-command'

@Injectable()
export class DeleteDeactivatedAccountsCommand {
    private readonly logger = new Logger(DeleteDeactivatedAccountsCommand.name)

    constructor(
        private readonly accountDeletionService: AccountDeletionService,
    ) {}

    @Command({
        command: 'accounts:delete-deactivated',
        describe:
            'Delete deactivated accounts after specified threshold period',
    })
    async run(
        @Option({
            name: 'days',
            describe: 'Number of days since deactivation (default: 7)',
            type: 'number',
            default: 7,
        })
        days: number,

        @Option({
            name: 'dry-run',
            describe: 'Run in dry-run mode without actually deleting accounts',
            type: 'boolean',
            default: false,
        })
        dryRun: boolean,
    ): Promise<void> {
        this.logger.log(
            `Starting manual deactivated accounts deletion (threshold: ${days} days)`,
        )

        try {
            const deactivatedAccounts =
                await this.accountDeletionService.findDeactivatedAccounts(days)

            if (deactivatedAccounts.length === 0) {
                this.logger.log('No deactivated accounts found to delete')
                return
            }

            this.logger.log(
                `Found ${deactivatedAccounts.length} deactivated accounts`,
            )

            deactivatedAccounts.forEach((account) => {
                this.logger.log(
                    `- ID: ${account.id}, Email: ${account.email}, Deactivated at: ${account.deactivatedAt}`,
                )
            })

            if (dryRun) {
                this.logger.log('Dry run mode: no accounts will be deleted')
                return
            }

            this.logger.log('Sending email notifications to users...')
            await this.accountDeletionService.notifyUsersAboutDeletion(
                deactivatedAccounts,
            )

            this.logger.log('Deleting accounts...')
            const deletedCount =
                await this.accountDeletionService.deleteAccounts(days)

            this.logger.log(`Successfully deleted ${deletedCount} accounts`)
        } catch (error) {
            this.logger.error(
                `Failed to delete deactivated accounts: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
