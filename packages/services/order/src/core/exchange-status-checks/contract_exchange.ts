import { getCacheClient } from '@abx/db-connection-utils'

const contractExchangeStatusKey: string = 'contractExchangeStatus'

export const enum ContractExchangeStatus {
  stopped = 'stopped',
  running = 'running',
}

export async function getContractExchangeStatus(): Promise<ContractExchangeStatus> {
  let status: ContractExchangeStatus = await getCacheClient().get<ContractExchangeStatus>(contractExchangeStatusKey)
  // If a status hasn't been explicitly set, we are running!
  if (!status) {
    status = ContractExchangeStatus.running
  }
  return status
}

export async function stopContractExchange(): Promise<void> {
  await getCacheClient().set(contractExchangeStatusKey, ContractExchangeStatus.stopped)
}

export async function resumeContractExchange(): Promise<void> {
  await getCacheClient().set(contractExchangeStatusKey, ContractExchangeStatus.running)
}
