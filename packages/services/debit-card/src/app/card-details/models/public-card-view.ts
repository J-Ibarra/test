import { CurrencyCode, DebitCardStatus, DebitCard } from '../../../shared-components/models'

export interface CardView {
  currency: CurrencyCode
  status: DebitCardStatus
  balance: number
}

export class PublicCardView {
  public card?: CardView
  public cardOrdered: boolean

  constructor(card: DebitCard) {
    this.card = {
      currency: card.currency,
      status: card.status,
      balance: card.balance,
    }

    this.cardOrdered = true
  }
}
