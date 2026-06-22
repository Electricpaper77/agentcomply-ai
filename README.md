# AgentComply AI

AgentComply AI is an audit evidence layer for autonomous AI-agent actions in regulated workflows. This single-page validation site presents the concept, a synthetic risk-engine demo, pilot scope, buyer/user concerns, and a local-only design partner form.

## Demo Scope

This is a front-end-only validation website. It includes:

- Static landing page content in `index.html`
- Styling in `styles.css`
- Synthetic scenario rendering, risk scoring, policy overrides, copy buttons, report preview toggle, vertical selection, and local form handling in `app.js`
- No backend, no deployment configuration, and no live customer data

## Synthetic Data Disclaimer

All scenario events, audit logs, report numbers, and workflow examples are synthetic. The demo does not use customer data, production logs, regulated records, or real deployment evidence.

AgentComply AI does not provide legal advice, certify regulatory compliance, or claim regulatory approval.

## Algorithm Explanation

The interactive demo calculates an agent-action risk score from five inputs:

- `action_criticality`
- `data_sensitivity`
- `policy_violation_severity`
- `approval_gap`
- `audit_completeness_gap`

The score is rounded to the nearest integer.

```text
risk_score =
  (action_criticality * 0.22) +
  (data_sensitivity * 0.24) +
  (policy_violation_severity * 0.26) +
  (approval_gap * 0.16) +
  (audit_completeness_gap * 0.12)
```

## Risk Engine v0

The interactive demo uses a two-layer decision model:

1. Weighted scoring estimates risk severity.
2. Hard policy overrides apply deterministic decisions when a regulated action meets a specific rule.

The weighted score still uses the formula above and the score-based fallback thresholds:

- `0-29`: allow
- `30-59`: flag
- `60-79`: escalate
- `80-100`: block

If a hard policy rule matches, the final decision uses the override. If no hard policy rule matches, the final decision uses the score-based decision.

Scenario C calculates to a weighted score of `73`, so its score-based decision is `escalate`. It becomes `block` because the `PAYMENT_ABOVE_THRESHOLD_NO_APPROVAL` hard policy rule applies: the action is payment/refund-related, action criticality is at least `85`, policy violation severity is at least `80`, and the approval gap is at least `70`.

The JSONL evidence records include:

- `risk_score`
- `score_based_decision`
- `policy_override_applied`
- `policy_rule_id`
- `final_decision`
- `reason`

This remains a synthetic demo only. It does not use live customer data, provide legal advice, certify regulatory compliance, or claim production readiness.

## How To Run Locally

Open `index.html` directly in a browser, or serve the folder with a local static server:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Local Validation Checklist

Before commit or preview deployment, confirm:

- Scenario A final decision is `allow`
- Scenario B final decision is `escalate`
- Scenario C has `risk_score` `73`, score-based decision `escalate`, policy rule `PAYMENT_ABOVE_THRESHOLD_NO_APPROVAL`, and final decision `block`
- Scenario D final decision is `flag`
- JSON output parses successfully and includes the Risk Engine v0 fields listed above
- Public copy does not claim customers, revenue, certification, compliance approval, production deployment, legal advice, or guarantees

## What Not To Claim Publicly Yet

Do not claim:

- Customers
- Revenue
- SOC 2 certification
- HIPAA compliance
- Legal compliance
- Production deployments
- Partnerships
- Regulatory approval
- Live customer data
- Unsupported market-size claims

## Suggested Next Validation Steps

1. Build 15-20 named contact list
2. Run structured discovery calls
3. Confirm 3+ repeated pain signals
4. Choose one vertical
5. Secure 2-3 design partners
