import { Module } from '@nestjs/common'

import { TransactionController } from './TransactionController'
import { commonProviders } from '../common-dependencies'
import { TransactionRetriever } from '../../shared-components/providers/transaction/TransactionRetriever'
import { TypeOrmModule } from '@nestjs/typeorm'
import {
  CardRepository,
  TransactionRepository,
  TopUpRequestRepository,
  ContisRequestLogRepository,
} from '../../shared-components/repositories'
import { AdminTransactionController } from './AdminTransactionController'

@Module({
  imports: [
    TypeOrmModule.forFeature([TopUpRequestRepository, CardRepository, TransactionRepository, ContisRequestLogRepository]),
  ],
  providers: [TransactionRetriever, ...commonProviders],
  controllers: [TransactionController, AdminTransactionController],
})
export class TransactionModule {}
