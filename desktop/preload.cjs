const { contextBridge } = require('electron')

const apiArgument = process.argv.find(argument => argument.startsWith('--desens-api-base-url='))
const apiBaseUrl = apiArgument ? apiArgument.slice('--desens-api-base-url='.length) : ''

contextBridge.exposeInMainWorld('desensDesktop', Object.freeze({ apiBaseUrl, platform: process.platform }))
