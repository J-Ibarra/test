import { Module, Global } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TerminusModule } from '@nestjs/terminus/dist'

import { TerminusHealthCheckService } from '../shared-components/providers'
import { TypeOrmModuleFactory } from '../shared-components/module-factories'
import { CardOrderModule } from './card-order'
import { TOP_LEVEL_PROVIDERS } from './TopLevelProviders'
import { TopUpModule } from './top-up'
import { CardStateModule } from './card-state'
import { CardNumberValidatorModule } from './card-number-validator'
import { CardDetailsModule } from './card-details'
import { CardStatusChangeModule } from './card-status-change'
import { ContisWebhooksIntakeModule } from './contis-webhooks'
import { TransactionModule } from './transactions'
import { WithdrawalModule } from './withdrawal'
import { E2ETestSetupModule } from './e2e-testing'

const additionalModules = [E2ETestSetupModule]
if (process.env.ENV !== 'e2e-local') {
  additionalModules.pop()
}

@Global()
@Module({
  imports: [
    TerminusModule.forRootAsync({
      useClass: TerminusHealthCheckService,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: TypeOrmModuleFactory.create,
    }),
    ContisWebhooksIntakeModule,
    CardOrderModule,
    TopUpModule,
    CardStateModule,
    CardNumberValidatorModule,
    CardDetailsModule,
    CardStatusChangeModule,
    TransactionModule,
    WithdrawalModule,
    ...additionalModules,
  ],
  providers: [...TOP_LEVEL_PROVIDERS],
})
export class AppModule {}
