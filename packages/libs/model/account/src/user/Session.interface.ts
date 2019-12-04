export interface Session {
  id: string
  userId: string
  expiry: Date
  deactivated?: boolean
}
