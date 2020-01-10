import axios from 'axios'
import moment from 'moment'

import { Environment } from '@abx-types/reference-data'
import { AccessToken, SalesforceTokenResponse } from '@abx-types/account'

const subDomain = process.env.NODE_ENV === 'production' ? 'login' : 'test'
const SALESFORCE_HOST = `https://${subDomain}.salesforce.com`
let accessData: AccessToken

export async function getSalesforceClient() {
  if (process.env.NODE_ENV === Environment.e2eLocal) {
    return axios.create({
      baseURL: 'http://localhost:9001', // The API Stub runs on this port for local E2E tests
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
  }

  if (!accessData || moment().isAfter(accessData.expiry)) {
    const token = await requestForToken()
    accessData = {
      token: token.access_token,
      instanceUrl: token.instance_url,
      expiry: moment(token.issued_at)
        .add('minutes', 110)
        .toDate(),
    }
  }

  return createSalesforceAxiosInstance({
    instanceUrl: accessData.instanceUrl,
    token: accessData.token,
  })
}

async function requestForToken(): Promise<SalesforceTokenResponse> {
  const url = `${SALESFORCE_HOST}/services/oauth2/token`
  const data = {
    grant_type: 'password',
    client_secret: process.env.SALESFORCE_CLIENT_SECRET,
    client_id: process.env.SALESFORCE_CLIENT_ID,
    username: process.env.SALESFORCE_API_ADMIN_USERNAME,
    password: process.env.SALESFORCE_API_ADMIN_PASSWORD,
  }

  const response = await axios.post(url, null, {
    params: data,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  return {
    ...response.data,
    issued_at: moment(+response.data.issued_at).toDate(),
  }
}

function createSalesforceAxiosInstance(auth: { token: string; instanceUrl: string }) {
  return axios.create({
    baseURL: `${auth.instanceUrl}/services/data/v46.0/`,
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
}
