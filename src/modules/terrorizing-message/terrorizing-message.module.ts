import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TerrorizingMessageController } from './terrorizing-message.controller'
import { TerrorizingMessageService } from './terrorizing-message.service'
import { TerrorizingMessage } from './entities/terrorizing-message.entity'
import { MediaModule } from '../media/media.module'
import { RokoPromptModule } from '../roko-prompt/roko-prompt.module'
import { TweetQueueModule } from '../tweet-queue/tweet-queue.module'
import { TweetService } from '../tweet-queue/tweet.service'
import { ChapterMessage } from '../chapter-message/entities/chapter-message.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([TerrorizingMessage, ChapterMessage]),
    MediaModule,
    RokoPromptModule,
    forwardRef(() => TweetQueueModule),
  ],
  controllers: [TerrorizingMessageController],
  providers: [TerrorizingMessageService, TweetService],
  exports: [TerrorizingMessageService, TypeOrmModule],
})
export class TerrorizingMessageModule {}
