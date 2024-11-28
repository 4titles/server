import { registerAs } from '@nestjs/config'
import { DataSource, DataSourceOptions } from 'typeorm'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env' })

export interface ITypeORMConfig {
    type: string
    host: string
    port: string
    username: string
    password: string
    database: string
    entities: [string]
    migrations: [string]
    autoLoadEntities: boolean
    synchronize: boolean
    retryAttempts: number
}

const config: ITypeORMConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || '5432',
    username: `${process.env.DB_USERNAME}`,
    password: `${process.env.DB_PASSWORD}`,
    database: `${process.env.DB_DATABASE}`,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    autoLoadEntities: true,
    synchronize: false,
    retryAttempts: 15,
}

export default registerAs('typeorm', (): ITypeORMConfig => config)
export const connectionSource = new DataSource(config as DataSourceOptions)
