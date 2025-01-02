import { Module } from '@nestjs/common'
import { GeocodingService } from './services/geocoding.service'

@Module({
    exports: [GeocodingService],
    providers: [GeocodingService],
})
export class GeocodingModule {}
