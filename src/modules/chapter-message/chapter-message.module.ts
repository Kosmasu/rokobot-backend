import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChapterMessageController } from './chapter-message.controller'
import { ChapterMessageService } from './chapter-message.service'
import { ChapterMessage } from './entities/chapter-message.entity'
import { MediaModule } from '../media/media.module'
import { TweetQueueModule } from '../tweet-queue/tweet-queue.module'

@Module({
  imports: [TypeOrmModule.forFeature([ChapterMessage]), MediaModule, TweetQueueModule],
  controllers: [ChapterMessageController],
  providers: [ChapterMessageService],
  exports: [ChapterMessageService],
})
export class ChapterMessageModule {}
