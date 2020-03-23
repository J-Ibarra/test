import { Module } from '@nestjs/common'

import { CardOrderKycCheckQueue } from './CardOrderKycCheckQueue'
import { CardOrderOrchestrator } from './CardOrderOrchestrator'
import { CardOrderController } from './CardOrderController'
import { CardOrderGateway } from './CardOrderGateway'
import { commonProviders } from '../common-dependencies'
import { CardOrderSuccessfulApplicationRecorder } from './CardOrderSuccesfulApplicationRecorder'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContisRequestLogRepository, CardRepository, CardOrderRequestRepository } from '../../shared-components/repositories'
import { AdminCardOrderController } from './AdminCardOrderController'

@Module({
  imports: [TypeOrmModule.forFeature([ContisRequestLogRepository, CardRepository, CardOrderRequestRepository])],
  providers: [
    CardOrderKycCheckQueue,
    CardOrderOrchestrator,
    CardOrderGateway,
    CardOrderSuccessfulApplicationRecorder,
    ...commonProviders,
  ],
  controllers: [CardOrderController, AdminCardOrderController],
})
export class CardOrderModule {}
