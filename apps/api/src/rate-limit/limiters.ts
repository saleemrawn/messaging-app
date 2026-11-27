import {
  RateLimiterMemory,
  RateLimiterPrisma,
  type RateLimiterAbstract,
} from "rate-limiter-flexible";
import { prisma } from "../lib/prisma.ts";
import {
  ACCOUNT_LIMIT,
  AVATAR_UPLOAD_LIMIT,
  GLOBAL_IP_LIMIT,
  LOGIN_ATTEMPTS_BY_IP_LIMIT,
  LOGIN_FAILURES_BY_IP_LIMIT,
  LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT,
  LOGIN_FAILURES_BY_USERNAME_LIMIT,
  SIGNUP_LIMIT,
  SEND_MESSAGE_LIMIT,
  type RateLimit,
} from "./rate-limit-config.ts";

// The Prisma client property for the RateLimit model (table "rate_limits").
const PRISMA_MODEL_NAME = "rateLimit";

type MemoryLimiterName =
  | "globalIp"
  | "loginAttemptsByIp"
  | "account"
  | "sendMessage"
  | "avatarUpload";

type StoreLimiterName =
  | "loginFailuresByUsernameAndIp"
  | "loginFailuresByUsername"
  | "loginFailuresByIp"
  | "signup";

type LimiterName = MemoryLimiterName | StoreLimiterName;

const memoryLimiter = (keyPrefix: string, limit: RateLimit) =>
  new RateLimiterMemory({
    keyPrefix,
    points: limit.points,
    duration: limit.durationSeconds,
  });

// Kept in Postgres so the counts survive restarts and are shared by every
// API instance. `blockSeconds` isn't passed on: the library would only block
// on the attempt after the last point, so login-rate-limit.ts blocks
// explicitly instead.
const storeLimiter = (keyPrefix: string, limit: RateLimit) =>
  new RateLimiterPrisma({
    storeClient: prisma,
    tableName: PRISMA_MODEL_NAME,
    keyPrefix,
    points: limit.points,
    duration: limit.durationSeconds,
  });

// Per-process counters for high-volume limits, where a DB round-trip on every
// request would cost more than the limit is worth. They reset on restart.
const createMemoryLimiters = (): Record<
  MemoryLimiterName,
  RateLimiterAbstract
> => ({
  globalIp: memoryLimiter("global-ip", GLOBAL_IP_LIMIT),
  loginAttemptsByIp: memoryLimiter("login-ip", LOGIN_ATTEMPTS_BY_IP_LIMIT),
  account: memoryLimiter("account", ACCOUNT_LIMIT),
  sendMessage: memoryLimiter("send-message", SEND_MESSAGE_LIMIT),
  avatarUpload: memoryLimiter("avatar-upload", AVATAR_UPLOAD_LIMIT),
});

const storeLimiters: Record<StoreLimiterName, RateLimiterAbstract> = {
  loginFailuresByUsernameAndIp: storeLimiter(
    "login-fail-user-ip",
    LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT,
  ),
  loginFailuresByUsername: storeLimiter(
    "login-fail-user",
    LOGIN_FAILURES_BY_USERNAME_LIMIT,
  ),
  loginFailuresByIp: storeLimiter("login-fail-ip", LOGIN_FAILURES_BY_IP_LIMIT),
  signup: storeLimiter("signup", SIGNUP_LIMIT),
};

let memoryLimiters = createMemoryLimiters();

function getLimiter(name: LimiterName): RateLimiterAbstract {
  if (name in memoryLimiters) {
    return memoryLimiters[name as MemoryLimiterName];
  }
  return storeLimiters[name as StoreLimiterName];
}

// For tests: starts every in-memory counter from zero. The Postgres counters
// are cleared by truncating "rate_limits".
function resetRateLimiters(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to reset rate limiters in production");
  }
  memoryLimiters = createMemoryLimiters();
}

export { getLimiter, resetRateLimiters };
export type { LimiterName };
