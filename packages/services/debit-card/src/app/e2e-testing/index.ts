import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { E2ETestSetupService } from './E2ETestSetupService'
import { E2ETestSetupController } from './E2ETestSetupController'
import { CardRepository, TransactionRepository, CardOrderRequestRepository } from '../../shared-components/repositories'
import { AccountRetrievalService } from './AccountRetrievalService'
import { commonProviders } from '../common-dependencies'

@Module({
  imports: [TypeOrmModule.forFeature([CardRepository, TransactionRepository, CardOrderRequestRepository])],
  providers: [...commonProviders, E2ETestSetupService, AccountRetrievalService],
  controllers: [E2ETestSetupController],
})
export class E2ETestSetupModule {}
