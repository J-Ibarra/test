import * as express from 'express';
import { getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_QUEUE_URL, DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL, DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL } from '@abx/exchange-deposit-service/src/service-wrappers/third-party-coin-deposit-processor/core/constants'
import { WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL } from '@abx-service-clients/withdrawal';

export function RegisterRoutes(app: express.Express) {
    const epicurus = getEpicurusInstance()

    app.post('/api/webhooks/crypto/deposits/address/transactions/unconfirmed',
        function(request: any, response: any) {
            console.log(`Received deposit address transaction unconfirmed webhook`)
            epicurus.publish(DEPOSIT_ADDRESS_UNCONFIRMED_TRANSACTION_QUEUE_URL, { payload: request.body })
            response.status(200).end();
        });

    app.post('/api/webhooks/crypto/deposits/address/transactions/confirmed',
        function(request: any, response: any) {
            console.log(`Received deposit address transaction confirmed webhook`)
            epicurus.publish(DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL, { payload: request.body })
            response.status(200).end();
        });

    app.post('/api/webhooks/crypto/deposits/holdings-transactions/confirmations',
        function(request: any, response: any) {
            console.log(`Received deposit holdings transaction confirmed webhook`)
            epicurus.publish(DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL, { payload: request.body })
            response.status(200).end();
        });

    app.post('/api/webhooks/crypto/withdrawals/confirmations',
        function(request: any, response: any) {
            console.log(`Received withdrawal transaction confirmed webhook`)
            epicurus.publish(WITHDRAWAL_TRANSACTION_COMPLETION_PENDING_QUEUE_URL, { payload: request.body })
            response.status(200).end();
        });
}
