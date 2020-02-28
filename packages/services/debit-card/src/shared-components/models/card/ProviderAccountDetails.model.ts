export abstract class ProviderAccountDetails {
  abstract getProviderAccountId(): number
  abstract getCardId(): number | undefined
}

export class ContisAccountDetails extends ProviderAccountDetails {
  consumerId: number
  accountId: number
  cardId?: number
  lastFourDigits?: number
  nameOnCard?: string

  constructor(serializedJsonData: any) {
    super()
    this.consumerId = serializedJsonData.consumerId
    this.accountId = serializedJsonData.accountId
    this.cardId = serializedJsonData.cardId
  }

  public getProviderAccountId() {
    return this.accountId
  }

  public getCardId() {
    return this.cardId
  }
}

/** Used when serialising/deserialising the provider details to/from the db.  */
export class ProviderTransformer {
  to(data: any): any {
    return data
  }

  from(rawProviderDetials: Record<string, any>): ProviderAccountDetails {
    if (!!rawProviderDetials.consumerId) {
      return new ContisAccountDetails(rawProviderDetials)
    }

    return {} as any
  }
}
