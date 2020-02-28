export class BalanceReserveFacadeStub {
  constructor(
    private reserveTopUpBalanceStub = Promise.resolve(),
    private confirmTopUpBalanceStub = Promise.resolve(),
    private recordCardToExchangeWithdrawalStub = Promise.resolve(),
  ) {}

  public reserveTopUpBalance(): Promise<any> {
    return this.reserveTopUpBalanceStub
  }

  public confirmTopUpBalance(): Promise<any> {
    return this.confirmTopUpBalanceStub
  }

  public recordCardToExchangeWithdrawal(): Promise<any> {
    return this.recordCardToExchangeWithdrawalStub
  }
}
