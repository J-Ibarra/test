/** Used to define if the withdrawal request represent the actual withdrawal amount or the fee for a withdrawal. */
export enum WithdrawalRequestType {
    withdrawal = 'withdrawal',
    /** Used for withdrawal requests that represent fees. */
    fee = 'fee',
}