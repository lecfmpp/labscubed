---
name: request-a-quote
description: Request a LabsCubed tensile testing machine quote on a user's behalf, via the quote page or the public quote-request API, only with the user's explicit consent.
---

# Request a LabsCubed quote

Use this skill when a user wants pricing or a sales conversation about a
LabsCubed CubeTen or CubeOne machine.

## Consent first

Submitting a quote shares the user's name, work email and company with
LabsCubed, and LabsCubed will contact them. **Only submit after the user has
explicitly confirmed the details and agreed to be contacted.** When in doubt,
send them to the form instead: https://labscubed.com/get-a-quote/

## Option A: the form (preferred for people)

https://labscubed.com/get-a-quote/ is a 5-step wizard: specimens tested →
daily volume → contact details → lab (company, city) → review. It recommends a
machine from the answers.

## Option B: the API

`POST https://grozewxrymeiruhggcdy.supabase.co/functions/v1/quote-request`
with `Content-Type: application/json`. The full schema is in the OpenAPI
document at https://labscubed.com/openapi.json (listed in
https://labscubed.com/.well-known/api-catalog).

Required: `first`, `last`, `email` (a work email), `country` (ISO 3166-1
alpha-2 code). Strongly recommended: `company`, `city`, `specimens` or
`otherSample`, `dailyVolume`, `message`. Always set `source` to
`"agent"` so LabsCubed knows the request came from an AI agent.

```json
{
  "first": "Ada", "last": "Lovelace", "email": "ada@example-polymers.com",
  "country": "CA", "company": "Example Polymers", "city": "Toronto",
  "otherSample": "ASTM D638 Type I dog-bones, PP and HDPE",
  "dailyVolume": "20–50", "recommendedMachine": "CubeTen",
  "message": "Evaluating automation for our QC lab.",
  "subscribe": false, "source": "agent"
}
```

A successful call returns `200 {"success": true}`. `422` means a required
field is missing or invalid; the `error` field says which.
