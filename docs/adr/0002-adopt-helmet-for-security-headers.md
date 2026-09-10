# 0002. Adopt helmet for browser security headers

## Status
Accepted

## Context
Security headers were set by hand in a single Express middleware. Each
header's value was a string literal with no validation, and the set
omitted several headers browsers now honor. Getting CSP subtly wrong is
easy and fails silently.

## Decision
Adopt helmet as the source of truth for browser security headers.
Override only the directives where our policy is stricter than helmet's
baseline, or where the local HTTP environment makes a default wrong.

## Consequences
+ Upstream tracks new headers and browser behavior changes for us.
+ Header values are typed rather than free-form strings.
- We inherit helmet's release cadence and any regressions it ships.
- Defaults are now implicit; a reader must know helmet's baseline to
  understand the effective policy.
- strictTransportSecurity: false and upgradeInsecureRequests: null are
  correct only for local HTTP and become defects in production.

## Alternatives considered
- Keep hand-rolled headers: full control, ongoing maintenance burden.
- Terminate headers at a reverse proxy: moves policy away from the code
  that knows which resources each route needs.