# Deployment Checklist

Use this checklist to prepare AgentComply AI for GitHub and Vercel preview deployment.

## Local Validation

Run local validation before pushing:

```bash
node --check app.js
```

If `node` is not on PATH in the local shell, use the bundled or installed Node.js binary available on the machine.

Open `index.html` directly in a browser, or serve the folder locally:

```bash
python -m http.server 8000
```

Then review:

- Scenario buttons render the expected decisions
- JSONL output parses correctly
- Copy buttons work
- Sample audit report page opens
- Design partner form shows the backend-not-configured mailto fallback
- Mobile layout has no horizontal overflow

## Expected Scenario Decisions

- Low-risk CRM lookup final decision: `allow`
- Customer email with PII and no approval final decision: `escalate`
- Refund/payment action above threshold final decision: `escalate`
- Missing audit fields final decision: `block`

## GitHub Setup

1. Create a GitHub repository for AgentComply AI.
2. Add the GitHub repository as this local repo's remote.
3. Push the committed branch to GitHub.
4. Open a pull request or use a non-production branch for preview review.

## Vercel Preview Deployment

1. Connect the GitHub repository to Vercel.
2. Configure it as a static site if Vercel does not auto-detect the root.
3. Use a pull request or non-production branch to trigger a preview deployment.
4. Review the generated preview URL before any production action.

Do not production deploy until the preview has been reviewed.

## Claim Safety

Do not add fake customer, revenue, compliance, certification, legal approval, production deployment, or guarantee claims.

Safe wording includes:

- Synthetic demo only
- No live customer data
- Does not provide legal advice
- Does not certify compliance
