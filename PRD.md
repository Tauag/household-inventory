# Household Inventory — PRD

## Problem

We stock consumables (currently 41 skincare and personal-care products across 30 brands) and track them in a Google Sheet. The sheet fails in three ways:

1. **Identification.** Most products are Korean or Japanese. Packaging is unreadable to anyone who didn't buy the item, so "Aestura Atobarrier 365 Cream" on a shelf and "Aestura Atobarrier 365 Hydro Soothing Cream" in the sheet are indistinguishable.
2. **Updating is too expensive.** Editing a spreadsheet cell on a phone, in a bathroom, while holding an empty bottle, does not happen. Counts drift from reality.
3. **Optional fields decay.** The sheet has Purchase Link and Last Restocked columns. Both are empty on all 41 rows. Anything requiring a second deliberate action will not be filled in.

## Users

Household members only. 3-5 people. No roles, no permissions tiers: everyone can do everything.

## Scope

v1 ships with the skincare list, but nothing in the schema or UI assumes cosmetics. Paper towels, detergent, and batteries must fit without migration.

## Core flows

All four carry equal weight. Each must work one-handed on a phone.

| Flow | Requirement |
|---|---|
| Decrement | From app open to count decremented: one search or scan, one tap. No confirmation dialog. |
| Lookup | Answer "do we have any left" without editing anything. |
| Restock | Update several items in one sitting after an order arrives, without re-navigating between each. |
| Low stock | A single list of everything at or below its reorder point. |

## Identification

Three paths to the same item, in order of expected use:

- **Barcode scan.** Camera scan resolves to an item. Unknown codes bind to an item once and resolve instantly thereafter.
- **Search.** Matches brand and product name, substring, case- and space-insensitive.
- **Category and location browse.** For items without a barcode or a remembered name.

**Photos.** One optional thumbnail per item, camera or paste. This is the strongest fix for the identification problem and storage cost is negligible (~150 items at 150 KB is 25 MB against a 1 GB free tier). It is also the only v1 feature that can be cut without breaking a flow, so it is the first thing to drop if v1 slips.

## Counting

A single integer per item: total units on hand, open or sealed. Matches current practice.

Each item has a reorder point, defaulting to 1. An item at or below it appears in the low stock list.

## Reorder

An optional purchase URL per item, opened in a new tab. The app does not buy anything, track prices, or manage a cart.

The purchase link is optional and today is never filled. v1 must make the low stock list useful when the link is absent: brand and product name are enough to search a store manually. Treat link capture as a nice-to-have that the barcode lookup may populate for free.

## Access

Google sign-in, restricted to an allowlist of household email addresses. A leaked URL grants nothing.

No audit trail. Who changed what is not tracked.

## Migration

One-time import of the sheet at launch. The app becomes the source of truth and the sheet is archived. Brand is blank on some rows; the importer must accept that rather than reject the row.

## Platform

Installable phone-first web app. Requires connectivity.

## Non-goals

Offline editing. Expiry and period-after-opening tracking. Consumption-rate prediction. Price history. Multiple households. Audit log. Two-way sync with Google Sheets. Native apps.

## Success

The counts in the app match the shelf. Concretely: a month after launch, a spot check of ten random items finds at most one wrong, and Last Restocked is populated for any item restocked since launch (it is set as a side effect of restocking, never typed).
