import { GreylistCheckChangeNotification } from './GreylistCheckChangeNotification'
import { HoscCheckChangeNotification } from './HoscCheckChangeNotification'
import { KycCheckChangeNotification } from './KycCheckChangeNotification'
import { TransactionRequest } from './TransactionRequest'
import { UserStatusChangeRequest } from './UserStatusChangeRequest'

export enum ContisNotificationName {
  hosc = 'hosc_status_change',
  greylist = 'greylist_status_change',
  kyc = 'kyc_status_change',
  transaction = 'transaction',
  userStatusChange = 'user_status_change',
}

export interface AwsSqsNotification {
  name: ContisNotificationName
  payload:
    | GreylistCheckChangeNotification
    | HoscCheckChangeNotification
    | KycCheckChangeNotification
    | UserStatusChangeRequest
    | TransactionRequest
}
