import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'The text of the message to send',
    example: 'Find me some recipes',
    maxLength: 3000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  text: string;
}
