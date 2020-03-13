export class BitcoinTransactionCreationUtils {
  public static readonly MAX_BITCOIN_DECIMALS = 8

  public static createTransactionAddress(address: string, amount: number) {
    return {
      address,
      value: amount,
    }
  }
}
