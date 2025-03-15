import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { GeocodingService } from './services/geocoding.service'

@Module({
    imports: [HttpModule],
    exports: [GeocodingService],
    providers: [GeocodingService],
})
export class GeocodingModule {}
