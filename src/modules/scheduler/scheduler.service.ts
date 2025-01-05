import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CreateTerrorizingMessageDto } from '../terrorizing-message/dto/terrorizing-message.dto'
import { TerrorizingMessageStatus } from '../terrorizing-message/entities/terrorizing-message.entity'
import { TerrorizingMessageService } from '../terrorizing-message/terrorizing-message.service'

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name)
  private isEnabled = true
  private readonly createHours = [1, 5, 9, 13, 17] // Creation hours (WIB)
  private readonly postHours = [2, 6, 10, 14, 18] // Posting hours (WIB)

  constructor(
    private readonly terrorizingMessageService: TerrorizingMessageService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledMessages() {
    if (!this.isEnabled) {
      this.logger.log(`SchedulerService is not enabled!`)
      return
    }

    const jakartaTime = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
    )
    const currentWibHour = jakartaTime.getHours()

    if (this.createHours.includes(currentWibHour)) {
      const scheduleIndex = this.createHours.indexOf(currentWibHour)
      await this.createAndScheduleMessage(this.postHours[scheduleIndex])
    } else {
      this.logger.log(`Not at creation hour! currentWibHour: ${currentWibHour}`)
    }
  }

  private async createAndScheduleMessage(scheduleHour: number) {
    try {
      // Get current Jakarta time
      const jakartaTime = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
      )

      // Set to target hour
      jakartaTime.setHours(scheduleHour, 0, 0, 0)

      const createDto: CreateTerrorizingMessageDto = {
        status: TerrorizingMessageStatus.SCHEDULED,
        scheduledAt: jakartaTime,
      }

      const createdMessage =
        await this.terrorizingMessageService.create(createDto)

      if (createdMessage) {
        this.logger.log(
          `Message scheduled for ${jakartaTime.toLocaleString('en-US', {
            timeZone: 'Asia/Jakarta',
          })} WIB`,
        )
      } else {
        this.logger.error('Failed to create and schedule terrorizing message.')
      }
    } catch (error) {
      this.logger.error('Error while creating and scheduling message:', error)
    }
  }

  // Methods to control scheduler state
  enableScheduler() {
    this.isEnabled = true
    this.logger.log('Scheduler enabled')
    return { status: 'enabled' }
  }

  disableScheduler() {
    this.isEnabled = false
    this.logger.log('Scheduler disabled')
    return { status: 'disabled' }
  }

  getSchedulerStatus() {
    return { enabled: this.isEnabled }
  }
}
