import { Deferrable, Sequelize, Transaction, TransactionIsolationLevels } from 'sequelize'
import { Logger } from '@abx/logging'

const logger = Logger.getInstance('transaction_wrapper', 'wrapInTransaction')

export async function wrapInTransaction<R>(
  sequelize: Sequelize,
  transaction: Transaction | null,
  fn: (t: Transaction) => Promise<R>,
  errorCallback?: () => Promise<any> | void,
  isolationLevel: TransactionIsolationLevels[keyof TransactionIsolationLevels] = Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  deferrable: Deferrable[keyof Deferrable] = Deferrable.SET_IMMEDIATE,
  autoCommit: boolean = true,
): ReturnType<typeof fn> {
  const transactionConfig = {
    isolationLevel,
    deferrable,
    autoCommit,
  }
  return transaction
    ? fn(transaction).catch(e => transactionErrorCatcher(e, errorCallback, transaction))
    : sequelize.transaction(transactionConfig, fn).catch(e => transactionErrorCatcher(e, errorCallback))
}

async function transactionErrorCatcher(err: any, errorCallback?: () => Promise<any> | void, transaction?: Transaction) {
  if (transaction && !err.message.includes('rollback has been called on this transaction')) {
    await transaction.rollback().catch(e => {
      logger.warn(`Rollback can't be completed: err msg : ${e.message},`)
    })
  }
  if (err.message.includes('deadlock detected')) {
    logger.debug(`Deadlock Detected - Restarting Operation`)
    if (errorCallback) {
      return errorCallback()
    } else {
      logger.error(`Error with transaction wrapper,no callback - stack: ${err.stack}, message: ${err.message}`)
      throw err
    }
  } else {
    logger.error(`Error with transaction wrapper - stack: ${err.stack}, message: ${err.message}`)
    throw err
  }
}
