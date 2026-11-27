import type { Request, RequestHandler, Response } from "express";
import { RateLimiterRes } from "rate-limiter-flexible";
import { HttpError } from "../lib/http-error.ts";
import { getAuthenticatedUserAccountId } from "../auth/auth-helpers.ts";
import { getLimiter, type LimiterName } from "./limiters.ts";
import { toIpKey } from "./rate-limit-keys.ts";

const HTTP_TOO_MANY_REQUESTS = 429;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;

const pluralize = (count: number, unit: string) =>
  `${String(count)} ${unit}${count === 1 ? "" : "s"}`;

// Rounds up, so the user is never told to retry before the block ends.
function formatWait(seconds: number): string {
  if (seconds < SECONDS_PER_MINUTE) {
    return pluralize(seconds, "second");
  }
  if (seconds < 2 * SECONDS_PER_HOUR) {
    return pluralize(Math.ceil(seconds / SECONDS_PER_MINUTE), "minute");
  }
  return pluralize(Math.ceil(seconds / SECONDS_PER_HOUR), "hour");
}

// Sets Retry-After and returns the 429 for errorHandler to send in the usual
// envelope.
function tooManyRequests(res: Response, msBeforeNext: number): HttpError {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil(msBeforeNext / MS_PER_SECOND),
  );
  res.set("Retry-After", String(retryAfterSeconds));
  return new HttpError(
    HTTP_TOO_MANY_REQUESTS,
    `Too many requests, please try again in ${formatWait(retryAfterSeconds)}`,
  );
}

// Spends one point for the key, or throws a 429 when none are left. Any other
// error (the store failing) is rethrown, so the request fails closed.
async function consumeOrThrow(
  res: Response,
  name: LimiterName,
  key: string,
): Promise<void> {
  try {
    await getLimiter(name).consume(key);
  } catch (error: unknown) {
    if (error instanceof RateLimiterRes) {
      throw tooManyRequests(res, error.msBeforeNext);
    }
    throw error;
  }
}

const rateLimit =
  (name: LimiterName, toKey: (req: Request) => string): RequestHandler =>
  async (req, res, next) => {
    await consumeOrThrow(res, name, toKey(req));
    next();
  };

const byIp = (req: Request) => toIpKey(req.ip);
// Only valid after requireAuth.
const byAccount = (req: Request) => String(getAuthenticatedUserAccountId(req));

const globalIpRateLimit = rateLimit("globalIp", byIp);
const signupRateLimit = rateLimit("signup", byIp);
const accountRateLimit = rateLimit("account", byAccount);
const sendMessageRateLimit = rateLimit("sendMessage", byAccount);
const avatarUploadRateLimit = rateLimit("avatarUpload", byAccount);

export {
  consumeOrThrow,
  tooManyRequests,
  globalIpRateLimit,
  signupRateLimit,
  accountRateLimit,
  sendMessageRateLimit,
  avatarUploadRateLimit,
};
