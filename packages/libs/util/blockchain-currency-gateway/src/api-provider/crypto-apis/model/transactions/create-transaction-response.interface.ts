import { PayloadWrapper } from '../../model'

export interface CreateTransactionResponse extends PayloadWrapper<CreateTransactionResponsePayload> {}

export interface CreateTransactionResponsePayload {
  hex: string
  view_in_explorer?: string
}
