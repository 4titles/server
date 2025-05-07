import { Resolver } from '@nestjs/graphql'
import { FilmingLocation } from './models/filming-location.model'

@Resolver(() => FilmingLocation)
export class FilmingLocationResolver {}
