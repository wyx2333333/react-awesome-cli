import fs from 'fs'
import os from 'os'
import path from 'path'
import https from 'https'
import { execSync } from 'child_process'

import semver from 'semver'
import clear from 'clear'
import figlet from 'figlet'
import { sync as commandExistsSync } from 'command-exists'
import inquirer from 'inquirer'
import ora from 'ora'
import chalk from 'chalk'
import { createCommand } from 'commander'

const spinner = ora()

const templates = {
  default: {
    name: 'Defaut: React + React Router + Vite + Axios + SWR + Zustand + Tailwindcss + ESLint + Prettier',
    value: 'https://github.com/wyx2333333/react-awesome-template',
  },
}

const util = {
  log(text = '', color = 'white') {
    console.log(chalk[color](text))
  },
  getPackageJson(path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  },
  spinner(step, text) {
    if ('start' === step) {
      spinner.start(text)
    } else {
      spinner.succeed(text)
    }
    util.log()
  },
}

const packageJson = util.getPackageJson(
  new URL('./package.json', import.meta.url)
)

export default function init() {
  createCommand(packageJson.name)
    .version(packageJson.version)
    .action(async () => {
      try {
        clear()

        logFiglet()
        await checkUpgrade()

        const projectName = await createProject()
        const templateUrl = await chooseTemplate()

        util.spinner('start', 'Initializing...')
        util.log()
        downloadTemplate(templateUrl, projectName)
        initTemplate(projectName)
        util.spinner('end', 'Complete initialization!')

        util.spinner(
          'start',
          'Installing packages. This might take a couple of minutes...'
        )
        installPackages()
        util.spinner('end', 'Complete installation!')

        util.log('🎉 Job done!', 'green')
        process.exit(1)
      } catch (error) {
        util.log()
        util.log(error, 'red')
        process.exit(1)
      }
    })
    .parse(process.argv)
}

function checkUpgrade() {
  return new Promise(resolve => {
    https
      .get(
        `https://registry.npmjs.org/-/package/${packageJson.name}/dist-tags`,
        res => {
          if (res.statusCode === 200) {
            let body = ''
            res.on('data', data => (body += data))
            res.on('end', () => {
              const latest = JSON.parse(body).latest
              if (semver.lt(packageJson.version, latest)) {
                util.log(`Update available: ${latest}`, 'yellow')
                util.log()
              }
              resolve()
            })
          } else {
            resolve()
          }
        }
      )
      .on('error', () => resolve())
  })
}

function logFiglet() {
  const text = figlet.textSync('R  A  C')
  util.log(text, 'green')
}

async function createProject() {
  const { projectName } = await inquirer.prompt([
    {
      name: 'projectName',
      type: 'input',
      message: 'Project Name:',
      default: 'react-awesome-project',
      validate: function (value) {
        if (!!!value.trim().length)
          return 'Please specify the project directory'

        if (fs.existsSync(`./${value}`))
          return 'The project directory already exists'

        return true
      },
    },
  ])

  util.log()

  return Promise.resolve(projectName)
}

async function chooseTemplate() {
  const { templateUrl } = await inquirer.prompt([
    {
      name: 'templateUrl',
      type: 'list',
      message: 'Target Template:',
      choices: Object.keys(templates).map(key => templates[key]),
      default: templates.default,
    },
  ])

  util.log()

  return Promise.resolve(templateUrl)
}

function downloadTemplate(templateUrl, projectName) {
  execSync(`git clone ${templateUrl} ${projectName}`)

  const projectPackagePath = `${projectName}/package.json`
  const projectPackageJson = util.getPackageJson(projectPackagePath)
  projectPackageJson.name = projectName
  fs.writeFileSync(
    projectPackagePath,
    JSON.stringify(projectPackageJson, null, 2) + os.EOL
  )

  util.log()
}

function initTemplate(projectName) {
  process.chdir(path.join(path.resolve(), projectName))

  fs.writeFileSync('.env', `VITE_APP_TITLE = '${projectName}'`)
  execSync(`rm -rf .git pnpm-lock.yaml LICENSE README.md`)
}

function installPackages() {
  execSync(
    commandExistsSync('pnpm')
      ? 'pnpm i'
      : commandExistsSync('yarn')
      ? 'yarn'
      : 'npm i'
  )

  util.log()
}
