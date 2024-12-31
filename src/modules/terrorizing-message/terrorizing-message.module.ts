import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TerrorizingMessageController } from './terrorizing-message.controller'
import { TerrorizingMessageService } from './terrorizing-message.service'
import { TerrorizingMessage } from './entities/terrorizing-message.entity'
import { MediaModule } from '../media/media.module'
import { RokoPromptModule } from '../roko-prompt/roko-prompt.module'
import { TweetQueueModule } from '../tweet-queue/tweet-queue.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([TerrorizingMessage]),
    MediaModule,
    RokoPromptModule,
    forwardRef(() => TweetQueueModule),
  ],
  controllers: [TerrorizingMessageController],
  providers: [TerrorizingMessageService],
  exports: [TerrorizingMessageService, TypeOrmModule],
})
export class TerrorizingMessageModule {}
