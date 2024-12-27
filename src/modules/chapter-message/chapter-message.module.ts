import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChapterMessageController } from './chapter-message.controller'
import { ChapterMessageService } from './chapter-message.service'
import { ChapterMessage } from './entities/chapter-message.entity'
import { MediaModule } from '../media/media.module'

@Module({
  imports: [TypeOrmModule.forFeature([ChapterMessage]), MediaModule],
  controllers: [ChapterMessageController],
  providers: [ChapterMessageService],
  exports: [ChapterMessageService],
})
export class ChapterMessageModule {}
