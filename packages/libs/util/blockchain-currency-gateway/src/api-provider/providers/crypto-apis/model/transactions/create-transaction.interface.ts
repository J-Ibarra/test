import { PayloadWrapper } from '..'

export interface CreateTransactionResponse extends PayloadWrapper<CreateTransactionResponsePayload> {}

export interface CreateTransactionResponsePayload {
  hex: string
}
