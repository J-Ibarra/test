export ABX_LOG_LEVEL=debug 
export NEW_RELIC_NO_CONFIG_FILE=true 
export TZ=UTC 
export NODE_ENV=e2e-local
export ETHEREUM_HOLDINGS_SECRET='0D2A830B749706BED447A58C67E747623CAE76C6EFA7479837200BC0027B2E7E'
export KAU_HOLDINGS_SECRET='SCBRXPGQHNW2YAH3X6YJ7SYRK5DCIEQAKYJCEOUZ3DWVRG6VK65MS72Y'
export KAG_HOLDINGS_SECRET='SDZ67NF65PALNRO7ZMB6VQSK2UBCUKTAYUJYTZVVHF6S57OEHNNGZKFW'
export KVT_CONTRACT_ADDRESS='0x05cB21867dda44391F7a1fd32940E7D7B1280273'
export KAU_HOLDINGS_SIGNER_SECRET='SC2EHXD2GW4CUO23XWLPMXUTVKF4UNSEBB7RDJMXQYILZ7NU4BW6K3B3'
export KAG_HOLDINGS_SIGNER_SECRET='SDRQZN43IU7I77FNRSLF7SBWHDKB2752PZZF7DJFHDORYXHPHJJJUQIG'
export KINESIS_BANK_NAME='Test Bank'
export KINESIS_BANK_CODE='123567'
export KINESIS_BANK_ACCOUNT_NUMBER='1234512'
export KINESIS_BANK_ACCOUNT_NAME='Kinesis Account'
export SALESFORCE_CLIENT_ID='3MVG9uAc45HBYUrhWDpRX6wFvgMHqefY1.8GZiJXVYg8weDKGRHjIHJ3cZf0V5ckxgcDQ8om1iO8qnWUw8QkB'
export SALESFORCE_CLIENT_SECRET='C8F16E23671341C54CC95EEC34B54078BC61C256865FADFE7F9A60DE5E30F8A3'
export SALESFORCE_API_ADMIN_USERNAME='boris.shekerov@abx.com.testing'
export SALESFORCE_API_ADMIN_PASSWORD='Abcd12341234e5Zw811eM8IB3HKBzV21AwCi'
export KMS_DOMAIN='http://localhost:1234'
export KBE_INFURA_PROJECT_ID='5ada5f39db534bda836abc3caf333002'
export KVT_INFURA_PROJECT_ID='c2ea3bc13d094d3a824322a7628f4882'
export KVT_FEE_HOLDINGS_SECRET='B7AFD4671093505A4C1197099270F77532DF63959676824E88B91C86688C8CFA'
export ETHERSCAN_API_DOMAIN_ROOT='ropsten'

export ENV=integration
export API_PORT=3031
export EXCHANGE_DB_HOST=localhost
export EXCHANGE_DB_PORT=6432
export EXCHANGE_DB_USERNAME=postgres
export EXCHANGE_DB_NAME=kinesis_exchange
export EXCHANGE_DB_PASSWORD=postgres
export DEBIT_CARD_DB_HOST=localhost
export DEBIT_CARD_DB_PORT=5433
export DEBIT_CARD_DB_USERNAME=postgres
export DEBIT_CARD_DB_NAME=db
export DEBIT_CARD_DB_PASSWORD=postgres
export REDIS_HOST=localhost
export REDIS_PORT=7379
export UI_DOMAIN='localhost:1234'
export LOG_LEVEL=debug
export COOKIE_KEY='7yH*clwZeD0Pq&WPSYE*Q!1x9HafSs@X'
export COOKIE_IV='67Jo*Jip5C8m6P%n'
export JWT_SECRET=foo
export CONTIS_USERNAME=KINEUR_beta
export CONTIS_PASSWORD=myaqcd34
export CONTIS_API_ROOT=https://sandboxapi.contis.com
export CONTIS_CARD_ORDER_FEE=5
export CONTIS_CARD_ORDER_VALIDATION_SLA=5

# All the variables required for running deposits/withdrawals locally are listed here
# These variables will allow connecting to and consuming transaction notification messages from SQS
# int in the URL path is to be replaced by the environment
export CRYPTO_APIS_TOKEN='801c9ee2538cb40da9dbc03790894ea3431fb8ac'
export KINESIS_BITCOIN_HOLDINGS_WIF='cUh5AjG5LMpQjkdjs3y22h7duzBxTukJpHvkMLydBhFDiKnj7zhn'
export KINESIS_BITCOIN_HOLDINGS_ADDRESS='n38x83CNLcKqNWAgKSzfdvfaEMAT4CiLr8'
export KINESIS_BITCOIN_HOLDINGS_PRIVATE_KEY='d423a7abfa4752c3e99ba1e755356511f82887f73b40e0bedafef140993100e4'
export BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS=1
export DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_CALLBACK_URL="https://$PROXY_URL/api/webhooks/crypto/deposits/address/transactions/unconfirmed"
export DEPOSIT_CONFIRMED_TRANSACTION_CALLBACK_URL="https://$PROXY_URL/api/webhooks/crypto/deposits/address/transactions/confirmed"
export DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_CALLBACK_URL="https://$PROXY_URL/api/webhooks/crypto/deposits/holdings-transactions/confirmations"

# export DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-deposits-new-address-transactions	'
# export DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-deposit-holdings-transaction-confirmations'
# export DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-deposits-address-transaction-confirmations'

# export WITHDRAWAL_STATUS_CHANGE_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-withdrawal-change.fifo'
# export WITHDRAWAL_NEW_TRANSACTION_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-withdrawal-new-request.fifo'
# export WITHDRAWAL_TRANSACTION_SENT_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-withdrawal-transaction-sent.fifo'
# export WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL='https://sqs.ap-southeast-2.amazonaws.com/884998542479/int-kbe-withdrawal-transaction-completion-pending'
export WITHDRAWAL_TRANSACTION_CONFIRMATION_CALLBACK_URL="https://$PROXY_URL/api/webhooks/crypto/withdrawals/confirmations"

kill $(ps aux | grep -i ngrok | awk '{print $2}')
npm run start-ngrok:e2e-local
sleep 2
PROXY_URL=`curl --silent --show-error http://localhost:4040/api/tunnels | sed -nE 's/.*public_url":"https:..([^"]*).*/\1/p'`

npm run start
