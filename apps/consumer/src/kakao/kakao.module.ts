import { Module } from '@nestjs/common';
import { KakaoConsumer } from './kakao.consumer';
import { KakaoService } from './kakao.service';

@Module({
  controllers: [KakaoConsumer],
  providers: [KakaoService],
})
export class KakaoModule {}
