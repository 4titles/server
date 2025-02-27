import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { ApplicationHealthService } from './services/application-health.service'
import { GraphQLHealthService } from './services/graphql-health.service'
import { PostgresHealthService } from './services/postgres-health.service'
import { RedisHealthService } from './services/redis-health.service'
import { SMTPHealthService } from './services/smtp-health.service'

@Controller('health')
export class HealthController {
    constructor(
        private readonly healthCheckService: HealthCheckService,
        private readonly postgresHealthService: PostgresHealthService,
        private readonly redisHealthService: RedisHealthService,
        private readonly applicationHealthService: ApplicationHealthService,
        private readonly graphqlHealthService: GraphQLHealthService,
        private readonly smtpHealthService: SMTPHealthService,
    ) {}

    @Get()
    @HealthCheck()
    check() {
        return this.healthCheckService.check([
            () => this.postgresHealthService.check('database'),
            () => this.redisHealthService.check('redis'),
            () => this.applicationHealthService.check('app'),
            () => this.graphqlHealthService.check('graphql'),
            () => this.smtpHealthService.check('smtp'),
        ])
    }

    @Get('liveness')
    @HealthCheck()
    checkLiveness() {
        return this.healthCheckService.check([
            () => this.applicationHealthService.check('app'),
        ])
    }

    @Get('readiness')
    @HealthCheck()
    checkReadiness() {
        return this.healthCheckService.check([
            () => this.postgresHealthService.check('database'),
            () => this.redisHealthService.check('redis'),
        ])
    }
}
