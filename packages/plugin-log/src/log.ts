import prop from '@tinkoff/utils/object/prop';
import pick from '@tinkoff/utils/object/pick';
import { Context, Plugin } from '@tinkoff/request-core';
import { LOG } from './constants/metaTypes';

const fillDuration = (context: Context) => {
    const meta = context.getExternalMeta(LOG);
    const end = Date.now();
    const duration = end - meta.start;

    context.updateExternalMeta(LOG, {
        end,
        duration,
    });
};

type LogFunction = (...args) => void;

interface Logger {
    info: LogFunction;
    debug: LogFunction;
    error: LogFunction;
}

const defaultLogger = (name: string): Logger => {
    return {
        info: (...args) => console.info(name, ...args), // tslint:disable-line:no-console
        debug: (...args) => console.debug(name, ...args), // tslint:disable-line:no-console
        error: (...args) => console.error(name, ...args), // tslint:disable-line:no-console
    };
};

const getInfo = pick(['url', 'query', 'payload']);

/**
 * Logs request events and timing
 *
 * requestParams:
 *      silent {boolean}
 *
 * metaInfo:
 *      log.start {number} - request start Date.now()
 *      log.end {number} - request end Date.now()
 *      log.duration {number} - request duration (end - start)
 *
 * @param name {string}
 * @param logger {Function} - logger factory
 * @return {{init: init, complete: complete, error: error}}
 */
export default ({ name = '', logger = defaultLogger }): Plugin => {
    const log = logger(`request.${name}`);

    return {
        init: (context, next) => {
            const request = context.getRequest();
            const start = Date.now();
            const silent = prop('silent', request);

            if (!silent) {
                log.info('init', getInfo(request));
            }

            log.debug('init', request);

            context.updateExternalMeta(LOG, {
                start,
            });

            next();
        },
        complete: (context, next) => {
            fillDuration(context);

            const request = context.getRequest();
            const silent = prop('silent', request);

            if (!silent) {
                log.info('complete', getInfo(request), context.getExternalMeta());
            }

            log.debug('complete', context.getState(), context.getExternalMeta(), context.getInternalMeta());

            next();
        },
        error: (context, next) => {
            const request = context.getRequest();
            const silent = prop('silent', request);

            fillDuration(context);
            if (!silent) {
                log.error('error', getInfo(request), context.getState().error, context.getExternalMeta());
            }
            log.debug('error', context.getState(), context.getExternalMeta(), context.getInternalMeta());

            next();
        },
    };
};
