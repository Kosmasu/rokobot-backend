import { TerrorizingMessageStatus } from '../entities/terrorizing-message.entity';

export class CreateTerrorizingMessageDto {
  tweetId?: string;
  content?: string;
  mediaId?: number;
  tweetMediaId?: string;
  mediaUrl?: string;
  scheduledAt?: Date;
  status?: TerrorizingMessageStatus = TerrorizingMessageStatus.DRAFT;
}

export class UpdateTerrorizingMessageDto extends CreateTerrorizingMessageDto {
}