// Messages from one IP address, counted separately per window. The throttler names are the ones `api-invites`
// registers with `ThrottlerModule`; `@Throttle()` sets this endpoint's own limits for them.
export const FEEDBACK_THROTTLES = {
  minute: { ttl: 60_000, limit: 3 },
  hour: { ttl: 3_600_000, limit: 10 },
};

// The same limit as the database check.
export const FEEDBACK_USER_AGENT_MAX_LENGTH = 500;
