import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Media, MediaType } from 'src/modules/media/entities/media.entity'
import { Repository } from 'typeorm'
import winston from 'winston'
import { CreateMediaDto, UpdateMediaDto } from './dto/media.dto'
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate'

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async createMedia(
    createMediaDto: CreateMediaDto,
    filePath: string,
  ): Promise<Media> {
    try {
      const media = this.mediaRepository.create({
        filename: createMediaDto.filename,
        filepath: filePath,
        type: createMediaDto.type,
      })

      const savedMedia = await this.mediaRepository.save(media)
      return savedMedia
    } catch (error) {
      throw new Error(`Failed to create media: ${error.message}`)
    }
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Media>> {
    return paginate(query, this.mediaRepository, {
      sortableColumns: ['id', 'filename', 'updatedAt', 'type'],
      nullSort: 'last',
      defaultSortBy: [['id', 'DESC']],
      searchableColumns: ['filename'],
      filterableColumns: {
        type: [FilterOperator.EQ],
      },
      maxLimit: 5,
    })
  }

  async getMediaById(id: number): Promise<Media> {
    try {
      const media = await this.mediaRepository.findOne({
        where: { id },
      })

      if (!media) {
        throw new NotFoundException(`Media with ID ${id} not found`)
      }

      return media
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new Error(`Failed to fetch media: ${error.message}`)
    }
  }

  async updateMedia(
    id: number,
    updateMediaDto: UpdateMediaDto,
  ): Promise<Media> {
    try {
      const media = await this.getMediaById(id)

      Object.assign(media, updateMediaDto)

      const updatedMedia = await this.mediaRepository.save(media)
      return updatedMedia
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new Error(`Failed to update media: ${error.message}`)
    }
  }

  async deleteMedia(id: number): Promise<void> {
    try {
      const result = await this.mediaRepository.delete(id)

      if (result.affected === 0) {
        throw new NotFoundException(`Media with ID ${id} not found`)
      }
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new Error(`Failed to delete media: ${error.message}`)
    }
  }

  async getMediaByType(type: MediaType): Promise<Media[]> {
    try {
      return await this.mediaRepository.find({
        where: { type },
        order: {
          createdAt: 'DESC',
        },
      })
    } catch (error) {
      throw new Error(`Failed to fetch media by type: ${error.message}`)
    }
  }
}
