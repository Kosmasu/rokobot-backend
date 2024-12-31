import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThanOrEqual, Repository } from 'typeorm'
import {
  TerrorizingMessage,
  TerrorizingMessageStatus,
} from './entities/terrorizing-message.entity'
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate'
import {
  CreateTerrorizingMessageDto,
  UpdateTerrorizingMessageDto,
} from './dto/terrorizing-message.dto'
import { Media, MediaType } from '../media/entities/media.entity'
import {
  RokoPrompt,
  RokoPromptType,
} from '../roko-prompt/entities/roko-prompt.entity'
import { RokoPromptService } from '../roko-prompt/roko-prompt.service'
import { TweetQueueService } from '../tweet-queue/tweet-queue.service'
import { TweetService } from '../tweet-queue/tweet.service'

@Injectable()
export class TerrorizingMessageService {
  constructor(
    @InjectRepository(TerrorizingMessage)
    private readonly repository: Repository<TerrorizingMessage>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly rokoPromptService: RokoPromptService,
    private readonly tweetQueueService: TweetQueueService,
    @Inject(TweetService) private readonly tweetService: TweetService,
  ) {}

  async create(data: CreateTerrorizingMessageDto): Promise<TerrorizingMessage> {
    const message = this.repository.create(data);

    if (!message.content || message.content.trim() === '') {
      const activePrompt = await this.rokoPromptService.getActiveByType(
        RokoPromptType.TERROR,
      );
      if (activePrompt) {
        const temperature = data.temperature || 0.7 + Math.random() * 0.6;
        message.content = await this.rokoPromptService.generateTerrorMessage(
          activePrompt.greeting || 'Generate a terrorizing message.',
          temperature,
        );
      }
    }

    if (message.mediaId == -1) {
      const mediaIds = await this.mediaRepository.find({
        select: { id: true },
        where: { type: MediaType.TerrorizingMessage },
        order: { createdAt: 'DESC' },
      });

      if (mediaIds.length > 0) {
        const randomIndex = Math.floor(Math.random() * mediaIds.length);
        message.mediaId = mediaIds[randomIndex].id;
      }
    }

    const savedMessage = await this.repository.save(message);
    console.log('savedMessage:', savedMessage);

    if (savedMessage.status === TerrorizingMessageStatus.SCHEDULED) {
      const tweet = await this.findOne(savedMessage.id);
      await this.tweetQueueService.scheduleJob(tweet);
    }

    return savedMessage;
  }

  async postToTwitter(id: string) {
    const message = await this.findOne(id)
    await this.tweetService.postMessageToTwitter(message)
  }

  async findAll(query: PaginateQuery) {
    if (query.filter && query.filter.status === 'all') {
      delete query.filter.status
    }
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'createdAt', 'scheduledAt', 'status'],
      searchableColumns: ['content', 'tweetId'],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ],
        scheduledAt: [
          FilterOperator.BTW,
          FilterOperator.GTE,
          FilterOperator.LTE,
        ],
        mediaId: [FilterOperator.EQ],
      },
      relations: ['media'],
    })
  }

  async findOne(id: string): Promise<TerrorizingMessage> {
    const message = await this.repository.findOne({
      where: { id },
      relations: ['media'],
    })

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`)
    }

    return message
  }

  async update(
    id: string,
    data: UpdateTerrorizingMessageDto,
  ): Promise<TerrorizingMessage> {
    const oldMessage = await this.findOne(id);
    await this.repository.update(id, data);
    const updatedMessage = await this.findOne(id);

    // Handle scheduling changes
    if (oldMessage.status !== TerrorizingMessageStatus.SCHEDULED && 
        updatedMessage.status === TerrorizingMessageStatus.SCHEDULED) {
      await this.tweetQueueService.scheduleJob(updatedMessage);
    } else if (oldMessage.status === TerrorizingMessageStatus.SCHEDULED && 
               updatedMessage.status !== TerrorizingMessageStatus.SCHEDULED) {
      await this.tweetQueueService.removeJob(id);
    } else if (oldMessage.status === TerrorizingMessageStatus.SCHEDULED && 
               updatedMessage.status === TerrorizingMessageStatus.SCHEDULED &&
               oldMessage.scheduledAt !== updatedMessage.scheduledAt) {
      await this.tweetQueueService.rescheduleJob(updatedMessage);
    }

    return updatedMessage;
  }

  async delete(id: string): Promise<void> {
    const message = await this.findOne(id);
    if (message.status === TerrorizingMessageStatus.SCHEDULED) {
      await this.tweetQueueService.removeJob(id);
    }
    
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
  }

  async findByStatus(
    status: TerrorizingMessageStatus,
  ): Promise<TerrorizingMessage[]> {
    return this.repository.find({
      where: { status },
      relations: ['media'],
      order: { scheduledAt: 'ASC' },
    })
  }

  async updateStatus(
    id: string,
    status: TerrorizingMessageStatus,
  ): Promise<TerrorizingMessage> {
    return this.update(id, { status })
  }

  async findScheduled(): Promise<TerrorizingMessage[]> {
    return this.repository.find({
      where: {
        status: TerrorizingMessageStatus.SCHEDULED,
        scheduledAt: MoreThanOrEqual(new Date()),
      },
      relations: ['media'],
      order: { scheduledAt: 'ASC' },
    })
  }
}
