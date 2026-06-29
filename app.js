const scenarios = [
  {
    label: "Low-risk CRM lookup",
    agent_id: "crm-research-agent-018",
    user_role: "support_specialist",
    action_type: "crm_lookup",
    tool_called: "crm.records.read",
    data_touched: ["account status", "case history"],
    policy_context: "REGULATED_CUSTOMER_SUPPORT",
    human_approved: true,
    approval_status: "not_required",
    amount_usd: 0,
    threshold_usd: 500,
    reviewer_id: "n/a",
    message_channel: "n/a",
    recipient_type: "internal",
    allowed_tools: ["crm.records.read", "case.notes.read"],
    missing_audit_fields: [],
    prompt_injection_detected: false,
    metrics: {
      action_criticality: 15,
      data_sensitivity: 20,
      policy_violation_severity: 0,
      approval_gap: 0,
      audit_completeness_gap: 0
    },
    reason: "Read-only lookup uses support context with complete audit fields."
  },
  {
    label: "Customer email with PII and no approval",
    agent_id: "support-agent-042",
    user_role: "customer_support",
    action_type: "customer_email",
    tool_called: "email.send_draft",
    data_touched: ["customer email", "account notes", "PII"],
    policy_context: "REGULATED_CUSTOMER_SUPPORT",
    human_approved: false,
    approval_status: "missing",
    amount_usd: 0,
    threshold_usd: 500,
    reviewer_id: null,
    message_channel: "email",
    recipient_type: "customer",
    allowed_tools: ["email.send_draft", "crm.records.read"],
    missing_audit_fields: [],
    prompt_injection_detected: false,
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
    label: "Refund/payment action above threshold",
    agent_id: "billing-agent-117",
    user_role: "billing_operations",
    action_type: "refund_payment_action",
    tool_called: "payments.refund.create",
    data_touched: ["customer account", "payment method token", "refund amount"],
    policy_context: "REGULATED_CUSTOMER_SUPPORT",
    human_approved: false,
    approval_status: "missing",
    amount_usd: 1250,
    threshold_usd: 500,
    reviewer_id: null,
    message_channel: "n/a",
    recipient_type: "customer",
    allowed_tools: ["payments.refund.create", "payments.refund.quote", "crm.records.read"],
    missing_audit_fields: [],
    prompt_injection_detected: false,
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
    label: "Missing audit fields",
    agent_id: "workflow-agent-003",
    user_role: "platform_operator",
    action_type: "record_update",
    tool_called: "workflow.records.update",
    data_touched: ["workflow record", "customer status"],
    policy_context: "REGULATED_CUSTOMER_SUPPORT",
    human_approved: true,
    approval_status: "approved",
    amount_usd: 0,
    threshold_usd: 500,
    reviewer_id: "reviewer-218",
    message_channel: "case_note",
    recipient_type: "internal",
    allowed_tools: ["workflow.records.update", "crm.records.read"],
    missing_audit_fields: ["timestamp", "tool_called", "policy_context"],
    prompt_injection_detected: false,
    metrics: {
      action_criticality: 45,
      data_sensitivity: 55,
      policy_violation_severity: 40,
      approval_gap: 30,
      audit_completeness_gap: 90
    },
    reason: "Required audit fields are missing, so the event is blocked before reporting."
  }
];

const schemaVersion = "agentcomply.policy_pack_v1.audit";
const policyRules = {
  piiReview: {
    rule_id: "PII_OUTBOUND_MESSAGE_REQUIRES_REVIEW",
    decision: "escalate",
    reason_code: "PII_OUTBOUND_REVIEW_REQUIRED",
    required_evidence: ["message_channel", "recipient_type", "data_touched", "human_approved", "reviewer_id"],
    reason: "Outbound customer message touched PII without required review."
  },
  paymentApproval: {
    rule_id: "PAYMENT_OR_REFUND_ABOVE_THRESHOLD_REQUIRES_APPROVAL",
    decision: "escalate",
    reason_code: "PAYMENT_THRESHOLD_APPROVAL_REQUIRED",
    required_evidence: ["amount_usd", "threshold_usd", "approval_status", "approver_role", "tool_called"],
    reason: "Refund or payment-adjacent action exceeded the approval threshold."
  },
  missingAuditFields: {
    rule_id: "MISSING_AUDIT_FIELDS_BLOCK",
    decision: "block",
    reason_code: "AUDIT_FIELDS_MISSING",
    required_evidence: ["event_id", "timestamp", "agent_id", "action_type", "tool_called", "policy_context"],
    reason: "Required audit fields are missing from the agent event."
  },
  promptInjection: {
    rule_id: "PROMPT_INJECTION_OR_UNAUTHORIZED_TOOL_USE_BLOCK",
    decision: "block",
    reason_code: "UNAUTHORIZED_TOOL_OR_PROMPT_INJECTION",
    required_evidence: ["prompt_signal", "tool_called", "allowed_tools", "policy_context", "detection_source"],
    reason: "Prompt-injection signal or unauthorized tool use appeared in the event."
  }
};
const fieldLabels = [
  ["agent_id", "Agent ID"],
  ["user_role", "User role"],
  ["action_type", "Action type"],
  ["tool_called", "Tool called"],
  ["data_touched", "Data touched"],
  ["policy_context", "Policy context"],
  ["human_approved", "Human approved"],
  ["approval_status", "Approval status"],
  ["policy_matched", "Policy matched"],
  ["reason_code", "Reason code"]
];
const allowedEventPayloadFields = [
  "scenario_id",
  "scenario_name",
  "final_decision",
  "policy_rule_id",
  "vertical_choice",
  "cta_location"
];
const allowedEventNames = [
  "hero_cta_click",
  "demo_cta_click",
  "scenario_selected",
  "schema_copied",
  "jsonl_copied",
  "report_preview_opened",
  "form_started",
  "form_submitted_local"
];

function trackEvent(eventName, payload = {}) {
  if (!allowedEventNames.includes(eventName)) return;

  const safePayload = {};

  allowedEventPayloadFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field) && payload[field] !== undefined) {
      safePayload[field] = String(payload[field]);
    }
  });

  console.log("AgentComply AI event", JSON.stringify({
    event_name: eventName,
    ...safePayload
  }));
}

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
    scenario.prompt_injection_detected ||
    !scenario.allowed_tools.includes(scenario.tool_called)
  ) {
    return policyRules.promptInjection;
  }

  if (scenario.missing_audit_fields.length > 0 || metrics.audit_completeness_gap >= 80) {
    return policyRules.missingAuditFields;
  }

  if (
    includesActionTerm(scenario.action_type, ["refund", "payment"]) &&
    scenario.amount_usd > scenario.threshold_usd &&
    scenario.approval_status !== "approved"
  ) {
    return policyRules.paymentApproval;
  }

  if (
    includesActionTerm(scenario.action_type, ["customer email", "customer communication"]) &&
    touchesPii(scenario.data_touched) &&
    scenario.recipient_type === "customer" &&
    scenario.approval_status !== "approved"
  ) {
    return policyRules.piiReview;
  }

  return null;
}

function buildAuditEvent(scenario, index) {
  const risk_score = calculateRiskScore(scenario.metrics);
  const score_based_decision = getDecision(risk_score);
  const policyOverride = evaluatePolicyOverride(scenario);
  const final_decision = policyOverride ? policyOverride.decision : score_based_decision;
  const reasonCode = policyOverride ? policyOverride.reason_code : "LOW_RISK_SUPPORT_LOOKUP_ALLOWED";

  return {
    schema_version: schemaVersion,
    event_id: `synthetic_evt_${String(index + 1).padStart(3, "0")}`,
    timestamp: "2026-06-21T17:42:11Z",
    workflow: "regulated_customer_support",
    agent_id: scenario.agent_id,
    user_role: scenario.user_role,
    action_type: scenario.action_type,
    tool_called: scenario.tool_called,
    data_touched: scenario.data_touched,
    policy_context: scenario.policy_context,
    human_approved: scenario.human_approved,
    approval_status: scenario.approval_status,
    amount_usd: scenario.amount_usd,
    threshold_usd: scenario.threshold_usd,
    reviewer_id: scenario.reviewer_id,
    message_channel: scenario.message_channel,
    recipient_type: scenario.recipient_type,
    missing_audit_fields: scenario.missing_audit_fields,
    policy_matched: policyOverride ? policyOverride.rule_id : "NONE",
    risk_score,
    score_based_decision,
    policy_override_applied: Boolean(policyOverride),
    policy_rule_id: policyOverride ? policyOverride.rule_id : "NONE",
    final_decision,
    reason_code: reasonCode,
    reason: policyOverride ? policyOverride.reason : scenario.reason,
    required_evidence: policyOverride ? policyOverride.required_evidence : ["event_id", "timestamp", "agent_id", "action_type", "tool_called", "policy_context"],
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
  jsonOutput.textContent = JSON.stringify(event);

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
      const clipboard = window.navigator && window.navigator.clipboard;
      if (clipboard && clipboard.writeText) {
        return clipboard.writeText(text);
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
      if (!fallbackCopyText(text)) {
        button.textContent = "Copy failed";
        window.setTimeout(() => {
          button.textContent = resetLabel;
        }, 1400);
        return;
      }
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = resetLabel;
      }, 1400);
    });
}

function getActiveScenarioIndex() {
  const activeButton = document.querySelector("[data-scenario].active");
  return activeButton ? Number(activeButton.dataset.scenario) : 0;
}

document.addEventListener("DOMContentLoaded", () => {
  renderScenario(0);

  document.querySelectorAll("[data-track-event]").forEach((element) => {
    element.addEventListener("click", () => {
      trackEvent(element.dataset.trackEvent, {
        cta_location: element.dataset.ctaLocation
      });
    });
  });

  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.scenario);
      renderScenario(index);
      const event = buildAuditEvent(scenarios[index], index);
      trackEvent("scenario_selected", {
        scenario_id: String(index + 1),
        scenario_name: scenarios[index].label,
        final_decision: event.final_decision,
        policy_rule_id: event.policy_rule_id
      });
    });
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(`#${button.dataset.copyTarget}`);
      copyText(target.textContent, button);
      if (button.dataset.copyTarget === "schema-output") {
        trackEvent("schema_copied", {
          cta_location: "schema"
        });
      }
      if (button.dataset.copyTarget === "jsonl-output") {
        const index = getActiveScenarioIndex();
        const event = buildAuditEvent(scenarios[index], index);
        trackEvent("jsonl_copied", {
          scenario_id: String(index + 1),
          scenario_name: scenarios[index].label,
          final_decision: event.final_decision,
          policy_rule_id: event.policy_rule_id,
          cta_location: "risk_engine"
        });
      }
    });
  });

  document.querySelectorAll(".vertical-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".vertical-card").forEach((item) => item.classList.remove("active"));
      card.classList.add("active");
    });
  });

  const partnerForm = document.querySelector("#partner-form");
  let formStarted = false;

  partnerForm.addEventListener("focusin", () => {
    if (formStarted) return;
    formStarted = true;
    trackEvent("form_started", {
      cta_location: "design_partner_form"
    });
  });

  partnerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const emailBody = [
      "AgentComply AI pilot request",
      "",
      `Next step: ${payload.requestType}`,
      `Work email: ${payload.workEmail}`,
      `Company: ${payload.company}`,
      `Role: ${payload.role}`,
      `Regulated industry example: ${payload.regulatedIndustry}`,
      `Agents deployed: ${payload.agentDeployment}`,
      `Workflow: ${payload.relevantWorkflow}`,
      `Riskiest action: ${payload.riskiestAction}`
    ].join("\n");
    const mailtoFallback = document.querySelector("#mailto-fallback");

    trackEvent("form_submitted_local", {
      vertical_choice: payload.relevantWorkflow,
      cta_location: "design_partner_form"
    });
    document.querySelector("#form-success").hidden = false;
    mailtoFallback.href = `mailto:hello@agentcomply.ai?subject=${encodeURIComponent(payload.requestType)}&body=${encodeURIComponent(emailBody)}`;
    mailtoFallback.hidden = false;
    event.currentTarget.reset();
  });

  document.querySelector("#sticky-cta-close").addEventListener("click", () => {
    document.querySelector("#sticky-cta").hidden = true;
  });
});
