import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TerrorizingMessageController } from './terrorizing-message.controller'
import { TerrorizingMessageService } from './terrorizing-message.service'
import { TerrorizingMessage } from './entities/terrorizing-message.entity'
import { MediaModule } from '../media/media.module'

@Module({
  imports: [TypeOrmModule.forFeature([TerrorizingMessage]), MediaModule],
  controllers: [TerrorizingMessageController],
  providers: [TerrorizingMessageService],
  exports: [TerrorizingMessageService],
})
export class TerrorizingMessageModule {}
