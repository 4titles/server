import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateTitlesTable1732798442277 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

        await queryRunner.query(
            `CREATE TYPE "titles_type_enum" AS ENUM ('movie', 'tvSeries')`,
        )

        await queryRunner.createTable(
            new Table({
                name: 'titles',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'title_name',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'imdbid',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'type',
                        type: 'titles_type_enum',
                    },
                    {
                        name: 'rank',
                        type: 'integer',
                        isNullable: true,
                        unsigned: true,
                        isUnique: true,
                    },
                    {
                        name: 'image',
                        type: 'varchar',
                        isNullable: true,
                        isUnique: true,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'genre',
                        type: 'jsonb',
                        default: "'{}'",
                    },
                    {
                        name: 'rating',
                        type: 'numeric',
                        isNullable: true,
                    },
                    {
                        name: 'imdb_link',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'year',
                        type: 'integer',
                        isNullable: true,
                        unsigned: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestampTz',
                        default: 'now()',
                        isNullable: true,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestampTz',
                        default: 'now()',
                        isNullable: true,
                    },
                ],
            }),
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('titles')
        await queryRunner.query('DROP TYPE "titles_type_enum"')
    }
}
