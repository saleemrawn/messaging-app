// Limits for every rate limiter. `points` is how many requests (or failures)
// a key may spend per `durationSeconds` window. A window starts at the key's
// first request. `blockSeconds`, where set, is how long a key stays blocked
// once it spends its last point.
interface RateLimit {
  points: number;
  durationSeconds: number;
  blockSeconds?: number;
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Every request, per client IP, before anything else runs. Stops floods.
const GLOBAL_IP_LIMIT: RateLimit = { points: 300, durationSeconds: MINUTE };

// Login attempts per IP, whatever the outcome. Each one costs a bcrypt
// compare, so this caps the CPU one client can use.
const LOGIN_ATTEMPTS_BY_IP_LIMIT: RateLimit = {
  points: 20,
  durationSeconds: MINUTE,
};

// Failed logins for one username from one IP: brute force on one account.
// A successful login resets it.
const LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT: RateLimit = {
  points: 5,
  durationSeconds: 15 * MINUTE,
  blockSeconds: 15 * MINUTE,
};

// Failed logins for one username from any IP: distributed brute force.
const LOGIN_FAILURES_BY_USERNAME_LIMIT: RateLimit = {
  points: 20,
  durationSeconds: HOUR,
  blockSeconds: HOUR,
};

// Failed logins from one IP across any usernames: credential stuffing.
const LOGIN_FAILURES_BY_IP_LIMIT: RateLimit = {
  points: 100,
  durationSeconds: DAY,
  blockSeconds: DAY,
};

// Signup attempts per IP, whatever the outcome. Also slows probing for taken
// usernames and emails through 409s.
const SIGNUP_LIMIT: RateLimit = { points: 10, durationSeconds: HOUR };

// Requests per signed-in account.
const ACCOUNT_LIMIT: RateLimit = { points: 120, durationSeconds: MINUTE };

const SEND_MESSAGE_LIMIT: RateLimit = { points: 30, durationSeconds: MINUTE };

// Each upload is decoded and re-encoded by sharp.
const AVATAR_UPLOAD_LIMIT: RateLimit = { points: 10, durationSeconds: HOUR };

export {
  GLOBAL_IP_LIMIT,
  LOGIN_ATTEMPTS_BY_IP_LIMIT,
  LOGIN_FAILURES_BY_USERNAME_AND_IP_LIMIT,
  LOGIN_FAILURES_BY_USERNAME_LIMIT,
  LOGIN_FAILURES_BY_IP_LIMIT,
  SIGNUP_LIMIT,
  ACCOUNT_LIMIT,
  SEND_MESSAGE_LIMIT,
  AVATAR_UPLOAD_LIMIT,
};
export type { RateLimit };
