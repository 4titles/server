import { registerAs } from '@nestjs/config'
import { DataSource, DataSourceOptions } from 'typeorm'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env' })

export interface ITypeORMConfig {
    type: string
    entities: [string]
    migrations: [string]
    autoLoadEntities: boolean
    synchronize: boolean
    retryAttempts: number
    replication?: {
        master: {
            host: string
            port: number
            username: string
            password: string
            database: string
        }
        slaves: Array<{
            host: string
            port: number
            username: string
            password: string
            database: string
        }>
    }
    logging: boolean
}

const config: ITypeORMConfig = {
    type: 'postgres',
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    autoLoadEntities: true,
    synchronize: true,
    retryAttempts: 15,
    replication: {
        master: {
            host: process.env.DB_HOST || 'postgres',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
        },
        slaves: [
            {
                host: process.env.DB_SLAVE_HOST || 'postgres',
                port: parseInt(process.env.DB_SLAVE_PORT || '5432', 10),
                username: process.env.DB_SLAVE_USERNAME,
                password: process.env.DB_SLAVE_PASSWORD,
                database: process.env.DB_SLAVE_DATABASE,
            },
        ],
    },
    logging: true,
}

export default registerAs('typeorm', (): ITypeORMConfig => config)
export const connectionSource = new DataSource(config as DataSourceOptions)
