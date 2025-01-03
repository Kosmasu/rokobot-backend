import { ChapterMessageStatus } from "../entities/chapter-message.entity"

export class CreateChapterMessageDto {
  tweetId?: string
  content?: string
  mediaId?: number
  tweetMediaId?: string
  mediaUrl?: string
  scheduledAt?: Date
  status?: ChapterMessageStatus = ChapterMessageStatus.DRAFT
}

export class UpdateChapterMessageDto extends CreateChapterMessageDto {}
