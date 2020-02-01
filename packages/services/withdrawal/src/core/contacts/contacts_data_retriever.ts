import { WhereOptions } from 'sequelize'
import { getModel } from '@abx/db-connection-utils'
import { Contact } from '@abx-types/withdrawal'

export async function findContactsForAccountByCurrency({ accountId, currencyCode }) {
  const contacts = await findContacts({ accountId, currencyCode })
  return contacts.map(contact => formatContact(contact))
}

export async function findContacts(where: WhereOptions): Promise<Contact[]> {
  const contactsInstance = await getModel<Contact>('contacts').findAll({ where })
  return contactsInstance.map(contact => contact.get())
}

export async function createContactForAccount({ accountId, currency, name, publicKey }) {
  const savedContact = await getModel<Contact>('contacts').create({ accountId, currencyCode: currency, name, publicKey })
  return formatContact(savedContact.get())
}

export function formatContact(contact: Contact) {
  return {
    id: contact.id,
    currency: contact.currencyCode,
    name: contact.name,
    publicKey: contact.publicKey,
  }
}
