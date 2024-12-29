import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import geocodingConfig from 'src/config/geocoding.config'
import { GeocodingService } from './services/geocoding.service'

@Module({
    imports: [ConfigModule.forFeature(geocodingConfig)],
    exports: [GeocodingService],
    providers: [GeocodingService],
})
export class GeocodingModule {}
