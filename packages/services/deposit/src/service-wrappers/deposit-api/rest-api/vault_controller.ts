import { Body, Controller, Get, Post, Request, Route, Security, Tags } from 'tsoa'
import { isNullOrUndefined } from 'util'
import { Logger } from '@abx-utils/logging'
import { OverloadedRequest } from '@abx-types/account'
import { persistAccountVaultPublicKey, getAccountVaultPublicKey } from '../core/vault/vault_data_retrieval'

export interface VaultPersistRequest {
  publicKey: string
}

@Tags('deposit')
@Route('/vault')
export class VaultController extends Controller {
  private logger = Logger.getInstance('api', 'VaultController')

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post()
  public async persistAccountsVaultPublicKey(@Request() request: OverloadedRequest, @Body() vaultPersistRequest: VaultPersistRequest) {
    this.logger.info(`Validating and persisting publicKey: ${vaultPersistRequest.publicKey} to accountId: ${request.account!.id}`)
    try {
      this.setStatus(201)
      return await persistAccountVaultPublicKey(request.account!.id, vaultPersistRequest.publicKey)
    } catch (error) {
      this.setStatus(error.status || 400)

      return { message: error.message as string }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get()
  public async getAccountVaultPublicKey(@Request() request: OverloadedRequest) {
    const address = await getAccountVaultPublicKey({ accountId: request.account!.id })
    if (isNullOrUndefined(address)) {
      this.setStatus(400)
      return { message: 'Vault Address does not exist for this account' }
    }

    this.setStatus(200)
    return address
  }
}
