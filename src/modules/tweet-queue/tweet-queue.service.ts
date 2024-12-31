import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { TerrorizingMessage } from '../terrorizing-message/entities/terrorizing-message.entity'
import { ChapterMessage } from '../chapter-message/entities/chapter-message.entity'

@Injectable()
export class TweetQueueService {
  constructor(@InjectQueue('tweet-queue') private tweetQueue: Queue) {}

  async scheduleJob(tweet: TerrorizingMessage | ChapterMessage) {
    console.log('tweet:', tweet);
    if (!tweet.scheduledAt || !tweet.id || !tweet.content) {
      throw new Error('Invalid tweet data')
    }
    console.log("asdf 1")
    const delay = tweet.scheduledAt.getTime() - Date.now()
    console.log('delay:', delay);
    if (delay < 0) {
      throw new Error('Cannot schedule tweet in the past')
    }
    console.log("asdf 2")

    const job = this.tweetQueue.add('schedule-tweet', tweet, {
      delay,
      jobId: tweet.id.toString(),
      removeOnComplete: true,
    })
    console.log("Successfully scheduled a job!")
    console.log('message:', tweet);
    console.log('job:', job);
    return job
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
