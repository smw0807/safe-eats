import { IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionType } from '@safe-eats/database';

export class CreateSubscriptionDto {
  @ApiProperty({ example: '오리온' })
  @IsString()
  @MinLength(1)
  keyword: string;

  @ApiProperty({ enum: SubscriptionType })
  @IsEnum(SubscriptionType)
  type: SubscriptionType;
}
