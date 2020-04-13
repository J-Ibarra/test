kill $(ps aux | grep -i ngrok | awk '{print $2}')
npm run start-ngrok:e2e-local
sleep 2
PROXY_URL=`curl --silent --show-error http://localhost:4040/api/tunnels | sed -nE 's/.*public_url":"https:..([^"]*).*/\1/p'`

# All the variables required for running deposits/withdrawals locally are listed here
# These variables will allow connecting to and consuming transaction notification messages from SQS
# int in the URL path is to be replaced by the environment
export CRYPTO_APIS_TOKEN='801c9ee2538cb40da9dbc03790894ea3431fb8ac'
export KINESIS_BITCOIN_HOLDINGS_WIF='cUh5AjG5LMpQjkdjs3y22h7duzBxTukJpHvkMLydBhFDiKnj7zhn'
export KINESIS_BITCOIN_HOLDINGS_ADDRESS='n38x83CNLcKqNWAgKSzfdvfaEMAT4CiLr8'
export KINESIS_BITCOIN_HOLDINGS_PRIVATE_KEY='d423a7abfa4752c3e99ba1e755356511f82887f73b40e0bedafef140993100e4'
export BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS=1
export DEPOSIT_ADDRESS_TRANSACTION_CALLBACK_URL="https://$PROXY_URL/api/webhooks/crypto/deposits/address/transactions/unconfirmed"
export DEPOSIT_CONFIRMED_TRANSACTION_CALLBACK_URL="https://$PROXY_URL/api/webhooks/crypto/deposits/address/transactions/confirmed"
export DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_CALLBACK_URL="https://$PROXY_URL/api/webhooks/crypto/deposits/holdings-transactions/confirmations"

# export DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-deposits-new-address-transactions'
# export DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-deposit-holdings-transaction-confirmations'
# export DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-deposits-address-transaction-confirmations'

# export WITHDRAWAL_STATUS_CHANGE_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-withdrawal-change.fifo'
# export WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-withdrawal-new-request.fifo'
# export WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-withdrawal-transaction-sent.fifo'
# export WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-withdrawal-transaction-completion-pending'
export WITHDRAWAL_TRANSACTION_CONFIRMATION_CALLBACK_URL="https://$PROXY_URL/api/webhooks/crypto/withdrawals/confirmations"
echo "Withdrawal confirmation webhook URL $WITHDRAWAL_TRANSACTION_CONFIRMATION_CALLBACK_URL"

curl -X POST \
  'https://api.cryptoapis.io/v1/bc/btc/testnet/hooks' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: '$CRYPTO_APIS_TOKEN'' \
  -d '{
    "event" : "ADDRESS",
    "url" : "'"$WITHDRAWAL_TRANSACTION_CONFIRMATION_CALLBACK_URL"'",
    "address": "'"$KINESIS_BITCOIN_HOLDINGS_ADDRESS"'", 
    "confirmations" : '$BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS'
}'
echo "Created BTC Holdings wallet $KINESIS_BITCOIN_HOLDINGS_ADDRESS address transaction webhook to $WITHDRAWAL_TRANSACTION_CONFIRMATION_CALLBACK_URL"
