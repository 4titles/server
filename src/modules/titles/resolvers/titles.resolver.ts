import {
    Resolver,
    Query,
    Args,
    Mutation,
    ResolveField,
    Parent,
} from '@nestjs/graphql'
import { Title, TitleType } from '../../../entities/title.entity'
import { TitlesService } from '../services/titles.service'
import { Logger } from '@nestjs/common'
import { Credit, CreditCategory } from 'src/entities/credit.entity'

@Resolver(() => Title)
export class TitlesResolver {
    private readonly logger = new Logger(TitlesResolver.name)
    constructor(private readonly titlesService: TitlesService) {}

    @Query(() => Title, { nullable: true })
    async title(@Args('id') id: string) {
        return this.titlesService.getTitleById(id)
    }

    @ResolveField(() => [Credit])
    directors(@Parent() title: Title) {
        return title.credits?.filter(
            (credit) => credit.category === CreditCategory.DIRECTOR,
        )
    }

    @ResolveField(() => [Credit])
    writers(@Parent() title: Title) {
        return title.credits?.filter(
            (credit) => credit.category === CreditCategory.WRITER,
        )
    }

    @ResolveField(() => [Credit])
    casts(@Parent() title: Title) {
        return title.credits?.filter(
            (credit) =>
                credit.category === CreditCategory.ACTOR ||
                credit.category === CreditCategory.ACTRESS,
        )
    }

    @Query(() => [Title])
    async titles(
        @Args('ids', { type: () => [String], nullable: true }) ids?: string[],
        @Args('type', { type: () => TitleType, nullable: true })
        type?: TitleType,
    ): Promise<Title[]> {
        if (ids?.length) {
            return this.titlesService.getTitlesByIds(ids)
        }
        return this.titlesService.getTitlesByType(TitleType[type])
    }

    @Query(() => [Title])
    async movies(): Promise<Title[]> {
        return this.titlesService.getTitlesByType(TitleType.MOVIE)
    }

    @Query(() => [Title])
    async tvSeries(): Promise<Title[]> {
        return this.titlesService.getTitlesByType(TitleType.TV_SERIES)
    }

    @Query(() => [Title])
    async tvMiniSeries(): Promise<Title[]> {
        return this.titlesService.getTitlesByType(TitleType.TV_MINISERIES)
    }

    @Query(() => Title)
    async titleById(@Args('imdbId') imdbId: string): Promise<Title | null> {
        return this.titlesService.getTitleById(imdbId)
    }

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
