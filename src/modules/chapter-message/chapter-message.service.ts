import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThanOrEqual, Repository } from 'typeorm'
import {
  ChapterMessage,
  ChapterMessageStatus,
} from './entities/chapter-message.entity'
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate'
import {
  CreateChapterMessageDto,
  UpdateChapterMessageDto,
} from './dto/chapter-message.dto'
import { Media, MediaType } from '../media/entities/media.entity'
import { TweetQueueService } from '../tweet-queue/tweet-queue.service'

@Injectable()
export class ChapterMessageService {
  constructor(
    @InjectRepository(ChapterMessage)
    private readonly repository: Repository<ChapterMessage>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly tweetQueueService: TweetQueueService,
  ) {}

  async create(data: CreateChapterMessageDto): Promise<ChapterMessage> {
    if (data.chapter_number !== undefined && data.chapter_number < 0) {
      throw new Error('chapter_number cannot be negative')
    }

    const message = this.repository.create(data)
    if (message.mediaId == -1) {
      const mediaIds = await this.mediaRepository.find({
        select: {
          id: true,
        },
        where: { type: MediaType.Chapter },
        order: {
          createdAt: 'DESC',
        },
      })
      if (mediaIds.length > 0) {
        const randomIndex = Math.floor(Math.random() * mediaIds.length)
        message.mediaId = mediaIds[randomIndex].id
      }
    }

    const savedMessage = await this.repository.save(message)

    if (savedMessage.status === ChapterMessageStatus.SCHEDULED) {
      const tweet = await this.findOne(savedMessage.id);
      await this.tweetQueueService.scheduleJob(tweet);
    }

    return savedMessage
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

  async findOne(id: string): Promise<ChapterMessage> {
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
    data: UpdateChapterMessageDto,
  ): Promise<ChapterMessage> {
    if (data.chapter_number !== undefined && data.chapter_number < 0) {
      throw new Error('chapter_number cannot be negative')
    }

    const oldMessage = await this.findOne(id);
    await this.repository.update(id, data);
    const updatedMessage = await this.findOne(id);

    // Handle scheduling changes
    if (
      oldMessage.status !== ChapterMessageStatus.SCHEDULED &&
      updatedMessage.status === ChapterMessageStatus.SCHEDULED
    ) {
      await this.tweetQueueService.scheduleJob(updatedMessage)
    } else if (
      oldMessage.status === ChapterMessageStatus.SCHEDULED &&
      updatedMessage.status !== ChapterMessageStatus.SCHEDULED
    ) {
      await this.tweetQueueService.removeJob(id)
    } else if (
      oldMessage.status === ChapterMessageStatus.SCHEDULED &&
      updatedMessage.status === ChapterMessageStatus.SCHEDULED &&
      oldMessage.scheduledAt !== updatedMessage.scheduledAt
    ) {
      await this.tweetQueueService.rescheduleJob(updatedMessage)
    }

    return updatedMessage;
  }

  async delete(id: string): Promise<void> {
    const message = await this.findOne(id);
    if (message.status === ChapterMessageStatus.SCHEDULED) {
      await this.tweetQueueService.removeJob(id);
    }
    
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
  }

  async findByStatus(status: ChapterMessageStatus): Promise<ChapterMessage[]> {
    return this.repository.find({
      where: { status },
      relations: ['media'],
      order: { scheduledAt: 'ASC' },
    })
  }

  async updateStatus(
    id: string,
    status: ChapterMessageStatus,
  ): Promise<ChapterMessage> {
    return this.update(id, { status })
  }

  async findScheduled(): Promise<ChapterMessage[]> {
    return this.repository.find({
      where: {
        status: ChapterMessageStatus.SCHEDULED,
        scheduledAt: MoreThanOrEqual(new Date()),
      },
      relations: ['media'],
      order: { scheduledAt: 'ASC' },
    })
  }
}
