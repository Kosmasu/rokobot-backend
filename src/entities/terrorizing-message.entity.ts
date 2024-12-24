import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm'
import { Media } from './media.entity'

export enum TerrorizingMessageStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  POSTED = 'posted',
}

@Entity('terrorizing_message')
export class TerrorizingMessage {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 255, nullable: true })
  tweetId: string

  @Column({ type: 'text', nullable: true })
  content: string

  @Column({ nullable: true })
  mediaId: number

  @ManyToOne(() => Media)
  @JoinColumn({ name: 'mediaId' })
  media: Media

  @Column({ type: 'text', nullable: true })
  tweetMediaId: string

  @Column({ type: 'text', nullable: true })
  mediaUrl: string

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date

  @Column({
    type: 'enum',
    enum: TerrorizingMessageStatus,
    default: TerrorizingMessageStatus.DRAFT,
  })
  status: TerrorizingMessageStatus

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date
}
