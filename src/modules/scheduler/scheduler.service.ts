import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CreateTerrorizingMessageDto } from '../terrorizing-message/dto/terrorizing-message.dto'
import {
  TerrorizingMessage,
  TerrorizingMessageStatus,
} from '../terrorizing-message/entities/terrorizing-message.entity'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name)
  private isEnabled = false

  constructor(
    @InjectRepository(TerrorizingMessage)
    private readonly terrorizingMessageRepository: Repository<TerrorizingMessage>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledMessages() {
    if (!this.isEnabled) {
      return // Don't process if scheduler is disabled
    }

    const targetHours = [1, 5, 9, 13, 17] // 1AM, 5AM, 9AM, 1PM, 5PM WIB
    const currentWibHour = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
    ).getHours()

    if (targetHours.includes(currentWibHour)) {
      await this.createAndScheduleMessage(currentWibHour + 1) // Schedule for one hour ahead
    }
  }

  private async createAndScheduleMessage(scheduleHour: number) {
    try {
      const scheduleTime = new Date()
      scheduleTime.setHours(scheduleHour, 0, 0, 0)

      const createDto: CreateTerrorizingMessageDto = {
        status: TerrorizingMessageStatus.SCHEDULED,
        scheduledAt: scheduleTime,
      }

      const createdMessage = await this.terrorizingMessageRepository.create(createDto)

      if (createdMessage) {
        this.logger.log(
          `Message scheduled for ${scheduleTime.toLocaleString('en-US', {
            timeZone: 'Asia/Jakarta',
          })}`,
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
