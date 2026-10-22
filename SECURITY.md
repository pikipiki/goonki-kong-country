# Security

This is a client-side, single-player game with local save data. There is no
account service or authoritative score server. The inspection objects exposed
on `window` are deliberate debugging tools; their values are not a trust boundary.

## Input and resource boundaries

Save files are size-limited before parsing. Only known stage IDs and bounded,
finite score fields are copied into a fresh save object. Prototype keys, arrays,
extra nested objects and malformed scores are discarded. URL coordinates must
be finite and bounded; invalid stage IDs normalize to a valid catalog entry.

The production HTML carries a Content Security Policy restricting scripts and
asset requests to the same origin. Inline styles are allowed for React/MUI;
inline scripts and object embeds are not. Blob/data permissions are limited to
the asset types that need them. Development and Storybook have separate build
requirements and do not receive the production meta policy.

A meta policy cannot provide every HTTP-header protection, including
`frame-ancestors`. Configure those headers at the hosting layer when supported.
See [MDN's CSP guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).
`npm run test:production` checks actual mobile pages for policy violations.

The quality workflow uses a read-only repository token. Deployment write
permissions are limited to the deployment job. GitHub actions are pinned to
verified commit SHAs and checkout does not persist credentials. See
[GitHub's workflow security guidance](https://docs.github.com/en/actions/reference/security/secure-use).

## Review and report

Run `npm audit --audit-level=moderate` after dependency changes and keep the
lockfile in the review. Run the standard lint, type/build and browser checks.
The dated findings and validation are in
[the architecture review](docs/architecture-review.md). This is a source and
dependency review, not an external penetration-test certification.

Report a suspected vulnerability privately to the repository owner with a
minimal reproduction, affected version and expected impact. Do not put tokens,
personal save data or private account details in a public issue.
