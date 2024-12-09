import { Module } from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { SqsModule } from '@ssut/nestjs-sqs';
import { SQSClient } from '@aws-sdk/client-sqs';

@Module({
  imports: [
    SqsModule.register({
      consumers: [
        {
          name: 'request-queue',
          queueUrl:
            'http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/request-queue',
          region: 'us-east-1',
          sqs: new SQSClient({
            region: 'us-east-1',
            credentials: {
              accessKeyId: 'testkey',
              secretAccessKey: 'testkey',
            },
          }),
        },
      ],
      producers: [],
    }),
  ],
  providers: [ConsumerService],
})
export class ConsumerModule {}
