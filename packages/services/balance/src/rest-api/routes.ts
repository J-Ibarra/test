/* tslint:disable */
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { BalancesController } from './balances_controller';
import { E2eTestingDataSetupController } from './e2e-testing/E2eTestingDataSetupController';
import { expressAuthentication } from './middleware/authentication';
import * as express from 'express';

const models: TsoaRoute.Models = {
    "CurrencyCode": {
        "enums": ["ETH", "KAU", "KAG", "KVT", "BTC", "USD", "EUR", "GBP"],
    },
    "BalanceAmount": {
        "properties": {
            "amount": { "dataType": "double", "required": true },
            "preferredCurrencyAmount": { "dataType": "double", "required": true },
        },
    },
    "EDisplayFormats": {
        "enums": ["0", "1"],
    },
    "PreferredCurrencyEnrichedBalance": {
        "properties": {
            "currency": { "ref": "CurrencyCode", "required": true },
            "total": { "ref": "BalanceAmount", "required": true },
            "available": { "ref": "BalanceAmount", "required": true },
            "reserved": { "ref": "BalanceAmount", "required": true },
            "pendingDeposit": { "ref": "BalanceAmount", "required": true },
            "pendingWithdrawal": { "ref": "BalanceAmount", "required": true },
            "pendingRedemption": { "ref": "BalanceAmount", "required": true },
            "pendingDebitCardTopUp": { "ref": "BalanceAmount", "required": true },
            "displayFormat": { "ref": "EDisplayFormats" },
        },
    },
    "CompleteBalanceDetails": {
        "properties": {
            "accountId": { "dataType": "string", "required": true },
            "preferredCurrencyTotal": { "dataType": "double", "required": true },
            "balances": { "dataType": "array", "array": { "ref": "PreferredCurrencyEnrichedBalance" }, "required": true },
        },
    },
};
const validationService = new ValidationService(models);

export function RegisterRoutes(app: express.Express) {
    app.get('/api/balances',
        authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
        function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new BalancesController();


            const promise = controller.getAllBalancesForAccount.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/test-automation/balances',
        function(request: any, response: any, next: any) {
            const args = {
                undefined: { "in": "body", "required": true, "dataType": "any" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new E2eTestingDataSetupController();


            const promise = controller.updateBalancesForAccount.apply(controller, validatedArgs as any);
            promiseHandler(controller, promise, response, next);
        });

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return (request: any, _response: any, next: any) => {
            let responded = 0;
            let success = false;

            const succeed = function(user: any) {
                if (!success) {
                    success = true;
                    responded++;
                    request['user'] = user;
                    next();
                }
            }

            const fail = function(error: any) {
                responded++;
                if (responded == security.length && !success) {
                    error.status = 401;
                    next(error)
                }
            }

            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    let promises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        promises.push(expressAuthentication(request, name, secMethod[name]));
                    }

                    Promise.all(promises)
                        .then((users) => { succeed(users[0]); })
                        .catch(fail);
                } else {
                    for (const name in secMethod) {
                        expressAuthentication(request, name, secMethod[name])
                            .then(succeed)
                            .catch(fail);
                    }
                }
            }
        }
    }

    function isController(object: any): object is Controller {
        return 'getHeaders' in object && 'getStatus' in object && 'setStatus' in object;
    }

    function promiseHandler(controllerObj: any, promise: any, response: any, next: any) {
        return Promise.resolve(promise)
            .then((data: any) => {
                let statusCode;
                if (isController(controllerObj)) {
                    const headers = controllerObj.getHeaders();
                    Object.keys(headers).forEach((name: string) => {
                        response.set(name, headers[name]);
                    });

                    statusCode = controllerObj.getStatus();
                }

                if (data || data === false) { // === false allows boolean result
                    response.status(statusCode || 200).json(data);
                } else {
                    response.status(statusCode || 204).end();
                }
            })
            .catch((error: any) => next(error));
    }

    function getValidatedArgs(args: any, request: any): any[] {
        const fieldErrors: FieldErrors = {};
        const values = Object.keys(args).map((key) => {
            const name = args[key].name;
            switch (args[key].in) {
                case 'request':
                    return request;
                case 'query':
                    return validationService.ValidateParam(args[key], request.query[name], name, fieldErrors);
                case 'path':
                    return validationService.ValidateParam(args[key], request.params[name], name, fieldErrors);
                case 'header':
                    return validationService.ValidateParam(args[key], request.header(name), name, fieldErrors);
                case 'body':
                    return validationService.ValidateParam(args[key], request.body, name, fieldErrors, name + '.');
                case 'body-prop':
                    return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, 'body.');
            }
        });
        if (Object.keys(fieldErrors).length > 0) {
            throw new ValidateError(fieldErrors, '');
        }
        return values;
    }
}
