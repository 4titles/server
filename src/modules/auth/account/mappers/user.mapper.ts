import { DbUser } from '@/modules/infrastructure/drizzle/schema/users.schema'
import { User } from '../models/user.model'

export class UserMapper {
    static toGraphQL(dbUser: DbUser): User {
        const user = new User()
        Object.assign(user, dbUser)
        return user
    }

    static toGraphQLList(dbUsers: DbUser[]): User[] {
        return dbUsers.map((dbUser) => this.toGraphQL(dbUser))
    }
}
