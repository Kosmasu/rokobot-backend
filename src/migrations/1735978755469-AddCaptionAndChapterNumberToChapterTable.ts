import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddCaptionAndChapterNumberToChapterTable1735978755469
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('chapter_message', 'number')
    await queryRunner.addColumns('chapter_message', [
      new TableColumn({
        name: 'chapter_number',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
      new TableColumn({
        name: 'caption',
        type: 'text',
        isNullable: true,
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('chapter_message', 'chapter_number')
    await queryRunner.dropColumn('chapter_message', 'caption')
  }
}
