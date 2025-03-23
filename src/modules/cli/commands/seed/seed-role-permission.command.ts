import { RolePermissionSeeder } from '@/modules/infrastructure/drizzle/seeders/role-permission.seeder'
import { Injectable } from '@nestjs/common'
import { Command } from 'nestjs-command'

@Injectable()
export class SeedRolePermissionCommand {
    constructor(private readonly rolePermissionSeeder: RolePermissionSeeder) {}

    @Command({
        command: 'seed:roles-permissions',
        describe: 'Seed database roles and permissions',
    })
    async run(): Promise<void> {
        try {
            await this.rolePermissionSeeder.seed()
            console.log('Roles and permissions seeded successfully')
        } catch (error) {
            console.error('Error seeding roles and permissions:', error.message)
            process.exit(1)
        }
    }
}
