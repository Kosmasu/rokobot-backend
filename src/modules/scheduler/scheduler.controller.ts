import { Controller, Post, Get } from '@nestjs/common'
import { SchedulerService } from './scheduler.service'

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('enable')
  enableScheduler() {
    return this.schedulerService.enableScheduler()
  }

  @Post('disable')
  disableScheduler() {
    return this.schedulerService.disableScheduler()
  }

  @Get('status')
  getStatus() {
    return this.schedulerService.getSchedulerStatus()
  }
}
