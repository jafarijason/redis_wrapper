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

    test('test connect', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        const client = getRedisWrapperClient(redisClientName)
        expect(client).toBeDefined();
        const result = await testConnectionRedisWrapperSession(redisClientName)
        expect(result).toBe(true)
    });

    test('test connect all sessions', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        redisWrapperInit(redisClientName, redisConnectConfig);
        const client = getRedisWrapperClient(redisClientName)
        expect(client).toBeDefined();
        const result = await testConnectionRedisWrapperAllSessions()
        expect(result).toBe(true)
    });

    test('test connect for false response', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        const client = getRedisWrapperClient(redisClientName)
        expect(client).toBeDefined();
        await setTimeout(500)
        client.ping = jest.fn().mockResolvedValue('NOT_PONG');
        const result = await testConnectionRedisWrapperSession(redisClientName);
        expect(result).toBe(false);

    });

    test('test connect for error response', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        const client = getRedisWrapperClient(redisClientName)
        expect(client).toBeDefined();
        await setTimeout(500)
        client.ping = jest.fn().mockRejectedValue('error');
        const result = await testConnectionRedisWrapperSession(redisClientName);
        expect(result).toBe(false);
    });

    test('test connect for error response for all sessions', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        redisWrapperInit(`${redisClientName}1`, redisConnectConfig);
        const client = getRedisWrapperClient(`${redisClientName}1`)
        expect(client).toBeDefined();
        await setTimeout(500)
        client.ping = jest.fn().mockRejectedValue('error');
        const result = await testConnectionRedisWrapperAllSessions()
        expect(result).toBe(false)
    });

    test('test redis functionality for 1 client', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        await waitForRedisWrapperSession(redisClientName, 1)
        const client = getRedisWrapperClient(redisClientName)
        await client.set('test_key', 'test_value')
        const value = await client.get('test_key')
        expect(value).toBe('test_value')
    });

    test('test redis functionality for multiple clients', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        redisWrapperInit(`${redisClientName}1`, redisConnectConfig);
        await waitForRedisWrapperAllSessions()
        const client = getRedisWrapperClient(redisClientName)
        await client.set('test_key', 'test_value')
        const value = await client.get('test_key')
        expect(value).toBe('test_value')
        const client1 = getRedisWrapperClient(`${redisClientName}1`)
        await client1.set('test_key', 'test_value')
        const value1 = await client1.get('test_key')
        expect(value1).toBe('test_value')
    });

    test('test redisWrapperEndSession  ', async () => {
        redisWrapperInit('test', {});
        const result = redisWrapperEndSession('test')
        expect(result).toBe(null);
    });

    test('test testConnectionRedisWrapperSession if there are miss configuration', async () => {
        redisWrapperInit('test', {});
        const result = await testConnectionRedisWrapperSession('test')


        expect(result).toBe(null);
    });

    test('test waitForRedisWrapperSession if there are miss configuration', async () => {
        redisWrapperInit('test', {});
        const result = await waitForRedisWrapperSession('test')
        expect(result).toBe(null);
    });

    test('test waitForRedisWrapperAllSessions when error comes', async () => {
        redisWrapperInit(redisClientName, redisConnectConfig);
        redisWrapperInit(`${redisClientName}1`, redisConnectConfig);
        const client = getRedisWrapperClient(`${redisClientName}1`)
        client.ping = jest.fn().mockRejectedValue('error');
        await setTimeout(500)
        const waitForAllSessions = async () => {
            try {
                await waitForRedisWrapperAllSessions(1);
            } catch (error) {
                return error;
            }
        };

        const error = await waitForAllSessions();
        expect(error).toBeDefined();
        expect(error.message).toBe('can not connect for testClient1 after 1 Sec');
    });


    test('test getRedisWrapperClient if there are miss configuration', async () => {
        const client = getRedisWrapperClient(redisClientName)
        expect(client).toBeDefined();
    });


});
