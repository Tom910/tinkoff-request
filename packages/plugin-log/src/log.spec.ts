import { Context } from '@tinkoff/request-core';
import log from './log';
import { LOG } from './constants/metaTypes';

const mockDebug = jest.fn();
const mockInfo = jest.fn();
const mockError = jest.fn();

const logger = (name) => ({
    debug: mockDebug,
    info: mockInfo,
    error: mockError,
});

const plugin = log({ logger, name: 'test' });
const next = jest.fn();
const realDateNow = Date.now;

Date.now = () => 32523523535;

describe('plugins/log', () => {
    let context: Context;

    beforeEach(() => {
        context = new Context();
        next.mockClear();
        mockDebug.mockClear();
    });

    afterAll(() => {
        Date.now = realDateNow;
    });

    it('init', () => {
        const url = 'test1';
        const query = { a: 1 };
        const payload = { b: 2 };
        const request = { query, payload, a: 1, url };

        context.setState({ request });
        plugin.init(context, next, null);

        expect(next).toHaveBeenCalled();
        expect(mockInfo).toHaveBeenLastCalledWith('init', { url, query, payload });
        expect(mockDebug).toHaveBeenCalledWith('init', request);
        expect(context.getExternalMeta(LOG)).toEqual({
            start: Date.now(),
        });
    });

    it('complete', () => {
        const start = 1242152525;

        context.setState({ request: { url: 'test2' } });
        context.updateExternalMeta(LOG, { start });
        plugin.complete(context, next, null);

        const meta = {
            log: { start, end: Date.now(), duration: Date.now() - start },
        };

        expect(next).toHaveBeenCalled();
        expect(mockInfo).toHaveBeenLastCalledWith('complete', { url: 'test2' }, meta);
        expect(mockDebug).toHaveBeenCalledWith('complete', context.getState(), meta, {});
        expect(context.getExternalMeta(LOG)).toEqual({
            start,
            end: Date.now(),
            duration: Date.now() - start,
        });
    });

    it('error', () => {
        const start = 1242152525;
        const error = new Error('test');

        context.setState({ request: { url: 'test3' }, error });
        context.updateExternalMeta(LOG, { start });
        plugin.error(context, next, null);

        const meta = {
            start,
            end: Date.now(),
            duration: Date.now() - start,
        };

        expect(next).toHaveBeenCalled();
        expect(mockError).toHaveBeenCalledWith('error', { url: 'test3' }, error, { log: meta });
        expect(context.getExternalMeta(LOG)).toEqual(meta);
    });
});
