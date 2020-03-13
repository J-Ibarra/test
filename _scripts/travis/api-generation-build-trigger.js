'use strict'
const request = require('request')

triggerApiDocGeneration()

async function triggerApiDocGeneration() {
  await new Promise(resolve => {
    request.post(
      `https://api.travis-ci.com/repo/bullioncapital%2Fsecondary-exchange-services/requests`,
      {
        method: 'POST',
        body: JSON.stringify({
          request: {
            branch: 'api-doc-generation',
            message: 'Triggered by Travis CI',
          },
        }),
        headers: {
          'content-type': 'application/json',
          Accept: 'application/json',
          'Travis-API-Version': 3,
          Authorization: `token ${process.env.TRAVIS_ACCESS_TOKEN}`,
        },
      },
      err => {
        if (!!err) {
          console.log(JSON.stringify(err))
        }

        resolve()
      },
    )
  })

  console.log(`API Doc generation triggered`)
}
