import { Module } from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { SqsModule } from '@ssut/nestjs-sqs';
import { SQSClient } from '@aws-sdk/client-sqs';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    SqsModule.registerAsync({
      useFactory: () => {
        return {
          consumers: [
            {
              name: process.env.SQS_REQUEST_QUEUE_NAME,
              shouldDeleteMessages: true,
              queueUrl: process.env.SQS_REQUEST_QUEUE_URL,
              region: process.env.SQS_REGION,
              sqs: new SQSClient({
                region: process.env.SQS_REGION,
                credentials: {
                  accessKeyId: process.env.SQS_ACCESS_KEY_ID,
                  secretAccessKey: process.env.SQS_SECRET_ACCESS_KEY,
                },
              }),
            },
          ],
          producers: [
            {
              name: process.env.SQS_RESPONSE_QUEUE_NAME,
              queueUrl: process.env.SQS_RESPONSE_QUEUE_URL,
              region: process.env.SQS_REGION,
              sqs: new SQSClient({
                region: process.env.SQS_REGION,
                credentials: {
                  accessKeyId: process.env.SQS_ACCESS_KEY_ID,
                  secretAccessKey: process.env.SQS_SECRET_ACCESS_KEY,
                },
              }),
            },
          ],
        };
      },
    }),
  ],
  providers: [ConsumerService, ConfigModule],
})
export class ConsumerModule {}
