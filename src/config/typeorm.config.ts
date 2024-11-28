import { registerAs } from '@nestjs/config'
import { config as dotenvConfig } from 'dotenv'
import { DataSource, DataSourceOptions } from 'typeorm'

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
}

const config: ITypeORMConfig = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_ARTMAP_DATABASE,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    autoLoadEntities: true,
    synchronize: false,
}

export default registerAs('typeorm', (): ITypeORMConfig => config)
export const connectionSource = new DataSource(config as DataSourceOptions)
