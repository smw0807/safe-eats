import { Module } from '@nestjs/common';
import { KakaoConsumer } from './kakao.consumer';
import { KakaoService } from './kakao.service';

@Module({
  providers: [KakaoConsumer, KakaoService],
})
export class KakaoModule {}
