import { forwardRef, Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { TweetQueueProcessor } from './tweet-queue.processor'
import { TweetQueueService } from './tweet-queue.service'
import { TweetService } from './tweet.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TerrorizingMessage } from '../terrorizing-message/entities/terrorizing-message.entity'
import { ChapterMessage } from '../chapter-message/entities/chapter-message.entity'
import { Media } from '../media/entities/media.entity'
import { TerrorizingMessageModule } from '../terrorizing-message/terrorizing-message.module'
import { TweetController } from './tweet.controller'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'tweet-queue',
    }),
    TypeOrmModule.forFeature([TerrorizingMessage, ChapterMessage, Media]),
    forwardRef(() => TerrorizingMessageModule),
  ],
  providers: [TweetQueueService, TweetQueueProcessor, TweetService],
  controllers: [TweetController],
  exports: [TweetQueueService],
})
export class TweetQueueModule {}
