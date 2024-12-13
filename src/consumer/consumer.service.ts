import { Injectable } from '@nestjs/common';
import {
  SqsConsumerEventHandler,
  SqsMessageHandler,
  SqsService,
} from '@ssut/nestjs-sqs';
import { google } from 'googleapis';
import * as AWS from 'aws-sdk';
import { CredentialsDto } from './dto/credentials.dto';
import { UserDetailsDto } from './dto/user-details.dto';
import { Message } from '@ssut/nestjs-sqs/dist/sqs.types';

@Injectable()
export class ConsumerService {
  constructor(private readonly sqsService: SqsService) {}

  @SqsMessageHandler('request-queue', false)
  async handleMessage(message: AWS.SQS.Message) {
    const credentials: CredentialsDto = JSON.parse(message.Body);

    if (credentials) {
      const oauth2Client = new google.auth.OAuth2({
        clientId: credentials.client_id,
        clientSecret: credentials.client_secret,
      });
      oauth2Client.setCredentials({ refresh_token: credentials.refresh_token });

      const service = google.admin({
        auth: oauth2Client,
        version: 'directory_v1',
      });

      const res = await service.users.list({
        customer: 'my_customer',
        orderBy: 'email',
      });

      const users = res.data.users;
      if (!users || users.length === 0) {
        console.log('No users found.');
        return;
      }

      const userDetails: UserDetailsDto[] = users.map((user) => ({
        email: user.primaryEmail,
        name: user.name.fullName,
      }));

      await this.sendMessage(userDetails);
    } else {
      console.log('No data found in the message body.');
    }
  }

  async sendMessage(body: UserDetailsDto[]) {
    const message: Message = {
      body: body,
      id: 'employee-data',
    };

    try {
      await this.sqsService.send(process.env.SQS_RESPONSE_QUEUE_NAME, message);
    } catch (error) {
      console.log('error:', error);
    }
  }

  @SqsConsumerEventHandler('request-queue', 'processing_error')
  public onProcessingError(error: Error, message: AWS.SQS.Message) {
    console.log(error, message);
  }
}
