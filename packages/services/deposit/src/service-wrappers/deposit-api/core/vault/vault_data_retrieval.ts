import { getModel } from '@abx-utils/db-connection-utils'
import { ValidationError } from '@abx-types/error'
import { VaultAddress } from '@abx-types/deposit'
import { isNullOrUndefined } from 'util'

export async function persistAccountVaultPublicKey(accountId: string, publicKey: string): Promise<VaultAddress> {
  await validateAccount(accountId, publicKey)
  const savedAddress = await getModel<VaultAddress>('vaultAddress').findOrCreate({
    where: {
      accountId,
      publicKey,
    },
  })
  return savedAddress[0].get()
}

export async function getAccountVaultPublicKey(where: Partial<VaultAddress>): Promise<VaultAddress | null> {
  const vaultAddress = await getModel<VaultAddress>('vaultAddress').findOne({ where: where as any })
  return vaultAddress ? vaultAddress.get() : null
}

export async function validateAccount(accountId: string, publicKey: string): Promise<void> {
  const vaultAddressFromPublicKey = await getAccountVaultPublicKey({ publicKey })

  if (vaultAddressFromPublicKey && vaultAddressFromPublicKey.accountId !== accountId) {
    throw new ValidationError('This is not the correct public key for your wallet.', {
      context: { accountId },
    })
  }

  const vaultAddressFromAccountId = await getAccountVaultPublicKey({ accountId })

  if (isNullOrUndefined(vaultAddressFromAccountId)) {
    return
  }

  if (vaultAddressFromAccountId.publicKey !== publicKey) {
    throw new ValidationError('Your accounts linked wallet does not match the wallet you are trying to import. Accounts can only have 1 wallet.', {
      context: { accountId },
    })
  }
}
