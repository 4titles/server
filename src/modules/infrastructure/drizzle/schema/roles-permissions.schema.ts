import { relations } from 'drizzle-orm'
import {
    index,
    pgTable,
    text,
    timestamp,
    unique,
    uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { users } from './users.schema'

export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),
    ...timestamps,
})

export const userRoles = pgTable(
    'user_roles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        roleId: uuid('role_id')
            .references(() => roles.id, { onDelete: 'cascade' })
            .notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            userIdIdx: index('user_roles_user_id_idx').on(table.userId),
            roleIdIdx: index('user_roles_role_id_idx').on(table.roleId),
            userRoleIdx: unique('user_role_idx').on(table.userId, table.roleId),
        }
    },
)

export const permissions = pgTable(
    'permissions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        resource: text('resource').notNull(),
        action: text('action').notNull(),
        description: text('description'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            resourceActionIdx: unique('resource_action_idx').on(
                table.resource,
                table.action,
            ),
        }
    },
)

export const rolePermissions = pgTable(
    'role_permissions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        roleId: uuid('role_id')
            .references(() => roles.id, { onDelete: 'cascade' })
            .notNull(),
        permissionId: uuid('permission_id')
            .references(() => permissions.id, { onDelete: 'cascade' })
            .notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            roleIdIdx: index('role_permissions_role_id_idx').on(table.roleId),
            permissionIdIdx: index('role_permissions_permission_id_idx').on(
                table.permissionId,
            ),
            rolePermissionIdx: unique('role_permission_idx').on(
                table.roleId,
                table.permissionId,
            ),
        }
    },
)

export const rolesRelations = relations(roles, ({ many }) => ({
    userRoles: many(userRoles),
    rolePermissions: many(rolePermissions),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, {
        fields: [userRoles.userId],
        references: [users.id],
    }),
    role: one(roles, {
        fields: [userRoles.roleId],
        references: [roles.id],
    }),
}))

export const permissionsRelations = relations(permissions, ({ many }) => ({
    rolePermissions: many(rolePermissions),
}))

export const rolePermissionsRelations = relations(
    rolePermissions,
    ({ one }) => ({
        role: one(roles, {
            fields: [rolePermissions.roleId],
            references: [roles.id],
        }),
        permission: one(permissions, {
            fields: [rolePermissions.permissionId],
            references: [permissions.id],
        }),
    }),
)

export type DbRole = typeof roles.$inferSelect
export type DbUserRole = typeof userRoles.$inferSelect
export type DbPermission = typeof permissions.$inferSelect
export type DbRolePermission = typeof rolePermissions.$inferSelect
