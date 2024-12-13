import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ConsumerModule } from './consumer/consumer.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
    }),
    ConsumerModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConsumerModule],
})
export class AppModule {}
