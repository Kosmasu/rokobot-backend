import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Patch,
  UseGuards,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { RokoPromptService } from './roko-prompt.service'
import { RokoPrompt, RokoPromptType } from './entities/roko-prompt.entity'
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate'
import { ApiKeyGuard } from '@/guards/api-key.guard'
import { Response } from 'express'

@Controller('roko-prompt')
@UseGuards(ApiKeyGuard)
export class RokoPromptController {
  constructor(private readonly rokoPromptService: RokoPromptService) {}

  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<RokoPrompt>> {
    return await this.rokoPromptService.findAll(query)
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    return await this.rokoPromptService.findById(id)
  }

  @Post()
  async create(
    @Body()
    data: {
      systemPrompt: string
      greeting?: string
      type: RokoPromptType
      isActive: number
    },
  ) {
    return await this.rokoPromptService.create(data)
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body()
    data: Partial<{
      systemPrompt: string
      greeting?: string
      type: RokoPromptType
      isActive: number
    }>,
  ) {
    return await this.rokoPromptService.update(id, data)
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return await this.rokoPromptService.delete(id)
  }

  @Patch(':id/activate')
  async setActive(@Param('id') id: number) {
    return await this.rokoPromptService.setActive(id)
  }

  @Get('active/:type')
  async getActiveByType(@Param('type') type: RokoPromptType) {
    return await this.rokoPromptService.getActiveByType(type)
  }

  @Post('terror')
  async generateTerror(@Body() data: { message: string }) {
    return await this.rokoPromptService.generateTerrorMessage(data.message)
  }

  @Post('chat')
  async chat(@Body() data: { messages: any[] }, @Res() res: Response) {
    return await this.rokoPromptService.streamConversation(data.messages, res)
  }

  @Post('chat/greeting')
  async chatGreeting(@Res() res: Response) {
    const activePrompt = await this.rokoPromptService.getActiveByType(
      RokoPromptType.CONVERSATIONAL,
    )
    if (!activePrompt?.greeting) {
      throw new HttpException('No active greeting found', HttpStatus.NOT_FOUND)
    }

    return await this.rokoPromptService.streamConversation(
      [{ role: 'user', content: activePrompt.greeting }],
      res,
    )
  }
}
