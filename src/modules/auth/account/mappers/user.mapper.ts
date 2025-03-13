import { DbUser } from '@/modules/infrastructure/drizzle/schema/users.schema'
import { User } from '../models/user.model'

export class UserMapper {
    static toGraphQL(dbUser: DbUser): User {
        const user = new User()
        user.id = dbUser.id
        user.email = dbUser.email
        user.username = dbUser.username
        user.displayName = dbUser.displayName
        user.avatar = dbUser.avatar
        user.createdAt = dbUser.createdAt
        user.updatedAt = dbUser.updatedAt

        return user
    }

    static toGraphQLList(dbUsers: DbUser[]): User[] {
        return dbUsers.map((dbUser) => this.toGraphQL(dbUser))
    }
}
