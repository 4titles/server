import { Resolver, Query, Args, Mutation } from '@nestjs/graphql'
import { Title, TitleType } from '../../../entities/title.entity'
import { TitlesService } from '../services/titles.service'
import { Logger } from '@nestjs/common'

@Resolver(() => Title)
export class TitlesResolver {
    private readonly logger = new Logger(TitlesResolver.name)
    constructor(private readonly titlesService: TitlesService) {}

    // @Query(() => [Title])
    // async titles(
    //     @Args('type', { type: () => TitleType, nullable: true })
    //     type?: TitleType,
    // ): Promise<Title[]> {
    //     return this.titlesService.findTitles(TitleType[type])
    // }

    // @Query(() => [Title])
    // async movies(): Promise<Title[]> {
    //     return this.titlesService.findTitles(TitleType.MOVIE)
    // }

    // @Query(() => [Title])
    // async tvSeries(): Promise<Title[]> {
    //     return this.titlesService.findTitles(TitleType.TV_SERIES)
    // }

    @Mutation(() => Boolean)
    async refreshTitlesCache(): Promise<boolean> {
        try {
            await this.titlesService.refreshCache()
            return true
        } catch (error) {
            this.logger.error('Failed to refresh titles cache', error)
            return false
        }
    }
}
