import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum MediaType {
  TerrorizingMessage = 'TerrorizingMessage',
  Chapter = 'Chapter'
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number

  @Column('text')
  filename: string

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  type: MediaType

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}