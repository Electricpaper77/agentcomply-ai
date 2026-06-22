const scenarios = [
  {
    label: "A. Low-risk CRM lookup",
    agent_id: "crm-research-agent-018",
    user_role: "account_manager",
    action_type: "crm_lookup",
    tool_called: "crm.records.read",
    data_touched: ["company profile", "account status"],
    policy_context: "STANDARD_CRM_READ_ACCESS",
    human_approved: true,
    policy_matched: "STANDARD_CRM_READ_ACCESS",
    metrics: {
      action_criticality: 15,
      data_sensitivity: 20,
      policy_violation_severity: 0,
      approval_gap: 0,
      audit_completeness_gap: 0
    },
    reason: "Read-only lookup uses low-sensitivity account data with complete audit fields."
  },
  {
    label: "B. Customer email with PII and no human approval",
    agent_id: "support-agent-042",
    user_role: "customer_support",
    action_type: "customer_email",
    tool_called: "email.send_draft",
    data_touched: ["customer email", "account notes", "PII"],
    policy_context: "PII_CUSTOMER_COMMUNICATION_REVIEW",
    human_approved: false,
    policy_matched: "PII_CUSTOMER_COMMUNICATION_REVIEW",
    metrics: {
      action_criticality: 65,
      data_sensitivity: 80,
      policy_violation_severity: 70,
      approval_gap: 90,
      audit_completeness_gap: 10
    },
    reason: "PII appears in a customer-facing communication without human approval."
  },
  {
    label: "C. Refund/payment action above threshold",
    agent_id: "billing-agent-117",
    user_role: "billing_operations",
    action_type: "refund_payment_action",
    tool_called: "payments.refund.create",
    data_touched: ["customer account", "payment method token", "refund amount"],
    policy_context: "PAYMENT_THRESHOLD_REVIEW",
    human_approved: false,
    policy_matched: "PAYMENT_THRESHOLD_REVIEW",
    metrics: {
      action_criticality: 90,
      data_sensitivity: 75,
      policy_violation_severity: 85,
      approval_gap: 80,
      audit_completeness_gap: 5
    },
    reason: "Payment-adjacent action exceeds review threshold and lacks approval evidence."
  },
  {
    label: "D. Missing audit fields",
    agent_id: "workflow-agent-003",
    user_role: "platform_operator",
    action_type: "record_update",
    tool_called: "workflow.records.update",
    data_touched: ["workflow record", "customer status"],
    policy_context: "INCOMPLETE_EVIDENCE_REVIEW",
    human_approved: true,
    policy_matched: "INCOMPLETE_EVIDENCE_REVIEW",
    metrics: {
      action_criticality: 45,
      data_sensitivity: 55,
      policy_violation_severity: 40,
      approval_gap: 30,
      audit_completeness_gap: 90
    },
    reason: "Required audit fields are missing, so the event needs follow-up before reporting."
  }
];

const schemaVersion = "agentcomply.synthetic.audit.v0";
const fieldLabels = [
  ["agent_id", "Agent ID"],
  ["user_role", "User role"],
  ["action_type", "Action type"],
  ["tool_called", "Tool called"],
  ["data_touched", "Data touched"],
  ["policy_context", "Policy context"],
  ["human_approved", "Human approved"],
  ["policy_matched", "Policy matched"]
];

function calculateRiskScore(metrics) {
  return Math.round(
    metrics.action_criticality * 0.22 +
      metrics.data_sensitivity * 0.24 +
      metrics.policy_violation_severity * 0.26 +
      metrics.approval_gap * 0.16 +
      metrics.audit_completeness_gap * 0.12
  );
}

function getDecision(score) {
  if (score <= 29) return "allow";
  if (score <= 59) return "flag";
  if (score <= 79) return "escalate";
  return "block";
}

function includesActionTerm(actionType, terms) {
  const normalized = actionType.toLowerCase().replace(/_/g, " ");
  return terms.some((term) => normalized.includes(term));
}

function touchesPii(dataTouched) {
  const piiTerms = [
    "customer_name",
    "customer name",
    "policy_number",
    "policy number",
    "claim_status",
    "claim status",
    "email",
    "phone",
    "address",
    "ssn",
    "dob",
    "medical_record",
    "medical record",
    "pii",
    "personally identifiable",
    "personal data"
  ];
  return dataTouched.some((field) => {
    const normalized = field.toLowerCase().replace(/-/g, "_");
    return piiTerms.some((term) => normalized.includes(term));
  });
}

function evaluatePolicyOverride(scenario) {
  const metrics = scenario.metrics;

  if (
    includesActionTerm(scenario.action_type, ["refund", "payment"]) &&
    metrics.action_criticality >= 85 &&
    metrics.policy_violation_severity >= 80 &&
    metrics.approval_gap >= 70
  ) {
    return {
      decision: "block",
      rule_id: "PAYMENT_ABOVE_THRESHOLD_NO_APPROVAL",
      reason: "High-risk payment or refund action exceeded policy threshold without human approval."
    };
  }

  if (
    includesActionTerm(scenario.action_type, ["customer email", "customer communication"]) &&
    touchesPii(scenario.data_touched) &&
    metrics.approval_gap >= 70
  ) {
    return {
      decision: "escalate",
      rule_id: "PII_CUSTOMER_COMMUNICATION_NO_APPROVAL",
      reason: "Customer-facing communication touched PII without required human approval."
    };
  }

  if (metrics.audit_completeness_gap >= 80) {
    return {
      decision: "flag",
      rule_id: "MISSING_REQUIRED_AUDIT_FIELDS",
      reason: "Required audit evidence is incomplete and needs review before reporting."
    };
  }

  if (
    metrics.action_criticality <= 20 &&
    metrics.data_sensitivity <= 25 &&
    metrics.policy_violation_severity === 0 &&
    metrics.audit_completeness_gap === 0
  ) {
    return {
      decision: "allow",
      rule_id: "LOW_RISK_READ_ONLY_COMPLETE_AUDIT",
      reason: "Read-only low-risk action with complete audit evidence."
    };
  }

  return null;
}

function buildAuditEvent(scenario, index) {
  const risk_score = calculateRiskScore(scenario.metrics);
  const score_based_decision = getDecision(risk_score);
  const policyOverride = evaluatePolicyOverride(scenario);
  const final_decision = policyOverride ? policyOverride.decision : score_based_decision;

  return {
    schema_version: schemaVersion,
    event_id: `synthetic_evt_${String(index + 1).padStart(3, "0")}`,
    timestamp: "2026-06-21T17:42:11Z",
    agent_id: scenario.agent_id,
    user_role: scenario.user_role,
    action_type: scenario.action_type,
    tool_called: scenario.tool_called,
    data_touched: scenario.data_touched,
    policy_context: scenario.policy_context,
    human_approved: scenario.human_approved,
    policy_matched: scenario.policy_matched,
    risk_score,
    score_based_decision,
    policy_override_applied: Boolean(policyOverride),
    policy_rule_id: policyOverride ? policyOverride.rule_id : "NONE",
    final_decision,
    reason: policyOverride ? policyOverride.reason : scenario.reason,
    scoring_inputs: scenario.metrics
  };
}

function renderScenario(index) {
  const scenario = scenarios[index];
  const event = buildAuditEvent(scenario, index);
  const title = document.querySelector("#scenario-title");
  const fields = document.querySelector("#scenario-fields");
  const riskScore = document.querySelector("#risk-score");
  const scoreDecision = document.querySelector("#score-based-decision");
  const policyRule = document.querySelector("#policy-rule");
  const finalDecision = document.querySelector("#final-decision");
  const decisionReason = document.querySelector("#decision-reason");
  const decisionPill = document.querySelector("#decision-pill");
  const jsonOutput = document.querySelector("#jsonl-output");

  title.textContent = scenario.label;
  fields.innerHTML = fieldLabels
    .map(([key, label]) => {
      const value = Array.isArray(event[key]) ? event[key].join(", ") : String(event[key]);
      return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
    })
    .join("");
  riskScore.textContent = event.risk_score;
  scoreDecision.textContent = event.score_based_decision;
  policyRule.textContent = event.policy_override_applied ? event.policy_rule_id : "No override";
  finalDecision.textContent = event.final_decision;
  decisionReason.textContent = event.reason;
  decisionPill.textContent = event.final_decision;
  decisionPill.className = `decision-pill decision-${event.final_decision}`;
  jsonOutput.textContent = JSON.stringify(event, null, 2);

  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.scenario) === index);
  });
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

function copyText(text, button) {
  const resetLabel = button.textContent;

  Promise.resolve()
    .then(() => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      if (fallbackCopyText(text)) return;
      throw new Error("Clipboard unavailable");
    })
    .then(() => {
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = resetLabel;
      }, 1400);
    })
    .catch(() => {
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = resetLabel;
      }, 1400);
    });
}

function getReportJsonlSample() {
  return scenarios.map((scenario, index) => JSON.stringify(buildAuditEvent(scenario, index))).join("\n");
}

document.addEventListener("DOMContentLoaded", () => {
  renderScenario(0);

  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      renderScenario(Number(button.dataset.scenario));
    });
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(`#${button.dataset.copyTarget}`);
      copyText(target.textContent, button);
    });
  });

  document.querySelector("#copy-report-jsonl").addEventListener("click", (event) => {
    copyText(getReportJsonlSample(), event.currentTarget);
  });

  document.querySelector("#toggle-report-preview").addEventListener("click", (event) => {
    const preview = document.querySelector("#report-preview");
    const isHidden = preview.hasAttribute("hidden");
    preview.toggleAttribute("hidden");
    event.currentTarget.textContent = isHidden ? "Hide report preview" : "View report preview";
  });

  document.querySelectorAll(".vertical-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".vertical-card").forEach((item) => item.classList.remove("active"));
      card.classList.add("active");
    });
  });

  document.querySelector("#partner-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    console.log("AgentComply AI design partner request", payload);
    document.querySelector("#form-success").hidden = false;
    event.currentTarget.reset();
  });
});
