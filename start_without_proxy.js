// 1. read proxies from file
const fs = require('fs')
const path = require('path')

// 2. start pm2 with PROXY env
const { execSync } = require('child_process')
const USER = process.env.APP_USER || ''
const PASSWORD = process.env.APP_PASS || ''

if (!USER || !PASSWORD) {
  console.error("Please set APP_USER and APP_PASS env variables")
  process.exit()
}

const name = "gradient"
execSync(`APP_USER='${USER}' APP_PASS='${PASSWORD}' pm2 start app_without_proxy.js --name ${name}`)

// 3. save proxies to file
console.log('-> √ All proxies started!')

// 4. pm2 status
execSync('pm2 status')
