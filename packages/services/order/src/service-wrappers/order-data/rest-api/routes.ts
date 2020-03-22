/* tslint:disable */
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { OrderRetrievalController } from './order_retrieval_controller';
import { FeesController } from './fees_controller';
import { OrderMatchesController } from './order_match_controller';
import { AdminOrdersController } from './orders_admin_controller';
import { TransactionHistoryController } from './transaction_history_controller';
import { DepthController } from './depth_controller';
import { E2eTestingDataSetupController } from './e2e-testing/E2eTestingDataSetupController';
import { expressAuthentication } from './middleware/authentication';
import * as express from 'express';

const models: TsoaRoute.Models = {
  "TradeTransaction": {
    "properties": {
      "id": { "dataType": "double" },
      "counterTradeTransactionId": { "dataType": "double", "required": true },
      "counterTrade": { "ref": "TradeTransaction" },
      "direction": { "ref": "OrderDirection", "required": true },
      "symbolId": { "dataType": "string", "required": true },
      "accountId": { "dataType": "string", "required": true },
      "orderId": { "dataType": "double", "required": true },
      "amount": { "dataType": "double", "required": true },
      "matchPrice": { "dataType": "double", "required": true },
      "fee": { "dataType": "double", "required": true },
      "feeCurrencyId": { "dataType": "double", "required": true },
      "feeRate": { "dataType": "double", "required": true },
      "taxRate": { "dataType": "double", "required": true },
      "taxAmountCHF": { "dataType": "double", "required": true },
      "taxAmountFeeCurrency": { "dataType": "double", "required": true },
      "baseFiatConversion": { "dataType": "double", "required": true },
      "quoteFiatConversion": { "dataType": "double", "required": true },
      "fiatCurrencyCode": { "ref": "FiatCurrency", "required": true },
      "createdAt": { "dataType": "datetime" },
      "updatedAt": { "dataType": "datetime" },
    },
  },
  "OrderDirection": {
    "enums": ["buy", "sell"],
  },
  "FiatCurrency": {
    "enums": ["CurrencyCode", "CurrencyCode", "CurrencyCode"],
  },
  "OrderWithTradeTransactions": {
    "properties": {
      "transactions": { "dataType": "array", "array": { "ref": "TradeTransaction" }, "required": true },
    },
  },
  "FeeTier": {
    "properties": {
      "id": { "dataType": "double" },
      "tier": { "dataType": "double", "required": true },
      "symbolId": { "dataType": "string", "required": true },
      "threshold": { "dataType": "double", "required": true },
      "rate": { "dataType": "double", "required": true },
    },
  },
  "AccountFeeTier": {
    "properties": {
      "id": { "dataType": "double" },
      "tier": { "dataType": "double", "required": true },
      "symbolId": { "dataType": "string", "required": true },
      "threshold": { "dataType": "double", "required": true },
      "rate": { "dataType": "double", "required": true },
      "accountId": { "dataType": "string", "required": true },
    },
  },
  "OrderStatus": {
    "enums": ["submit", "partialFill", "cancel", "pendingCancel", "fill"],
  },
  "OrderAdminSummary": {
    "properties": {
      "createdAt": { "dataType": "datetime", "required": true },
      "orderId": { "dataType": "double", "required": true },
      "client": { "dataType": "string", "required": true },
      "hin": { "dataType": "string", "required": true },
      "direction": { "ref": "OrderDirection", "required": true },
      "symbolId": { "dataType": "string", "required": true },
      "amount": { "dataType": "double", "required": true },
      "price": { "dataType": "double", "required": true },
      "fee": { "dataType": "double" },
      "feeCurrency": { "dataType": "string", "required": true },
      "filled": { "dataType": "double", "required": true },
      "status": { "ref": "OrderStatus", "required": true },
    },
  },
};
const validationService = new ValidationService(models);

export function RegisterRoutes(app: express.Express) {
  app.get('/api/orders',
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

      const controller = new OrderRetrievalController();


      const promise = controller.getOrdersForCurrentAccount.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/orders/:orderId',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        orderId: { "in": "path", "name": "orderId", "required": true, "dataType": "double" },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new OrderRetrievalController();


      const promise = controller.getOrder.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/orders/currencies/:currency',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        currency: { "in": "path", "name": "currency", "required": true, "dataType": "enum", "enums": ["ETH", "KAU", "KAG", "KVT", "BTC", "USD", "EUR", "GBP"] },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new OrderRetrievalController();


      const promise = controller.getOrdersForCurrency.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/fees/trade',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new FeesController();


      const promise = controller.getAllDefaultTiers.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/fees/account',
    authenticateMiddleware([{ "cookieAuth": [] }]),
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

      const controller = new FeesController();


      const promise = controller.getAllAccountTiers.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/fees/:symbolId',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        symbolId: { "in": "path", "name": "symbolId", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new FeesController();


      const promise = controller.getFees.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/admin/fees/default',
    authenticateMiddleware([{ "cookieAuth": [], "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "dataType": "array", "array": { "ref": "FeeTier" } },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new FeesController();


      const promise = controller.addDefaultTiers.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/admin/fees/default',
    authenticateMiddleware([{ "cookieAuth": [], "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        symbolId: { "in": "query", "name": "symbolId", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new FeesController();


      const promise = controller.getDefaultTiers.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/admin/fees/account',
    authenticateMiddleware([{ "cookieAuth": [], "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "dataType": "array", "array": { "ref": "AccountFeeTier" } },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new FeesController();


      const promise = controller.addAccountTiers.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/admin/fees/account',
    authenticateMiddleware([{ "cookieAuth": [], "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        accountId: { "in": "query", "name": "accountId", "required": true, "dataType": "string" },
        symbolId: { "in": "query", "name": "symbolId", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new FeesController();


      const promise = controller.getAccountSymbolTiers.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/order-matches',
    function(request: any, response: any, next: any) {
      const args = {
        symbolPairId: { "in": "query", "name": "symbolPairId", "required": true, "dataType": "string" },
        limit: { "in": "query", "name": "limit", "dataType": "double" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new OrderMatchesController();


      const promise = controller.getOrderMatches.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/admin/orders',
    authenticateMiddleware([{ "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AdminOrdersController();


      const promise = controller.getAllOrders.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/admin/orders/accounts/:accountHin',
    authenticateMiddleware([{ "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        accountHin: { "in": "path", "name": "accountHin", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AdminOrdersController();


      const promise = controller.getOrdersForAccount.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/transaction-history/:selectedCurrency',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        selectedCurrency: { "in": "path", "name": "selectedCurrency", "required": true, "dataType": "enum", "enums": ["ETH", "KAU", "KAG", "KVT", "BTC", "USD", "EUR", "GBP"] },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new TransactionHistoryController();


      const promise = controller.getTransactionHistoryForCurrency.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/depth/:symbolId/:direction/top',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        symbolId: { "in": "path", "name": "symbolId", "required": true, "dataType": "string" },
        direction: { "in": "path", "name": "direction", "required": true, "dataType": "enum", "enums": ["buy", "sell"] },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new DepthController();


      const promise = controller.getTopOfDepthForCurrencyPairAndDirection.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/depth/:symbolId',
    function(request: any, response: any, next: any) {
      const args = {
        symbolId: { "in": "path", "name": "symbolId", "required": true, "dataType": "string" },
        limit: { "default": 100, "in": "query", "name": "limit", "dataType": "double" },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        direction: { "in": "query", "name": "direction", "dataType": "enum", "enums": ["buy", "sell"] },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new DepthController();


      const promise = controller.getDepthForCurrencyPair.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/test-automation/orders/data-reset',
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


      const promise = controller.resetOrderData.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/test-automation/orders/account-setup-scripts',
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


      const promise = controller.runAccountSetupScript.apply(controller, validatedArgs as any);
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
