# All the variables required for running deposits/withdrawals locally are listed here
# These variables will allow connecting to and consuming transaction notification messages from SQS
# ${ENV} in the URL path is to be replaced by the environment
export CRYPTO_APIS_TOKEN='xxxxx'
export KINESIS_BITCOIN_HOLDINGS_WIF='cUh5AjG5LMpQjkdjs3y22h7duzBxTukJpHvkMLydBhFDiKnj7zhn'
export KINESIS_BITCOIN_HOLDINGS_ADDRESS='n38x83CNLcKqNWAgKSzfdvfaEMAT4CiLr8'
export KINESIS_BITCOIN_HOLDINGS_PRIVATE_KEY='d423a7abfa4752c3e99ba1e755356511f82887f73b40e0bedafef140993100e4'
export BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS=1
export DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_CALLBACK_URL='https://${ENV}-api.kinesis.money/api/webhooks/crypto/deposits/address/transactions/unconfirmed'
export DEPOSIT_CONFIRMED_TRANSACTION_CALLBACK_URL='https://${ENV}-api.kinesis.money/api/webhooks/crypto/deposits/address/transactions/confirmed'
export DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_CALLBACK_URL='https://${ENV}-api.kinesis.money/api/webhooks/crypto/deposits/holdings-transactions/confirmations'

export DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/${ENV}-kbe-deposits-new-address-transactions	'
export DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/${ENV}-kbe-deposit-holdings-transaction-confirmations'
export DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/${ENV}-kbe-deposits-address-transaction-confirmations'

export WITHDRAWAL_STATUS_CHANGE_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/${ENV}-kbe-withdrawal-change.fifo'
export WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/${ENV}-kbe-withdrawal-new-request.fifo'
export WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/${ENV}-kbe-withdrawal-transaction-sent.fifo'
export WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/${ENV}-kbe-withdrawal-transaction-completion-pending.fifo'
export WITHDRAWAL_TRANSACTION_CONFIRMATION_CALLBACK_URL='https://${ENV}-api.kinesis.money/api/webhooks/crypto/withdrawals/confirmations'
