import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import {
  ENCRYPTION_SERVICE,
  AESEncryptionService,
  CONTIS_AXIOS_INSTANCE_TOKEN,
  CardConstraintService,
  BalanceSourceOfTruthComparator,
  TransactionSourceOfTruthSynchronizer,
  TransactionRetriever,
} from '../../shared-components/providers'
import { contisAxiosInstanceFactory } from '../TopLevelProviders'
import { CardDetailsController } from './CardDetailsController'
import { CardDetailsOrchestrator } from './CardDetailsOrchestrator'
import { commonProviders } from '../common-dependencies'
import {
  CardRepository,
  CardConstraintRepository,
  ContisRequestLogRepository,
  CardOrderRequestRepository,
  TransactionRepository,
  TopUpRequestRepository,
} from '../../shared-components/repositories'
import { AdminCardDetailsController } from './AdminCardDetailsController'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CardRepository,
      ContisRequestLogRepository,
      CardOrderRequestRepository,
      CardConstraintRepository,
      TransactionRepository,
      TopUpRequestRepository,
    ]),
  ],
  providers: [
    ...commonProviders,
    {
      provide: ENCRYPTION_SERVICE,
      useClass: AESEncryptionService,
    },
    {
      provide: CONTIS_AXIOS_INSTANCE_TOKEN,
      useFactory: contisAxiosInstanceFactory,
    },
    CardDetailsOrchestrator,
    CardConstraintService,
    BalanceSourceOfTruthComparator,
    TransactionSourceOfTruthSynchronizer,
    TransactionRetriever,
  ],
  controllers: [CardDetailsController, AdminCardDetailsController],
})
export class CardDetailsModule {}
