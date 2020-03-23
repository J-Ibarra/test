import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { StatusChangeRecorder } from './providers/StatusChangeRecorder'
import { commonProviders } from '../common-dependencies'
import { ContisTransactionRecorder } from './providers/ContisTransactionRecorder'
import { BackgroundCheckStatusChangeRecorder } from './providers/BackgroundCheckChangeRecorder'
import { CardRepository, ContisRequestLogRepository, TransactionRepository } from '../../shared-components/repositories'
import { ContisNotificationQueueProcessor } from './ContisNotificationQueueProcessor'
import { QueueGatewayStub, AwsSqsQueueGateway, QUEUE_GATEWAY } from '../../shared-components/providers'

const environmentsWithStubEnabled = ['dev', 'test', 'e2e-local']

@Module({
  imports: [TypeOrmModule.forFeature([CardRepository, ContisRequestLogRepository, TransactionRepository])],
  providers: [
    StatusChangeRecorder,
    ContisTransactionRecorder,
    BackgroundCheckStatusChangeRecorder,
    ContisNotificationQueueProcessor,
    {
      provide: QUEUE_GATEWAY,
      useFactory: () =>
        environmentsWithStubEnabled.includes(process.env.ENV!) ? new QueueGatewayStub() : new AwsSqsQueueGateway(),
    },
    ...commonProviders,
  ],
})
export class ContisWebhooksIntakeModule {}
