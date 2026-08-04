/**
 * Pino logger configured for human-friendly output in dev, JSON in prod.
 * All modules import from here; never call console.* directly.
 */
import pino from "pino";
import { CONFIG } from "@/config";

const isProd = CONFIG.isProd;
const level = CONFIG.logLevel;

export const log = pino({
  level,
  base: { app: CONFIG.appName },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname,app",
          singleLine: false,
          messageFormat: "{msg}",
        },
      },
});

export type Logger = typeof log;

/** Create a child logger scoped to a module name */
export function logger(scope: string): Logger {
  return log.child({ scope });
}
