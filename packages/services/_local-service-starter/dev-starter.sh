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
export REDIS_PORT=7380
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

npm run start
