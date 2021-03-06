import { Wallet } from 'ethers'
import { JsonRpcProvider } from 'ethers/providers'
import { ETH_CONFIG } from '.'
import { Environment } from '@abx-types/reference-data'

export function getAccount(accountIndex: number) {
  return Wallet.fromMnemonic(ETH_CONFIG[Environment.test].mnemonic, getAccountPath(accountIndex)).connect(
    new JsonRpcProvider({ url: ETH_CONFIG[Environment.test].url, allowInsecure: true }),
  )
}

function getAccountPath(accountIndex: number) {
  return `m/44'/60'/0'/0/${accountIndex}`
}
