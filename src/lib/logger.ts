type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

/**
 * Structured server-side logging. Used instead of bare `console.*` in
 * `src/server/**` so that output is greppable and carries context.
 *
 * Never log secrets, tokens, full request bodies, or raw email addresses.
 *
 * **No timestamp**, deliberately.
 *
 * Under `cacheComponents` a bare `new Date()` inside a prerender is a build
 * error — the value changes between renders, so Next.js refuses to bake it into
 * static HTML. That is the right rule, and it bites here for an unfortunate
 * reason: the places most worth logging are the fallback paths that run *during*
 * prerendering, so a logger that reads the clock turns "we degraded gracefully"
 * back into "the build failed". A try/catch does not help — the violation is
 * recorded whether or not the call throws.
 *
 * Every runtime we deploy to stamps its own timestamp on a log line, so the
 * field was a convenience rather than the record. Dropping it keeps the part
 * that matters and removes a landmine for anyone who later logs from inside a
 * prerendered component.
 */
function emit(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
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
