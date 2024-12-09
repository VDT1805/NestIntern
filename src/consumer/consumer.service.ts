import { Message } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import { SqsConsumerEventHandler, SqsMessageHandler } from '@ssut/nestjs-sqs';
import { google } from 'googleapis';

@Injectable()
export class ConsumerService {
  constructor() {}
  @SqsMessageHandler('request-queue', false)
  async handleMessage(message: AWS.SQS.Message) {
    const credentials: any = JSON.parse(message.Body) as {
      client_id: string;
      client_secret: string;
      refresh_token: string;
    };
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

      // Collect user details in an array
      const userDetails = users.map((user) => ({
        email: user.primaryEmail,
        name: user.name.fullName,
      }));
      
    } else {
      console.log('no data');
    }
  }

  @SqsConsumerEventHandler('request-queue', 'processing_error')
  public onProcessingError(error: Error, message: Message) {
    console.log(error, message);
  }
}
