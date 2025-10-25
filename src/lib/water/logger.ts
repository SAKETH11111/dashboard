type LogLevel = "debug" | "info" | "warn" | "error"

const LEVEL_TAG: Record<LogLevel, string> = {
  debug: "🐛",
  info: "ℹ️",
  warn: "⚠️",
  error: "❌",
}

function log(level: LogLevel, scope: string, message: string, meta?: unknown) {
  const tag = LEVEL_TAG[level]
  const payload = meta !== undefined ? [meta] : []
  const timestamp = new Date().toISOString()

  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
    `[water][${scope}] ${tag} ${message} @ ${timestamp}`,
    ...payload,
  )
}

export const waterLogger = {
  debug(scope: string, message: string, meta?: unknown) {
    log("debug", scope, message, meta)
  },
  info(scope: string, message: string, meta?: unknown) {
    log("info", scope, message, meta)
  },
  warn(scope: string, message: string, meta?: unknown) {
    log("warn", scope, message, meta)
  },
  error(scope: string, message: string, meta?: unknown) {
    log("error", scope, message, meta)
  },
}
