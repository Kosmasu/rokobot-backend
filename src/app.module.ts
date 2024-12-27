import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppService } from './app.service'
import { AppController } from './app.controller'
import { Tweet } from './entities/tweet.entity'
import { ApiKeyGuard } from './guards/api-key.guard'
import { Prompt } from './entities/prompt.entity'
import { StoryPrompt } from './entities/story-prompt.entity'
import { Chapter } from './entities/chapter.entity'
import { Media } from './modules/media/entities/media.entity'
import { MediaModule } from './modules/media/media.module'

import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { ChapterMessageModule } from './modules/chapter-message/chapter-message.module'
import { TerrorizingMessageModule } from './modules/terrorizing-message/terrorizing-message.module'
import { TerrorizingMessage } from './modules/terrorizing-message/entities/terrorizing-message.entity'
import { ChapterMessage } from './modules/chapter-message/entities/chapter-message.entity'

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'media'),
      serveRoot: '/media-file',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        console.log('Database Configuration:')
        console.log('----------------------')
        console.log('DB_HOST:', configService.get('DB_HOST'))
        console.log('DB_PORT:', configService.get('DB_PORT'))
        console.log('DB_USER:', configService.get('DB_USER'))
        console.log(
          'DB_PASSWORD:',
          configService.get('DB_PASSWORD') ? '****' : 'NOT SET',
        )
        console.log('DB_NAME:', configService.get('DB_NAME'))
        console.log('----------------------')

        return {
          type: 'mysql',
          host: configService.get('DB_HOST'),
          port: +configService.get('DB_PORT'),
          username: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          entities: [Tweet, Prompt, StoryPrompt, Chapter, Media, TerrorizingMessage, ChapterMessage],
          synchronize: true,
          logging: true,
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          driver: require('mysql2'),
        }
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Tweet, Prompt, StoryPrompt, Chapter, Media, TerrorizingMessage, ChapterMessage]),
    MediaModule,
    ChapterMessageModule,
    TerrorizingMessageModule,
  ],
  controllers: [AppController],
  providers: [AppService, ApiKeyGuard],
})
export class AppModule {}
