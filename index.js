#! /usr/bin/env node

import init from './init.js'

const currentNodeVersion = process.versions.node

if (currentNodeVersion.split('.')[0] < 14) {
  console.error(
    'You are running Node ' +
      currentNodeVersion +
      '.\n' +
      'Create React App requires Node 14 or higher. \n' +
      'Please update your version of Node.'
  )
  process.exit(1)
}

init()
