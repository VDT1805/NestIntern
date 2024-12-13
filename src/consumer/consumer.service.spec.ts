import { Test, TestingModule } from '@nestjs/testing';
import { ConsumerService } from './consumer.service';
import * as AWS from 'aws-sdk';
import { google } from 'googleapis';
import { UserDetailsDto } from './dto/user-details.dto';
import { SqsService } from '@ssut/nestjs-sqs';

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    admin: jest.fn().mockImplementation(() => ({
      users: {
        list: jest.fn().mockResolvedValue({
          data: {
            users: [
              {
                primaryEmail: 'user1@example.com',
                name: { fullName: 'User One' },
              },
              {
                primaryEmail: 'user2@example.com',
                name: { fullName: 'User Two' },
              },
            ],
          },
        }),
      },
    })),
  },
}));

describe('ConsumerService', () => {
  let consumerService: ConsumerService;
  let sendMessageSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumerService,
        {
          provide: SqsService,
          useValue: {
            send: jest.fn(), // Mock the send method
          },
        },
      ],
    }).compile();

    consumerService = module.get<ConsumerService>(ConsumerService);

    // Spy on sendMessage
    sendMessageSpy = jest
      .spyOn(consumerService, 'sendMessage')
      .mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should process message and send user details to ProducerService', async () => {
    const mockMessage = {
      Body: JSON.stringify({
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        refresh_token: 'test-refresh-token',
      }),
    } as AWS.SQS.Message;

    await consumerService.handleMessage(mockMessage);

    expect(google.auth.OAuth2).toHaveBeenCalledWith({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });

    const expectedUserDetails: UserDetailsDto[] = [
      { email: 'user1@example.com', name: 'User One' },
      { email: 'user2@example.com', name: 'User Two' },
    ];

    expect(sendMessageSpy).toHaveBeenCalledWith(expectedUserDetails);
  });

  it('should handle processing errors', () => {
    const mockError = new Error('Test Error');
    const mockMessage = { Body: '' } as AWS.SQS.Message;
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    consumerService.onProcessingError(mockError, mockMessage);

    // Check if console.log was called with the correct arguments
    expect(consoleSpy).toHaveBeenCalledWith(mockError, mockMessage);

    // Clean up spy to avoid side effects on other tests
    consoleSpy.mockRestore();
  });
});
