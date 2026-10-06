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
  mkdir -p lib
  node scripts/version.js > lib/version.json
  node scripts/assemble_lua.js > lib/lua.json
}

makeLibDev() {
  echo '[B] Compiling Bottleneck with TypeScript...'
  npx tsc --project tsconfig.json
}

makeLib() {
  echo '[B] Compiling Bottleneck with TypeScript and Babel for the Node versions in .babelrc.lib...'
  npx tsc --project tsconfig.json --target ES2015
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
  npx rollup -c rollup.config.es5.mjs
}

makeLight() {
  makeLibDev

  echo '[B] Assembling light bundle...'
  npx rollup -c rollup.config.light.mjs
}

makeTypings() {
  echo '[B] Compiling and testing TS typings...'
  node scripts/render_typings.js
  npx tsc --noEmit --strict test.ts
}

if [ "$1" = 'dev' ]; then
  clean
  makeLibDev
elif [ "$1" = 'bench' ]; then
  clean
  makeLib
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
  makeLib
  makeTypings
fi

rm -f .babelrc

echo '[B] Done!'
