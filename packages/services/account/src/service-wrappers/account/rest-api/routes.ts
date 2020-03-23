/* tslint:disable */
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { AccountsController } from './account_controller';
import { AccountStateController } from './account_state_controller';
import { MFAController } from './mfa_controller';
import { ResetPasswordController } from './password_reset_controller';
import { SessionsController } from './session_controller';
import { TokensController } from './token_controller';
import { UserStateController } from './user_controller';
import { E2eTestingDataSetupController } from './e2e-testing/E2eTestingDataSetupController';
import { expressAuthentication } from './middleware/authentication';
import * as express from 'express';

const models: TsoaRoute.Models = {
  "PersonalBankDetails": {
    "properties": {
      "id": { "dataType": "double" },
      "accountHolderName": { "dataType": "string", "required": true },
      "bankName": { "dataType": "string", "required": true },
      "iban": { "dataType": "string" },
      "bankSwiftCode": { "dataType": "string" },
      "routingCode": { "dataType": "string" },
      "abaNumber": { "dataType": "string" },
      "accountNumber": { "dataType": "string" },
      "notes": { "dataType": "string" },
      "bankAddress": { "dataType": "string" },
      "accountId": { "dataType": "string" },
    },
  },
  "ChangePasswordRequest": {
    "properties": {
      "currentPassword": { "dataType": "string", "required": true },
      "newPassword": { "dataType": "string", "required": true },
    },
  },
  "AccountType": {
    "enums": ["individual", "corporate", "operator", "administrator", "kinesisRevenue"],
  },
  "AccountStatus": {
    "enums": ["registered", "emailVerified", "kycVerified", "superUser"],
  },
  "Gender": {
    "enums": ["Male", "Female"],
  },
  "Address": {
    "properties": {
      "addressLine1": { "dataType": "string", "required": true },
      "addressLine2": { "dataType": "string", "required": true },
      "addressLine3": { "dataType": "string" },
      "postCode": { "dataType": "string", "required": true },
      "country": { "dataType": "string", "required": true },
    },
  },
  "KycVerifiedAccountDetails": {
    "properties": {
      "id": { "dataType": "string", "required": true },
      "hin": { "dataType": "string", "required": true },
      "type": { "ref": "AccountType", "required": true },
      "status": { "ref": "AccountStatus", "required": true },
      "email": { "dataType": "string", "required": true },
      "passportNumber": { "dataType": "string" },
      "passportExpiryDate": { "dataType": "string" },
      "firstName": { "dataType": "string" },
      "lastName": { "dataType": "string" },
      "nationality": { "dataType": "string" },
      "dateOfBirth": { "dataType": "string" },
      "gender": { "ref": "Gender" },
      "address": { "ref": "Address" },
    },
  },
  "CreateAccountRequest": {
    "properties": {
      "email": { "dataType": "string", "required": true },
      "password": { "dataType": "string", "required": true },
      "firstName": { "dataType": "string" },
      "lastName": { "dataType": "string" },
      "referrerHin": { "dataType": "string" },
    },
  },
  "VerifyAccountRequest": {
    "properties": {
      "userToken": { "dataType": "string" },
    },
  },
  "UserPublicView": {
    "properties": {
      "mfaEnabled": { "dataType": "boolean", "required": true },
      "accountType": { "ref": "AccountType", "required": true },
      "status": { "ref": "AccountStatus", "required": true },
      "hin": { "dataType": "string", "required": true },
      "hasTriggeredKycCheck": { "dataType": "boolean" },
    },
  },
  "StatusChangeRequest": {
    "properties": {
      "status": { "ref": "AccountStatus", "required": true },
    },
  },
  "AccountSuspensionChangeRequest": {
    "properties": {
      "suspended": { "dataType": "boolean", "required": true },
    },
  },
  "MfaStatusResponse": {
    "properties": {
      "enabled": { "dataType": "boolean", "required": true },
    },
  },
  "PartialMFA": {
  },
  "SendResetPasswordEmailRequest": {
    "properties": {
      "email": { "dataType": "string", "required": true },
    },
  },
  "ResetPasswordRequest": {
    "properties": {
      "userId": { "dataType": "string", "required": true },
      "newPassword": { "dataType": "string", "required": true },
      "newPasswordRetyped": { "dataType": "string", "required": true },
      "token": { "dataType": "string", "required": true },
    },
  },
  "LoginRequest": {
    "properties": {
      "email": { "dataType": "string", "required": true },
      "password": { "dataType": "string", "required": true },
      "mfaToken": { "dataType": "string" },
    },
  },
  "TokenResponse": {
    "properties": {
      "id": { "dataType": "string", "required": true },
      "token": { "dataType": "string", "required": true },
    },
  },
  "TokenRequest": {
    "properties": {
      "email": { "dataType": "string", "required": true },
      "password": { "dataType": "string", "required": true },
    },
  },
  "AccountTypeUpdateRequest": {
    "properties": {
      "email": { "dataType": "string", "required": true },
      "type": { "ref": "AccountType", "required": true },
    },
  },
  "AccountStatusUpdateRequest": {
    "properties": {
      "email": { "dataType": "string", "required": true },
      "status": { "ref": "AccountStatus", "required": true },
      "enableMfa": { "dataType": "boolean" },
      "hasTriggeredKycCheck": { "dataType": "boolean" },
    },
  },
};
const validationService = new ValidationService(models);

export function RegisterRoutes(app: express.Express) {
  app.get('/api/accounts/bank-details',
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

      const controller = new AccountsController();


      const promise = controller.getBankDetails.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/accounts/bank-details',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "request", "required": true, "dataType": "object" },
        bankDetails: { "in": "body", "name": "bankDetails", "required": true, "ref": "PersonalBankDetails" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountsController();


      const promise = controller.saveBankDetails.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.patch('/api/accounts/password',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        undefined: { "in": "body", "required": true, "ref": "ChangePasswordRequest" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountsController();


      const promise = controller.changePassword.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/accounts/kyc-details',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountsController();


      const promise = controller.getKycUserDetails.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/accounts/:id',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountsController();


      const promise = controller.getAccount.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/accounts',
    function(request: any, response: any, next: any) {
      const args = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "CreateAccountRequest" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountsController();


      const promise = controller.createIndividualAccount.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/accounts/verification/generation',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountsController();


      const promise = controller.sendUserVerificationEmail.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/accounts/verification',
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "body", "required": true, "ref": "VerifyAccountRequest" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountsController();


      const promise = controller.verifyUserAccount.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/accounts/kyc-form-submission',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountsController();


      const promise = controller.recordKycFormSubmission.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/admin/accounts/search',
    authenticateMiddleware([{ "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        hin: { "in": "query", "name": "hin", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountsController();


      const promise = controller.searchForUserAccount.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.patch('/api/admin/accounts/:accountId/status',
    authenticateMiddleware([{ "cookieAuth": [], "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        accountId: { "in": "path", "name": "accountId", "required": true, "dataType": "string" },
        undefined: { "in": "body", "required": true, "ref": "StatusChangeRequest" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountStateController();


      const promise = controller.changeAccountStatus.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.patch('/api/admin/accounts/:accountId/suspension',
    authenticateMiddleware([{ "cookieAuth": [], "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        accountId: { "in": "path", "name": "accountId", "required": true, "dataType": "string" },
        undefined: { "in": "body", "required": true, "ref": "AccountSuspensionChangeRequest" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountStateController();


      const promise = controller.suspendAccount.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/mfa',
    function(request: any, response: any, next: any) {
      const args = {
        email: { "in": "query", "name": "email", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new MFAController();


      const promise = controller.getMfaStatusForUser.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/mfa',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new MFAController();


      const promise = controller.activateMfaForUser.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.delete('/api/mfa/:token',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        token: { "in": "path", "name": "token", "required": true, "dataType": "string" },
        undefined: { "in": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new MFAController();


      const promise = controller.deactivateMfaForUser.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/mfa/verification',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "dataType": "any" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new MFAController();


      const promise = controller.verifyMfaForUser.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/reset-password',
    function(request: any, response: any, next: any) {
      const args = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "SendResetPasswordEmailRequest" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new ResetPasswordController();


      const promise = controller.sendResetPasswordEmail.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/reset-password',
    function(request: any, response: any, next: any) {
      const args = {
        userId: { "in": "query", "name": "userId", "required": true, "dataType": "string" },
        token: { "in": "query", "name": "token", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new ResetPasswordController();


      const promise = controller.validateToken.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.put('/api/reset-password',
    function(request: any, response: any, next: any) {
      const args = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "ResetPasswordRequest" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new ResetPasswordController();


      const promise = controller.resetPassword.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/sessions',
    function(request: any, response: any, next: any) {
      const args = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "LoginRequest" },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new SessionsController();


      const promise = controller.login.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.delete('/api/sessions',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new SessionsController();


      const promise = controller.removeUsersSession.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/tokens',
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

      const controller = new TokensController();


      const promise = controller.getTokens.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/tokens',
    function(request: any, response: any, next: any) {
      const args = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "TokenRequest" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new TokensController();


      const promise = controller.createToken.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.delete('/api/tokens/:id',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new TokensController();


      const promise = controller.removeToken.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.patch('/api/users/activate',
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

      const controller = new UserStateController();


      const promise = controller.activateUser.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.patch('/api/test-automation/accounts/type',
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "body", "required": true, "ref": "AccountTypeUpdateRequest" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new E2eTestingDataSetupController();


      const promise = controller.updateAccountType.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.patch('/api/test-automation/accounts/account-status',
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "body", "required": true, "ref": "AccountStatusUpdateRequest" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new E2eTestingDataSetupController();


      const promise = controller.updateAccountStatus.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/test-automation/accounts/details/:publicKey',
    function(request: any, response: any, next: any) {
      const args = {
        publicKey: { "in": "path", "name": "publicKey", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new E2eTestingDataSetupController();


      const promise = controller.getAddressDetailsByPublicKey.apply(controller, validatedArgs as any);
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
