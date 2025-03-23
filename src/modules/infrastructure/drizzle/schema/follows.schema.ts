import { relations } from 'drizzle-orm'
import {
    index,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
} from 'drizzle-orm/pg-core'
import { users } from './users.schema'

export const follows = pgTable(
    'follows',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        followerId: uuid('follower_id')
            .references(() => users.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        followingId: uuid('following_id')
            .references(() => users.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            followerIdx: index('follower_idx').on(table.followerId),
            followingIdx: index('following_idx').on(table.followingId),
            followersUniqueIdx: uniqueIndex('followers_unique_idx').on(
                table.followerId,
                table.followingId,
            ),
        }
    },
)

export const followsRelations = relations(follows, ({ one }) => ({
    follower: one(users, {
        fields: [follows.followerId],
        references: [users.id],
        relationName: 'follower',
    }),
    following: one(users, {
        fields: [follows.followingId],
        references: [users.id],
        relationName: 'following',
    }),
}))

export type DbFollows = typeof follows.$inferSelect
