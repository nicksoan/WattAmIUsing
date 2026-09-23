# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Household energy customer reviewing supplier CSV exports to understand when electricity is used and where recurring consumption can be reduced.

## Product Purpose

Turn interval-level electricity data into fast, understandable daily, weekly, and monthly patterns. Success means a user can isolate a time window such as 08:00-11:00 or 16:00-21:00, compare recurring usage, and identify practical reduction opportunities.

## Positioning

Private, browser-only analysis focused on repeatable time-of-day patterns rather than generic bill totals.

## Operating Context

User opens a static dashboard, imports a CSV export, changes time and date filters, and reviews aggregates and recurring patterns. Expected columns are `Consumption (kwh)`, `Estimated Cost Inc. Tax (p)`, `Standing Charge Inc. Tax (p)`, `Start`, and `End`.

## Capabilities and Constraints

- Runs entirely in browser with no backend and no data upload.
- Reads CSV files from local device.
- Supports daily, weekly, and monthly analysis.
- Supports arbitrary time-of-day windows, including windows crossing midnight.
- Must tolerate common date formats and interval lengths.
- Must remain quick to stand up without a build pipeline.

## Evidence on Hand

Only CSV schema is available. No real household data, tariff claims, savings benchmarks, or brand assets exist and none should be fabricated.

## Product Principles

- Keep household data private.
- Make patterns visible before offering interpretation.
- Keep every filter legible and reversible.
- Distinguish measured usage, estimated cost, and standing charges.
- Work from imperfect supplier exports with explicit errors.

## Accessibility & Inclusion

Keyboard-operable controls, readable contrast, clear non-colour labels, and responsive use on desktop and mobile.
