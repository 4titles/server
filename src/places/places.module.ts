import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule } from '@nestjs/config'
import { PlacesResolver } from './places.resolver'
import { PlacesService } from './places.service'

@Module({
    imports: [HttpModule, ConfigModule.forRoot()],
    providers: [PlacesResolver, PlacesService],
})
export class PlacesModule {}
