type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

/**
 * Structured server-side logging. Used instead of bare `console.*` in
 * `src/server/**` so that output is greppable and carries context.
 *
 * Never log secrets, tokens, full request bodies, or raw email addresses.
 */
function emit(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...(context ? { context: serialize(context) } : {}),
  }

  const line = JSON.stringify(entry)

  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

/** Errors do not survive JSON.stringify; unwrap them into something readable. */
function serialize(context: LogContext): LogContext {
  const out: LogContext = {}

  for (const [key, value] of Object.entries(context)) {
    out[key] =
      value instanceof Error
        ? { name: value.name, message: value.message, stack: value.stack }
        : value
  }

  return out
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    process.env.NODE_ENV === 'development' && emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),
}
