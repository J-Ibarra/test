const fs = require('fs');
const glob = require('glob');

const output = {};

const info = {
  "title": "Kinesis Exchange API",
  "version": process.env.TRAVIS_TAG || '1.2.0'
};

glob('../../**/dist/swagger.json', (error, files) => {
  files.forEach((filename) => {
    const contents = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (Object.keys(output).length === 0) {
      Object.assign(output, contents);
    } else {
      const definitions = output["definitions"];
      const paths = output["paths"];
      output["definitions"] = Object.assign(definitions, contents["definitions"]);
      output["paths"] = Object.assign(paths, contents["paths"]);
    }
  });

  output["info"] = info;
  fs.writeFileSync('swagger.json', JSON.stringify(output));
});
