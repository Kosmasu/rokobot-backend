import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateChapterMessage1735031608135 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'chapter_message',
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
            isNullable: true,
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
            default: "'draft'",
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
    await queryRunner.dropTable('chapter_message')
  }
}
