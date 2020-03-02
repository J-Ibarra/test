# Slate API docs

## How to run ?

### To develop
1. `npm run start` will start the dev server that host and watch the file from `./source`.
2. After compile the whole other services, run `npm run mergeSwagger` to merge all the `swagger.json` into one file.
3. Run `npm run convert` will convert the `swagger.json` to slate readable file `index.html.md`

### To build
`npm run build` will generate the static file in `./build`. And you can host the output on any hosting server such as *S3*.

