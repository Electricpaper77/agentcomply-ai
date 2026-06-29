# AgentComply AI

AgentComply AI is a buyer-facing synthetic audit evidence demo for regulated customer-support AI agents.

Live demo: https://agentcomply-ai.vercel.app

## Summary

The demo shows how AI-agent actions can be converted into audit-ready evidence before they become compliance review problems. It focuses on regulated customer-support workflows where agents send customer messages, access account data, touch PII, or trigger refund/payment-adjacent actions.

## Key Features

- Policy Pack v1 for regulated customer support
- Four deterministic policy rules for PII, refund/payment thresholds, missing audit fields, and unauthorized tool/prompt-injection risk
- Interactive scenario builder with allow, escalate, and block outcomes
- Copyable JSONL audit records
- Static sample audit report page
- Demo-only lead capture with a clear mailto fallback
- Visible trust boundaries and compliance disclaimers

## Screenshots

Screenshots can be added here:

- Homepage / Policy Pack v1
- Scenario builder with JSONL audit record
- Sample audit report page

## QA Proof

- Scenario buttons verified:
  - CRM lookup: `allow`
  - PII outbound email: `escalate`
  - refund/payment threshold: `escalate`
  - missing audit fields: `block`
- JSONL copy works and copied JSON parses correctly
- Production homepage returns `200`
- Production sample audit report returns `200`
- Browser console errors: none
- Mobile horizontal overflow: none
- No false backend, legal advice, compliance certification, SOC 2, HIPAA, production enforcement, or live customer data claims

## Known Limitations

- No real backend, CRM, or email lead capture is implemented
- Audit data is static synthetic demo data
- Not legal advice
- Not compliance certification
- Not connected to live customer data
- Not production enforcement

## Target Roles And Keywords

Target roles:

- AI governance
- Compliance
- Risk
- Security
- Platform engineering
- Customer support operations

Keywords:

- AI agent governance
- AI audit evidence
- regulated customer support
- PII review
- refund approval workflows
- policy enforcement
- JSONL audit logs
- compliance automation
