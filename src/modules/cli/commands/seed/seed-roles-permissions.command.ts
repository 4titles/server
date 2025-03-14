import { RolesPermissionsSeeder } from '@/modules/infrastructure/drizzle/seeders'
import { Injectable } from '@nestjs/common'
import { Command } from 'nestjs-command'

@Injectable()
export class SeedRolesPermissionsCommand {
    constructor(
        private readonly rolesPermissionsSeeder: RolesPermissionsSeeder,
    ) {}

    @Command({
        command: 'seed:roles-permissions',
        describe: 'Seed database roles and permissions',
    })
    async run(): Promise<void> {
        try {
            await this.rolesPermissionsSeeder.seed()
            console.log('Roles and permissions seeded successfully')
        } catch (error) {
            console.error('Error seeding roles and permissions:', error.message)
            process.exit(1)
        }
    }
}
