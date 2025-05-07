import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { titleFilmingLocations } from '@/modules/infrastructure/drizzle/schema/title-filming-locations.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable } from '@nestjs/common'
import { and, eq, inArray } from 'drizzle-orm'

@Injectable()
export class TitleFilmingLocationService {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

    async findByTitleAndFilmingLocation(
        titleId: string,
        filmingLocationId: string,
    ) {
        return await this.db.query.titleFilmingLocations.findFirst({
            where: and(
                eq(titleFilmingLocations.titleId, titleId),
                eq(titleFilmingLocations.filmingLocationId, filmingLocationId),
            ),
            with: {
                filmingLocation: {
                    with: {
                        country: true,
                        descriptions: { with: { language: true } },
                    },
                },
            },
        })
    }

    async linkTitleToFilmingLocations(
        tx: DrizzleDB,
        titleId: string,
        locationIds: string[],
        removePrev: boolean = true,
    ): Promise<void> {
        if (!locationIds) return

        const currentLocations = await tx
            .select({
                filmingLocationId: titleFilmingLocations.filmingLocationId,
            })
            .from(titleFilmingLocations)
            .where(eq(titleFilmingLocations.titleId, titleId))

        const currentIds = currentLocations.map((l) => l.filmingLocationId)
        const idsToAdd = locationIds.filter((id) => !currentIds.includes(id))

        if (removePrev) {
            const idsToRemove = currentIds.filter(
                (id) => !locationIds.includes(id),
            )

            if (idsToRemove.length > 0) {
                await tx
                    .delete(titleFilmingLocations)
                    .where(
                        and(
                            eq(titleFilmingLocations.titleId, titleId),
                            inArray(
                                titleFilmingLocations.filmingLocationId,
                                idsToRemove,
                            ),
                        ),
                    )
            }
        }

        if (idsToAdd.length > 0) {
            const relations = idsToAdd.map((locationId) => ({
                titleId,
                filmingLocationId: locationId,
            }))

            await tx
                .insert(titleFilmingLocations)
                .values(relations)
                .onConflictDoNothing({
                    target: [
                        titleFilmingLocations.titleId,
                        titleFilmingLocations.filmingLocationId,
                    ],
                })
        }
    }

    async unlinkAllFilmingLocations(
        tx: DrizzleDB,
        titleId: string,
    ): Promise<void> {
        await tx
            .delete(titleFilmingLocations)
            .where(eq(titleFilmingLocations.titleId, titleId))
    }
}
