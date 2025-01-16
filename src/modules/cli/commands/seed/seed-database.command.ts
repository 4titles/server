import { DatabaseSeeder } from '@/modules/drizzle/seeders'
import { Injectable } from '@nestjs/common'
import { Command } from 'nestjs-command'

@Injectable()
export class SeedDatabaseCommand {
    constructor(private readonly databaseSeeder: DatabaseSeeder) {}

    @Command({
        command: 'seed:database',
        describe: 'Seed all database tables',
    })
    async run(): Promise<void> {
        console.log('Starting database seeding...')
        await this.databaseSeeder.seedAll()
        console.log('Database seeding completed')
    }
}
