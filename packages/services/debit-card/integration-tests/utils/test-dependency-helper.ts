import { TestingModuleBuilder, TestingModule } from '@nestjs/testing'
import { User } from '@abx/ke-auth-lib'

import {
  PLACE_ORDER_FACADE_TOKEN,
  CARD_PROVIDER_FACADE_FACTORY,
  ContisClientStub,
  TestUserDetailsProvider,
  CONFIG_SOURCE_TOKEN,
  USER_DETAILS_FACADE_TOKEN,
  UserDetailsFacadeStub,
  ContisEndpointPath,
  defaultTestUser,
  PlaceOrderFacadeStub,
  BALANCE_RESERVE_FACADE_TOKEN,
  BalanceReserveFacadeStub,
  QueueGatewayStub,
  QUEUE_GATEWAY,
} from '../../src/shared-components/providers'
/* tslint:disable-next-line:max-line-length */
import { CardProviderFacadeFactoryStub } from '../../src/shared-components/providers/debit-card-provider/CardProviderFacadeFactoryStub'
import { LocalTestConfigSource } from '../../src/shared-components/providers/config/source'
import { IntegrationTestsConfig } from '../../src/shared-components/models'
import {
  defaultContisStubbedEndpoints,
  defaultCompleteAccountDetails,
  notKycVerifiedCompleteAccountDetails,
} from './test-data'

export async function wireInTestDependencies(
  testingModuleBuilder: TestingModuleBuilder,
  integrationTestsConfig: IntegrationTestsConfig = {},
  contisStubbedEndpoints: Map<ContisEndpointPath, any> = defaultContisStubbedEndpoints,
  testUser: User = defaultTestUser,
): Promise<{ moduleFixture: TestingModule; contisClientStub: ContisClientStub; queueGatewayStub: QueueGatewayStub }> {
  const contisClientStub = new ContisClientStub(contisStubbedEndpoints, integrationTestsConfig.rejectRequest)
  const queueGatewayStub = new QueueGatewayStub()

  const moduleFixture = await testingModuleBuilder
    .overrideProvider(CARD_PROVIDER_FACADE_FACTORY)
    .useValue(new CardProviderFacadeFactoryStub(contisClientStub))
    .overrideProvider(TestUserDetailsProvider)
    .useValue(new TestUserDetailsProvider(testUser))
    .overrideProvider(CONFIG_SOURCE_TOKEN)
    .useValue(new LocalTestConfigSource())
    .overrideProvider(QUEUE_GATEWAY)
    .useValue(queueGatewayStub)
    .overrideProvider(USER_DETAILS_FACADE_TOKEN)
    .useValue(
      new UserDetailsFacadeStub(
        integrationTestsConfig.setNotVerifiedUser
          ? notKycVerifiedCompleteAccountDetails
          : defaultCompleteAccountDetails,
      ),
    )
    .overrideProvider(PLACE_ORDER_FACADE_TOKEN)
    .useValue(integrationTestsConfig.placeOrderStub || new PlaceOrderFacadeStub())
    .overrideProvider(BALANCE_RESERVE_FACADE_TOKEN)
    .useValue(integrationTestsConfig.balanceReserveFacadeStub || new BalanceReserveFacadeStub())
    .compile()

  return {
    moduleFixture,
    contisClientStub,
    queueGatewayStub,
  }
}
