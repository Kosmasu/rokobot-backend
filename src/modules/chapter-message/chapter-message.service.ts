import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThanOrEqual, Repository } from 'typeorm'
import {
  ChapterMessage,
  ChapterMessageStatus,
} from './entities/chapter-message.entity'
import { FilterOperator, paginate, Paginated, PaginateQuery } from 'nestjs-paginate'
import { CreateChapterMessageDto, UpdateChapterMessageDto } from './dto/chapter-message.dto'
import { Media, MediaType } from '../media/entities/media.entity'

@Injectable()
export class ChapterMessageService {
  constructor(
    @InjectRepository(ChapterMessage)
    private readonly repository: Repository<ChapterMessage>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async create(data: CreateChapterMessageDto): Promise<ChapterMessage> {
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
      return this.repository.save(message)
  }
  
    async findAll(query: PaginateQuery) {
      console.log('query:', query);
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

  async findOne(id: number): Promise<ChapterMessage> {
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
    id: number,
    data: UpdateChapterMessageDto
  ): Promise<ChapterMessage> {
    await this.findOne(id) // Verify existence
    await this.repository.update(id, data)
    return this.findOne(id)
  }

  async delete(id: number): Promise<void> {
    const result = await this.repository.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException(`Message with ID ${id} not found`)
    }
  }

  async findByStatus(
    status: ChapterMessageStatus,
  ): Promise<ChapterMessage[]> {
    return this.repository.find({
      where: { status },
      relations: ['media'],
      order: { scheduledAt: 'ASC' },
    })
  }

  async updateStatus(
    id: number,
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
