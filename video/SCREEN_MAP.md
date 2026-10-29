# Screen map — findoe.vercel.app

What the live prototype shows at a 1920×1080 laptop viewport, with the exact labels the demo
video uses. Checked on Oct 28, 2026 against `main` (`2385343`). Every figure is mock data.

## Sign-on — `/`

- Card **Sign On** with fields **User ID** and **Password** (placeholder _Any value works in this
  demo_), orange button **Sign On**.
- Demo chips under _Demo sign-on — pick a User ID, any password works:_ **husband · customer**,
  **wife · customer**, **child1 · customer**, **child2 · customer**, **advisor · advisor**.
  Clicking a chip fills the User ID.
- Sign off: the name + avatar button at the right of the top banner (accessible name
  _Sign off Husband_, _Sign off Wife_, …).

## Husband (customer) — before a loss

Top nav: **Home · My Assets (2) · Will (1) · Family · Help**, then _Husband_ + avatar.
**Ask Findoe** launcher fixed at the bottom right of every customer page.

| Screen                 | URL                  | What the video uses                                                                                                                                                                                                                |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                   | `/home`              | Card **Your money at a glance** — $309,946.36, _Across 5 accounts at PNC · plus a $500K term life policy held outside PNC_; Cash / Retirement / Investments / Owed on cards; Owned · Custodial · Shared.                           |
|                        |                      | Card **Notifications (4)** — **Write your will** → _Start your will_; **Add a beneficiary to Savings x0002** → _Add beneficiary_; **Add a beneficiary to Brokerage Account x0012**; _Child 1 turns 18 on Nov 30, 2026_ (not used). |
|                        |                      | Card **Your families** — Sample Family · Admin.                                                                                                                                                                                    |
| Family list            | `/family`            | _Your families_ → Sample Family card → **Open**.                                                                                                                                                                                   |
| Family detail          | `/family#fam-sample` | Header _Sample Family · You're an Admin · 4 members_; button **Manage family**.                                                                                                                                                    |
| Manage family (dialog) | same                 | Title **Manage Sample Family**; tabs **Members · Roles & access · Visibility**. Members shows roles Admin / Older child / Younger child per person.                                                                                |
| Roles & access tab     | same                 | **Admin** (Built-in, _Full access to every shared account…_), **Older child** (_Sees the household checking account and its activity. No control._), **Younger child** (_Nothing shared yet._), button **Create role**.            |
| My Assets              | `/assets`            | Not used in the video.                                                                                                                                                                                                             |
| Will                   | `/will`              | Not used in the video.                                                                                                                                                                                                             |
| Help                   | `/help`              | Placeholder — avoided.                                                                                                                                                                                                             |

## Wife (customer) — after a loss

The after-loss view only exists once the bank records the death. In the demo that is the
advisor's own control: **Advisor Home → ⋮ More actions → Record a death notice** (dialog defaults
to _Husband_, today's mock date, _Phone call_) → **Record and notify**. It is stored in the
browser (localStorage); **⋮ → Reset demo** clears it. The capture script does this in its own
browser context.

| Screen           | URL                          | What the video uses                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home             | `/home`                      | Condolence strip _We're so sorry for the loss of Husband… See what passes to you_; notification **Looking after Husband's accounts**.                                                                                                                                                                                                                                                              |
| Unclaimed assets | `/assets#unclaimed`          | Tabs **My assets · Unclaimed assets (4)**. Card **Husband's accounts that can pass to you** with **TODAY** _Upload Husband's death certificate…_ **Start**.                                                                                                                                                                                                                                        |
|                  |                              | Rows: **Joint Checking x0001** _Joint owner_ (_Owned together, so it's already yours._), **401(k) Rollover IRA x0011** _Named beneficiary_ (_Husband named you as the beneficiary._, 0 of 5 steps, review 2–3 weeks), **Term Life Policy** _Beneficiary · outside PNC_, **Child 2's Teen Savings x0041** _New custodian_. Each row: **Start claim** / **See how to claim** and **Ask Findoe**.     |
|                  |                              | **Handled through the estate**: Savings x0002 and others.                                                                                                                                                                                                                                                                                                                                          |
| Ask Findoe panel | launcher, bottom right       | Header **Findoe** · _Simulated · your PNC records + legal library_. Question used: _How do I claim the 401(k) Rollover IRA?_ Work trace: _Searched your PNC records · 1 found_ (401(k) Rollover IRA x0011), _Searched the legal library · 1 law applies_ (IRS Publication 590-B), _Wrote the answer · 2 citations_ → _Used 1 record and 1 law_.                                                    |
|                  |                              | Answer: can pass to you because Husband named you as the beneficiary; spouse options; **What the claim asks for:** certified death certificate (a photo or scan), beneficiary claim form (we fill this in), photo ID and taxpayer details (W-9), how you'd like to receive it, tax withholding; _Once you send it, our review usually takes 2–3 weeks._ Sources: Your PNC records / Legal library. |
| Claim            | `/assets#claim-retirement:…` | **401(k) Rollover IRA** · progress bar **0 of 5 done**; steps **1 Certified death certificate** (Upload), **2 Beneficiary claim form** (Filled in for you, checkbox _The details are correct_), **3 Your photo ID and taxpayer details (W-9)**…. Ticking the checkbox → **1 of 5 done**.                                                                                                           |

## Advisor — `/advisor`

Top nav: **Home** + avatar. The Findoe panel is docked on the right of a client page.

| Screen        | URL                                                            | What the video uses                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Advisor Home  | `/advisor`                                                     | _Welcome, Alex_; **Your Customers (22)** table (avoided: dated rows such as _Nov 4, 2026 · in 10 days_, placeholder names, page 2); **Notifications (5)** — **Loss of a family member** · _Morgan Placeholder · spouse passed away_ (Urgent).                                                                                                                                                                     |
| Client        | `/advisor/clients/c-placeholder`                               | Tabs **Next steps (15) · Client**. **Where things stand** — _Riley Placeholder died 2 days ago_; _…Nothing at PNC goes through probate…_; **Passes outside probate $7.79M · Goes through probate $0 · Next date Jan 23**.                                                                                                                                                                                         |
|               |                                                                | **Do next** (15 open): **1 Call Morgan to offer condolences** (Today · You), 2 Flag the death and request a certified death certificate, **3 Needs your answer — Who should own 529 College Savings x0018 now?**, 4 Did Riley receive Social Security…, 5 Retitle 3 joint accounts to Morgan; **Details**.                                                                                                        |
| Findoe panel  | right column                                                   | **Findoe** · _Claude Haiku 5.5 · grounded in the rulebook_. _I walked 10 accounts Riley was part of through the settlement rulebook (v2026.10-pa-pilot)…_ → **How I decided · 10 accounts** (expands to one path per account). **One thing I need from you — Who should own 529 College Savings x0018 now?** (Morgan Placeholder / Jamie Placeholder / Not sure yet). Input chip _Haiku 5.5 · v2026.10-pa-pilot_. |
| Decision path | Details → What happens to each account → Traditional IRA x0015 | **How the rulebook decided**: _What was Riley to this account?_ → **Sole owner**; _What kind of account did Riley own alone?_ → **Traditional IRA**; _Is a living beneficiary named on the retirement account?_ → **Yes**; _Who is the primary beneficiary?_ → **Surviving spouse**; **Outcome: Spouse chooses how to take over the IRA** (2–3 weeks, outside probate).                                           |

The capture script (`scripts/capture.ts`) reads these labels from the page and writes them to
`public/captures/manifest.json`; the overlays quote the manifest rather than hard-coded copies.
