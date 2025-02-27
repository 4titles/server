import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { DrizzleModule } from '../drizzle/drizzle.module'
import { HealthController } from './health.controller'
import { ApplicationHealthService } from './services/application-health.service'
import { GraphQLHealthService } from './services/graphql-health.service'
import { PostgresHealthService } from './services/postgres-health.service'
import { RedisHealthService } from './services/redis-health.service'
import { SMTPHealthService } from './services/smtp-health.service'

@Module({
    imports: [TerminusModule, HttpModule, DrizzleModule],
    controllers: [HealthController],
    providers: [
        PostgresHealthService,
        RedisHealthService,
        ApplicationHealthService,
        GraphQLHealthService,
        SMTPHealthService,
    ],
    exports: [
        PostgresHealthService,
        RedisHealthService,
        ApplicationHealthService,
        GraphQLHealthService,
        SMTPHealthService,
    ],
})
export class HealthModule {}
