import { Resolver } from '@nestjs/graphql'
import { Title } from './models/title.model'
import { TitlesService } from './titles.service'

@Resolver(() => Title)
export class TitlesResolver {
    constructor(private readonly titlesService: TitlesService) {}
}
