import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum RokoPromptType {
  TERROR = "terror",
  CONVERSATIONAL = "conversational",
}

@Entity("RokoPrompt")
export class RokoPrompt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  systemPrompt: string;

  @Column("text", { nullable: true })
  greeting?: string;

  @Column({
    type: "enum",
    enum: RokoPromptType,
  })
  type: RokoPromptType;

  @Column("tinyint")
  isActive: number;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;
}
