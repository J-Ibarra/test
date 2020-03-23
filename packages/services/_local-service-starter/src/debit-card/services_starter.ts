import { bootstrapDebitCard } from 'services/debit-card/src';

export async function startAllServices() {
  await bootstrapDebitCard()
}
