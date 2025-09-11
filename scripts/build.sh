#!/usr/bin/env bash

set -e

if [ ! -d node_modules ]; then
	echo "[B] Run 'npm install' first"
	exit 1
fi


clean() {
  echo 'Cleaning...'
  rm -f .babelrc
  rm -rf lib/*
  node scripts/version.js > lib/version.json
  node scripts/assemble_lua.js > lib/lua.json
}

makeLib10() {
  echo '[B] Compiling Bottleneck to Node 10+ with TypeScript...'
  npx tsc --project tsconfig.json
}

makeLib6() {
  echo '[B] Compiling Bottleneck to Node 6+ with TypeScript and Babel...'
  npx tsc --project tsconfig.json --target ES2015
  # Then transpile with Babel for Node 6+ compatibility
  ln -s .babelrc.lib .babelrc
  npx babel lib --out-dir lib --extensions .js
}

makeES5() {
  echo '[B] Compiling Bottleneck to ES5 with TypeScript and Babel...'
  npx tsc --project tsconfig.json --target ES2015
  # Then transpile with Babel for ES5 compatibility
  ln -s .babelrc.es5 .babelrc
  npx babel lib --out-dir lib --extensions .js

  echo '[B] Assembling ES5 bundle...'
  npx rollup -c rollup.config.es5.js
}

makeLight() {
  makeLib10

  echo '[B] Assembling light bundle...'
  npx rollup -c rollup.config.light.js
}

makeTypings() {
  echo '[B] Compiling and testing TS typings...'
  npx ejs-cli bottleneck.d.ts.ejs > bottleneck.d.ts
  npx ejs-cli light.d.ts.ejs > light.d.ts
  npx tsc --noEmit --strict test.ts
}

if [ "$1" = 'dev' ]; then
  clean
  makeLib10
elif [ "$1" = 'bench' ]; then
  clean
  makeLib6
elif [ "$1" = 'es5' ]; then
  clean
  makeES5
elif [ "$1" = 'light' ]; then
  clean
  makeLight
elif [ "$1" = 'typings' ]; then
  makeTypings
else
  clean
  makeES5

  clean
  makeLight

  clean
  makeLib6
  makeTypings
fi

rm -f .babelrc

echo '[B] Done!'
