import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject } from '@nestjs/common'
import { Job } from 'bullmq'
import { TweetService } from './tweet.service'
import { TerrorizingMessage } from '../terrorizing-message/entities/terrorizing-message.entity'
import { ChapterMessage } from '../chapter-message/entities/chapter-message.entity'

@Processor('tweet-queue')
export class TweetQueueProcessor extends WorkerHost {
  constructor(
    @Inject(TweetService) private readonly tweetService: TweetService,
  ) {
    super()
  }

  async process(job: Job<TerrorizingMessage | ChapterMessage, any, string>): Promise<any> {
    try {
      console.log("Posting message to twitter!........")
      console.log('job.data:', job.data);
      await this.tweetService.postMessageToTwitter(job.data)
      console.log("Posting message to twitter done!........")
      return {}
    } catch (error) {
      // Log error details before rethrowing
      console.log('error processing tweet to twitter:', error);
      throw error 
    }
  }
}
