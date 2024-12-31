import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ChapterMessageService } from './chapter-message.service';
import { ChapterMessage, ChapterMessageStatus } from './entities/chapter-message.entity';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { CreateChapterMessageDto, UpdateChapterMessageDto } from './dto/chapter-message.dto';
import { ApiKeyGuard } from '@/guards/api-key.guard';

@Controller('chapter-messages')
@UseGuards(ApiKeyGuard)
export class ChapterMessageController {
  constructor(private readonly service: ChapterMessageService) {}

  @Post()
  create(@Body() data: CreateChapterMessageDto) {
    return this.service.create(data);
  }

  @Get()
  findAll(@Paginate() query: PaginateQuery) {
    return this.service.findAll(query);
  }

  @Get('scheduled')
  findScheduled() {
    return this.service.findScheduled();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: UpdateChapterMessageDto) {
    return this.service.update(id, data);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ChapterMessageStatus,
  ) {
    return this.service.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}