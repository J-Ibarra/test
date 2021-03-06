---
title: Kinesis Exchange API
language_tabs:
  - http: HTTP
  - javascript: JavaScript
  - javascript--nodejs: Node.JS
  - python: Python
  - ruby: Ruby
toc_footers: []
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<h1 id="kinesis-exchange-api">Kinesis Exchange API v1.2.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

Base URLs:

* <a href="/api">/api</a>

<h1 id="kinesis-exchange-api-default">Default</h1>

## SetOrderRangeForSymbol

<a id="opIdSetOrderRangeForSymbol"></a>

> Code samples

```http
PATCH /api/symbols/admin/{symbolId} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/symbols/admin/{symbolId}',
  method: 'patch',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/symbols/admin/{symbolId}',
{
  method: 'PATCH',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.patch('/api/symbols/admin/{symbolId}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.patch '/api/symbols/admin/{symbolId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`PATCH /symbols/admin/{symbolId}`

> Body parameter

```json
{}
```

<h3 id="setorderrangeforsymbol-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|symbolId|path|string|true|none|
|body|body|[VerifyMfaForUserRequestbody](#schemaverifymfaforuserrequestbody)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="setorderrangeforsymbol-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="setorderrangeforsymbol-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth & adminAuth
</aside>

<h1 id="kinesis-exchange-api-admin-fund-management-api">Admin Fund Management API</h1>

## RetrieveAdminRequestsCount

<a id="opIdRetrieveAdminRequestsCount"></a>

> Code samples

```http
GET /api/admin/fund-management/admin-requests/count HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/admin/fund-management/admin-requests/count',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/admin/fund-management/admin-requests/count',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/admin/fund-management/admin-requests/count', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/admin/fund-management/admin-requests/count',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /admin/fund-management/admin-requests/count`

<h3 id="retrieveadminrequestscount-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|accountHin|query|string|false|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="retrieveadminrequestscount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="retrieveadminrequestscount-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
adminAuth
</aside>

<h1 id="kinesis-exchange-api-account-api">Account API</h1>

## GetBankDetails

<a id="opIdGetBankDetails"></a>

> Code samples

```http
GET /api/accounts/bank-details HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/accounts/bank-details',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/accounts/bank-details',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/accounts/bank-details', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/accounts/bank-details',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /accounts/bank-details`

> Example responses

> 200 Response

```json
{}
```

<h3 id="getbankdetails-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getbankdetails-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## SaveBankDetails

<a id="opIdSaveBankDetails"></a>

> Code samples

```http
POST /api/accounts/bank-details HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/accounts/bank-details',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "id": 0,
  "accountHolderName": "string",
  "bankName": "string",
  "iban": "string",
  "bankSwiftCode": "string",
  "routingCode": "string",
  "abaNumber": "string",
  "accountNumber": "string",
  "notes": "string",
  "bankAddress": "string",
  "accountId": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/accounts/bank-details',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/accounts/bank-details', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/accounts/bank-details',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /accounts/bank-details`

> Body parameter

```json
{
  "id": 0,
  "accountHolderName": "string",
  "bankName": "string",
  "iban": "string",
  "bankSwiftCode": "string",
  "routingCode": "string",
  "abaNumber": "string",
  "accountNumber": "string",
  "notes": "string",
  "bankAddress": "string",
  "accountId": "string"
}
```

<h3 id="savebankdetails-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PersonalBankDetails](#schemapersonalbankdetails)|true|none|

> Example responses

> 200 Response

```json
{
  "id": 0,
  "accountHolderName": "string",
  "bankName": "string",
  "iban": "string",
  "bankSwiftCode": "string",
  "routingCode": "string",
  "abaNumber": "string",
  "accountNumber": "string",
  "notes": "string",
  "bankAddress": "string",
  "accountId": "string"
}
```

<h3 id="savebankdetails-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[PersonalBankDetails](#schemapersonalbankdetails)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## ChangePassword

<a id="opIdChangePassword"></a>

> Code samples

```http
PATCH /api/accounts/password HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/accounts/password',
  method: 'patch',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "currentPassword": "string",
  "newPassword": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/accounts/password',
{
  method: 'PATCH',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.patch('/api/accounts/password', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.patch '/api/accounts/password',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`PATCH /accounts/password`

> Body parameter

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

<h3 id="changepassword-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[ChangePasswordRequest](#schemachangepasswordrequest)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="changepassword-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="changepassword-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetKycUserDetails

<a id="opIdGetKycUserDetails"></a>

> Code samples

```http
GET /api/accounts/kyc-details HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/accounts/kyc-details',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/accounts/kyc-details',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/accounts/kyc-details', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/accounts/kyc-details',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /accounts/kyc-details`

> Example responses

> 200 Response

```json
{
  "id": "string",
  "hin": "string",
  "type": "individual",
  "status": "registered",
  "email": "string",
  "passportNumber": "string",
  "passportExpiryDate": "string",
  "firstName": "string",
  "lastName": "string",
  "nationality": "string",
  "dateOfBirth": "string",
  "gender": "Male",
  "address": {
    "addressLine1": "string",
    "addressLine2": "string",
    "addressLine3": "string",
    "postCode": "string",
    "country": "string"
  }
}
```

<h3 id="getkycuserdetails-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[KycVerifiedAccountDetails](#schemakycverifiedaccountdetails)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetAccount

<a id="opIdGetAccount"></a>

> Code samples

```http
GET /api/accounts/{id} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/accounts/{id}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/accounts/{id}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/accounts/{id}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/accounts/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /accounts/{id}`

<h3 id="getaccount-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getaccount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Unauthorized|None|

<h3 id="getaccount-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## CreateIndividualAccount

<a id="opIdCreateIndividualAccount"></a>

> Code samples

```http
POST /api/accounts HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/accounts',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "referrerHin": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/accounts',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/accounts', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/accounts',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /accounts`

> Body parameter

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "referrerHin": "string"
}
```

<h3 id="createindividualaccount-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CreateAccountRequest](#schemacreateaccountrequest)|true|none|

> Example responses

> 201 Response

```json
{}
```

<h3 id="createindividualaccount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Created|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid request body|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Account email already taken|None|

<h3 id="createindividualaccount-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## SendUserVerificationEmail

<a id="opIdSendUserVerificationEmail"></a>

> Code samples

```http
POST /api/accounts/verification/generation HTTP/1.1

```

```javascript

$.ajax({
  url: '/api/accounts/verification/generation',
  method: 'post',

  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

fetch('/api/accounts/verification/generation',
{
  method: 'POST'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests

r = requests.post('/api/accounts/verification/generation', params={

)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.post '/api/accounts/verification/generation',
  params: {
  }

p JSON.parse(result)

```

`POST /accounts/verification/generation`

<h3 id="senduserverificationemail-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Account verification email successfully sent|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## VerifyUserAccount

<a id="opIdVerifyUserAccount"></a>

> Code samples

```http
POST /api/accounts/verification HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/accounts/verification',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "userToken": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/accounts/verification',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/accounts/verification', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/accounts/verification',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /accounts/verification`

> Body parameter

```json
{
  "userToken": "string"
}
```

<h3 id="verifyuseraccount-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[VerifyAccountRequest](#schemaverifyaccountrequest)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="verifyuseraccount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Account verified|Inline|

<h3 id="verifyuseraccount-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## RecordKycFormSubmission

<a id="opIdRecordKycFormSubmission"></a>

> Code samples

```http
POST /api/accounts/kyc-form-submission HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/accounts/kyc-form-submission',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/accounts/kyc-form-submission',
{
  method: 'POST',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.post('/api/accounts/kyc-form-submission', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.post '/api/accounts/kyc-form-submission',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /accounts/kyc-form-submission`

> Example responses

> 200 Response

```json
{}
```

<h3 id="recordkycformsubmission-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="recordkycformsubmission-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## ChangeAccountStatus

<a id="opIdChangeAccountStatus"></a>

> Code samples

```http
PATCH /api/admin/accounts/{accountId}/status HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/admin/accounts/{accountId}/status',
  method: 'patch',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "status": "registered"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/admin/accounts/{accountId}/status',
{
  method: 'PATCH',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.patch('/api/admin/accounts/{accountId}/status', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.patch '/api/admin/accounts/{accountId}/status',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`PATCH /admin/accounts/{accountId}/status`

> Body parameter

```json
{
  "status": "registered"
}
```

<h3 id="changeaccountstatus-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|accountId|path|string|true|none|
|body|body|[StatusChangeRequest](#schemastatuschangerequest)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="changeaccountstatus-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="changeaccountstatus-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth & adminAuth
</aside>

## SuspendAccount

<a id="opIdSuspendAccount"></a>

> Code samples

```http
PATCH /api/admin/accounts/{accountId}/suspension HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/admin/accounts/{accountId}/suspension',
  method: 'patch',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "suspended": true
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/admin/accounts/{accountId}/suspension',
{
  method: 'PATCH',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.patch('/api/admin/accounts/{accountId}/suspension', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.patch '/api/admin/accounts/{accountId}/suspension',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`PATCH /admin/accounts/{accountId}/suspension`

> Body parameter

```json
{
  "suspended": true
}
```

<h3 id="suspendaccount-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|accountId|path|string|true|none|
|body|body|[AccountSuspensionChangeRequest](#schemaaccountsuspensionchangerequest)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="suspendaccount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="suspendaccount-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth & adminAuth
</aside>

## GetMfaStatusForUser

<a id="opIdGetMfaStatusForUser"></a>

> Code samples

```http
GET /api/mfa?email=string HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/mfa',
  method: 'get',
  data: '?email=string',
  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/mfa?email=string',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/mfa', params={
  'email': 'string'
}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/mfa',
  params: {
  'email' => 'string'
}, headers: headers

p JSON.parse(result)

```

`GET /mfa`

<h3 id="getmfastatusforuser-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|email|query|string|true|none|

> Example responses

> 200 Response

```json
{
  "enabled": true
}
```

<h3 id="getmfastatusforuser-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[MfaStatusResponse](#schemamfastatusresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## ActivateMfaForUser

<a id="opIdActivateMfaForUser"></a>

> Code samples

```http
POST /api/mfa HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/mfa',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/mfa',
{
  method: 'POST',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.post('/api/mfa', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.post '/api/mfa',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /mfa`

> Example responses

> 200 Response

```json
{}
```

<h3 id="activatemfaforuser-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[PartialMFA](#schemapartialmfa)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## DeactivateMfaForUser

<a id="opIdDeactivateMfaForUser"></a>

> Code samples

```http
DELETE /api/mfa/{token} HTTP/1.1

```

```javascript

$.ajax({
  url: '/api/mfa/{token}',
  method: 'delete',

  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

fetch('/api/mfa/{token}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests

r = requests.delete('/api/mfa/{token}', params={

)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '/api/mfa/{token}',
  params: {
  }

p JSON.parse(result)

```

`DELETE /mfa/{token}`

<h3 id="deactivatemfaforuser-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|token|path|string|true|none|

<h3 id="deactivatemfaforuser-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## VerifyMfaForUser

<a id="opIdVerifyMfaForUser"></a>

> Code samples

```http
POST /api/mfa/verification HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/mfa/verification',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/mfa/verification',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/mfa/verification', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/mfa/verification',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /mfa/verification`

> Body parameter

```json
{}
```

<h3 id="verifymfaforuser-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[VerifyMfaForUserRequestbody](#schemaverifymfaforuserrequestbody)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="verifymfaforuser-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|MFA token successfully verified|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|MFA token not verified|None|

<h3 id="verifymfaforuser-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## DisableMfaByAdmin

<a id="opIdDisableMfaByAdmin"></a>

> Code samples

```http
DELETE /api/mfa/admin/{accountHin} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/mfa/admin/{accountHin}',
  method: 'delete',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/mfa/admin/{accountHin}',
{
  method: 'DELETE',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.delete('/api/mfa/admin/{accountHin}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.delete '/api/mfa/admin/{accountHin}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`DELETE /mfa/admin/{accountHin}`

<h3 id="disablemfabyadmin-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|accountHin|path|string|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="disablemfabyadmin-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="disablemfabyadmin-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth & adminAuth
</aside>

## SendResetPasswordEmail

<a id="opIdSendResetPasswordEmail"></a>

> Code samples

```http
POST /api/reset-password HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/reset-password',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "email": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/reset-password',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/reset-password', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/reset-password',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /reset-password`

> Body parameter

```json
{
  "email": "string"
}
```

<h3 id="sendresetpasswordemail-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[SendResetPasswordEmailRequest](#schemasendresetpasswordemailrequest)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="sendresetpasswordemail-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

<h3 id="sendresetpasswordemail-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## ValidateToken

<a id="opIdValidateToken"></a>

> Code samples

```http
GET /api/reset-password?userId=string&token=string HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/reset-password',
  method: 'get',
  data: '?userId=string&token=string',
  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/reset-password?userId=string&token=string',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/reset-password', params={
  'userId': 'string',  'token': 'string'
}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/reset-password',
  params: {
  'userId' => 'string',
'token' => 'string'
}, headers: headers

p JSON.parse(result)

```

`GET /reset-password`

<h3 id="validatetoken-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|userId|query|string|true|none|
|token|query|string|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="validatetoken-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|valid|Inline|

<h3 id="validatetoken-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## ResetPassword

<a id="opIdResetPassword"></a>

> Code samples

```http
PUT /api/reset-password HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/reset-password',
  method: 'put',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "userId": "string",
  "newPassword": "string",
  "newPasswordRetyped": "string",
  "token": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/reset-password',
{
  method: 'PUT',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.put('/api/reset-password', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.put '/api/reset-password',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`PUT /reset-password`

> Body parameter

```json
{
  "userId": "string",
  "newPassword": "string",
  "newPasswordRetyped": "string",
  "token": "string"
}
```

<h3 id="resetpassword-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[ResetPasswordRequest](#schemaresetpasswordrequest)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="resetpassword-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<h3 id="resetpassword-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## RemoveUsersSession

<a id="opIdRemoveUsersSession"></a>

> Code samples

```http
DELETE /api/sessions HTTP/1.1

```

```javascript

$.ajax({
  url: '/api/sessions',
  method: 'delete',

  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

fetch('/api/sessions',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests

r = requests.delete('/api/sessions', params={

)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '/api/sessions',
  params: {
  }

p JSON.parse(result)

```

`DELETE /sessions`

<h3 id="removeuserssession-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetTokens

<a id="opIdGetTokens"></a>

> Code samples

```http
GET /api/tokens HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/tokens',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/tokens',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/tokens', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/tokens',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /tokens`

> Example responses

> 200 Response

```json
[
  {
    "id": "string",
    "token": "string"
  }
]
```

<h3 id="gettokens-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="gettokens-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[TokenResponse](#schematokenresponse)]|false|none|none|
|» id|string|true|none|none|
|» token|string|true|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## RemoveToken

<a id="opIdRemoveToken"></a>

> Code samples

```http
DELETE /api/tokens/{id} HTTP/1.1

```

```javascript

$.ajax({
  url: '/api/tokens/{id}',
  method: 'delete',

  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

fetch('/api/tokens/{id}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests

r = requests.delete('/api/tokens/{id}', params={

)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '/api/tokens/{id}',
  params: {
  }

p JSON.parse(result)

```

`DELETE /tokens/{id}`

<h3 id="removetoken-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|none|

<h3 id="removetoken-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No Body|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## ActivateUser

<a id="opIdActivateUser"></a>

> Code samples

```http
PATCH /api/users/activate HTTP/1.1

```

```javascript

$.ajax({
  url: '/api/users/activate',
  method: 'patch',

  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

fetch('/api/users/activate',
{
  method: 'PATCH'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests

r = requests.patch('/api/users/activate', params={

)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.patch '/api/users/activate',
  params: {
  }

p JSON.parse(result)

```

`PATCH /users/activate`

<h3 id="activateuser-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No content|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

<h1 id="kinesis-exchange-api-authentication">Authentication</h1>

## Login

<a id="opIdLogin"></a>

> Code samples

```http
POST /api/sessions HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/sessions',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "email": "string",
  "password": "string",
  "mfaToken": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/sessions',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/sessions', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/sessions',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /sessions`

> Body parameter

```json
{
  "email": "string",
  "password": "string",
  "mfaToken": "string"
}
```

<h3 id="login-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[LoginRequest](#schemaloginrequest)|true|none|

> Example responses

> 201 Response

```json
{}
```

<h3 id="login-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Created|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<h3 id="login-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## CreateToken

<a id="opIdCreateToken"></a>

> Code samples

```http
POST /api/tokens HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/tokens',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "email": "string",
  "password": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/tokens',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/tokens', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/tokens',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /tokens`

> Body parameter

```json
{
  "email": "string",
  "password": "string"
}
```

<h3 id="createtoken-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[TokenRequest](#schematokenrequest)|true|none|

> Example responses

> 201 Response

```json
{}
```

<h3 id="createtoken-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Created|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<h3 id="createtoken-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="kinesis-exchange-api-balance-api">Balance API</h1>

## GetAllBalancesForAccount

<a id="opIdGetAllBalancesForAccount"></a>

> Code samples

```http
GET /api/balances HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/balances',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/balances',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/balances', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/balances',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /balances`

> Example responses

> 200 Response

```json
{
  "accountId": "string",
  "preferredCurrencyTotal": 0,
  "balances": [
    {
      "currency": "ETH",
      "total": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "available": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "reserved": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "pendingDeposit": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "pendingWithdrawal": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "pendingRedemption": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "pendingDebitCardTopUp": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "displayFormat": "0"
    }
  ]
}
```

<h3 id="getallbalancesforaccount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[CompleteBalanceDetails](#schemacompletebalancedetails)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

<h1 id="kinesis-exchange-api-deposit-api">Deposit API</h1>

## PersistAccountsVaultPublicKey

<a id="opIdPersistAccountsVaultPublicKey"></a>

> Code samples

```http
POST /api/vault HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/vault',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "publicKey": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/vault',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/vault', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/vault',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /vault`

> Body parameter

```json
{
  "publicKey": "string"
}
```

<h3 id="persistaccountsvaultpublickey-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[VaultPersistRequest](#schemavaultpersistrequest)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="persistaccountsvaultpublickey-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="persistaccountsvaultpublickey-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetAccountVaultPublicKey

<a id="opIdGetAccountVaultPublicKey"></a>

> Code samples

```http
GET /api/vault HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/vault',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/vault',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/vault', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/vault',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /vault`

> Example responses

> 200 Response

```json
{}
```

<h3 id="getaccountvaultpublickey-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getaccountvaultpublickey-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## RetrieveWalletAddressesForAccount

<a id="opIdRetrieveWalletAddressesForAccount"></a>

> Code samples

```http
GET /api/wallets HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/wallets',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/wallets',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/wallets', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/wallets',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /wallets`

> Example responses

> 200 Response

```json
{}
```

<h3 id="retrievewalletaddressesforaccount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="retrievewalletaddressesforaccount-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## ActivateWalletAddressForAccount

<a id="opIdActivateWalletAddressForAccount"></a>

> Code samples

```http
POST /api/wallets/address/activation HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/wallets/address/activation',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/wallets/address/activation',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/wallets/address/activation', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/wallets/address/activation',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /wallets/address/activation`

> Body parameter

```json
{}
```

<h3 id="activatewalletaddressforaccount-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[VerifyMfaForUserRequestbody](#schemaverifymfaforuserrequestbody)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="activatewalletaddressforaccount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="activatewalletaddressforaccount-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## RetrieveKinesisBankDetails

<a id="opIdRetrieveKinesisBankDetails"></a>

> Code samples

```http
GET /api/wallets/kinesis-bank-details HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/wallets/kinesis-bank-details',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/wallets/kinesis-bank-details',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/wallets/kinesis-bank-details', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/wallets/kinesis-bank-details',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /wallets/kinesis-bank-details`

> Example responses

> 200 Response

```json
{}
```

<h3 id="retrievekinesisbankdetails-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="retrievekinesisbankdetails-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetMinimumDepositAmounts

<a id="opIdGetMinimumDepositAmounts"></a>

> Code samples

```http
GET /api/deposits/minimum-amounts HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/deposits/minimum-amounts',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/deposits/minimum-amounts',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/deposits/minimum-amounts', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/deposits/minimum-amounts',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /deposits/minimum-amounts`

> Example responses

> 200 Response

```json
{}
```

<h3 id="getminimumdepositamounts-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[Record](#schemarecord)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

<h1 id="kinesis-exchange-api-market-data-api">Market Data API</h1>

## GetOHLCMarketData

<a id="opIdGetOHLCMarketData"></a>

> Code samples

```http
GET /api/market-data/ohlc?symbolId=string&timeFrame=1&fromDate=2020-05-20T07%3A42%3A38Z HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/market-data/ohlc',
  method: 'get',
  data: '?symbolId=string&timeFrame=1&fromDate=2020-05-20T07%3A42%3A38Z',
  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/market-data/ohlc?symbolId=string&timeFrame=1&fromDate=2020-05-20T07%3A42%3A38Z',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/market-data/ohlc', params={
  'symbolId': 'string',  'timeFrame': '1',  'fromDate': '2020-05-20T07:42:38Z'
}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/market-data/ohlc',
  params: {
  'symbolId' => 'string',
'timeFrame' => 'string',
'fromDate' => 'string(date-time)'
}, headers: headers

p JSON.parse(result)

```

`GET /market-data/ohlc`

<h3 id="getohlcmarketdata-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|symbolId|query|string|true|none|
|timeFrame|query|string|true|none|
|fromDate|query|string(date-time)|true|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|timeFrame|1|
|timeFrame|5|
|timeFrame|15|
|timeFrame|30|
|timeFrame|60|
|timeFrame|240|
|timeFrame|360|
|timeFrame|720|
|timeFrame|1440|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getohlcmarketdata-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getohlcmarketdata-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## GetMarketDataSnapshotForAllCurrencies

<a id="opIdGetMarketDataSnapshotForAllCurrencies"></a>

> Code samples

```http
GET /api/market-data/snapshots/all HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/market-data/snapshots/all',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/market-data/snapshots/all',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/market-data/snapshots/all', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/market-data/snapshots/all',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /market-data/snapshots/all`

> Example responses

> 200 Response

```json
{}
```

<h3 id="getmarketdatasnapshotforallcurrencies-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getmarketdatasnapshotforallcurrencies-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetMarketDataSnapshotForCurrency

<a id="opIdGetMarketDataSnapshotForCurrency"></a>

> Code samples

```http
GET /api/market-data/snapshots/{currency} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/market-data/snapshots/{currency}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/market-data/snapshots/{currency}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/market-data/snapshots/{currency}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/market-data/snapshots/{currency}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /market-data/snapshots/{currency}`

<h3 id="getmarketdatasnapshotforcurrency-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|currency|path|string|true|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|currency|ETH|
|currency|KAU|
|currency|KAG|
|currency|KVT|
|currency|BTC|
|currency|USDT|
|currency|USD|
|currency|EUR|
|currency|GBP|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getmarketdatasnapshotforcurrency-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getmarketdatasnapshotforcurrency-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetMidPriceForSymbolPair

<a id="opIdGetMidPriceForSymbolPair"></a>

> Code samples

```http
GET /api/mid-price?symbolPairId=string HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/mid-price',
  method: 'get',
  data: '?symbolPairId=string',
  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/mid-price?symbolPairId=string',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/mid-price', params={
  'symbolPairId': 'string'
}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/mid-price',
  params: {
  'symbolPairId' => 'string'
}, headers: headers

p JSON.parse(result)

```

`GET /mid-price`

<h3 id="getmidpriceforsymbolpair-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|symbolPairId|query|string|true|none|
|timeFrame|query|string|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|timeFrame|1|
|timeFrame|5|
|timeFrame|15|
|timeFrame|30|
|timeFrame|60|
|timeFrame|240|
|timeFrame|360|
|timeFrame|720|
|timeFrame|1440|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getmidpriceforsymbolpair-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad request|None|

<h3 id="getmidpriceforsymbolpair-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetRealTimeMidPriceForWalletSymbols

<a id="opIdGetRealTimeMidPriceForWalletSymbols"></a>

> Code samples

```http
GET /api/mid-price/real-time HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/mid-price/real-time',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/mid-price/real-time',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/mid-price/real-time', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/mid-price/real-time',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /mid-price/real-time`

> Example responses

> 200 Response

```json
{}
```

<h3 id="getrealtimemidpriceforwalletsymbols-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getrealtimemidpriceforwalletsymbols-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetRealTimeMidPriceForSymbol

<a id="opIdGetRealTimeMidPriceForSymbol"></a>

> Code samples

```http
GET /api/mid-price/real-time/{symbolId} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/mid-price/real-time/{symbolId}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/mid-price/real-time/{symbolId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/mid-price/real-time/{symbolId}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/mid-price/real-time/{symbolId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /mid-price/real-time/{symbolId}`

<h3 id="getrealtimemidpriceforsymbol-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|symbolId|path|string|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getrealtimemidpriceforsymbol-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getrealtimemidpriceforsymbol-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

<h1 id="kinesis-exchange-api-reference-data-api">Reference Data API</h1>

## FindAllBoundaries

<a id="opIdFindAllBoundaries"></a>

> Code samples

```http
GET /api/boundaries HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/boundaries',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/boundaries',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/boundaries', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/boundaries',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /boundaries`

> Example responses

> 200 Response

```json
{}
```

<h3 id="findallboundaries-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[Record](#schemarecord)|

<aside class="success">
This operation does not require authentication
</aside>

## GetCurrencies

<a id="opIdGetCurrencies"></a>

> Code samples

```http
GET /api/currencies HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/currencies',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/currencies',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/currencies', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/currencies',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /currencies`

<h3 id="getcurrencies-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|includeExtendedDetails|query|boolean|false|none|

> Example responses

> 200 Response

```json
[
  {
    "id": 0,
    "code": "ETH",
    "symbolSortPriority": 0,
    "currencyOrderPriority": 0,
    "isEnabled": true
  }
]
```

<h3 id="getcurrencies-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getcurrencies-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[Currency](#schemacurrency)]|false|none|none|
|» id|number(double)|true|none|none|
|» code|[CurrencyCode](#schemacurrencycode)|true|none|none|
|» symbolSortPriority|number(double)\|null|false|none|none|
|» currencyOrderPriority|number(double)\|null|false|none|none|
|» isEnabled|boolean\|null|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|code|ETH|
|code|KAU|
|code|KAG|
|code|KVT|
|code|BTC|
|code|USDT|
|code|USD|
|code|EUR|
|code|GBP|

<aside class="success">
This operation does not require authentication
</aside>

## RetrieveAllFeatureFlags

<a id="opIdRetrieveAllFeatureFlags"></a>

> Code samples

```http
GET /api/feature-flags HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/feature-flags',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/feature-flags',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/feature-flags', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/feature-flags',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /feature-flags`

> Example responses

> 200 Response

```json
[
  {
    "name": "debit_card",
    "enabled": {}
  }
]
```

<h3 id="retrieveallfeatureflags-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="retrieveallfeatureflags-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[FeatureFlag](#schemafeatureflag)]|false|none|none|
|» name|[SupportedFeatureFlags](#schemasupportedfeatureflags)|true|none|none|
|» enabled|object|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|name|debit_card|
|name|BTC|
|name|TETHER|
|name|BTC_KAU|
|name|BTC_KAG|
|name|ETH_BTC|
|name|BTC_USD|
|name|BTC_EUR|
|name|BTC_GBP|
|name|KVT_BTC|
|name|KVT_USDT|
|name|KAU_USDT|
|name|KAG_USDT|
|name|ETH_USDT|
|name|BTC_USDT|
|name|USDT_EUR|
|name|USDT_USD|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetSymbols

<a id="opIdGetSymbols"></a>

> Code samples

```http
GET /api/symbols HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/symbols',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/symbols',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/symbols', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/symbols',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /symbols`

<h3 id="getsymbols-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|includeOrderRange|query|boolean|false|none|

> Example responses

> 200 Response

```json
[
  {
    "id": "string",
    "base": "ETH",
    "quote": "ETH",
    "fee": "ETH",
    "orderRange": {},
    "sortOrder": {}
  }
]
```

<h3 id="getsymbols-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getsymbols-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[SymbolPairApiResponse](#schemasymbolpairapiresponse)]|false|none|none|
|» id|string|true|none|none|
|» base|[CurrencyCode](#schemacurrencycode)|true|none|none|
|» quote|[CurrencyCode](#schemacurrencycode)|true|none|none|
|» fee|[CurrencyCode](#schemacurrencycode)|true|none|none|
|» orderRange|object\|null|false|none|The percentage used to limit order price ranges.|
|» sortOrder|object\|null|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|base|ETH|
|base|KAU|
|base|KAG|
|base|KVT|
|base|BTC|
|base|USDT|
|base|USD|
|base|EUR|
|base|GBP|
|quote|ETH|
|quote|KAU|
|quote|KAG|
|quote|KVT|
|quote|BTC|
|quote|USDT|
|quote|USD|
|quote|EUR|
|quote|GBP|
|fee|ETH|
|fee|KAU|
|fee|KAG|
|fee|KVT|
|fee|BTC|
|fee|USDT|
|fee|USD|
|fee|EUR|
|fee|GBP|

<aside class="success">
This operation does not require authentication
</aside>

## GetApplySymbolsThresholdStatus

<a id="opIdGetApplySymbolsThresholdStatus"></a>

> Code samples

```http
GET /api/symbols/apply-threshold HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/symbols/apply-threshold',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/symbols/apply-threshold',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/symbols/apply-threshold', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/symbols/apply-threshold',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /symbols/apply-threshold`

This will find out if your account is bound to the symbols order ranges or not.
Returns true if you are bound and false if you aren't

> Example responses

> 200 Response

```json
{}
```

<h3 id="getapplysymbolsthresholdstatus-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getapplysymbolsthresholdstatus-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
None, cookieAuth
</aside>

## RetrieveTransactionFeeCaps

<a id="opIdRetrieveTransactionFeeCaps"></a>

> Code samples

```http
GET /api/fees/transaction HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/fees/transaction',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/fees/transaction',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/fees/transaction', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/fees/transaction',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /fees/transaction`

> Example responses

> 200 Response

```json
{}
```

<h3 id="retrievetransactionfeecaps-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[Record](#schemarecord)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## RetrieveMobileVersions

<a id="opIdRetrieveMobileVersions"></a>

> Code samples

```http
GET /api/mobile/versions HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/mobile/versions',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/mobile/versions',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/mobile/versions', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/mobile/versions',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /mobile/versions`

> Example responses

> 200 Response

```json
{
  "ios": "string",
  "android": "string",
  "forceVersionUpdate": true
}
```

<h3 id="retrievemobileversions-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[MobileVersions](#schemamobileversions)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

<h1 id="kinesis-exchange-api-withdrawal-api">Withdrawal API</h1>

## InitialiseWithdrawal

<a id="opIdInitialiseWithdrawal"></a>

> Code samples

```http
POST /api/withdrawals HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/withdrawals',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "address": "string",
  "amount": 0,
  "currencyCode": "ETH",
  "memo": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/withdrawals',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/withdrawals', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/withdrawals',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /withdrawals`

> Body parameter

```json
{
  "address": "string",
  "amount": 0,
  "currencyCode": "ETH",
  "memo": "string"
}
```

<h3 id="initialisewithdrawal-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[WithdrawalRequestParams](#schemawithdrawalrequestparams)|true|none|

> Example responses

> 201 Response

```json
{}
```

<h3 id="initialisewithdrawal-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Created|Inline|

<h3 id="initialisewithdrawal-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetWithdrawalConfigs

<a id="opIdGetWithdrawalConfigs"></a>

> Code samples

```http
GET /api/withdrawals/configs HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/withdrawals/configs',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/withdrawals/configs',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/withdrawals/configs', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/withdrawals/configs',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /withdrawals/configs`

> Example responses

> 200 Response

```json
{}
```

<h3 id="getwithdrawalconfigs-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getwithdrawalconfigs-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetWithdrawalConfigForCurrency

<a id="opIdGetWithdrawalConfigForCurrency"></a>

> Code samples

```http
GET /api/withdrawals/configs/{currency} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/withdrawals/configs/{currency}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/withdrawals/configs/{currency}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/withdrawals/configs/{currency}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/withdrawals/configs/{currency}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /withdrawals/configs/{currency}`

<h3 id="getwithdrawalconfigforcurrency-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|currency|path|string|true|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|currency|ETH|
|currency|KAU|
|currency|KAG|
|currency|KVT|
|currency|BTC|
|currency|USDT|
|currency|USD|
|currency|EUR|
|currency|GBP|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getwithdrawalconfigforcurrency-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getwithdrawalconfigforcurrency-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## UpdateWithdrawalConfig

<a id="opIdUpdateWithdrawalConfig"></a>

> Code samples

```http
POST /api/withdrawals/configs/{currency} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/withdrawals/configs/{currency}',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/withdrawals/configs/{currency}',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/withdrawals/configs/{currency}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/withdrawals/configs/{currency}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /withdrawals/configs/{currency}`

> Body parameter

```json
{}
```

<h3 id="updatewithdrawalconfig-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|currency|path|string|true|none|
|body|body|[PartialCurrencyWithdrawalConfig](#schemapartialcurrencywithdrawalconfig)|true|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|currency|ETH|
|currency|KAU|
|currency|KAG|
|currency|KVT|
|currency|BTC|
|currency|USDT|
|currency|USD|
|currency|EUR|
|currency|GBP|

> Example responses

> 200 Response

```json
{}
```

<h3 id="updatewithdrawalconfig-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="updatewithdrawalconfig-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## ValidateAddressForCrypto

<a id="opIdValidateAddressForCrypto"></a>

> Code samples

```http
GET /api/crypto/validate?code=ETH&address=string HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/crypto/validate',
  method: 'get',
  data: '?code=ETH&address=string',
  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/crypto/validate?code=ETH&address=string',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/crypto/validate', params={
  'code': 'ETH',  'address': 'string'
}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/crypto/validate',
  params: {
  'code' => 'string',
'address' => 'string'
}, headers: headers

p JSON.parse(result)

```

`GET /crypto/validate`

<h3 id="validateaddressforcrypto-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|code|query|string|true|none|
|address|query|string|true|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|code|ETH|
|code|KAU|
|code|KAG|
|code|KVT|
|code|BTC|
|code|USDT|
|code|USD|
|code|EUR|
|code|GBP|

> Example responses

> 200 Response

```json
"string"
```

<h3 id="validateaddressforcrypto-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|string|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth
</aside>

## RetrieveContactsForCurrencyForAccount

<a id="opIdRetrieveContactsForCurrencyForAccount"></a>

> Code samples

```http
GET /api/contacts/{currencyCode} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/contacts/{currencyCode}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/contacts/{currencyCode}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/contacts/{currencyCode}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/contacts/{currencyCode}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /contacts/{currencyCode}`

<h3 id="retrievecontactsforcurrencyforaccount-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|currencyCode|path|string|true|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|currencyCode|ETH|
|currencyCode|KAU|
|currencyCode|KAG|
|currencyCode|KVT|
|currencyCode|BTC|
|currencyCode|USDT|
|currencyCode|USD|
|currencyCode|EUR|
|currencyCode|GBP|

> Example responses

> 200 Response

```json
[
  {}
]
```

<h3 id="retrievecontactsforcurrencyforaccount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="retrievecontactsforcurrencyforaccount-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## CreateContactForCurrencyForAccount

<a id="opIdCreateContactForCurrencyForAccount"></a>

> Code samples

```http
POST /api/contacts HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/contacts',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{
  "currency": "ETH",
  "name": "string",
  "publicKey": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/contacts',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/contacts', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/contacts',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /contacts`

> Body parameter

```json
{
  "currency": "ETH",
  "name": "string",
  "publicKey": "string"
}
```

<h3 id="createcontactforcurrencyforaccount-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[ContactCreateRequest](#schemacontactcreaterequest)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="createcontactforcurrencyforaccount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="createcontactforcurrencyforaccount-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

<h1 id="kinesis-exchange-api-order-api">Order API</h1>

## CreateOrder

<a id="opIdCreateOrder"></a>

> Code samples

```http
POST /api/orders HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/orders',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '{}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/orders',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/orders', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/orders',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /orders`

> Body parameter

```json
{}
```

<h3 id="createorder-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[PartialPlaceOrderRequest](#schemapartialplaceorderrequest)|true|none|

> Example responses

> 201 Response

```json
{}
```

<h3 id="createorder-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Created|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden|None|

<h3 id="createorder-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetOrderExecutions

<a id="opIdGetOrderExecutions"></a>

> Code samples

```http
GET /api/orders/{orderId}/executions HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/orders/{orderId}/executions',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/orders/{orderId}/executions',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/orders/{orderId}/executions', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/orders/{orderId}/executions',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /orders/{orderId}/executions`

<h3 id="getorderexecutions-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|orderId|path|number(double)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getorderexecutions-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getorderexecutions-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetOrder

<a id="opIdGetOrder"></a>

> Code samples

```http
GET /api/orders/{orderId} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/orders/{orderId}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/orders/{orderId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/orders/{orderId}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/orders/{orderId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /orders/{orderId}`

<h3 id="getorder-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|orderId|path|number(double)|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getorder-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getorder-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetOrdersForCurrency

<a id="opIdGetOrdersForCurrency"></a>

> Code samples

```http
GET /api/orders/currencies/{currency} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/orders/currencies/{currency}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/orders/currencies/{currency}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/orders/currencies/{currency}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/orders/currencies/{currency}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /orders/currencies/{currency}`

<h3 id="getordersforcurrency-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|currency|path|string|true|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|currency|ETH|
|currency|KAU|
|currency|KAG|
|currency|KVT|
|currency|BTC|
|currency|USDT|
|currency|USD|
|currency|EUR|
|currency|GBP|

> Example responses

> 200 Response

```json
[
  {
    "transactions": [
      {
        "id": 0,
        "counterTradeTransactionId": 0,
        "counterTrade": null,
        "direction": "buy",
        "symbolId": "string",
        "accountId": "string",
        "orderId": 0,
        "amount": 0,
        "matchPrice": 0,
        "fee": 0,
        "feeCurrencyId": 0,
        "feeRate": 0,
        "taxRate": 0,
        "taxAmountCHF": 0,
        "taxAmountFeeCurrency": 0,
        "baseFiatConversion": 0,
        "quoteFiatConversion": 0,
        "fiatCurrencyCode": "CurrencyCode",
        "createdAt": "2020-05-20T07:42:38Z",
        "updatedAt": "2020-05-20T07:42:38Z"
      }
    ]
  }
]
```

<h3 id="getordersforcurrency-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getordersforcurrency-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[OrderWithTradeTransactions](#schemaorderwithtradetransactions)]|false|none|none|
|» transactions|[[TradeTransaction](#schematradetransaction)]|true|none|none|
|»» id|number(double)\|null|false|none|none|
|»» counterTradeTransactionId|number(double)|true|none|none|
|»» counterTrade|[TradeTransaction](#schematradetransaction)|false|none|none|
|»» direction|[OrderDirection](#schemaorderdirection)|true|none|none|
|»» symbolId|string|true|none|none|
|»» accountId|string|true|none|none|
|»» orderId|number(double)|true|none|none|
|»» amount|number(double)|true|none|none|
|»» matchPrice|number(double)|true|none|none|
|»» fee|number(double)|true|none|none|
|»» feeCurrencyId|number(double)|true|none|none|
|»» feeRate|number(double)|true|none|none|
|»» taxRate|number(double)|true|none|none|
|»» taxAmountCHF|number(double)|true|none|none|
|»» taxAmountFeeCurrency|number(double)|true|none|none|
|»» baseFiatConversion|number(double)|true|none|none|
|»» quoteFiatConversion|number(double)|true|none|none|
|»» fiatCurrencyCode|[FiatCurrency](#schemafiatcurrency)|true|none|none|
|»» createdAt|string(date-time)\|null|false|none|none|
|»» updatedAt|string(date-time)\|null|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|direction|buy|
|direction|sell|
|fiatCurrencyCode|CurrencyCode|
|fiatCurrencyCode|CurrencyCode|
|fiatCurrencyCode|CurrencyCode|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetAllDefaultTiers

<a id="opIdGetAllDefaultTiers"></a>

> Code samples

```http
GET /api/fees/trade HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/fees/trade',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/fees/trade',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/fees/trade', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/fees/trade',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /fees/trade`

> Example responses

> 200 Response

```json
{}
```

<h3 id="getalldefaulttiers-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[Record](#schemarecord)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetAllAccountTiers

<a id="opIdGetAllAccountTiers"></a>

> Code samples

```http
GET /api/fees/account HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/fees/account',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/fees/account',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/fees/account', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/fees/account',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /fees/account`

> Example responses

> 200 Response

```json
{}
```

<h3 id="getallaccounttiers-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getallaccounttiers-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth
</aside>

## GetFees

<a id="opIdGetFees"></a>

> Code samples

```http
GET /api/fees/{symbolId} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/fees/{symbolId}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/fees/{symbolId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/fees/{symbolId}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/fees/{symbolId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /fees/{symbolId}`

<h3 id="getfees-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|symbolId|path|string|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getfees-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getfees-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## AddDefaultTiers

<a id="opIdAddDefaultTiers"></a>

> Code samples

```http
POST /api/admin/fees/default HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/admin/fees/default',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '[
  {
    "id": 0,
    "tier": 0,
    "symbolId": "string",
    "threshold": 0,
    "rate": 0
  }
]';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/admin/fees/default',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/admin/fees/default', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/admin/fees/default',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /admin/fees/default`

> Body parameter

```json
[
  {
    "id": 0,
    "tier": 0,
    "symbolId": "string",
    "threshold": 0,
    "rate": 0
  }
]
```

<h3 id="adddefaulttiers-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|array[object]|true|none|

> Example responses

> 201 Response

```json
{}
```

<h3 id="adddefaulttiers-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Created|Inline|

<h3 id="adddefaulttiers-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth & adminAuth
</aside>

## GetDefaultTiers

<a id="opIdGetDefaultTiers"></a>

> Code samples

```http
GET /api/admin/fees/default?symbolId=string HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/admin/fees/default',
  method: 'get',
  data: '?symbolId=string',
  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/admin/fees/default?symbolId=string',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/admin/fees/default', params={
  'symbolId': 'string'
}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/admin/fees/default',
  params: {
  'symbolId' => 'string'
}, headers: headers

p JSON.parse(result)

```

`GET /admin/fees/default`

<h3 id="getdefaulttiers-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|symbolId|query|string|true|none|

> Example responses

> 200 Response

```json
[
  {
    "id": 0,
    "tier": 0,
    "symbolId": "string",
    "threshold": 0,
    "rate": 0
  }
]
```

<h3 id="getdefaulttiers-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getdefaulttiers-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[FeeTier](#schemafeetier)]|false|none|none|
|» id|number(double)\|null|false|none|none|
|» tier|number(double)|true|none|The fee tier.|
|» symbolId|string|true|none|The id of the targeted symbol.|
|» threshold|number(double)|true|none|The tier threshold.|
|» rate|number(double)|true|none|The fee rate.|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth & adminAuth
</aside>

## AddAccountTiers

<a id="opIdAddAccountTiers"></a>

> Code samples

```http
POST /api/admin/fees/account HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
var headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

$.ajax({
  url: '/api/admin/fees/account',
  method: 'post',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');
const inputBody = '[
  {
    "id": 0,
    "tier": 0,
    "symbolId": "string",
    "threshold": 0,
    "rate": 0,
    "accountId": "string"
  }
]';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'

};

fetch('/api/admin/fees/account',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('/api/admin/fees/account', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '/api/admin/fees/account',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`POST /admin/fees/account`

> Body parameter

```json
[
  {
    "id": 0,
    "tier": 0,
    "symbolId": "string",
    "threshold": 0,
    "rate": 0,
    "accountId": "string"
  }
]
```

<h3 id="addaccounttiers-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|array[object]|true|none|

> Example responses

> 201 Response

```json
{}
```

<h3 id="addaccounttiers-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Created|Inline|

<h3 id="addaccounttiers-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth & adminAuth
</aside>

## GetAccountSymbolTiers

<a id="opIdGetAccountSymbolTiers"></a>

> Code samples

```http
GET /api/admin/fees/account?accountId=string&symbolId=string HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/admin/fees/account',
  method: 'get',
  data: '?accountId=string&symbolId=string',
  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/admin/fees/account?accountId=string&symbolId=string',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/admin/fees/account', params={
  'accountId': 'string',  'symbolId': 'string'
}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/admin/fees/account',
  params: {
  'accountId' => 'string',
'symbolId' => 'string'
}, headers: headers

p JSON.parse(result)

```

`GET /admin/fees/account`

<h3 id="getaccountsymboltiers-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|accountId|query|string|true|none|
|symbolId|query|string|true|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getaccountsymboltiers-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getaccountsymboltiers-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth & adminAuth
</aside>

## GetOrderMatches

<a id="opIdGetOrderMatches"></a>

> Code samples

```http
GET /api/order-matches?symbolPairId=string HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/order-matches',
  method: 'get',
  data: '?symbolPairId=string',
  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/order-matches?symbolPairId=string',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/order-matches', params={
  'symbolPairId': 'string'
}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/order-matches',
  params: {
  'symbolPairId' => 'string'
}, headers: headers

p JSON.parse(result)

```

`GET /order-matches`

<h3 id="getordermatches-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|symbolPairId|query|string|true|none|
|limit|query|number(double)|false|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getordermatches-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getordermatches-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## RetrieveAllOrdersCount

<a id="opIdRetrieveAllOrdersCount"></a>

> Code samples

```http
GET /api/admin/orders/count HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/admin/orders/count',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/admin/orders/count',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/admin/orders/count', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/admin/orders/count',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /admin/orders/count`

<h3 id="retrieveallorderscount-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|accountHin|query|string|false|none|

> Example responses

> 200 Response

```json
{}
```

<h3 id="retrieveallorderscount-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="retrieveallorderscount-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## GetTransactionHistoryForCurrency

<a id="opIdGetTransactionHistoryForCurrency"></a>

> Code samples

```http
GET /api/transaction-history/{selectedCurrency} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/transaction-history/{selectedCurrency}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/transaction-history/{selectedCurrency}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/transaction-history/{selectedCurrency}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/transaction-history/{selectedCurrency}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /transaction-history/{selectedCurrency}`

<h3 id="gettransactionhistoryforcurrency-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|selectedCurrency|path|string|true|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|selectedCurrency|ETH|
|selectedCurrency|KAU|
|selectedCurrency|KAG|
|selectedCurrency|KVT|
|selectedCurrency|BTC|
|selectedCurrency|USDT|
|selectedCurrency|USD|
|selectedCurrency|EUR|
|selectedCurrency|GBP|

> Example responses

> 200 Response

```json
{}
```

<h3 id="gettransactionhistoryforcurrency-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="gettransactionhistoryforcurrency-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetTopOfDepthForCurrencyPairAndDirection

<a id="opIdGetTopOfDepthForCurrencyPairAndDirection"></a>

> Code samples

```http
GET /api/depth/{symbolId}/{direction}/top HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/depth/{symbolId}/{direction}/top',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/depth/{symbolId}/{direction}/top',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/depth/{symbolId}/{direction}/top', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/depth/{symbolId}/{direction}/top',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /depth/{symbolId}/{direction}/top`

<h3 id="gettopofdepthforcurrencypairanddirection-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|symbolId|path|string|true|none|
|direction|path|string|true|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|direction|buy|
|direction|sell|

> Example responses

> 200 Response

```json
{}
```

<h3 id="gettopofdepthforcurrencypairanddirection-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="gettopofdepthforcurrencypairanddirection-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetDepthForCurrencyPair

<a id="opIdGetDepthForCurrencyPair"></a>

> Code samples

```http
GET /api/depth/{symbolId} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/depth/{symbolId}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/depth/{symbolId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/depth/{symbolId}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/depth/{symbolId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /depth/{symbolId}`

<h3 id="getdepthforcurrencypair-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|symbolId|path|string|true|none|
|limit|query|number(double)|false|none|
|direction|query|string|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|direction|buy|
|direction|sell|

> Example responses

> 200 Response

```json
{}
```

<h3 id="getdepthforcurrencypair-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getdepthforcurrencypair-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## GetFeePools

<a id="opIdGetFeePools"></a>

> Code samples

```http
GET /api/fee-pools HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/fee-pools',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/fee-pools',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/fee-pools', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/fee-pools',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /fee-pools`

> Example responses

> 200 Response

```json
[
  {
    "code": "ETH",
    "pool": 0
  }
]
```

<h3 id="getfeepools-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="getfeepools-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[FeePool](#schemafeepool)]|false|none|none|
|» code|[CurrencyCode](#schemacurrencycode)|true|none|none|
|» pool|number(double)|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|code|ETH|
|code|KAU|
|code|KAG|
|code|KVT|
|code|BTC|
|code|USDT|
|code|USD|
|code|EUR|
|code|GBP|

<aside class="success">
This operation does not require authentication
</aside>

## GetFeePool

<a id="opIdGetFeePool"></a>

> Code samples

```http
GET /api/fee-pools/{currencyCode} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/fee-pools/{currencyCode}',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/fee-pools/{currencyCode}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/fee-pools/{currencyCode}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/fee-pools/{currencyCode}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /fee-pools/{currencyCode}`

<h3 id="getfeepool-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|currencyCode|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "code": "ETH",
  "pool": 0
}
```

<h3 id="getfeepool-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[FeePool](#schemafeepool)|

<aside class="success">
This operation does not require authentication
</aside>

## GetAccountMonthlyTradeSummary

<a id="opIdGetAccountMonthlyTradeSummary"></a>

> Code samples

```http
GET /api/transactions/monthly-summary HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/transactions/monthly-summary',
  method: 'get',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/transactions/monthly-summary',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/transactions/monthly-summary', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/transactions/monthly-summary',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`GET /transactions/monthly-summary`

> Example responses

> 200 Response

```json
{
  "currentMonth": {
    "trades": 0,
    "volume": 0
  },
  "lastMonth": {
    "trades": 0,
    "volume": 0
  }
}
```

<h3 id="getaccountmonthlytradesummary-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|[AccountMonthlyTradeSummary](#schemaaccountmonthlytradesummary)|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## GetTransactions

<a id="opIdGetTransactions"></a>

> Code samples

```http
GET /api/transactions?type=trade HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/transactions',
  method: 'get',
  data: '?type=trade',
  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/transactions?type=trade',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('/api/transactions', params={
  'type': 'trade'
}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '/api/transactions',
  params: {
  'type' => 'string'
}, headers: headers

p JSON.parse(result)

```

`GET /transactions`

<h3 id="gettransactions-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|type|query|string|true|none|
|limit|query|number(double)|false|none|
|offset|query|number(double)|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|type|trade|
|type|currency|
|type|transfer|

> Example responses

> 200 Response

```json
{}
```

<h3 id="gettransactions-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ok|Inline|

<h3 id="gettransactions-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

## CancelOrder

<a id="opIdCancelOrder"></a>

> Code samples

```http
DELETE /api/orders/{id} HTTP/1.1

Accept: application/json

```

```javascript
var headers = {
  'Accept':'application/json'

};

$.ajax({
  url: '/api/orders/{id}',
  method: 'delete',

  headers: headers,
  success: function(data) {
    console.log(JSON.stringify(data));
  }
})

```

```javascript--nodejs
const fetch = require('node-fetch');

const headers = {
  'Accept':'application/json'

};

fetch('/api/orders/{id}',
{
  method: 'DELETE',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.delete('/api/orders/{id}', params={

}, headers = headers)

print r.json()

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.delete '/api/orders/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

`DELETE /orders/{id}`

<h3 id="cancelorder-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|number(double)|true|none|

> Example responses

> 204 Response

```json
{}
```

<h3 id="cancelorder-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|No Response|Inline|

<h3 id="cancelorder-responseschema">Response Schema</h3>

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
cookieAuth, None
</aside>

# Schemas

<h2 id="tocSadminrequesttype">AdminRequestType</h2>

<a id="schemaadminrequesttype"></a>

```json
"withdrawal"

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|withdrawal|
|*anonymous*|deposit|
|*anonymous*|redemption|

<h2 id="tocScurrencycode">CurrencyCode</h2>

<a id="schemacurrencycode"></a>

```json
"ETH"

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|ETH|
|*anonymous*|KAU|
|*anonymous*|KAG|
|*anonymous*|KVT|
|*anonymous*|BTC|
|*anonymous*|USDT|
|*anonymous*|USD|
|*anonymous*|EUR|
|*anonymous*|GBP|

<h2 id="tocSadminrequeststatus">AdminRequestStatus</h2>

<a id="schemaadminrequeststatus"></a>

```json
"pending"

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|pending|
|*anonymous*|approved|
|*anonymous*|rejected|

<h2 id="tocSadminrequest">AdminRequest</h2>

<a id="schemaadminrequest"></a>

```json
{
  "client": "string",
  "hin": "string",
  "type": "withdrawal",
  "description": "string",
  "asset": "ETH",
  "amount": 0,
  "admin": "string",
  "status": "pending",
  "fee": 0,
  "id": 0,
  "globalTransactionId": "string",
  "createdAt": "2020-05-20T07:42:38Z",
  "updatedAt": "2020-05-20T07:42:38Z",
  "tradingPlatformName": "string"
}

```

*Contains the details for a withdrawal, deposit or redemption admin request for a given client.*

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|client|string|true|none|none|
|hin|string|true|none|none|
|type|[AdminRequestType](#schemaadminrequesttype)|true|none|none|
|description|string\|null|false|none|none|
|asset|[CurrencyCode](#schemacurrencycode)|true|none|none|
|amount|number(double)|true|none|none|
|admin|string|true|none|none|
|status|[AdminRequestStatus](#schemaadminrequeststatus)|true|none|none|
|fee|number(double)\|null|false|none|none|
|id|number(double)|true|none|none|
|globalTransactionId|string|true|none|none|
|createdAt|string(date-time)|true|none|none|
|updatedAt|string(date-time)|true|none|none|
|tradingPlatformName|string|true|none|none|

<h2 id="tocSadminrequeststatusupdateparams">AdminRequestStatusUpdateParams</h2>

<a id="schemaadminrequeststatusupdateparams"></a>

```json
{
  "status": "pending",
  "updatedAt": "2020-05-20T07:42:38Z"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|status|[AdminRequestStatus](#schemaadminrequeststatus)|true|none|none|
|updatedAt|string(date-time)|true|none|none|

<h2 id="tocSadminrequestparams">AdminRequestParams</h2>

<a id="schemaadminrequestparams"></a>

```json
{
  "hin": "string",
  "type": "withdrawal",
  "description": "string",
  "asset": "ETH",
  "amount": 0,
  "fee": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|hin|string|true|none|none|
|type|[AdminRequestType](#schemaadminrequesttype)|true|none|none|
|description|string\|null|false|none|none|
|asset|[CurrencyCode](#schemacurrencycode)|true|none|none|
|amount|number(double)|true|none|none|
|fee|number(double)\|null|false|none|none|

<h2 id="tocScreateadminrequestparams">CreateAdminRequestParams</h2>

<a id="schemacreateadminrequestparams"></a>

```json
{
  "client": "string",
  "hin": "string",
  "type": "withdrawal",
  "description": "string",
  "asset": "ETH",
  "amount": 0,
  "admin": "string",
  "status": "pending",
  "fee": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|client|string|true|none|none|
|hin|string|true|none|none|
|type|[AdminRequestType](#schemaadminrequesttype)|true|none|none|
|description|string\|null|false|none|none|
|asset|[CurrencyCode](#schemacurrencycode)|true|none|none|
|amount|number(double)|true|none|none|
|admin|string|true|none|none|
|status|[AdminRequestStatus](#schemaadminrequeststatus)|true|none|none|
|fee|number(double)\|null|false|none|none|

<h2 id="tocSpersonalbankdetails">PersonalBankDetails</h2>

<a id="schemapersonalbankdetails"></a>

```json
{
  "id": 0,
  "accountHolderName": "string",
  "bankName": "string",
  "iban": "string",
  "bankSwiftCode": "string",
  "routingCode": "string",
  "abaNumber": "string",
  "accountNumber": "string",
  "notes": "string",
  "bankAddress": "string",
  "accountId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|number(double)\|null|false|none|none|
|accountHolderName|string|true|none|none|
|bankName|string|true|none|none|
|iban|string\|null|false|none|none|
|bankSwiftCode|string\|null|false|none|none|
|routingCode|string\|null|false|none|none|
|abaNumber|string\|null|false|none|none|
|accountNumber|string\|null|false|none|none|
|notes|string\|null|false|none|none|
|bankAddress|string\|null|false|none|none|
|accountId|string\|null|false|none|none|

<h2 id="tocSchangepasswordrequest">ChangePasswordRequest</h2>

<a id="schemachangepasswordrequest"></a>

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|currentPassword|string|true|none|none|
|newPassword|string|true|none|none|

<h2 id="tocSaccounttype">AccountType</h2>

<a id="schemaaccounttype"></a>

```json
"individual"

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|individual|
|*anonymous*|corporate|
|*anonymous*|operator|
|*anonymous*|administrator|
|*anonymous*|kinesisRevenue|

<h2 id="tocSaccountstatus">AccountStatus</h2>

<a id="schemaaccountstatus"></a>

```json
"registered"

```

*The account status.*

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|The account status.|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|registered|
|*anonymous*|emailVerified|
|*anonymous*|kycVerified|
|*anonymous*|superUser|

<h2 id="tocSgender">Gender</h2>

<a id="schemagender"></a>

```json
"Male"

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|Male|
|*anonymous*|Female|

<h2 id="tocSaddress">Address</h2>

<a id="schemaaddress"></a>

```json
{
  "addressLine1": "string",
  "addressLine2": "string",
  "addressLine3": "string",
  "postCode": "string",
  "country": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|addressLine1|string|true|none|none|
|addressLine2|string|true|none|none|
|addressLine3|string\|null|false|none|none|
|postCode|string|true|none|none|
|country|string|true|none|none|

<h2 id="tocSkycverifiedaccountdetails">KycVerifiedAccountDetails</h2>

<a id="schemakycverifiedaccountdetails"></a>

```json
{
  "id": "string",
  "hin": "string",
  "type": "individual",
  "status": "registered",
  "email": "string",
  "passportNumber": "string",
  "passportExpiryDate": "string",
  "firstName": "string",
  "lastName": "string",
  "nationality": "string",
  "dateOfBirth": "string",
  "gender": "Male",
  "address": {
    "addressLine1": "string",
    "addressLine2": "string",
    "addressLine3": "string",
    "postCode": "string",
    "country": "string"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|hin|string|true|none|none|
|type|[AccountType](#schemaaccounttype)|true|none|none|
|status|[AccountStatus](#schemaaccountstatus)|true|none|The account status.|
|email|string|true|none|none|
|passportNumber|string\|null|false|none|none|
|passportExpiryDate|string\|null|false|none|none|
|firstName|string\|null|false|none|none|
|lastName|string\|null|false|none|none|
|nationality|string\|null|false|none|none|
|dateOfBirth|string\|null|false|none|none|
|gender|[Gender](#schemagender)|false|none|none|
|address|[Address](#schemaaddress)|false|none|none|

<h2 id="tocScreateaccountrequest">CreateAccountRequest</h2>

<a id="schemacreateaccountrequest"></a>

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "referrerHin": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string|true|none|none|
|password|string|true|none|none|
|firstName|string\|null|false|none|none|
|lastName|string\|null|false|none|none|
|referrerHin|string\|null|false|none|none|

<h2 id="tocSverifyaccountrequest">VerifyAccountRequest</h2>

<a id="schemaverifyaccountrequest"></a>

```json
{
  "userToken": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|userToken|string\|null|false|none|none|

<h2 id="tocSuserpublicview">UserPublicView</h2>

<a id="schemauserpublicview"></a>

```json
{
  "mfaEnabled": true,
  "accountType": "individual",
  "status": "registered",
  "hin": "string",
  "hasTriggeredKycCheck": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|mfaEnabled|boolean|true|none|True if MFA has been enabled by the user.|
|accountType|[AccountType](#schemaaccounttype)|true|none|The type of the owner account.|
|status|[AccountStatus](#schemaaccountstatus)|true|none|The status of the owner account.|
|hin|string|true|none|The hin of the owner account|
|hasTriggeredKycCheck|boolean\|null|false|none|The hasTriggeredKycCheck value of the owner account|

<h2 id="tocSstatuschangerequest">StatusChangeRequest</h2>

<a id="schemastatuschangerequest"></a>

```json
{
  "status": "registered"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|status|[AccountStatus](#schemaaccountstatus)|true|none|The account status.|

<h2 id="tocSaccountsuspensionchangerequest">AccountSuspensionChangeRequest</h2>

<a id="schemaaccountsuspensionchangerequest"></a>

```json
{
  "suspended": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|suspended|boolean|true|none|none|

<h2 id="tocSmfastatusresponse">MfaStatusResponse</h2>

<a id="schemamfastatusresponse"></a>

```json
{
  "enabled": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|enabled|boolean|true|none|none|

<h2 id="tocSpartialmfa">PartialMFA</h2>

<a id="schemapartialmfa"></a>

```json
{}

```

*Make all properties in T optional*

### Properties

*None*

<h2 id="tocSsendresetpasswordemailrequest">SendResetPasswordEmailRequest</h2>

<a id="schemasendresetpasswordemailrequest"></a>

```json
{
  "email": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string|true|none|none|

<h2 id="tocSresetpasswordrequest">ResetPasswordRequest</h2>

<a id="schemaresetpasswordrequest"></a>

```json
{
  "userId": "string",
  "newPassword": "string",
  "newPasswordRetyped": "string",
  "token": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|userId|string|true|none|none|
|newPassword|string|true|none|none|
|newPasswordRetyped|string|true|none|none|
|token|string|true|none|none|

<h2 id="tocSloginrequest">LoginRequest</h2>

<a id="schemaloginrequest"></a>

```json
{
  "email": "string",
  "password": "string",
  "mfaToken": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string|true|none|none|
|password|string|true|none|none|
|mfaToken|string\|null|false|none|none|

<h2 id="tocStokenresponse">TokenResponse</h2>

<a id="schematokenresponse"></a>

```json
{
  "id": "string",
  "token": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|token|string|true|none|none|

<h2 id="tocStokenrequest">TokenRequest</h2>

<a id="schematokenrequest"></a>

```json
{
  "email": "string",
  "password": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string|true|none|none|
|password|string|true|none|none|

<h2 id="tocSaccounttypeupdaterequest">AccountTypeUpdateRequest</h2>

<a id="schemaaccounttypeupdaterequest"></a>

```json
{
  "email": "string",
  "type": "individual"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string|true|none|none|
|type|[AccountType](#schemaaccounttype)|true|none|none|

<h2 id="tocSaccountstatusupdaterequest">AccountStatusUpdateRequest</h2>

<a id="schemaaccountstatusupdaterequest"></a>

```json
{
  "email": "string",
  "status": "registered",
  "enableMfa": true,
  "hasTriggeredKycCheck": true,
  "suspended": true,
  "hasLogged": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string|true|none|none|
|status|[AccountStatus](#schemaaccountstatus)|true|none|The account status.|
|enableMfa|boolean\|null|false|none|none|
|hasTriggeredKycCheck|boolean\|null|false|none|none|
|suspended|boolean\|null|false|none|none|
|hasLogged|boolean\|null|false|none|none|

<h2 id="tocSbalanceamount">BalanceAmount</h2>

<a id="schemabalanceamount"></a>

```json
{
  "amount": 0,
  "preferredCurrencyAmount": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|amount|number(double)|true|none|none|
|preferredCurrencyAmount|number(double)|true|none|none|

<h2 id="tocSedisplayformats">EDisplayFormats</h2>

<a id="schemaedisplayformats"></a>

```json
"0"

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|0|
|*anonymous*|1|

<h2 id="tocSpreferredcurrencyenrichedbalance">PreferredCurrencyEnrichedBalance</h2>

<a id="schemapreferredcurrencyenrichedbalance"></a>

```json
{
  "currency": "ETH",
  "total": {
    "amount": 0,
    "preferredCurrencyAmount": 0
  },
  "available": {
    "amount": 0,
    "preferredCurrencyAmount": 0
  },
  "reserved": {
    "amount": 0,
    "preferredCurrencyAmount": 0
  },
  "pendingDeposit": {
    "amount": 0,
    "preferredCurrencyAmount": 0
  },
  "pendingWithdrawal": {
    "amount": 0,
    "preferredCurrencyAmount": 0
  },
  "pendingRedemption": {
    "amount": 0,
    "preferredCurrencyAmount": 0
  },
  "pendingDebitCardTopUp": {
    "amount": 0,
    "preferredCurrencyAmount": 0
  },
  "displayFormat": "0"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|currency|[CurrencyCode](#schemacurrencycode)|true|none|none|
|total|[BalanceAmount](#schemabalanceamount)|true|none|none|
|available|[BalanceAmount](#schemabalanceamount)|true|none|none|
|reserved|[BalanceAmount](#schemabalanceamount)|true|none|none|
|pendingDeposit|[BalanceAmount](#schemabalanceamount)|true|none|none|
|pendingWithdrawal|[BalanceAmount](#schemabalanceamount)|true|none|none|
|pendingRedemption|[BalanceAmount](#schemabalanceamount)|true|none|none|
|pendingDebitCardTopUp|[BalanceAmount](#schemabalanceamount)|true|none|none|
|displayFormat|[EDisplayFormats](#schemaedisplayformats)|false|none|none|

<h2 id="tocScompletebalancedetails">CompleteBalanceDetails</h2>

<a id="schemacompletebalancedetails"></a>

```json
{
  "accountId": "string",
  "preferredCurrencyTotal": 0,
  "balances": [
    {
      "currency": "ETH",
      "total": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "available": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "reserved": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "pendingDeposit": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "pendingWithdrawal": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "pendingRedemption": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "pendingDebitCardTopUp": {
        "amount": 0,
        "preferredCurrencyAmount": 0
      },
      "displayFormat": "0"
    }
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|accountId|string|true|none|none|
|preferredCurrencyTotal|number(double)|true|none|none|
|balances|[[PreferredCurrencyEnrichedBalance](#schemapreferredcurrencyenrichedbalance)]|true|none|none|

<h2 id="tocSvaultpersistrequest">VaultPersistRequest</h2>

<a id="schemavaultpersistrequest"></a>

```json
{
  "publicKey": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|publicKey|string|true|none|none|

<h2 id="tocSrecord">Record</h2>

<a id="schemarecord"></a>

```json
{}

```

*Construct a type with a set of properties K of type T*

### Properties

*None*

<h2 id="tocSemailtemplates">EmailTemplates</h2>

<a id="schemaemailtemplates"></a>

```json
"Kinesis Money Welcome Email"

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|Kinesis Money Welcome Email|
|*anonymous*|Kinesis Money Verify Email Resend|
|*anonymous*|Kinesis Money Referral Link Email|
|*anonymous*|Kinesis Money Account Suspension|
|*anonymous*|Kinesis Money Account Reactivation|
|*anonymous*|Kinesis Money Withdrawal Request|
|*anonymous*|Kinesis Money Crypto Withdraw Success|
|*anonymous*|Kinesis Money Reset Password Request|
|*anonymous*|Kinesis Money Password Reset Confirmation|
|*anonymous*|Kinesis Money Trade Confirmation v2|
|*anonymous*|Kinesis Money Deposit Success|
|*anonymous*|Kinesis Money Suspended Account Crypto Deposit|

<h2 id="tocSemailcheckrequestbody">EmailCheckRequestBody</h2>

<a id="schemaemailcheckrequestbody"></a>

```json
{
  "email": "string",
  "template": "Kinesis Money Welcome Email",
  "from": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|email|string|true|none|none|
|template|[EmailTemplates](#schemaemailtemplates)|true|none|none|
|from|string\|null|false|none|none|

<h2 id="tocScurrency">Currency</h2>

<a id="schemacurrency"></a>

```json
{
  "id": 0,
  "code": "ETH",
  "symbolSortPriority": 0,
  "currencyOrderPriority": 0,
  "isEnabled": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|number(double)|true|none|none|
|code|[CurrencyCode](#schemacurrencycode)|true|none|none|
|symbolSortPriority|number(double)\|null|false|none|none|
|currencyOrderPriority|number(double)\|null|false|none|none|
|isEnabled|boolean\|null|false|none|none|

<h2 id="tocSsupportedfeatureflags">SupportedFeatureFlags</h2>

<a id="schemasupportedfeatureflags"></a>

```json
"debit_card"

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|debit_card|
|*anonymous*|BTC|
|*anonymous*|TETHER|
|*anonymous*|BTC_KAU|
|*anonymous*|BTC_KAG|
|*anonymous*|ETH_BTC|
|*anonymous*|BTC_USD|
|*anonymous*|BTC_EUR|
|*anonymous*|BTC_GBP|
|*anonymous*|KVT_BTC|
|*anonymous*|KVT_USDT|
|*anonymous*|KAU_USDT|
|*anonymous*|KAG_USDT|
|*anonymous*|ETH_USDT|
|*anonymous*|BTC_USDT|
|*anonymous*|USDT_EUR|
|*anonymous*|USDT_USD|

<h2 id="tocSfeatureflag">FeatureFlag</h2>

<a id="schemafeatureflag"></a>

```json
{
  "name": "debit_card",
  "enabled": {}
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|name|[SupportedFeatureFlags](#schemasupportedfeatureflags)|true|none|none|
|enabled|object|true|none|none|

<h2 id="tocSsymbolpairapiresponse">SymbolPairApiResponse</h2>

<a id="schemasymbolpairapiresponse"></a>

```json
{
  "id": "string",
  "base": "ETH",
  "quote": "ETH",
  "fee": "ETH",
  "orderRange": {},
  "sortOrder": {}
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|base|[CurrencyCode](#schemacurrencycode)|true|none|The base currency details.|
|quote|[CurrencyCode](#schemacurrencycode)|true|none|The quote currency details.|
|fee|[CurrencyCode](#schemacurrencycode)|true|none|The fee that the currency comes out of|
|orderRange|object\|null|false|none|The percentage used to limit order price ranges.|
|sortOrder|object\|null|false|none|none|

<h2 id="tocSmobileversions">MobileVersions</h2>

<a id="schemamobileversions"></a>

```json
{
  "ios": "string",
  "android": "string",
  "forceVersionUpdate": true
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|ios|string|true|none|none|
|android|string|true|none|none|
|forceVersionUpdate|boolean|true|none|none|

<h2 id="tocSwithdrawalrequestparams">WithdrawalRequestParams</h2>

<a id="schemawithdrawalrequestparams"></a>

```json
{
  "address": "string",
  "amount": 0,
  "currencyCode": "ETH",
  "memo": "string"
}

```

*interface for withdrawals controller request to create a new withdrawal*

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|address|string\|null|false|none|none|
|amount|number(double)|true|none|none|
|currencyCode|[CurrencyCode](#schemacurrencycode)|true|none|none|
|memo|string\|null|false|none|none|

<h2 id="tocSpartialcurrencywithdrawalconfig">PartialCurrencyWithdrawalConfig</h2>

<a id="schemapartialcurrencywithdrawalconfig"></a>

```json
{}

```

*Make all properties in T optional*

### Properties

*None*

<h2 id="tocScontactcreaterequest">ContactCreateRequest</h2>

<a id="schemacontactcreaterequest"></a>

```json
{
  "currency": "ETH",
  "name": "string",
  "publicKey": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|currency|[CurrencyCode](#schemacurrencycode)|true|none|none|
|name|string|true|none|none|
|publicKey|string|true|none|none|

<h2 id="tocStradetransaction">TradeTransaction</h2>

<a id="schematradetransaction"></a>

```json
{
  "id": 0,
  "counterTradeTransactionId": 0,
  "counterTrade": null,
  "direction": "buy",
  "symbolId": "string",
  "accountId": "string",
  "orderId": 0,
  "amount": 0,
  "matchPrice": 0,
  "fee": 0,
  "feeCurrencyId": 0,
  "feeRate": 0,
  "taxRate": 0,
  "taxAmountCHF": 0,
  "taxAmountFeeCurrency": 0,
  "baseFiatConversion": 0,
  "quoteFiatConversion": 0,
  "fiatCurrencyCode": "CurrencyCode",
  "createdAt": "2020-05-20T07:42:38Z",
  "updatedAt": "2020-05-20T07:42:38Z"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|number(double)\|null|false|none|none|
|counterTradeTransactionId|number(double)|true|none|none|
|counterTrade|[TradeTransaction](#schematradetransaction)|false|none|none|
|direction|[OrderDirection](#schemaorderdirection)|true|none|none|
|symbolId|string|true|none|none|
|accountId|string|true|none|none|
|orderId|number(double)|true|none|none|
|amount|number(double)|true|none|none|
|matchPrice|number(double)|true|none|none|
|fee|number(double)|true|none|none|
|feeCurrencyId|number(double)|true|none|none|
|feeRate|number(double)|true|none|none|
|taxRate|number(double)|true|none|none|
|taxAmountCHF|number(double)|true|none|none|
|taxAmountFeeCurrency|number(double)|true|none|none|
|baseFiatConversion|number(double)|true|none|none|
|quoteFiatConversion|number(double)|true|none|none|
|fiatCurrencyCode|[FiatCurrency](#schemafiatcurrency)|true|none|none|
|createdAt|string(date-time)\|null|false|none|none|
|updatedAt|string(date-time)\|null|false|none|none|

<h2 id="tocSorderdirection">OrderDirection</h2>

<a id="schemaorderdirection"></a>

```json
"buy"

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|buy|
|*anonymous*|sell|

<h2 id="tocSfiatcurrency">FiatCurrency</h2>

<a id="schemafiatcurrency"></a>

```json
"CurrencyCode"

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|CurrencyCode|
|*anonymous*|CurrencyCode|
|*anonymous*|CurrencyCode|

<h2 id="tocSorderwithtradetransactions">OrderWithTradeTransactions</h2>

<a id="schemaorderwithtradetransactions"></a>

```json
{
  "transactions": [
    {
      "id": 0,
      "counterTradeTransactionId": 0,
      "counterTrade": null,
      "direction": "buy",
      "symbolId": "string",
      "accountId": "string",
      "orderId": 0,
      "amount": 0,
      "matchPrice": 0,
      "fee": 0,
      "feeCurrencyId": 0,
      "feeRate": 0,
      "taxRate": 0,
      "taxAmountCHF": 0,
      "taxAmountFeeCurrency": 0,
      "baseFiatConversion": 0,
      "quoteFiatConversion": 0,
      "fiatCurrencyCode": "CurrencyCode",
      "createdAt": "2020-05-20T07:42:38Z",
      "updatedAt": "2020-05-20T07:42:38Z"
    }
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|transactions|[[TradeTransaction](#schematradetransaction)]|true|none|none|

<h2 id="tocSfeetier">FeeTier</h2>

<a id="schemafeetier"></a>

```json
{
  "id": 0,
  "tier": 0,
  "symbolId": "string",
  "threshold": 0,
  "rate": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|number(double)\|null|false|none|none|
|tier|number(double)|true|none|The fee tier.|
|symbolId|string|true|none|The id of the targeted symbol.|
|threshold|number(double)|true|none|The tier threshold.|
|rate|number(double)|true|none|The fee rate.|

<h2 id="tocSaccountfeetier">AccountFeeTier</h2>

<a id="schemaaccountfeetier"></a>

```json
{
  "id": 0,
  "tier": 0,
  "symbolId": "string",
  "threshold": 0,
  "rate": 0,
  "accountId": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|number(double)\|null|false|none|none|
|tier|number(double)|true|none|The fee tier.|
|symbolId|string|true|none|The id of the targeted symbol.|
|threshold|number(double)|true|none|The tier threshold.|
|rate|number(double)|true|none|The fee rate.|
|accountId|string|true|none|The id of the targetAddress account.|

<h2 id="tocSorderstatus">OrderStatus</h2>

<a id="schemaorderstatus"></a>

```json
"submit"

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|*anonymous*|submit|
|*anonymous*|partialFill|
|*anonymous*|cancel|
|*anonymous*|pendingCancel|
|*anonymous*|fill|

<h2 id="tocSorderadminsummary">OrderAdminSummary</h2>

<a id="schemaorderadminsummary"></a>

```json
{
  "createdAt": "2020-05-20T07:42:38Z",
  "orderId": 0,
  "client": "string",
  "hin": "string",
  "direction": "buy",
  "symbolId": "string",
  "amount": 0,
  "price": 0,
  "fee": 0,
  "feeCurrency": "string",
  "filled": 0,
  "status": "submit"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|createdAt|string(date-time)|true|none|none|
|orderId|number(double)|true|none|none|
|client|string|true|none|none|
|hin|string|true|none|none|
|direction|[OrderDirection](#schemaorderdirection)|true|none|none|
|symbolId|string|true|none|none|
|amount|number(double)|true|none|none|
|price|number(double)|true|none|none|
|fee|number(double)\|null|false|none|none|
|feeCurrency|string|true|none|none|
|filled|number(double)|true|none|none|
|status|[OrderStatus](#schemaorderstatus)|true|none|none|

<h2 id="tocSfeepool">FeePool</h2>

<a id="schemafeepool"></a>

```json
{
  "code": "ETH",
  "pool": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|code|[CurrencyCode](#schemacurrencycode)|true|none|none|
|pool|number(double)|true|none|none|

<h2 id="tocSmonthlytradesummary">MonthlyTradeSummary</h2>

<a id="schemamonthlytradesummary"></a>

```json
{
  "trades": 0,
  "volume": 0
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|trades|number(double)|true|none|The total number of trades.|
|volume|number(double)|true|none|The volume in the preferred currency.|

<h2 id="tocSaccountmonthlytradesummary">AccountMonthlyTradeSummary</h2>

<a id="schemaaccountmonthlytradesummary"></a>

```json
{
  "currentMonth": {
    "trades": 0,
    "volume": 0
  },
  "lastMonth": {
    "trades": 0,
    "volume": 0
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|currentMonth|[MonthlyTradeSummary](#schemamonthlytradesummary)|true|none|none|
|lastMonth|[MonthlyTradeSummary](#schemamonthlytradesummary)|true|none|none|

<h2 id="tocSpartialplaceorderrequest">PartialPlaceOrderRequest</h2>

<a id="schemapartialplaceorderrequest"></a>

```json
{}

```

*Make all properties in T optional*

### Properties

*None*

