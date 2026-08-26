# UFA League Operating Runbook

## Purpose and roles

**UFA League** is operated by two independent administrators: the league owner and **Arish**. Managers own team identity, day-only availability submission, private team discussion, and public trade participation after the market is jointly opened. Administrators control account linking, auction records, fixture publication, result confirmation, and market approvals.

## First-day setup

1. The owner signs in using passwordless access and links their UFA League membership record.
2. Arish signs in once; the owner assigns the Arish administrator seat from the Commissioner workspace.
3. Each manager signs in, then the owner or Arish links the account to the correct member record.
4. Managers set a team name, short name, and crest in **Team room**. Team logos must be PNG, JPEG, or WebP and no larger than 2 MB.
5. Administrators review the Operations health card and resolve outstanding account links before opening high-impact workflows.

## Auction and roster administration

1. In the Commissioner workspace, select the player, set the auction status, and select a buyer plus final price for a sold player.
2. Confirm that the player’s base price and final bought price are correct before saving. The record, roster ownership, manager balance, activity feed, and audit trail update together.
3. Use the **Rosters CSV** export to reconcile ownership and remaining balances after a material auction update.
4. Do not place uncalled or in-progress auction players into a team roster until an administrator records a final outcome.
5. After the auction closes, import the final results into the separate **Auction log** record. It is public and immutable; it preserves player snapshots, base prices, final bought prices, buying managers, and the completed round label.
6. Treat `auction_records`, `roster_entries`, and team balances as operational records. The public auction log is historical evidence and must not be edited to correct later roster transfers or administrative adjustments.

## Day-only fixture workflow

1. An administrator creates a fixture window for the two teams and a permitted range of calendar days. No time-of-day parameter is used.
2. Each manager submits available days within that window.
3. The system proposes every shared day. Each manager accepts or rejects a proposal.
4. An administrator publishes only a mutually accepted proposal and selects **competitive** or **friendly** classification.
5. Export **Fixtures CSV** when a published calendar is needed outside the platform.

## Match logging and standings

1. In the Match centre, select the published fixture and add structured goals, assists, yellow/red cards, player-of-the-match records, and committee notes.
2. Enter the final score and confirm the result only after checking the match log.
3. Competitive results enter the table only after administrator confirmation. The table uses **3 points for a win, 1 for a draw, 0 for a loss**, then goal difference and goals scored.
4. Friendlies remain in fixture and match history but never affect the competitive table.
5. Use **Confirmed results CSV** for reporting or archival.

## Transfer-market control

1. The market remains closed unless both the owner and Arish independently enable their approvals.
2. When open, sellers set base prices. Public threads record bids and negotiations.
3. Only the relevant seller accepts or rejects an offer. There is no automated transfer execution, scheduled market opening, or hidden trade negotiation.
4. Either administrator can withdraw their approval; this closes the market immediately.

## Exports, monitoring, and audit

The public **Auction log** page displays the completed round without requiring sign-in. The Commissioner workspace provides CSV exports for members, rosters, fixtures, and confirmed competitive results. The Operations health card reports unlinked accounts, pending auction outcomes, published fixtures, current market state, and recent audit activity. Review it before auction sessions, fixture publication, and result confirmation.

## Incident recovery

1. If an account is linked incorrectly, correct the link only from the Commissioner workspace after verifying the manager’s identity.
2. If a roster, balance, or result needs correction, use the administrator record controls rather than direct database editing so the audit trail remains intact.
3. If the market state is uncertain, disable both approvals first, review the audit record, then re-enable only when both administrators agree.
4. Before a major change or deployment, create a project version and ensure the GitHub repository contains the latest commit.
5. For a production outage, keep the market closed, export the current records if available, verify Supabase status and recent audit activity, then use the project version history to restore a known release.
