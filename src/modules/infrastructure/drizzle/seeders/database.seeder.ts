import { Injectable } from '@nestjs/common'
import { RolePermissionSeeder } from './role-permission.seeder'
import { TitleConfigSeeder } from './title-config.seeder'
import { UserSeeder } from './user.seeder'

@Injectable()
export class DatabaseSeeder {
    constructor(
        private readonly rolePermissionSeeder: RolePermissionSeeder,
        private readonly userSeeder: UserSeeder,
        private readonly titleConfigSeeder: TitleConfigSeeder,
    ) {}

    async seedAll(): Promise<void> {
        await this.rolePermissionSeeder.seed()
        await this.userSeeder.seed()
        await this.titleConfigSeeder.seed()
    }
}
