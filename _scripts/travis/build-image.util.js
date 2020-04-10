'use strict'
const { spawn } = require('child_process');

const RETRY_BUILD_TIMES = 3;
const passedParameter = process.argv.slice(2)[0];

const retryImageBuild = (times = 1, commandPassed = false) => {
    if (times > RETRY_BUILD_TIMES || commandPassed) {
        return;
    }
    
    executeBuildImageCommand();
}


const executeBuildImageCommand = () => {
    const process = spawn(
        'lerna run build-image-latest',
        ['--scope', passedParameter, '--since', 'develop']
    );

    process.stdout.on('data', (data) => {
        console.log(`lerna run build-image-latest success: ${data}`);
    });
    
    process.stderr.on('data', (data) => {
        console.error(`lerna run build-image-latest error: ${data}`);
        retryImageBuild(++times, false);
    });
    
    process.on('close', (code) => {
        console.log(`lerna run build-image-latest exited with code ${code}`);
        retryImageBuild(++times, code === 0);
    });
}

retryImageBuild();
