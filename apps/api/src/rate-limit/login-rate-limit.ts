import type { Response } from "express";
import {
  RateLimiterRes,
  type RateLimiterAbstract,
} from "rate-limiter-flexible";
import { getLimiter, type LimiterName } from "./limiters.ts";
import { toIpKey, toUsernameKey } from "./rate-limit-keys.ts";
import { consumeOrThrow, tooManyRequests } from "./rate-limit-middleware.ts";
import {
  LOGIN_FAILURES_BY_IP_LIMIT,
  LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT,
  LOGIN_FAILURES_BY_USERNAME_LIMIT,
  type RateLimit,
} from "./rate-limit-config.ts";

// Failed logins are counted three ways. Each stops a different attack:
// - username + IP: one client guessing one account's password
// - username: many clients guessing one account's password
// - IP: one client trying leaked credentials across many accounts
interface FailureCounter {
  name: LimiterName;
  limit: RateLimit;
  key: string;
}

const usernameAndIpKey = (username: string, ip: string | undefined) =>
  `${toUsernameKey(username)}|${toIpKey(ip)}`;

const failureCounters = (
  username: string,
  ip: string | undefined,
): FailureCounter[] => {
  const ipKey = toIpKey(ip);

  return [
    {
      name: "loginFailuresByUsernameAndIp",
      limit: LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT,
      key: usernameAndIpKey(username, ip),
    },
    {
      name: "loginFailuresByUsername",
      limit: LOGIN_FAILURES_BY_USERNAME_LIMIT,
      key: toUsernameKey(username),
    },
    {
      name: "loginFailuresByIp",
      limit: LOGIN_FAILURES_BY_IP_LIMIT,
      key: ipKey,
    },
  ];
};

// Runs before the password is checked. Spends a per-IP attempt, then throws a
// 429 if any failure counter has no points left, even when the password would
// be right, so guessing gains nothing while blocked.
async function assertLoginAllowed(
  res: Response,
  username: string,
  ip: string | undefined,
): Promise<void> {
  await consumeOrThrow(res, "loginAttemptsByIp", toIpKey(ip));

  const counts = await Promise.all(
    failureCounters(username, ip).map(({ name, key }) =>
      getLimiter(name).get(key),
    ),
  );
  const exhausted = counts.filter(
    (count): count is RateLimiterRes =>
      count !== null && count.remainingPoints === 0,
  );

  if (exhausted.length > 0) {
    const longestWait = Math.max(...exhausted.map((c) => c.msBeforeNext));
    throw tooManyRequests(res, longestWait);
  }
}

// A consume over the limit rejects with the current count. A concurrent
// failure can get there first, so that is treated like any other count.
const consumeFailure = async (
  limiter: RateLimiterAbstract,
  key: string,
): Promise<RateLimiterRes> => {
  try {
    return await limiter.consume(key);
  } catch (error: unknown) {
    if (error instanceof RateLimiterRes) {
      return error;
    }
    throw error;
  }
};

// Counts a failure on every counter, and blocks any counter that this failure
// used up, starting its block from now.
async function recordLoginFailure(
  username: string,
  ip: string | undefined,
): Promise<void> {
  await Promise.all(
    failureCounters(username, ip).map(async ({ name, limit, key }) => {
      const limiter = getLimiter(name);
      const count = await consumeFailure(limiter, key);

      if (count.remainingPoints === 0) {
        await limiter.block(key, limit.blockSeconds ?? limit.durationSeconds);
      }
    }),
  );
}

// Forgives earlier typos from this client. The per-username and per-IP
// counts stand, so a success can't be used to reset an ongoing attack.
async function recordLoginSuccess(
  username: string,
  ip: string | undefined,
): Promise<void> {
  await getLimiter("loginFailuresByUsernameAndIp").delete(
    usernameAndIpKey(username, ip),
  );
}

export { assertLoginAllowed, recordLoginFailure, recordLoginSuccess };
