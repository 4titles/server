import { User } from '@/modules/auth/account/models/user.model'
import { ContentModerationService } from '@/modules/content/content-moderation/services/content-moderation.service'
import { TitleFilmingLocationService } from '@/modules/content/title/services/relations/title-filming-location.service'
import { TitleElasticsearchLocationSyncService } from '@/modules/content/title/services/sync/title-elasticsearch-location-sync.service'
import { TitleService } from '@/modules/content/title/services/title.service'
import { CacheService } from '@/modules/infrastructure/cache/cache.service'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbFilmingLocationProposal,
    filmingLocationProposals,
} from '@/modules/infrastructure/drizzle/schema/filming-location-proposals.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { NotificationService } from '@/modules/infrastructure/notification/notification.service'
import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { FilmingLocationService } from '../../services/filming-location.service'
import { FilmingLocationProposalStatus } from './enums/filming-location-proposal-status.enum'
import { FilmingLocationProposalType } from './enums/filming-location-proposal-type.enum'
import { CreateFilmingLocationProposalInput } from './inputs/create-filming-location-proposal.input'
import { UpdateFilmingLocationProposalStatusInput } from './inputs/update-filming-location-proposal-status.input'

@Injectable()
export class FilmingLocationProposalService {
    private readonly logger: Logger = new Logger(
        FilmingLocationProposalService.name,
    )

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly titleService: TitleService,
        private readonly filmingLocationService: FilmingLocationService,
        private readonly titleFilmingLocationService: TitleFilmingLocationService,
        private readonly titleElasticsearchLocationSyncService: TitleElasticsearchLocationSyncService,
        private readonly contentModerationService: ContentModerationService,
        private readonly notificationService: NotificationService,
        private readonly cacheService: CacheService,
    ) {}

    async findProposalById(id: string) {
        return await this.db.query.filmingLocationProposals.findFirst({
            where: eq(filmingLocationProposals.id, id),
            with: {
                user: true,
                location: {
                    with: {
                        country: true,
                    },
                },
                title: true,
            },
        })
    }

    async findProposalByLocationId(locationId: string) {
        return await this.db.query.filmingLocationProposals.findFirst({
            where: eq(filmingLocationProposals.locationId, locationId),
            with: {
                user: true,
                location: {
                    with: {
                        country: true,
                    },
                },
                title: true,
            },
        })
    }

    async findProposalsByUserId(userId: string) {
        return await this.db.query.filmingLocationProposals.findMany({
            where: eq(filmingLocationProposals.userId, userId),
            with: {
                user: true,
                location: {
                    with: {
                        country: true,
                    },
                },
                title: true,
            },
        })
    }

    async createProposal(
        input: CreateFilmingLocationProposalInput,
        user: User,
    ): Promise<boolean> {
        const {
            type,
            titleId,
            address,
            coordinates,
            description,
            reason,
            locationId,
        } = input

        try {
            const title = await this.titleService.findById(titleId)
            if (!title) {
                throw new NotFoundException(
                    'Title of filming location proposal not found',
                )
            }

            if (type !== FilmingLocationProposalType.EDIT) {
                const isDescriptionSafe =
                    await this.contentModerationService.validateContent({
                        text: description,
                    })
                if (!isDescriptionSafe) {
                    throw new ConflictException(
                        'Filming location proposal contains inappropriate content',
                    )
                }
            }

            if (reason) {
                const isReasonSafe =
                    await this.contentModerationService.validateContent({
                        text: reason,
                    })
                if (!isReasonSafe) {
                    throw new ConflictException(
                        'Filming location proposal reason contains inappropriate content',
                    )
                }
            }

            const proposalToInsert = {
                type,
                status: FilmingLocationProposalStatus.PENDING,
                address,
                coordinates:
                    coordinates?.x && coordinates?.y
                        ? { x: coordinates.x, y: coordinates.y }
                        : null,
                description,
                titleId,
                locationId,
                userId: user.id,
                reason,
            }

            await this.db
                .insert(filmingLocationProposals)
                .values(proposalToInsert)

            return true
        } catch (error) {
            this.logger.warn(
                'Error occured while creating filming location proposal',
                error,
            )
            return false
        }
    }

    async updateProposalStatus(
        input: UpdateFilmingLocationProposalStatusInput,
    ) {
        try {
            const { proposalId, status, reviewMessage } = input

            const proposal = await this.findProposalById(proposalId)
            if (!proposal) {
                throw new NotFoundException(
                    'Filming location proposal not found',
                )
            }

            const [updatedProposal] = await this.db
                .update(filmingLocationProposals)
                .set({
                    status,
                    reviewMessage,
                } as Partial<DbFilmingLocationProposal>)
                .where(eq(filmingLocationProposals.id, input.proposalId))
                .returning()

            const {
                type,
                address,
                description,
                titleId,
                userId,
                coordinates,
                locationId,
            } = proposal

            if (status === FilmingLocationProposalStatus.APPROVED) {
                const geocoded = (
                    await this.filmingLocationService.geocodeLocationsByAddress(
                        address,
                    )
                )[0]

                if (!geocoded) {
                    throw new BadRequestException(
                        'Failed to geocode filming location proposal address',
                    )
                }

                let createdFilmingLocationId: string

                if (type === FilmingLocationProposalType.ADD) {
                    await this.db.transaction(async (tx) => {
                        await this.filmingLocationService.createFilmingLocation(
                            {
                                ...geocoded,
                                lon: coordinates?.x ?? geocoded.lon,
                                lat: coordinates?.y ?? geocoded.lat,
                            },
                            {
                                address,
                                description,
                            },
                            userId,
                        )

                        const createdFilmingLocation =
                            await this.filmingLocationService.findByPlaceId(
                                geocoded.placeId,
                            )
                        if (!createdFilmingLocation) {
                            throw new Error(
                                'Failed to find newly created filming location by proposal',
                            )
                        }
                        createdFilmingLocationId = createdFilmingLocation.id

                        await this.titleFilmingLocationService.linkTitleToFilmingLocations(
                            tx,
                            titleId,
                            [createdFilmingLocation.id],
                            false,
                        )
                    })

                    const titleFilmingLocation =
                        await this.titleFilmingLocationService.findByTitleAndFilmingLocation(
                            titleId,
                            createdFilmingLocationId,
                        )
                    if (titleFilmingLocation) {
                        await this.titleElasticsearchLocationSyncService.syncAddedFilmingLocation(
                            titleId,
                            titleFilmingLocation,
                        )
                    }
                } else if (type === FilmingLocationProposalType.EDIT) {
                    if (!locationId) {
                        throw new BadRequestException(
                            'Filming location proposal does not have a linked filming location to update',
                        )
                    }

                    await this.filmingLocationService.updateLocation(
                        locationId,
                        {
                            address,
                            description,
                            userId,
                            formattedAddress: geocoded.formattedAddress,
                            placeId: geocoded.placeId,
                            city: geocoded.city,
                            state: geocoded.state,
                        },
                    )

                    const titleFilmingLocation =
                        await this.titleFilmingLocationService.findByTitleAndFilmingLocation(
                            titleId,
                            locationId,
                        )
                    if (titleFilmingLocation) {
                        await this.titleElasticsearchLocationSyncService.syncUpdatedFilmingLocation(
                            titleId,
                            locationId,
                            titleFilmingLocation,
                        )
                    }
                } else {
                    throw new BadRequestException('Unsupported proposal type')
                }
            }

            await this.notificationService.notifyProposalStatusUpdate(
                await this.findProposalById(updatedProposal.id),
            )

            await Promise.all([
                this.cacheService.del(`*locations:title:${titleId}:*`),
                this.cacheService.del(`title:details:${titleId}`),
            ])

            return true
        } catch (error) {
            this.logger.warn(
                'Error occured while updating filming location proposal status',
                error,
            )
            return false
        }
    }
}
