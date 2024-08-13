
import IORedis from "ioredis"
import _ from "lodash"

export const redisWrapperDbs: any = {}

import debug from 'debug'
import { setTimeout } from "timers/promises"

const redisWrapperDebug = debug('redisWrapperDebug')


export const redisWrapperInit = (redisClientName: String, redisConnectConfig, otherOptions = {}) => {


    if (!_.has(redisWrapperDbs, redisClientName)) {
        const dbObj = {
            redisClientName,
            redisConnectConfig,
            clientInfo: {
                isInit: false
            },
            init: function () {
                if (!this.clientInfo.isInit) {
                    this.client = new IORedis(
                        this.redisConnectConfig.port,
                        this.redisConnectConfig.host,
                        {
                            password: this.redisConnectConfig.password,
                            username: this.redisConnectConfig.username,
                            db: this.redisConnectConfig.channel,
                            ...otherOptions
                        }
                    )
                    redisWrapperDebug(`init ${this.redisClientName} changed to true`)
                    this.clientInfo.isInit = true
                }

            },
            client: null,
            getClient: function () {
                this.init()
                return this.client
            },
            testConnection: async function () {
                this.init()
                const testResult = await this.client.ping().catch((err) => {
                    console.error(`WARNING: Cache connection test failed:`, err.message)
                    return null
                })
                const result = testResult === "PONG"
                redisWrapperDebug(`testResult ${this.redisClientName} ${result}`)
                return result
            },
            waitForConnection: async function (timeOut = 10) {
                console.log(`Wait for connection ${this.redisClientName}`)
                const startTime = Date.now();
                let counter = 0
                await setTimeout(100)
                while (true) {
                    await setTimeout(500)
                    counter += 1
                    if (Date.now() - startTime > timeOut * 1000) {
                        throw new Error(`can not connect for ${this.redisClientName} after ${timeOut} Sec`);
                    }

                    const isConnected = await this.testConnection()
                    if (isConnected === true) {
                        console.log(`Success connection for ${this.redisClientName}`)
                        return 'success'
                    }
                    console.log(`${this.redisClientName} is not connected yet, count ${counter} will try 0.5 sec again`)
                }
            },
        }

        _.set(redisWrapperDbs, redisClientName, dbObj)
        dbObj.init()

        return dbObj
    }

    return _.get(redisWrapperDbs, redisClientName)


}

export const getRedisWrapperClient = (redisClientName: string) => {
    const redisObj = _.get(redisWrapperDbs, redisClientName, {})
    if (!redisObj?.clientInfo?.isInit) {
        console.error(`client with ${redisClientName} isn not instantiated yet`)
        return null
    }
    return redisObj.client
}

export const redisWrapperEndSession = (redisClientName: string) => {
    const redisObj = _.get(redisWrapperDbs, redisClientName, {})
    if (!redisObj?.clientInfo?.isInit) {
        console.error(`client with ${redisClientName} isn not instantiated yet`)
        return null
    }
    redisWrapperDebug(`ending session for ${redisClientName}`)
    redisObj.client.disconnect()
    delete redisWrapperDbs[redisClientName]
}

export const redisWrapperEndAllSessions = () => {
    for (const redisClientName of Object.keys(redisWrapperDbs)) {
        redisWrapperEndSession(redisClientName)
    }
}

export const waitForRedisWrapperSession = async (redisClientName: string, timeOut = 10) => {
    const redisObj = _.get(redisWrapperDbs, redisClientName, {})
    if (!redisObj?.clientInfo?.isInit) {
        console.error(`client with ${redisClientName} isn not instantiated yet`)
        return null
    }
    await redisObj.waitForConnection(timeOut)
}

export const waitForRedisWrapperAllSessions = async (timeOut = 10) => {
    await Promise.all(Object.keys(redisWrapperDbs).map((redisClientName) => waitForRedisWrapperSession(redisClientName, timeOut)))
}

export const testConnectionRedisWrapperSession = async (redisClientName: string) => {
    const redisObj = _.get(redisWrapperDbs, redisClientName, {})
    if (!redisObj?.clientInfo?.isInit) {
        console.error(`client with ${redisClientName} isn not instantiated yet`)
        return null
    }
    return await redisObj.testConnection()
}

export const testConnectionRedisWrapperAllSessions = async (redisClientName: string) => {
    const result = await Promise.all(Object.keys(redisWrapperDbs).map((redisClientName) => testConnectionRedisWrapperSession(redisClientName)))
    if (result.includes(false) || result.includes(null)) {
        return false
    }

    return true
}
