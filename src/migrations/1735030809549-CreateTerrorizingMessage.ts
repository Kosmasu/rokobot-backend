import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateTerrorizingMessage1735030809549
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'terrorizing_message',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'tweetId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true, // No default value, just nullable
          },
          {
            name: 'mediaId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'tweetMediaId',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'mediaUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'scheduledAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'scheduled', 'posted'],
            default: "'draft'", // Default to 'draft'
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('terrorizing_message')
  }
}
