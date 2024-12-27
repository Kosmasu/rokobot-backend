import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { MediaService } from './media.service'
import { Media, MediaType } from 'src/modules/media/entities/media.entity'
import { CreateMediaDto, UpdateMediaDto } from 'src/modules/media/dto/media.dto'
import { ApiKeyGuard } from 'src/guards/api-key.guard'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { v4 as uuidv4 } from 'uuid'
import * as path from 'path'
import { Paginate, paginate, Paginated, PaginateQuery } from 'nestjs-paginate'

@Controller('media')
@UseGuards(ApiKeyGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/media',
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
          callback(null, uniqueName)
        },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
      fileFilter(req, file, callback) {
        const extname = path.extname(file.originalname)
        if (extname !== '.mp4') {
          return callback(new Error('Only .mp4 files are allowed'), false)
        }
        callback(null, true)
      },
    }),
  )
  async create(
    @Body() createMediaDto: CreateMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Media> {
    console.log('createMediaDto:', createMediaDto)
    console.log('file:', file)

    const filePath = path.join('media-file', file.filename)

    return this.mediaService.createMedia(createMediaDto, filePath)
  }

  @Get()
  public findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Media>> {
    return this.mediaService.findAll(query)
  }

  @Get('/type')
  public findByType(@Query('type') type: MediaType): Promise<Media[]> {
    return this.mediaService.getMediaByType(type)
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Media> {
    return this.mediaService.getMediaById(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ): Promise<Media> {
    return this.mediaService.updateMedia(+id, updateMediaDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.mediaService.deleteMedia(+id)
  }
}
