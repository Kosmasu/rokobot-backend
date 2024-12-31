import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { TerrorizingMessageService } from './terrorizing-message.service'
import {
  TerrorizingMessageStatus,
} from './entities/terrorizing-message.entity'
import { Paginate, PaginateQuery } from 'nestjs-paginate'
import {
  CreateTerrorizingMessageDto,
  UpdateTerrorizingMessageDto,
} from './dto/terrorizing-message.dto'
import { ApiKeyGuard } from '@/guards/api-key.guard'

@Controller('terrorizing-messages')
@UseGuards(ApiKeyGuard)
export class TerrorizingMessageController {
  constructor(private readonly service: TerrorizingMessageService) {}

  @Post()
  create(@Body() data: CreateTerrorizingMessageDto) {
    return this.service.create(data)
  }

  @Get()
  findAll(@Paginate() query: PaginateQuery) {
    return this.service.findAll(query)
  }

  @Get('scheduled')
  findScheduled() {
    return this.service.findScheduled()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: UpdateTerrorizingMessageDto) {
    return this.service.update(id, data)
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TerrorizingMessageStatus,
  ) {
    return this.service.updateStatus(id, status)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id)
  }
}
