import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { TerrorizingMessage } from '../terrorizing-message/entities/terrorizing-message.entity'
import { ChapterMessage } from '../chapter-message/entities/chapter-message.entity'

@Injectable()
export class TweetQueueService {
  constructor(@InjectQueue('tweet-queue') private tweetQueue: Queue) {}

  async scheduleJob(tweet: TerrorizingMessage | ChapterMessage) {
    if (!tweet.scheduledAt || !tweet.id || !tweet.content) {
      throw new Error('Invalid tweet data')
    }

    const delay = tweet.scheduledAt.getTime() - Date.now()
    if (delay < 0) {
      throw new Error('Cannot schedule tweet in the past')
    }

    return this.tweetQueue.add('schedule-tweet', tweet, {
      delay,
      jobId: tweet.id.toString(),
      removeOnComplete: true,
    })
  }

  async removeJob(tweetId: string) {
    const job = await this.tweetQueue.getJob(tweetId)
    if (job) {
      await job.remove()
    }
  }

  async rescheduleJob(tweet: TerrorizingMessage | ChapterMessage) {
    await this.removeJob(tweet.id.toString())
    return this.scheduleJob(tweet)
  }
}
