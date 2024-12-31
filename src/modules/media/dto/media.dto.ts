import { MediaType } from 'src/modules/media/entities/media.entity'

export class CreateMediaDto {
  filename: string
  type: MediaType
}

export class UpdateMediaDto {
  filename?: string
  type?: MediaType
}
