# Terminal imprest (decided 16 Nov 2026)

Each head of terminal (Terminal Manager; the Domestic Terminal Manager for GAT; the Head of
Terminal for the Presidential Terminal) holds an imprest: a cash float for the day-to-day running
of the terminal. They spend from it, retire the spends with receipts, and Finance replenishes the
float. The frontend in this package (Terminal imprest page) calls the routes below and shows "not
available on the server yet" until they exist.

## Who does what

| Who | Can |
|---|---|
| Head of terminal (holder of `TM-<terminal>`) | See their terminal's account; record spends with a receipt; send spends for retirement; answer a query |
| RGM | See every account; set or change a terminal's float; approve a retirement above the RGM limit |
| Finance (HOD Finance & Accounts and Finance officers) | See every account; approve, query or reject a retirement; record the replenishment |
| Internal Audit, super admin | Read everything (logged) |
| Anyone else | Nothing (403) |

## Data

**ImprestAccount** (one per terminal): `id, terminalId, holderUserId, floatAmount, balance,
currency ("NGN"), singleSpendLimit, rgmApprovalAbove, status ("active"|"suspended"), createdAt`.
`balance = floatAmount - sum(spends not yet replenished)`.

**ImprestSpend**: `id, accountId, spentOn (date), amount, category, description, receiptUploadId,
status ("recorded"|"in_retirement"|"retired"|"queried"|"rejected"), retirementId?, createdBy,
createdAt`. Categories: `cleaning_supplies, minor_repairs, utilities, transport, consumables,
hospitality, other`.

**ImprestRetirement**: `id, accountId, spendIds[], total, submittedBy, submittedAt,
status ("submitted"|"queried"|"approved"|"rejected"|"replenished"), financeComment, rgmApprovedBy?,
approvedBy?, approvedAt?, replenishedAmount?, replenishedAt?, paymentReference?`.

## Routes

| Route | Who | Does |
|---|---|---|
| `GET /imprest/accounts` | RGM, Finance, Audit: all; head of terminal: their own | List accounts with balance and counts of open spends and retirements |
| `GET /imprest/accounts/:id` | as above | One account with its spends and retirements |
| `POST /imprest/accounts` `{terminalId, holderUserId, floatAmount, singleSpendLimit, rgmApprovalAbove}` | RGM | Open an account for a terminal |
| `PATCH /imprest/accounts/:id` `{floatAmount?, holderUserId?, singleSpendLimit?, rgmApprovalAbove?, status?}` | RGM | Change the float, holder or limits |
| `POST /imprest/accounts/:id/spends` (multipart: `spentOn, amount, category, description, receipt`) | holder | Record a spend. Refuse when `amount > balance` or `amount > singleSpendLimit` (409 with the reason). A receipt is required |
| `POST /imprest/accounts/:id/retirements` `{spendIds[]}` | holder | Send recorded spends for retirement; they become `in_retirement` |
| `POST /imprest/retirements/:id/decide` `{decision: "approve"|"query"|"reject", comment}` | Finance (and the RGM first when `total > rgmApprovalAbove`) | Approve, query (back to the holder with the comment) or reject |
| `POST /imprest/retirements/:id/answer` `{comment, receiptUploadIds?}` | holder | Answer a query; back to `submitted` |
| `POST /imprest/retirements/:id/replenish` `{amount, paymentReference}` | Finance | Record the top-up; spends become `retired`, balance goes back up |

Every action is recorded with who and when, notifies the next person (holder, Finance, RGM), and
appears in the account's history. Amounts are naira with two decimals; send them as numbers.

## Suggested defaults

Float NGN 500,000 per terminal (NGN 250,000 for GAT and the Presidential Terminal), single spend
limit NGN 100,000, RGM approval for retirements above NGN 300,000. All set by the RGM per terminal.
