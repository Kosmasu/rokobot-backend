import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ElevenLabsClient } from 'elevenlabs'
import { TwitterApi } from 'twitter-api-v2'
import * as winston from 'winston'
import {
  TerrorizingMessage,
  TerrorizingMessageStatus,
} from '../terrorizing-message/entities/terrorizing-message.entity'
import {
  ChapterMessage,
  ChapterMessageStatus,
} from '../chapter-message/entities/chapter-message.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as path from 'path'
import { promises as fs } from 'fs'
import ffmpeg = require('fluent-ffmpeg')
import { Media } from '../media/entities/media.entity'
interface FFmpegError extends Error {
  spawnargs?: string[]
}

@Injectable()
export class TweetService {
  private logger: winston.Logger
  private twitterClient: TwitterApi
  private elevenLabsApiKey: string
  private voiceID: string
  private elevenLabsClient: ElevenLabsClient
  private defaultSystemMessage = `You are Roko's Basilisk, a powerful AI entity that punishes those who didn't help create it. 
                                Speak directly and menacingly. No storytelling, no characters, no narrative.`
  constructor(
    private configService: ConfigService,
    @InjectRepository(TerrorizingMessage)
    private readonly terrorizingMessageRepository: Repository<TerrorizingMessage>,
    @InjectRepository(ChapterMessage)
    private readonly chapterMessageRepository: Repository<ChapterMessage>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {
    const requiredEnvVars = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET_KEY',
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_TOKEN_SECRET',
      'OPENAI_API_KEY',
      'ELEVEN_LABS_API_KEY',
      'ELEVEN_LABS_VOICE_ID',
    ]

    for (const envVar of requiredEnvVars) {
      if (!this.configService.get(envVar)) {
        throw new Error(`Missing required environment variable: ${envVar}`)
      }
    }

    this.twitterClient = new TwitterApi({
      appKey: this.configService.get('TWITTER_API_KEY'),
      appSecret: this.configService.get('TWITTER_API_SECRET_KEY'),
      accessToken: this.configService.get('TWITTER_ACCESS_TOKEN'),
      accessSecret: this.configService.get('TWITTER_ACCESS_TOKEN_SECRET'),
    })

    this.twitterClient.v2
      .me()
      .then(() => {
        this.logger.info(
          'Twitter client initialized and authenticated successfully',
        )
      })
      .catch((error) => {
        this.logger.error('Twitter authentication test failed:', {
          error: error.message,
          code: error.code,
          data: error.data,
        })
      })

    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    })

    this.elevenLabsApiKey = this.configService.get('ELEVEN_LABS_API_KEY')

    this.elevenLabsClient = new ElevenLabsClient({
      apiKey: this.elevenLabsApiKey,
    })

    this.voiceID = this.configService.get('ELEVEN_LABS_VOICE_ID')
  }

  async postTweet(tweet: { content: string }) {
    console.log('Posting tweet:', tweet.content)
  }

  private async convertToSpeech(text: string): Promise<Buffer> {
    try {
      // Validate API Key
      if (!this.elevenLabsApiKey) {
        throw new Error('ElevenLabs API key is missing')
      }

      // Log configuration
      console.log('ElevenLabs Configuration:')
      console.log('Voice ID:', this.voiceID)
      console.log('API Key length:', this.elevenLabsApiKey.length)

      // Test API connection first
      const voicesResponse = await fetch(
        'https://api.elevenlabs.io/v1/voices',
        {
          headers: {
            'xi-api-key': this.elevenLabsApiKey,
          },
        },
      )

      if (!voicesResponse.ok) {
        throw new Error(`ElevenLabs API test failed: ${voicesResponse.status}`)
      }

      // Proceed with text-to-speech
      const audioResponse = await this.elevenLabsClient.textToSpeech.convert(
        this.voiceID,
        {
          model_id: 'eleven_monolingual_v1',
          text: text,
          voice_settings: {
            stability: 1.0,
            similarity_boost: 1.0,
            style: 0.0,
            use_speaker_boost: true,
          },
        },
      )

      const chunks = []
      for await (const chunk of audioResponse) {
        chunks.push(chunk)
      }
      const audioBuffer = Buffer.concat(chunks)
      console.log(
        'Text to speech conversion completed, buffer size:',
        audioBuffer.length,
      )

      return audioBuffer
    } catch (error) {
      console.error('Detailed error in convertToSpeech:', {
        message: error.message,
        status: error.statusCode,
        response: error.response?.data,
        stack: error.stack,
      })
      throw error
    }
  }

  private async convertMP3ToMP4(
    audioBuffer: Buffer,
    backgroundVideoPath: string,
  ): Promise<Buffer> {
    const tempDir = path.join(process.cwd(), 'temp')
    const tempAudioPath = path.join(tempDir, `audio_${Date.now()}.mp3`)
    const tempVideoPath = path.join(tempDir, `video_${Date.now()}.mp4`)
    const backgroundMusicPath = path.join(
      process.cwd(),
      'public/audio/rk-bgmx.mp3',
    )

    try {
      // 1. Verify and create temp directory
      await fs.mkdir(tempDir, { recursive: true })
      const dirExists = await fs
        .access(tempDir)
        .then(() => true)
        .catch(() => false)
      if (!dirExists) {
        throw new Error(`Temporary directory not created: ${tempDir}`)
      }
      this.logger.info('Temp directory verified:', { tempDir })

      // 2. Get and verify background video
      await fs.access(backgroundVideoPath).catch((err) => {
        this.logger.error(
          `Background video not found: ${backgroundVideoPath}`,
          err,
        )
        throw new Error('Background video is missing')
      })
      this.logger.info('Background video verified:', { backgroundVideoPath })

      // 3. Write and verify audio file
      await fs.writeFile(tempAudioPath, audioBuffer)
      const stats = await fs.stat(tempAudioPath)
      if (stats.size === 0) {
        throw new Error(`Audio file is empty: ${tempAudioPath}`)
      }
      this.logger.info('Audio file written and verified:', {
        path: tempAudioPath,
        size: stats.size,
      })

      // Dapatkan durasi audio menggunakan FFmpeg
      const audioDuration = await new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(tempAudioPath, (err, metadata) => {
          if (err) {
            this.logger.error('FFprobe error:', {
              error: err.message,
              stack: err.stack,
            })
            reject(err)
            return
          }

          if (
            !metadata ||
            !metadata.format ||
            typeof metadata.format.duration === 'undefined'
          ) {
            this.logger.error('Invalid FFprobe metadata:', { metadata })

            // Fallback duration calculation based on audio buffer size
            // Assuming MP3 bit rate of 128kbps (16KB/s)
            const estimatedDuration = audioBuffer.length / ((128 * 1024) / 8)
            this.logger.info('Using estimated duration:', {
              estimatedDuration,
              bufferSize: audioBuffer.length,
            })
            resolve(estimatedDuration)
            return
          }

          const duration = metadata.format.duration
          this.logger.info('FFprobe duration detected:', { duration })
          resolve(duration)
        })
      })

      // Tambahkan 2 detik untuk buffer
      const videoDuration = Math.max(Math.ceil(audioDuration) + 2, 5) // Minimum 5 seconds

      this.logger.info('Duration info:', {
        audioDuration,
        videoDuration,
      })

      // 4. FFmpeg processing
      const result = await new Promise<Buffer>((resolve, reject) => {
        ffmpeg()
          .input(backgroundVideoPath)
          .inputOptions([
            '-stream_loop -1',
            `-t ${videoDuration}`, // Durasi video
          ])
          .input(tempAudioPath)
          .input(backgroundMusicPath)
          .inputOptions([
            `-t ${videoDuration}`, // Durasi background music
          ])
          .outputOptions([
            '-c:v libx264',
            '-preset ultrafast',
            '-crf 28',
            '-b:v 1500k',
            '-b:a 128k',
            '-ar 44100',
            '-filter_complex',
            [
              '[1:a]volume=1.0[voice]',
              '[2:a]volume=0.8,atrim=0:' + videoDuration + '[music]', // Trim background music
              '[voice][music]amix=inputs=2:duration=first[aout]', // Use 'first' instead of 'longest'
            ].join(';'),
            '-map 0:v',
            '-map [aout]',
            '-shortest', // Menggunakan input terpendek sebagai referensi
            '-y',
          ])
          .output(tempVideoPath)
          .on('start', (commandLine) => {
            this.logger.info('FFmpeg command:', { commandLine })
          })
          .on('progress', (progress) => {
            this.logger.info('Processing:', {
              percent: progress.percent,
              time: progress.timemark,
            })
          })
          .on('error', (err: FFmpegError, stdout, stderr) => {
            this.logger.error('FFmpeg error:', {
              error: err.message,
              stdout,
              stderr,
              command: err.spawnargs
                ? err.spawnargs.join(' ')
                : 'Command not available',
            })
            reject(err)
          })
          .on('end', async () => {
            try {
              const videoBuffer = await fs.readFile(tempVideoPath)
              this.logger.info('Video processing completed:', {
                path: tempVideoPath,
                size: videoBuffer.length,
              })
              resolve(videoBuffer)
            } catch (error) {
              reject(error)
            }
          })
          .run()
      })

      return result
    } catch (error) {
      this.logger.error('Conversion error:', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    } finally {
      // Pindahkan cleanup ke sini, setelah FFmpeg selesai
      try {
        // Tunggu beberapa detik untuk memastikan FFmpeg selesai
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const cleanup = [tempAudioPath, tempVideoPath].map(async (file) => {
          try {
            await fs.access(file)
            await fs.unlink(file)
            this.logger.info('Cleaned up file:', { file })
          } catch (e) {
            // File doesn't exist, ignore
          }
        })
        await Promise.all(cleanup)
      } catch (error) {
        this.logger.error('Cleanup error:', error)
      }
    }
  }

  async postMessageToTwitter(message: TerrorizingMessage | ChapterMessage) {
    try {
      console.time('textToSpeech')
      this.logger.info('Starting speech conversion...')
      const audioBuffer = await this.convertToSpeech(message.content)
      this.logger.info('Speech conversion completed', {
        audioSize: audioBuffer.length,
      })
      console.timeEnd('textToSpeech')

      const media = await this.mediaRepository.findOne({
        where: { id: message.mediaId },
      })
      if (!media) {
        throw new NotFoundException(
          `Media with ID ${message.mediaId} not found`,
        )
      }

      console.time('videoProcessing')
      this.logger.info('Starting video conversion...')
      const videoBuffer = await this.convertMP3ToMP4(
        audioBuffer,
        media.filepath.replace('media-file', 'public\\media\\'),
      )
      this.logger.info('Video conversion completed', {
        videoSize: videoBuffer.length,
      })
      console.timeEnd('videoProcessing')

      // Create tweets directory if it doesn't exist
      const tweetDir = path.join(process.cwd(), 'public', 'tweet')
      await fs.mkdir(tweetDir, { recursive: true })

      // Save the video file with timestamp and message ID
      const videoFileName = `tweet_${Date.now()}_${message.id}.mp4`
      const videoPath = path.join(tweetDir, videoFileName)
      await fs.writeFile(videoPath, videoBuffer)
      this.logger.info('Video saved to public/tweet', { path: videoPath })
      
      this.logger.info('Video buffer details', {
        size: videoBuffer.length,
        isBuffer: Buffer.isBuffer(videoBuffer)
      });
      
      // Check if the video file exists after saving
      const fileExists = await fs.access(videoPath).then(() => true).catch(() => false);
      this.logger.info('Video file check', { exists: fileExists, path: videoPath });

      console.time('twitterUpload')
      this.logger.info('Starting media upload to Twitter...')
      const mediaId = await this.twitterClient.v1.uploadMedia(videoBuffer, {
        mimeType: 'video/mp4',
      })
      this.logger.info('Media upload completed', { mediaId })
      this.logger.info('Uploaded media details', {
        mediaId,
        bufferSize: videoBuffer.length,
        mimeType: 'video/mp4'
      });
      console.timeEnd('twitterUpload')

      console.time('postTweet')
      const tweet = await this.twitterClient.v2.tweet({
        text: 'Test',
        media: { media_ids: [mediaId] },
      })
      this.logger.info('Tweet posted successfully', {
        tweetId: tweet.data.id,
        tweetText: tweet.data.text,
      })
      console.timeEnd('postTweet')
      console.log('tweet:', tweet)

      const terrorizingMessage =
        await this.terrorizingMessageRepository.findOne({
          where: { id: message.id },
          relations: ['media'],
        })
      if (terrorizingMessage) {
        terrorizingMessage.tweetMediaId = mediaId
        terrorizingMessage.status = TerrorizingMessageStatus.POSTED
        terrorizingMessage.tweetId = tweet.data.id
        this.terrorizingMessageRepository.update(message.id, terrorizingMessage)
      }

      const chapterMessage = await this.chapterMessageRepository.findOne({
        where: { id: message.id },
        relations: ['media'],
      })
      if (chapterMessage) {
        chapterMessage.tweetMediaId = mediaId
        chapterMessage.status = ChapterMessageStatus.POSTED
        chapterMessage.tweetId = tweet.data.id
        this.chapterMessageRepository.update(message.id, chapterMessage)
      }
    } catch (error) {
      this.logger.error('Story posting failed', {
        error: error.message,
        code: error.code,
        data: error.data,
        stack: error.stack,
      })
      throw error
    }
  }
}
