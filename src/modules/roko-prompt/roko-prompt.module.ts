import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RokoPrompt } from './entities/roko-prompt.entity'
import { RokoPromptService } from './roko-prompt.service'
import { RokoPromptController } from './roko-prompt.controller'

@Module({
  imports: [TypeOrmModule.forFeature([RokoPrompt])],
  controllers: [RokoPromptController],
  providers: [RokoPromptService],
  exports: [RokoPromptService],
})
export class RokoPromptModule {}
