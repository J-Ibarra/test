'use strict'
const {
  spawn
} = require('child_process')

const RETRY_BUILD_TIMES = 3
const passedParameter = process.argv.slice(2)[0]
let attempts = 1

/**
 * The `lerna run bootstrap` command in the docker images 
 * can be a bit flakey at times and fail due to some file watcher issues.
 * Since we don't want that to fail the build we retry a total of 3 times before failing the docker build step.
 */
const retryImageBuild = (commandPassed = false) => {
  if (commandPassed) {
    return
  } else if (attempts > RETRY_BUILD_TIMES) {
    // The image build failed, this will fail the Travis build
    process.exit(1)
  }

  executeBuildImageCommand()
}

const executeBuildImageCommand = () => {
  const process = spawn('lerna', ['run', 'build-image-latest', '--scope', passedParameter, '--since', 'develop'])

  process.stdout.on('data', (data) => {
    console.log(`${data}`)
  })

  process.stderr.on('data', (data) => {
    console.error(`${data}`)
  })

  process.on('close', (code) => {
    console.log(`lerna run build-image-latest exited with code ${code}`)
    attempts++
    retryImageBuild(code === 0)
  })
}

retryImageBuild()
