/* eslint-disable no-console -- this is the one place console is allowed */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

// LOG_LEVEL=debug shows the route-calculation trace; production defaults to info.
const configured = process.env.LOG_LEVEL as Level | undefined;
const threshold =
  LEVELS[configured ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug')] ?? LEVELS.info;

function emit(level: Level, args: unknown[]) {
  if (LEVELS[level] < threshold) return;
  const write = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  write(`[${level}]`, ...args);
}

export const log = {
  debug: (...args: unknown[]) => emit('debug', args),
  info: (...args: unknown[]) => emit('info', args),
  warn: (...args: unknown[]) => emit('warn', args),
  error: (...args: unknown[]) => emit('error', args),
};
