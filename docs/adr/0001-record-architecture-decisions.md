# 0001. Record architecture decisions

## Status

Accepted

## Context

Significant technical decisions in this repository are currently
undocumented. The code shows what was built and the tests show that it
works, but the reasoning — which alternatives were weighed, which
constraints forced the outcome, what we knowingly traded away — survives
only in commit messages and the memory of whoever made the call.

This becomes a problem when a decision is revisited. Without a record,
the choice is either re-litigated from scratch or preserved by inertia,
and neither is deliberate.

## Decision

We will keep Architecture Decision Records, as described by Michael
Nygard in "Documenting Architecture Decisions" (2011).

- Records live in `docs/adr/`, named `NNNN-kebab-case-title.md`.
- Numbers are assigned sequentially and never reused or renumbered.
- Each record uses the sections: Status, Context, Decision,
  Consequences, and optionally Alternatives considered.
- Status is one of: Proposed, Accepted, Deprecated, or
  Superseded by ADR-NNNN.
- Records are immutable once Accepted. A reversed decision is captured
  in a new record that supersedes the old one; the old record is
  updated only to change its Status line.
- A record is warranted when a decision is costly to reverse, affects
  more than one module, or delegates responsibility to a third party.
  Routine implementation choices do not need one.

## Consequences

- Decisions and their reasoning are versioned alongside the code they
  govern, and survive squashes, rebases, and history rewrites.
- Commit messages can stay brief and reference a record instead of
  carrying the full rationale.
- The set of records is an onboarding document: reading `docs/adr/` in
  order explains how the system reached its current shape.
- Writing records is friction. Applied to trivial decisions it becomes
  bureaucracy, so the threshold above is deliberately narrow.
- Immutability means the directory accumulates superseded records that
  no longer describe the system. This is intentional — the history of
  reversed decisions is often the more useful artifact — but readers
  must check Status before trusting a record.

## Alternatives considered

- **A single `DECISIONS.md`.** Simpler to find, but grows unbounded and
  produces merge conflicts when several decisions land at once.
- **A project wiki.** Decouples the record from the commit that
  implements it, and drifts once the wiki stops being read.
- **Nothing beyond commit messages.** Zero overhead, but the rationale
  is unindexed and easily lost to history rewriting.