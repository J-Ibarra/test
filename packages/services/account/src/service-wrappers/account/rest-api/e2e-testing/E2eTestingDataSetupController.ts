import { Route, Body, Patch, Get, Hidden } from 'tsoa'
import { findUserByEmail, updateAccount, updateUser } from '../../../../core'
import { AccountTypeUpdateRequest, AccountStatusUpdateRequest } from './model'
import { getModel, getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { AccountStatus, SalesforceReferenceTable, KycStatusChange } from '@abx-types/account'
import { AccountPubSubTopics } from '@abx-service-clients/account'
import CryptoApis from 'cryptoapis.io'

const caClient = new CryptoApis(process.env.CRYPTO_APIS_TOKEN!)
caClient.BC.ETH.switchNetwork(caClient.BC.ETH.NETWORKS.ROPSTEN)

@Route('test-automation/accounts')
export class E2eTestingDataSetupController {
  @Patch('/type')
  @Hidden()
  public async updateAccountType(@Body() { email, type }: AccountTypeUpdateRequest): Promise<void> {
    const user = await findUserByEmail(email.toLocaleLowerCase())
    await updateAccount(user!.accountId, { type })
  }

  @Patch('/account-status')
  @Hidden()
  public async updateAccountStatus(@Body() { email, status, enableMfa, hasTriggeredKycCheck, suspended }: AccountStatusUpdateRequest): Promise<void> {
    const user = await findUserByEmail(email.toLocaleLowerCase())
    await getModel<Partial<Account>>('account').update(
      {
        status,
        hasTriggeredKycCheck,
        suspended,
      } as any,
      {
        where: { id: user!.accountId },
        returning: true,
      },
    )

    if (status === AccountStatus.kycVerified) {
      await getModel<SalesforceReferenceTable>('salesforce').create({
        accountId: user!.accountId,
        salesforceAccountId: '1',
        salesforcePlatformCredentialId: '1',
      })
      getEpicurusInstance().publish(AccountPubSubTopics.accountKycStatusChange, { accountId: user!.accountId, event: KycStatusChange.approved })
    }

    if (enableMfa) {
      // The actual secret is dummy because we actually skip the MFA validation in e2e tests
      // It is only used to disable MFA prompts on the UI
      await updateUser({ mfaSecret: 'fooBard', id: user!.id })
    }
  }

  @Get('/details/{publicKey}')
  public async getAddressDetailsByPublicKey(publicKey: string): Promise<any> {
    return caClient.BC.ETH.address.getInfo(publicKey)
  }
}
