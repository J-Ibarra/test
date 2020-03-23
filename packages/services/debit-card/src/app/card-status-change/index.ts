import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CardStatusChangeOrchestrator } from './CardStatusChangeOrchestrator'
import { CardStatusChangeController } from './CardStatusChangeController'
import { commonProviders } from '../common-dependencies'
import { ContisRequestLogRepository, CardRepository } from '../../shared-components/repositories'
import { AdminCardStatusChangeController } from './AdminCardStatusChangeController'
import { AdminCardStatusChangeOrchestrator } from './AdminCardStatusChangeOrchestrator'
import { CardLockingController } from './CardLockingController'
import { CardLockingService } from './CardLockingService'

@Module({
  imports: [TypeOrmModule.forFeature([ContisRequestLogRepository, CardRepository])],
  providers: [CardStatusChangeOrchestrator, AdminCardStatusChangeOrchestrator, CardLockingService, ...commonProviders],
  controllers: [CardStatusChangeController, AdminCardStatusChangeController, CardLockingController],
})
export class CardStatusChangeModule {}
