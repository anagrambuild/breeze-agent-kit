#!/bin/bash -e
cd deployment/bun-runtime && npm install
cd ../..
./deployment/bun-runtime/node_modules/.bin/bun install
export PATH="$PWD/deployment/bun-runtime/node_modules/.bin:$PATH"
exec bun build src/index.ts --outdir dist --target node --sourcemap
