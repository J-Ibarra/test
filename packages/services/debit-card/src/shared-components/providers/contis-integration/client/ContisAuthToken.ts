import moment from 'moment'

export class ContisAuthToken {
  expires: Date
  token: string

  constructor(expires: Date, token: string) {
    this.expires = expires
    this.token = token
  }

  hasExpired(): boolean {
    return moment(this.expires).isBefore(new Date())
  }
}
