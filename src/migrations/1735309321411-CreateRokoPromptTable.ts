import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateRokoPromptTable1735309321411 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "RokoPrompt",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "systemPrompt",
                        type: "text",
                    },
                    {
                        name: "greeting",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "type",
                        type: "enum",
                        enum: ["terror", "conversational"],
                    },
                    {
                        name: "isActive",
                        type: "tinyint",
                    },
                    {
                        name: "createdAt",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updatedAt",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                ],
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("RokoPrompt");
    }
}
