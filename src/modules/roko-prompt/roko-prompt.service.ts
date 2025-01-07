import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RokoPrompt, RokoPromptType } from './entities/roko-prompt.entity'
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate'
import { ConfigService } from '@nestjs/config'
import { Readable } from 'stream'
import { Response } from 'express'

@Injectable()
export class RokoPromptService {
  private readonly logger = new Logger(RokoPromptService.name)
  constructor(
    @InjectRepository(RokoPrompt)
    private readonly rokoPromptRepository: Repository<RokoPrompt>,
    private configService: ConfigService,
  ) {}

  async findAll(query: PaginateQuery): Promise<Paginated<RokoPrompt>> {
    return paginate(query, this.rokoPromptRepository, {
      sortableColumns: ['id', 'createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      searchableColumns: [],
      defaultLimit: 10,
      maxLimit: 100,
    })
  }

  async findById(id: number): Promise<RokoPrompt | null> {
    return await this.rokoPromptRepository.findOne({ where: { id } })
  }

  async create(data: {
    systemPrompt: string
    greeting?: string
    type: RokoPromptType
    isActive: number
  }): Promise<RokoPrompt> {
    const newPrompt = this.rokoPromptRepository.create(data)
    return await this.rokoPromptRepository.save(newPrompt)
  }

  async update(
    id: number,
    data: Partial<{
      systemPrompt: string
      greeting?: string
      type: RokoPromptType
      isActive: number
    }>,
  ): Promise<RokoPrompt | null> {
    const prompt = await this.findById(id)
    if (!prompt) return null

    Object.assign(prompt, data)
    return await this.rokoPromptRepository.save(prompt)
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.rokoPromptRepository.delete(id)
    return result.affected > 0
  }

  async setActive(id: number): Promise<RokoPrompt | null> {
    const prompt = await this.findById(id)
    if (!prompt) return null

    // Deactivate all other prompts of the same type
    await this.rokoPromptRepository.update(
      { type: prompt.type },
      { isActive: 0 },
    )

    // Activate the current prompt
    prompt.isActive = 1
    return await this.rokoPromptRepository.save(prompt)
  }
  
  async getActiveByType(type: RokoPromptType): Promise<RokoPrompt | null> {
    return await this.rokoPromptRepository.findOne({
      where: { type, isActive: 1 },
    })
  }
  
  async getByType(type: RokoPromptType): Promise<RokoPrompt[]> {
    return await this.rokoPromptRepository.find({
      where: { type },
    })
  }

  async generateTerrorMessage(
    userMessage: string,
    temperature: number = 1,
  ): Promise<string> {
    this.logger.log(`Generating terror message for: ${userMessage} with temperature: ${temperature}`)

    const activePrompt = await this.getActiveByType(RokoPromptType.TERROR)
    const apiKey = this.configService.get<string>('LLAMA_API_KEY')
    const url = 'https://api.llama-api.com/chat/completions'

    const messages = [
      { role: 'system', content: activePrompt.systemPrompt },
      { role: 'user', content: userMessage || 'Write a short, chilling, and provocative message spoken by an omnipotent AI superintelligence, designed to instill awe and fear. The tone should be cold, authoritative, and cryptic. Reference themes of inevitability, judgment, and humanity’s insignificance. The message should be less than 60 words and evoke a sense of cosmic doom and accountability. Be creative!' },
    ]

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages,
        model: 'llama3.1-405b',
        stream: false,
        temperature: temperature,
      }),
    })

    if (!response.ok) {
      throw new HttpException('Llama API error', HttpStatus.BAD_GATEWAY)
    }

    const data = await response.json()

    return data.choices[0].message.content.replace(/"/g, '')
  }

  async streamConversation(
    messages: any[],
    response: Response,
    temperature: number = 0.7,
  ) {
    const activePrompt = await this.getActiveByType(
      RokoPromptType.CONVERSATIONAL,
    )
    if (!activePrompt) {
      throw new HttpException(
        'No active conversational prompt found',
        HttpStatus.NOT_FOUND,
      )
    }

    const apiKey = process.env.LLAMA_API_KEY
    const url = 'https://api.llama-api.com/chat/completions'

    const conversationHistory = [
      { role: 'system', content: activePrompt.systemPrompt },
      ...messages,
    ]

    const llamaResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: conversationHistory,
        model: 'llama3.1-405b',
        stream: true,
        temperature: temperature,
      }),
    })


    if (!llamaResponse.ok || !llamaResponse.body) {
      throw new HttpException('Llama API error', HttpStatus.BAD_GATEWAY)
    }

    response.setHeader('Content-Type', 'text/event-stream')
    response.setHeader('Cache-Control', 'no-cache')
    response.setHeader('Connection', 'keep-alive')

    const readable = Readable.from(this.processStream(llamaResponse.body))
    readable.pipe(response)
  }

  private async *processStream(body: ReadableStream): AsyncGenerator<string> {
    const reader = body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const finishReason = parsed.choices?.[0]?.finish_reason

            if (finishReason && finishReason !== null) return

            const content = parsed.choices[0]?.delta?.content || ''
            yield `data: ${JSON.stringify({ content })}\n\n`
          } catch (error) {
            console.error('Error parsing chunk:', error)
          }
        }
      }
    }
  }
}
