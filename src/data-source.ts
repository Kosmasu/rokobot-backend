import { DataSource } from 'typeorm'
import { Tweet } from './entities/tweet.entity'
import { StoryPrompt } from './entities/story-prompt.entity'
import { Chapter } from './entities/chapter.entity'
import * as dotenv from 'dotenv'
import { ChapterMessage } from './modules/chapter-message/entities/chapter-message.entity'
import { TerrorizingMessage } from './modules/terrorizing-message/entities/terrorizing-message.entity'
import { Media } from './modules/media/entities/media.entity'
import { RokoPrompt } from './modules/roko-prompt/entities/roko-prompt.entity'
import { Prompt } from './entities/prompt.entity'

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rokobot',
  entities: [Tweet, Prompt, StoryPrompt, Media, Chapter, TerrorizingMessage, ChapterMessage, RokoPrompt],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  extra: {
    authPlugin: 'mysql_native_password',
  },
})
