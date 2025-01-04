import { Media } from '../../media/entities/media.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm'

export enum ChapterMessageStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  POSTED = 'posted',
}

@Entity('chapter_message')
export class ChapterMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string

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
    enum: ChapterMessageStatus,
    default: ChapterMessageStatus.DRAFT,
  })
  status: ChapterMessageStatus

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date

  @Column({ type: 'int', default: 0 })
  chapter_number: number

  @Column({ type: 'text', nullable: true })
  caption: string
}
