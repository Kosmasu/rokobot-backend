import { forwardRef, Module } from '@nestjs/common'
import { SchedulerService } from './scheduler.service'
import { SchedulerController } from './scheduler.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TerrorizingMessage } from '../terrorizing-message/entities/terrorizing-message.entity'
import { TerrorizingMessageModule } from '../terrorizing-message/terrorizing-message.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([TerrorizingMessage]),
    forwardRef(() => TerrorizingMessageModule),
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService],
})
export class SchedulerModule {}
