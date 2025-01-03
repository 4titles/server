import { Module } from '@nestjs/common'
import { GeocodingService } from './services/geocoding.service'
import { HttpModule } from '@nestjs/axios'

@Module({
    imports: [HttpModule],
    exports: [GeocodingService],
    providers: [GeocodingService],
})
export class GeocodingModule {}
