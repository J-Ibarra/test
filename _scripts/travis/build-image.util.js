'use strict'
const exec = require('child_process').exec;

const RETRY_REPEATED = 3;
const passedParameter = process.argv.slice(2)[0];

const retryImageBuild = (times = 1, commandPassed = false) => {
    if (times > RETRY_REPEATED || commandPassed) {
        return;
    }
    
    const result = executeBuildImageCommand();
    retryImageBuild(++times, result);
}


const executeBuildImageCommand = () => {
    exec(`lerna run build-image-latest --scope ${passedParameter} --since develop`,
    (error, stdout, stderr) => {
        if (error !== null) {
            console.log(`executeBuildImageCommand error: ${error}`);
            return false;
        }
        
        return true;
    });
}

retryImageBuild();
