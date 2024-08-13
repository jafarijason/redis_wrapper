import _ from 'lodash';
import {
    redisWrapperInit,
    redisWrapperEndAllSessions,
    redisWrapperEndSession,
    waitForRedisWrapperSession,
    testConnectionRedisWrapperSession,
    testConnectionRedisWrapperAllSessions,
    getRedisWrapperClient,
    waitForRedisWrapperAllSessions
} from './src/index';

import { setTimeout } from 'timers/promises';

jest.mock('ioredis', () => require('ioredis-mock'));

describe('Redis Wrapper Tests', () => {
    const redisClientName = 'testClient';
    const redisConnectConfig = {
        host: 'localhost',
        port: 6379,
        password: 'password',
        username: 'username',
        channel: 0,
    };

    beforeEach(() => {
        redisWrapperEndAllSessions();
    });

    test('should initialize Redis client and test connection works', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        const client = getRedisWrapperClient(redisClientName)
        expect(client).toBeDefined();
        const result = await testConnectionRedisWrapperSession(redisClientName)
        expect(result).toBe(true)
    });
    test('should initialize Redis client and test connection for all sessions', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        redisWrapperInit(redisClientName, redisConnectConfig);
        const client = getRedisWrapperClient(redisClientName)
        expect(client).toBeDefined();
        const result = await testConnectionRedisWrapperAllSessions()
        expect(result).toBe(true)
    });




    test('should initialize Redis client and test connection not works if ping not response PONG', async () => {

        redisWrapperInit(redisClientName, redisConnectConfig);
        const client = getRedisWrapperClient(redisClientName)
        expect(client).toBeDefined();
        await setTimeout(500)
        client.ping = jest.fn().mockResolvedValue('NOT_PONG');

        const result = await testConnectionRedisWrapperSession(redisClientName);
        expect(result).toBe(false);

    });
    test('should initialize Redis client and test connection if ping error', async () => {

        redisWrapperInit(redisClientName, redisConnectConfig);
        const client = getRedisWrapperClient(redisClientName)
        expect(client).toBeDefined();
        await setTimeout(500)
        client.ping = jest.fn().mockRejectedValue('error');

        const result = await testConnectionRedisWrapperSession(redisClientName);
        expect(result).toBe(false);

    });


    test('should initialize Redis client and test connection for all sessions', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        redisWrapperInit(`${redisClientName}1`, redisConnectConfig);
        const client = getRedisWrapperClient(`${redisClientName}1`)
        expect(client).toBeDefined();
        await setTimeout(500)
        client.ping = jest.fn().mockRejectedValue('error');
        const result = await testConnectionRedisWrapperAllSessions()

        expect(result).toBe(false)
    });

    test('should waitForRedisWrapperAllSessions  ', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        redisWrapperInit(`${redisClientName}1`, redisConnectConfig);
        await waitForRedisWrapperAllSessions()
    });
    test('should waitForRedisWrapperSession  ', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        await waitForRedisWrapperSession(redisClientName, 1)
    });
    test('should redisWrapperEndSession  ', async () => {
        redisWrapperInit('test', {});
        const result = redisWrapperEndSession('test')


        expect(result).toBe(null);
    });
    test('should testConnectionRedisWrapperSession  ', async () => {
        redisWrapperInit('test', {});
        const result = await testConnectionRedisWrapperSession('test')


        expect(result).toBe(null);
    });
    test('should waitForRedisWrapperSession  ', async () => {
        redisWrapperInit('test', {});
        const result = await waitForRedisWrapperSession('test')


        expect(result).toBe(null);
    });

    test('should waitForRedisWrapperAllSessions  ', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        redisWrapperInit(`${redisClientName}1`, redisConnectConfig);
        const client = getRedisWrapperClient(`${redisClientName}1`)
        client.ping = jest.fn().mockRejectedValue('error');
        await setTimeout(500)
        // Set up a function to catch the thrown error
        const waitForAllSessions = async () => {
            try {
                await waitForRedisWrapperAllSessions(1);
            } catch (error) {
                return error;
            }
        };

        // Run the test and expect it to throw an error
        const error = await waitForAllSessions();
        expect(error).toBeDefined();
        expect(error.message).toBe('can not connect for testClient1 after 1 Sec');
    });


    test('Coverage test', async () => {
        const client = getRedisWrapperClient(redisClientName)
        expect(client).toBeDefined();
    });


});
