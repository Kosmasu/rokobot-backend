import { Controller, Get, Query } from '@nestjs/common'
import { TweetService } from './tweet.service'

export interface TweetResponse {
  mediaUrl: string
  mediaId: string
  content: string
  caption: string
}

@Controller('tweets')
export class TweetController {
  constructor(private readonly tweetService: TweetService) {}

  @Get()
  async getTweets(): Promise<TweetResponse[]> {
    return this.tweetService.getRecentTweets()
  }
}
