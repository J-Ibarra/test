# Slate API docs

Responsible for merging the `swagger.json` docs generated for each service and rendering them in a `slate` template.

[widdershins](https://github.com/Mermade/widdershins) is used to convert the swagger.json docs to slate.

## How to run

After building the other services (running `npm run build` at the root of the repo), run `npm run build:docs` to generate a merged, compiled slate version of the docs for all services.

The static docs resources would be generated in the `./build` folder.
To access the locally you can use [http-server](https://www.npmjs.com/package/http-server) npm package and run `http-server . -p 3111` in the `./build` folder

## How to override documentation structure

Templates used to generate the documentation are in the `./user-templates` folder. In case a change
in the layout/structure of the documentation is needed, changes should take place there.
