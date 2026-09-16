import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? window.location.origin
    : "http://localhost:5000");
/* =========================================================
   ICONS
========================================================= */

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),

    tender: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </>
    ),

    bidder: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6" />
      </>
    ),

    verify: (
      <>
        <path d="M12 3l7 3v5c0 4.5-2.9 8.4-7 10-4.1-1.6-7-5.5-7-10V6z" />
        <polyline points="8.5 12 11 14.5 16 9.5" />
      </>
    ),

    report: (
      <>
        <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />
        <path d="M4 19a2 2 0 0 0 2 2h12" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="13" y2="16" />
      </>
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-2.6v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4v-2.6h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V6h2.6v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.3.3z" />
      </>
    ),

    upload: (
      <>
        <path d="M12 16V4" />
        <polyline points="7 9 12 4 17 9" />
        <path d="M5 20h14" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <line x1="20" y1="20" x2="16.2" y2="16.2" />
      </>
    ),

    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    arrow: (
      <>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="13 6 19 12 13 18" />
      </>
    ),

    check: (
      <>
        <polyline points="20 6 9 17 4 12" />
      </>
    ),

    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </>
    ),

    ai: (
      <>
        <path d="M12 3l1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4z" />
        <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" />
      </>
    ),

    warning: (
      <>
        <path d="M10.3 3.7L2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="16.5" x2="12.01" y2="16.5" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </>
    ),

    menu: (
      <>
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </>
    ),

    close: (
      <>
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </>
    ),

    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),

    download: (
      <>
        <path d="M12 3v12" />
        <polyline points="7 11 12 16 17 11" />
        <path d="M5 21h14" />
      </>
    ),

    filter: (
      <>
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="7" y1="12" x2="17" y2="12" />
        <line x1="10" y1="18" x2="14" y2="18" />
      </>
    ),

    chevron: (
      <>
        <polyline points="6 9 12 15 18 9" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.file}</svg>;
}

/* =========================================================
   HELPERS
========================================================= */

function formatBytes(bytes = 0) {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/*
 * SERVER IS THE SOURCE OF TRUTH
 * -----------------------------
 * The backend performs the actual bidder-document evidence verification.
 * The frontend must never invent a new compliance percentage from the
 * rendered labels because that can make the report disagree with the
 * verified backend result.
 */
function getServerScore(value, fallback = null) {
  const number = Number(value);
  if (Number.isFinite(number) && number >= 0 && number <= 100) {
    return number;
  }
  return fallback;
}

function getAnalysisCompliance(analysis, fallback = 0) {
  return clamp(
    getServerScore(
      analysis?.compliancePercentage ??
        analysis?.compliancePercent ??
        analysis?.compliance,
      fallback
    ) ?? fallback
  );
}

function getAnalysisRisk(analysis, fallback = null) {
  const serverRisk = getServerScore(
    analysis?.riskScore ??
      analysis?.risk ??
      analysis?.riskPercentage,
    fallback
  );

  if (serverRisk !== null) return clamp(serverRisk);

  return calculateRisk(analysis);
}

/*
  IMPORTANT:
  AI responses can sometimes return objects/arrays instead of
  plain strings. Rendering an object directly in React causes
  the page to crash with:
  "Objects are not valid as a React child."

  This helper converts any AI value into safe display text.
*/
function safeText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => safeText(item, ""))
      .filter(Boolean);

    return parts.length ? parts.join(", ") : fallback;
  }

  if (typeof value === "object") {
    const preferredKeys = [
      "text",
      "description",
      "summary",
      "reason",
      "message",
      "title",
      "name",
      "value",
      "label",
      "action",
      "excerpt",
      "document",
      "fileName",
      "filename",
    ];

    for (const key of preferredKeys) {
      if (
        value[key] !== undefined &&
        value[key] !== null
      ) {
        const result = safeText(value[key], "");

        if (result) {
          return result;
        }
      }
    }

  return fallback;
  }

  return fallback;
}

function safeObject(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
}

function normalizeAnalysisItem(item, index = 0) {
  if (
    item &&
    typeof item === "object" &&
    !Array.isArray(item)
  ) {
    return item;
  }

  return {
    id: `REQ-${String(index + 1).padStart(3, "0")}`,
    requirement: safeText(
      item,
      `Requirement ${index + 1}`
    ),
    description: safeText(
      item,
      "Requirement details unavailable."
    ),
    status: "REVIEW",
  };
}

function getStatusClass(status = "") {
  const value = safeText(status).toUpperCase().trim();

  if (
    value.includes("NON_COMPLIANT") ||
    value.includes("CRITICAL") ||
    value.includes("FAIL")
  ) {
    return "danger";
  }

  if (
    value.includes("MISSING") ||
    value.includes("HIGH") ||
    value.includes("EXPIRED") ||
    value.includes("MISMATCH") ||
    value.includes("NEEDS_HUMAN_REVIEW") ||
    value.includes("INCONSISTENT") ||
    value.includes("REVIEW")
  ) {
    return "warning";
  }

  if (
    value === "COMPLIANT" ||
    value === "APPROVED" ||
    value === "PASS" ||
    value.includes("COMPLIANT")
  ) {
    return "success";
  }

  return "info";
}

function getStatusLabel(status = "") {
  const value = safeText(status, "REVIEW")
    .replaceAll("_", " ")
    .toLowerCase();

  return value.charAt(0).toUpperCase() + value.slice(1);
}
function calculateRisk(analysis) {
  if (!analysis || typeof analysis !== "object") return 0;

  const rawItems = Array.isArray(analysis.requirementsAnalysis)
    ? analysis.requirementsAnalysis
    : [];

  if (rawItems.length === 0) {
    const directScore = Number(analysis.riskScore);
    return Number.isFinite(directScore)
      ? Math.round(clamp(directScore))
      : 0;
  }

  /*
   * Dynamic requirement-based risk model.
   * The score is normalized across the actual requirements, so a tender with
   * 5 requirements and one with 50 requirements are evaluated consistently.
   *
   * 0   = compliant
   * 35  = review / unclear
   * 55  = human review
   * 60  = inconsistent
   * 70  = mismatch
   * 80  = missing / expired evidence
   * 90  = non-compliant
   * 95  = failed
   * 100 = critical
   */
  const STATUS_RISK = {
    COMPLIANT: 0,
    APPROVED: 0,
    PASS: 0,
    REVIEW: 35,
    NEEDS_HUMAN_REVIEW: 55,
    INCONSISTENT: 60,
    MISMATCH: 70,
    EXPIRED: 80,
    MISSING: 80,
    NON_COMPLIANT: 90,
    FAIL: 95,
    CRITICAL: 100,
  };

  function normalizeStatus(item) {
    const raw = safeText(
      item?.status ||
        item?.complianceStatus ||
        item?.verificationStatus ||
        item?.matchStatus ||
        (item?.compliant === true ? "COMPLIANT" : "REVIEW"),
      "REVIEW"
    )
      .toUpperCase()
      .trim()
      .replace(/[\s-]+/g, "_");

    if (raw.includes("CRITICAL")) return "CRITICAL";
    if (
      raw.includes("NON_COMPLIANT") ||
      raw.includes("NONCOMPLIANT")
    ) {
      return "NON_COMPLIANT";
    }
    if (raw.includes("MISSING")) return "MISSING";
    if (raw.includes("EXPIRED")) return "EXPIRED";
    if (raw.includes("MISMATCH")) return "MISMATCH";
    if (
      raw.includes("NEEDS_HUMAN_REVIEW") ||
      raw.includes("HUMAN_REVIEW")
    ) {
      return "NEEDS_HUMAN_REVIEW";
    }
    if (raw.includes("INCONSISTENT")) return "INCONSISTENT";
    if (raw.includes("FAIL")) return "FAIL";
    if (
      raw === "COMPLIANT" ||
      raw === "APPROVED" ||
      raw === "PASS"
    ) {
      return "COMPLIANT";
    }

    return "REVIEW";
  }

  function isMandatory(item) {
    const value = item?.mandatory;

    return (
      value === true ||
      value === 1 ||
      safeText(value).toLowerCase() === "true" ||
      safeText(value).toLowerCase() === "yes" ||
      safeText(value).toLowerCase() === "mandatory" ||
      safeText(item?.priority).toLowerCase() === "mandatory"
    );
  }

  const scoredItems = rawItems.map((rawItem, index) => {
    const item = normalizeAnalysisItem(rawItem, index);
    const status = normalizeStatus(item);

    /*
     * If the backend explicitly supplies requirement-level risk, respect it.
     * Otherwise derive risk from the verified compliance status.
     */
    const explicitRiskCandidates = [
      item?.riskScore,
      item?.risk,
      item?.riskPercentage,
      item?.riskPercent,
    ];

    let itemRisk = null;

    for (const candidate of explicitRiskCandidates) {
      const number = Number(candidate);

      if (
        Number.isFinite(number) &&
        number >= 0 &&
        number <= 100
      ) {
        itemRisk = number;
        break;
      }
    }

    if (itemRisk === null) {
      itemRisk =
        STATUS_RISK[status] ??
        STATUS_RISK.REVIEW;
    }

    const weight = isMandatory(item) ? 1.5 : 1;

    return {
      status,
      risk: clamp(itemRisk),
      weight,
    };
  });

  const totalWeight = scoredItems.reduce(
    (sum, item) => sum + item.weight,
    0
  );

  if (!totalWeight) return 0;

  const weightedRisk =
    scoredItems.reduce(
      (sum, item) =>
        sum + item.risk * item.weight,
      0
    ) / totalWeight;

  /*
   * Critical/non-compliant requirements must remain visible in the overall
   * score instead of being diluted by many unrelated compliant requirements.
   */
  const criticalRisks = scoredItems
    .filter(
      (item) =>
        item.status === "CRITICAL" ||
        item.status === "NON_COMPLIANT" ||
        item.status === "FAIL"
    )
    .map((item) => item.risk);

  const maxCriticalRisk = criticalRisks.length
    ? Math.max(...criticalRisks)
    : 0;

  /*
   * Missing/expired evidence receives a small completeness adjustment when
   * it affects a substantial portion of the requirement set.
   */
  const missingCount = scoredItems.filter(
    (item) =>
      item.status === "MISSING" ||
      item.status === "EXPIRED"
  ).length;

  const missingRatio =
    scoredItems.length > 0
      ? missingCount / scoredItems.length
      : 0;

  const completenessAdjustment =
    missingRatio >= 0.5
      ? 10
      : missingRatio >= 0.25
      ? 5
      : 0;

  let finalRisk =
    weightedRisk +
    completenessAdjustment;

  if (maxCriticalRisk >= 100) {
    finalRisk = Math.max(finalRisk, 70);
  } else if (maxCriticalRisk >= 90) {
    finalRisk = Math.max(finalRisk, 60);
  }

  return Math.round(clamp(finalRisk));
}

function riskLevelFromScore(score) {
  const value = normalizeNumber(score);

  if (value >= 70) return "HIGH";
  if (value >= 40) return "MEDIUM";
  return "LOW";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getRequirementTitle(item, index) {
  return (
    safeText(item?.title) ||
    safeText(item?.requirement) ||
    safeText(item?.name) ||
    safeText(item?.description) ||
    `Requirement ${index + 1}`
  );
}

function getRequirementDescription(item) {
  return (
    safeText(item?.requirement) ||
    safeText(item?.description) ||
    safeText(item?.details) ||
    safeText(item?.threshold) ||
    "No additional description available."
  );
}

function normalizeEvidenceWhitespace(value) {
  return safeText(value, "")
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/*
 * IMPORTANT:
 * A bidder compliance matrix may legitimately contain REQ-01 / Requirement 1
 * in the SAME LINE as the bidder's answer. Therefore an evidence string must
 * NOT be rejected merely because it contains a requirement ID.
 *
 * We only reject text when it is itself just a tender requirement/title, or
 * an explicit "no evidence" placeholder.
 */
function isLikelyTenderText(value, item = {}) {
  const text = normalizeEvidenceWhitespace(value);
  if (!text) return false;

  const requirement = normalizeEvidenceWhitespace(
    item?.requirement || item?.requirementText
  );
  const title = normalizeEvidenceWhitespace(
    item?.title || item?.requirementTitle
  );

  const normalizedText = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const normalizedRequirement = requirement
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const normalizedTitle = title
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const noEvidencePatterns = [
    /^no bidder evidence found\.?$/i,
    /^no evidence found\.?$/i,
    /^evidence not found\.?$/i,
    /^not provided\.?$/i,
    /^not available\.?$/i,
    /^n\/a\.?$/i,
    /^none\.?$/i,
  ];

  if (noEvidencePatterns.some((pattern) => pattern.test(text))) {
    return true;
  }

  if (
    normalizedRequirement &&
    normalizedText === normalizedRequirement
  ) {
    return true;
  }

  if (
    normalizedTitle &&
    normalizedText === normalizedTitle
  ) {
    return true;
  }

  /*
   * Only a standalone requirement label is considered tender-only.
   * "REQ-01 ... bidder provides ISO certificate" is NOT rejected.
   */
  if (
    /^req(?:uirement)?[-_\s]?\d+\s*$/i.test(text) ||
    /^requirement\s*\d+\s*$/i.test(text)
  ) {
    return true;
  }

  return false;
}

function cleanDisplayEvidenceText(value, parentItem = {}) {
  let text = normalizeEvidenceWhitespace(value);
  if (!text) return "";

  /*
   * Remove frontend/backend contamination without deleting the actual
   * bidder response. This is deliberately conservative.
   */
  text = text
    .replace(/^\s*(?:matched\s+evidence|bidder\s+evidence|evidence)\s*:\s*/i, "")
    .replace(/\s*source\s*:\s*[^|;\n]+$/i, "")
    .replace(/\s*\b(?:document|file)\s*:\s*[^|;\n]+$/i, "")
    .trim();

  text = text.replace(
    /^\s*(?:REQ(?:UIREMENT)?[-_\s]?\d+|Requirement\s+\d+)\s*[:.)-]?\s*/i,
    ""
  );

  /*
   * If a matrix row is:
   *   REQ-01 ... COMPLIANT ... actual bidder response
   * keep the response after the decision marker.
   */
  const decisionMatch = text.match(
    /\b(?:COMPLIANT|COMPLIANCE\s*:\s*COMPLIANT|NON[\s_-]*COMPLIANT|MISSING|PARTIAL)\b\s*[:\-–—]?\s*/i
  );

  if (
    decisionMatch &&
    decisionMatch.index !== undefined &&
    decisionMatch.index > 0
  ) {
    const before = text.slice(0, decisionMatch.index).trim();
    const after = text
      .slice(decisionMatch.index + decisionMatch[0].length)
      .trim();

    /*
     * Only use the post-status text when it contains an actual answer.
     * Otherwise retain the original text rather than accidentally deleting
     * useful evidence.
     */
    if (
      after &&
      !/^source\s*:/i.test(after) &&
      !/^no bidder evidence found\.?$/i.test(after)
    ) {
      text = after;
    } else {
      text = before;
    }
  }

  /*
   * Strip a trailing source filename if the backend already appended it.
   */
  text = text
    .replace(
      /\s+Source:\s*[A-Za-z0-9_.()\- ]+\.(?:pdf|docx|txt)\s*$/i,
      ""
    )
    .trim();

  if (isLikelyTenderText(text, parentItem)) {
    return "";
  }

  return text;
}

function getEvidenceText(item, parentItem = {}) {
  if (!item) return "";

  if (typeof item === "string") {
    return cleanDisplayEvidenceText(item, parentItem);
  }

  if (Array.isArray(item)) {
    return item
      .map((entry) => getEvidenceText(entry, parentItem))
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  const sourceType = safeText(
    item?.sourceType || item?.type,
    ""
  ).toLowerCase();

  if (
    sourceType &&
    sourceType !== "bidder" &&
    sourceType !== "bidder_document" &&
    sourceType !== "bidder-document"
  ) {
    return "";
  }

  const candidates = [
    item?.text,
    item?.excerpt,
    item?.evidence,
    item?.evidenceText,
    item?.bidderEvidence,
    item?.matchedEvidence,
  ];

  for (const candidate of candidates) {
    const text = cleanDisplayEvidenceText(candidate, parentItem);
    if (text) return text;
  }

  return "";
}

function getBidderEvidence(item) {
  const sourceCandidates = safeArray(
    item?.evidenceCandidates
  ).filter((candidate) => {
    const sourceType = safeText(
      candidate?.sourceType || candidate?.type,
      "bidder"
    ).toLowerCase();

    return (
      !sourceType ||
      sourceType === "bidder" ||
      sourceType === "bidder_document" ||
      sourceType === "bidder-document" ||
      sourceType === "bidder_evidence" ||
      sourceType === "bidder-evidence" ||
      sourceType === "bidder_evidence_match"
    );
  });

  const candidatePairs = sourceCandidates
    .map((candidate) => ({
      candidate,
      text: getEvidenceText(candidate, item),
    }))
    .filter((entry) => entry.text);

  if (candidatePairs.length) {
    const uniqueEvidence = [
      ...new Set(
        candidatePairs.map((entry) => entry.text)
      ),
    ].slice(0, 5);

    const first = candidatePairs[0].candidate;

    return {
      text: uniqueEvidence.join(" ").trim(),
      sourceFile: safeText(
        first?.sourceDocument ||
          first?.sourceFile ||
          first?.fileName ||
          first?.filename ||
          first?.documentName,
        ""
      ),
    };
  }

  const directCandidates = [
    item?.bidderEvidence,
    item?.evidenceText,
    item?.evidence,
    item?.matchedEvidence,
    item?.excerpt,
  ];

  const explicitSourceType = safeText(
    item?.sourceType ||
      item?.evidenceSourceType ||
      "",
    ""
  ).toLowerCase();

  const explicitSourceFile = safeText(
    item?.sourceDocument ||
      item?.sourceFile ||
      item?.fileName ||
      item?.filename ||
      item?.documentName,
    ""
  );

  const directEvidenceAllowed =
    !explicitSourceType ||
    explicitSourceType === "bidder" ||
    explicitSourceType === "bidder_document" ||
    explicitSourceType === "bidder-document" ||
    explicitSourceType === "bidder_evidence" ||
    explicitSourceType === "bidder-evidence";

  /*
   * A direct evidence field is trusted only when it is explicitly marked
   * as bidder evidence or is tied to a source document. This prevents
   * generated "matchedEvidence" / recommendation text from being rendered
   * as documentary proof.
   */
  for (const candidate of directCandidates) {
    if (!directEvidenceAllowed && !explicitSourceFile) {
      continue;
    }

    const text = getEvidenceText(candidate, item);
    if (!text) continue;

    if (
      /no bidder evidence found|optionally submit|should submit|recommended to submit|recommendation/i.test(
        text
      )
    ) {
      continue;
    }

    return {
      text,
      sourceFile: explicitSourceFile,
    };
  }

  return {
    text: "",
    sourceFile: "",
  };
}

function normalizeVerificationStatus(item) {
  const raw = safeText(
    item?.status ??
      item?.complianceStatus ??
      item?.verificationStatus ??
      item?.matchStatus ??
      (item?.compliant === true ? "COMPLIANT" : "REVIEW"),
    "REVIEW"
  )
    .toUpperCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  if (
    raw.includes("NON_COMPLIANT") ||
    raw.includes("NONCOMPLIANT")
  ) {
    return "NON_COMPLIANT";
  }

  if (raw.includes("CRITICAL")) return "CRITICAL";
  if (raw.includes("MISSING")) return "MISSING";
  if (raw.includes("EXPIRED")) return "EXPIRED";
  if (raw.includes("MISMATCH")) return "MISMATCH";
  if (
    raw.includes("NEEDS_HUMAN_REVIEW") ||
    raw.includes("HUMAN_REVIEW")
  ) {
    return "NEEDS_HUMAN_REVIEW";
  }
  if (raw.includes("INCONSISTENT")) return "INCONSISTENT";
  if (raw.includes("FAIL")) return "FAIL";

  if (
    raw === "COMPLIANT" ||
    raw === "APPROVED" ||
    raw === "PASS"
  ) {
    return "COMPLIANT";
  }

  return "REVIEW";
}

function getMissingDocumentName(item) {
  if (typeof item === "string") return item;

  return (
    safeText(item?.name) ||
    safeText(item?.document) ||
    safeText(item?.documentName) ||
    safeText(item?.title) ||
    safeText(item?.fileName) ||
    safeText(item?.filename) ||
    "Missing document"
  );
}

function parseResponseValue(data) {
  return (
    data?.analysis ||
    data?.result ||
    data?.data ||
    data
  );
}

async function fetchJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(`Failed to fetch BIDIFI backend at ${API_URL}. Make sure server.js is running on port 5000. (${safeText(error?.message, "Network request failed.")})`);
  }

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned an invalid response (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(safeText(data?.error || data?.message || `Request failed with status ${response.status}.`));
  }
  return data;
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function StatusBadge({ status, children }) {
  const label =
    children !== undefined && children !== null
      ? safeText(children, getStatusLabel(status))
      : getStatusLabel(status);

  return (
    <span className={`statusBadge ${getStatusClass(status)}`}>
      {label}
    </span>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="pageHeader">
      <div>
        {eyebrow && (
          <span className="pageEyebrow">
            {safeText(eyebrow)}
          </span>
        )}

        <h1>{safeText(title)}</h1>

        {description && (
          <p>{safeText(description)}</p>
        )}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}

function PanelHeader({
  title,
  description,
  action,
}) {
  return (
    <div className="panelHeader">
      <div>
        <h3>{safeText(title)}</h3>

        {description && (
          <p>{safeText(description)}</p>
        )}
      </div>

      {action}
    </div>
  );
}

function EmptyState({
  icon = "file",
  title,
  description,
  action,
}) {
  return (
    <div className="emptyState">
      <div className="emptyStateIcon">
        <Icon name={icon} size={25} />
      </div>

      <h3>{safeText(title)}</h3>

      <p>{safeText(description)}</p>

      {action}
    </div>
  );
}

/* =========================================================
   PORTAL HERO
   Scroll-driven "portal" hero: two panels part outward to
   uncover the stage while the BIDIFI wordmark grows, tightens
   its tracking, and splits toward opposite edges.
   Everything below is bound to scroll position only (never a
   timer), so it reverses cleanly when the reader scrolls back
   up, and prefers-reduced-motion collapses straight to the
   finished, fully-open state.
========================================================= */

function getScrollParent(el) {
  let node = el && el.parentElement;

  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);

    if (/(auto|scroll)/.test(style.overflowY)) {
      return node;
    }

    node = node.parentElement;
  }

  return window;
}

function usePortalScrollProgress(sectionRef) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof window === "undefined") return undefined;

    let raf = 0;

    const clamp = (v) => Math.max(0, Math.min(1, v));

    const update = () => {
      raf = 0;

      const rect = section.getBoundingClientRect();
      const vh = Math.max(
        1,
        window.innerHeight || document.documentElement.clientHeight || 1
      );

      /*
       * IMPORTANT:
       * Do NOT calculate this from offsetTop. BIDIFI may live inside
       * wrappers/layouts that change its offset parent.
       *
       * rect.top is the section's real position in the viewport.
       * The hero has a 190vh track, so scrolling from its top toward the
       * end gives us a reliable reversible 0 -> 1 progress value.
       */
      const travel = Math.max(700, section.offsetHeight - vh);
      const next = clamp(-rect.top / travel);

      setProgress((old) =>
        Math.abs(old - next) < 0.0005 ? old : next
      );
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();

    window.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    document.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [sectionRef]);

  return progress;
}

function PortalHero({ navigate }) {
  const sectionRef = useRef(null);
  const progress = usePortalScrollProgress(sectionRef);

  /*
   * The hero deliberately uses a large, obvious motion range.
   * At progress 0 the portal is CLOSED.
   * At progress 1 the portal is completely OPEN.
   */
  const p = progress;
  const open = Math.min(1, p / 0.58);

  // Smooth but reversible easing.
  const eased = 1 - Math.pow(1 - open, 3);

  // The doors travel farther than their own width.
  const panelShift = eased * 118;

  // Image starts overscaled and settles to its natural size.
  const imageScale = 1.16 - eased * 0.16;

  // Centre logo appears as the doors separate.
  const logoOpacity = Math.min(1, Math.max(0, (open - 0.10) / 0.34));
  const logoScale = 0.72 + eased * 0.28;

  // Wordmark signature move.
  const titleScale = 1 + p * 0.28;
  const titleTracking = -0.012 - p * 0.035;
  const titleSplit = p * 58;
  const titleLift = p * -18;

  // Accent dots leave the centre as the portal opens.
  const dotX = eased * 42;
  const dotY = eased * 34;

  return (
    <section className="portalHeroSection" ref={sectionRef}>
      <div className="portalHeroStage">
        <div
          className="portalHeroImage"
          style={{
            transform: `scale(${imageScale})`,
          }}
        />

        <div
          className="portalHeroDuotone"
          style={{
            opacity: eased * 0.12,
          }}
        />

        <div className="portalHeroVeil" />

        <div
          className="portalDot portalDotTL"
          style={{
            transform: `translate(${-dotX}vw, ${-dotY}vh)`,
            opacity: 1 - eased * 0.25,
          }}
        />

        <div
          className="portalDot portalDotBR"
          style={{
            transform: `translate(${dotX}vw, ${dotY}vh)`,
            opacity: 1 - eased * 0.25,
          }}
        />

        {/* THE TWO PORTAL DOORS */}
        <div
          className="portalPanel portalPanelLeft"
          style={{
            transform: `translate3d(-${panelShift}%, 0, 0)`,
          }}
        />

        <div
          className="portalPanel portalPanelRight"
          style={{
            transform: `translate3d(${panelShift}%, 0, 0)`,
          }}
        />

        <div className="portalCornerMeta portalCornerTop">
          <span>
            <Icon name="ai" size={12} />
            AI procurement workspace
          </span>
          <span>BIDIFI</span>
        </div>

        {/* CENTRE LOGO */}
        <div
          className="portalCenterLogo"
          aria-label="BIDIFI"
          style={{
            opacity: logoOpacity,
            transform: `translate(-50%, -50%) scale(${logoScale})`,
          }}
        >
          <span className="portalLogoMark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="presentation">
              <path
                d="M24 4 39 10v11c0 10.5-6.2 18.7-15 23C15.2 39.7 9 31.5 9 21V10l15-6Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path
                d="m16 24 5 5 11-12"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="portalLogoText">BIDIFI</span>
        </div>

        {/* SPLIT WORDMARK */}
        <h1
          className="portalWordmark"
          style={{
            transform: `translate(-50%, calc(-50% + ${titleLift}px)) scale(${titleScale})`,
            letterSpacing: `${titleTracking}em`,
          }}
        >
          <span
            className="portalWordmarkHalf portalWordmarkLeft"
            style={{
              transform: `translate3d(-${titleSplit}%, 0, 0)`,
            }}
          >
            BID
          </span>

          <span
            className="portalWordmarkHalf portalWordmarkRight"
            style={{
              transform: `translate3d(${titleSplit}%, 0, 0)`,
            }}
          >
            IFI
          </span>
        </h1>

        <div className="portalCornerMeta portalCornerBottom">
          <p>
            Turn complex tender documents into clear,
            decision-ready compliance calls.
          </p>

          <div className="portalHeroActions">
            <button
              className="portalHeroButton"
              onClick={() => navigate("Tenders")}
            >
              Start verification
              <Icon name="arrow" size={13} />
            </button>

            <button
              className="portalHeroButtonGhost"
              onClick={() => navigate("Reports")}
            >
              View reports
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .portalHeroSection {
          position: relative;
          width: 100%;
          height: 190vh;
          margin-bottom: 28px;
        }

        .portalHeroStage {
          position: sticky;
          top: 112px;
          height: 76vh;
          min-height: 460px;
          max-height: 720px;
          border-radius: 22px;
          overflow: hidden;
          isolation: isolate;
          background: #0b0f19;
        }

        .portalHeroImage {
          position: absolute;
          inset: -6%;
          background:
            radial-gradient(
              60% 50% at 22% 26%,
              rgba(90, 124, 255, 0.55),
              transparent 60%
            ),
            radial-gradient(
              55% 45% at 80% 74%,
              rgba(124, 92, 255, 0.5),
              transparent 60%
            ),
            radial-gradient(
              85% 70% at 50% 100%,
              rgba(20, 26, 46, 1),
              rgba(9, 12, 20, 1) 70%
            ),
            linear-gradient(160deg, #10162a 0%, #070a12 100%);
          transform-origin: center;
          will-change: transform;
          transition: none !important;
        }

        .portalHeroDuotone {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            #5a7cff 0%,
            #7c5cff 100%
          );
          mix-blend-mode: overlay;
          pointer-events: none;
          transition: none !important;
        }

        .portalHeroVeil {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(
              120% 90% at 50% 50%,
              transparent 40%,
              rgba(4, 6, 12, 0.72) 100%
            );
          pointer-events: none;
        }

        .portalDot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 7px;
          height: 7px;
          margin: -3px 0 0 -3px;
          border-radius: 50%;
          background: #eef1f8;
          box-shadow: 0 0 14px 3px rgba(238, 241, 248, 0.55);
          pointer-events: none;
          will-change: transform, opacity;
          z-index: 3;
        }

        .portalPanel {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 51%;
          background: #0b0f19;
          z-index: 2;
          will-change: transform;
          transition: none !important;
        }

        .portalPanelLeft {
          left: 0;
        }

        .portalPanelRight {
          right: 0;
        }

        .portalCornerMeta {
          position: absolute;
          left: 22px;
          right: 22px;
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #c7cddb;
        }

        .portalCornerTop {
          top: 18px;
          font-size: 10.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .portalCornerTop span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .portalCornerBottom {
          bottom: 18px;
          gap: 18px;
          align-items: flex-end;
        }

        .portalCornerBottom p {
          margin: 0;
          max-width: 34ch;
          font-size: 13px;
          line-height: 1.45;
          color: #dfe3ee;
        }

        .portalHeroActions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .portalHeroButton,
        .portalHeroButtonGhost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          border: none;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .portalHeroButton {
          background: #eef1f8;
          color: #0b0f19;
        }

        .portalHeroButtonGhost {
          background: transparent;
          color: #eef1f8;
          border: 1px solid rgba(238, 241, 248, 0.35);
        }

        .portalWordmark {
          position: absolute;
          top: 50%;
          left: 50%;
          margin: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: clamp(38px, 8vw, 96px);
          color: #eef1f8;
          pointer-events: none;
          transform-origin: center;
          white-space: nowrap;
          will-change: transform, letter-spacing;
          transition: none !important;
        }

        .portalWordmarkHalf {
          display: inline-block;
          will-change: transform;
          transition: none !important;
        }

        .portalWordmarkLeft {
          text-align: right;
        }

        .portalWordmarkRight {
          text-align: left;
        }

        .portalCenterLogo {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #f0eadf;
          pointer-events: none;
          transform-origin: center;
          will-change: transform, opacity;
          transition: none !important;
        }

        .portalLogoMark {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
        }

        .portalLogoMark svg {
          width: 100%;
          height: 100%;
        }

        .portalLogoText {
          font-family: Syne, system-ui, sans-serif;
          font-size: clamp(20px, 3vw, 34px);
          font-weight: 800;
          letter-spacing: -0.045em;
          line-height: 1;
        }

        @media (max-width: 720px) {
          .portalHeroSection {
            height: 150vh;
          }

          .portalHeroStage {
            top: 92px;
            height: 64vh;
            min-height: 380px;
          }

          .portalCornerMeta {
            left: 14px;
            right: 14px;
          }

          .portalCornerBottom {
            flex-direction: column;
            align-items: flex-start;
          }

          .portalWordmark {
            font-size: clamp(32px, 14vw, 62px);
          }
        }
      `}</style>
    </section>
  );
}

function AuthModal({ mode, onClose, onSuccess, apiUrl }) {
  const [activeMode, setActiveMode] = useState(mode || "login");
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "", phone: "", role: "Administrator" });
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setLocalError("");
    try {
      const endpoint = activeMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Authentication failed.");
      if (!data.user) throw new Error("Server did not return an account profile.");
      onSuccess(data.user);
    } catch (error) {
      setLocalError(error?.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authModalBackdrop" onMouseDown={onClose}>
      <div className="authModal" onMouseDown={e => e.stopPropagation()}>
        <button className="authClose" onClick={onClose}><Icon name="close" size={17} /></button>
        <div className="authBrand"><div className="brandMark"><Icon name="ai" size={20} /></div><div><strong>BIDIFI</strong><span>AI BID COMPLIANCE</span></div></div>
        <div className="authTabs">
          <button type="button" className={activeMode === "login" ? "active" : ""} onClick={() => setActiveMode("login")}>Log in</button>
          <button type="button" className={activeMode === "register" ? "active" : ""} onClick={() => setActiveMode("register")}>Create account</button>
        </div>
        <h2>{activeMode === "login" ? "Welcome back" : "Create your BIDIFI account"}</h2>
        <p>{activeMode === "login" ? "Sign in to keep procurement activity linked to your identity." : "Create a workspace identity for tender and bidder audit information."}</p>
        <form onSubmit={submit} className="authForm">
          {activeMode === "register" && <>
            <label>Full name<input required value={form.name} onChange={e => setForm(v => ({...v, name:e.target.value}))} placeholder="Your name" /></label>
            <label>Company / organisation<input value={form.companyName} onChange={e => setForm(v => ({...v, companyName:e.target.value}))} placeholder="Organisation name" /></label>
            <label>Phone<input value={form.phone} onChange={e => setForm(v => ({...v, phone:e.target.value}))} placeholder="Phone number" /></label>
          </>}
          <label>Email<input required type="email" value={form.email} onChange={e => setForm(v => ({...v, email:e.target.value}))} placeholder="you@company.com" /></label>
          <label>Password<input required minLength={6} type="password" value={form.password} onChange={e => setForm(v => ({...v, password:e.target.value}))} placeholder="Minimum 6 characters" /></label>
          {localError && <div className="authError">{safeText(localError)}</div>}
          <button className="primaryButton fullWidth" disabled={busy}>{busy ? "Please wait..." : activeMode === "login" ? "Log in" : "Create account"}</button>
        </form>
        <small className="authSecurityNote">Your password is handled by the BIDIFI backend and is never shown in workspace records.</small>
      </div>
    </div>
  );
}

function SettingsPage({ currentUser, onLogin, onLogout }) {
  const [emailNotifications, setEmailNotifications] =
    useState(true);
  const [analysisNotifications, setAnalysisNotifications] =
    useState(true);
  const [autoSaveReports, setAutoSaveReports] =
    useState(true);
  const [theme, setTheme] = useState("System default");
  const [language, setLanguage] = useState("English");
  const [saved, setSaved] = useState(false);

  function saveSettings() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE SETTINGS"
        title="Settings"
        description="Manage your BIDIFI workspace preferences and analysis behaviour."
      />

      <div style={{ display: "grid", gap: 18, maxWidth: 920 }}>
        <section className="panel accountProfilePanel">
          <div className="panelHeader"><div><h3>Account & identity</h3><p>See which user is currently signed in and the organisation attached to the workspace.</p></div></div>
          {currentUser ? (
            <div className="accountProfileGrid">
              <div><span className="miniLabel">SIGNED IN USER</span><strong>{safeText(currentUser.name || "User")}</strong><small>{safeText(currentUser.email)}</small></div>
              <div><span className="miniLabel">ROLE</span><strong>{safeText(currentUser.role || "Administrator")}</strong><small>{safeText(currentUser.companyName || "No organisation added")}</small></div>
              <div><span className="miniLabel">ACCOUNT ID</span><strong>{safeText(currentUser.id || "Local account")}</strong><small>{currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleString() : ""}</small></div>
              <button className="secondaryButton" type="button" onClick={onLogout}>Sign out</button>
            </div>
          ) : (
            <div className="accountGuestRow"><div><strong>No user is signed in.</strong><span>Sign in to attach your identity to tender and bidder activity.</span></div><button className="primaryButton" type="button" onClick={onLogin}>Log in / Create account</button></div>
          )}
        </section>
        <section className="panel">
          <div className="panelHeader">
            <div>
              <h3>Workspace</h3>
              <p>General preferences for your BIDIFI workspace.</p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "grid", gap: 7 }}>
              <span className="miniLabel">LANGUAGE</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                style={{
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border, #e5e7eb)",
                  background: "var(--panel, #fff)",
                  color: "inherit",
                }}
              >
                <option>English</option>
                <option>Hindi</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 7 }}>
              <span className="miniLabel">APPEARANCE</span>
              <select
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                style={{
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border, #e5e7eb)",
                  background: "var(--panel, #fff)",
                  color: "inherit",
                }}
              >
                <option>System default</option>
                <option>Light</option>
                <option>Dark</option>
              </select>
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <h3>Notifications</h3>
              <p>Choose which BIDIFI updates you want to receive.</p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {[
              [
                "Email notifications",
                "Receive important workspace updates.",
                emailNotifications,
                setEmailNotifications,
              ],
              [
                "AI verification updates",
                "Show notifications when an analysis is completed.",
                analysisNotifications,
                setAnalysisNotifications,
              ],
            ].map(([title, description, enabled, setter]) => (
              <label
                key={title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                  padding: "14px 0",
                  borderBottom: "1px solid var(--border, #e5e7eb)",
                  cursor: "pointer",
                }}
              >
                <span>
                  <strong style={{ display: "block", marginBottom: 4 }}>
                    {title}
                  </strong>
                  <span style={{ opacity: 0.68, fontSize: 13 }}>
                    {description}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setter(event.target.checked)}
                  style={{ width: 18, height: 18, flexShrink: 0 }}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <h3>AI analysis</h3>
              <p>Preferences that affect how analysis results are handled in this workspace.</p>
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              padding: "14px 0",
              cursor: "pointer",
            }}
          >
            <span>
              <strong style={{ display: "block", marginBottom: 4 }}>
                Auto-save reports
              </strong>
              <span style={{ opacity: 0.68, fontSize: 13 }}>
                Keep completed verification reports available in the workspace.
              </span>
            </span>
            <input
              type="checkbox"
              checked={autoSaveReports}
              onChange={(event) => setAutoSaveReports(event.target.checked)}
              style={{ width: 18, height: 18, flexShrink: 0 }}
            />
          </label>
        </section>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          {saved && (
            <span style={{ fontSize: 13, opacity: 0.72 }}>
              Settings saved for this session.
            </span>
          )}
          <button
            className="primaryButton"
            type="button"
            onClick={saveSettings}
          >
            Save settings
          </button>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  activePage,
  navigate,
  mobileMenu,
  closeMobile,
  backendOnline,
  currentUser,
}) {
  const items = [
    { name: "Home", icon: "dashboard" },
    { name: "Tenders", icon: "tender" },
    { name: "Bidder Workspace", icon: "bidder" },
    { name: "AI Verification", icon: "verify" },
    { name: "Reports", icon: "report" },
  ];

  return (
    <aside
      className={`sidebar ${
        mobileMenu ? "open" : ""
      }`}
    >
      <div className="sidebarTop">
        <div className="brand">
          <div className="brandMark">
            <Icon
              name="ai"
              size={21}
              strokeWidth={2.1}
            />
          </div>

          <div>
            <div className="brandName" style={{ fontSize: "23px", fontWeight: 800, letterSpacing: "-0.035em" }}>BIDIFI</div>
            <div className="brandSub">
              AI BID COMPLIANCE
            </div>
          </div>
        </div>

        <button
          className="mobileClose"
          onClick={closeMobile}
          aria-label="Close menu"
        >
          <Icon name="close" size={19} />
        </button>
      </div>

      <div className="workspaceLabel">
        WORKSPACE
      </div>

      <nav className="nav">
        {items.map((item) => (
          <button
            key={item.name}
            className={`navItem ${
              activePage === item.name
                ? "active"
                : ""
            }`}
            onClick={() => navigate(item.name)}
          >
            <span className="navIcon">
              <Icon
                name={item.icon}
                size={17}
              />
            </span>

            <span>{item.name}</span>

            {item.name === "AI Verification" && (
              <span className="navDot" />
            )}
          </button>
        ))}
      </nav>

      <div className="sidebarBottom">
        <div className="systemCard">
          <div className="systemHeader">
            <span className="systemStatusDot" />
            System status
          </div>

          <div className="systemText">
            {backendOnline
              ? "AI compliance engine is online."
              : "Backend connection unavailable."}
          </div>
        </div>

        <button
          className={`navItem ${
            activePage === "Settings" ? "active" : ""
          }`}
          onClick={() => navigate("Settings")}
        >
          <span className="navIcon">
            <Icon
              name="settings"
              size={17}
            />
          </span>

          <span>Settings</span>
        </button>

        <div className="profile">
          <div className="profileAvatar">{safeText((currentUser?.name || "P").charAt(0).toUpperCase())}</div>
          <div>
            <strong>{safeText(currentUser?.name || "Guest User")}</strong>
            <span>{safeText(currentUser?.role || (currentUser ? "Administrator" : "Not signed in"))}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* =========================================================
   TOPBAR
========================================================= */

function Topbar({
  activePage,
  backendOnline,
  openMobile,
  hasAnalysis,
  currentUser,
  onLogin,
  onLogout,
  searchIndex = [],
  notifications = [],
  unreadNotifications = 0,
  onOpenNotifications,
  onClearNotifications,
  onRemoveNotification,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);

  const searchInputRef = useRef(null);
  const searchBoxRef = useRef(null);
  const notifRef = useRef(null);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return searchIndex
      .filter((item) => item?.label && item.label.toLowerCase().includes(query))
      .slice(0, 8);
  }, [searchQuery, searchIndex]);

  useEffect(() => {
    setActiveResultIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    function handleGlobalKeyDown(event) {
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (isCmdK) {
        event.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        searchInputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setSearchOpen(false);
      }

      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSearchResult(item) {
    if (!item) return;
    item.action?.();
    setSearchQuery("");
    setSearchOpen(false);
    setActiveResultIndex(-1);
    searchInputRef.current?.blur();
  }

  function handleSearchKeyDown(event) {
    if (!searchResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex((prev) => (prev + 1) % searchResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = searchResults[activeResultIndex] || searchResults[0];
      selectSearchResult(chosen);
    }
  }

  function toggleNotifications() {
    setNotifOpen((prev) => {
      const next = !prev;
      if (next) onOpenNotifications?.();
      return next;
    });
  }

  function relativeTime(timestamp) {
    const diffMs = Date.now() - Number(timestamp || 0);
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <header className="topbar">
      <div className="topbarLeft">
        <button
          className="mobileMenuButton"
          onClick={openMobile}
          aria-label="Open menu"
        >
          <Icon name="menu" size={20} />
        </button>

        <div className="breadcrumb">
          <span>BIDIFI</span>
          <b>/</b>
          <strong>{safeText(activePage)}</strong>
        </div>
      </div>

      <div className="topbarActions">
        <div
          className="searchBox"
          ref={searchBoxRef}
          style={{ position: "relative", overflow: "visible" }}
        >
          <Icon name="search" size={16} />

          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search workspace..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
            style={{
              flex: "1 1 auto",
              minWidth: 0,
              width: "100%",
              boxSizing: "border-box",
              color: "#0f172a",
              WebkitTextFillColor: "#0f172a",
              caretColor: "#0f172a",
              background: "transparent",
              opacity: 1,
              border: "none",
              outline: "none",
              font: "inherit",
            }}
          />

          {searchQuery ? (
            <button
              type="button"
              className="searchClearButton"
              aria-label="Clear search"
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
            >
              <Icon name="close" size={12} />
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}

          {searchOpen && searchQuery.trim() && (
            <div
              className="searchDropdown"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                minWidth: 280,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                boxShadow: "0 18px 40px rgba(15,23,42,.14)",
                padding: 6,
                zIndex: 60,
                maxHeight: 320,
                overflowY: "auto",
                color: "#0f172a",
              }}
            >
              {searchResults.length === 0 ? (
                <div className="searchEmpty" style={{ color: "#0f172a" }}>
                  No results for &ldquo;{safeText(searchQuery)}&rdquo;
                </div>
              ) : (
                searchResults.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`searchResultItem${index === activeResultIndex ? " active" : ""}`}
                    onMouseEnter={() => setActiveResultIndex(index)}
                    onClick={() => selectSearchResult(item)}
                    style={{ color: "#0f172a" }}
                  >
                    <span className="searchResultType">{safeText(item.type)}</span>
                    <span className="searchResultLabel" style={{ color: "#0f172a" }}>{safeText(item.label)}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="notifWrap" ref={notifRef}>
          <button
            className="iconButton"
            title="Notifications"
            type="button"
            onClick={toggleNotifications}
          >
            <Icon name="bell" size={17} />

            {unreadNotifications > 0 && (
              <span className="notificationDot" />
            )}
          </button>

          {notifOpen && (
            <div className="notifDropdown">
              <div className="notifDropdownHeader">
                <strong>Notifications</strong>

                {notifications.length > 0 && (
                  <button type="button" onClick={onClearNotifications}>
                    Clear all
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="notifEmpty">You're all caught up.</div>
              ) : (
                <div className="notifList">
                  {notifications.map((item) => (
                    <div key={item.id} className={`notifItem ${item.type || "info"}`}>
                      <span className="notifItemIcon">
                        <Icon name={item.type === "warning" ? "warning" : "check"} size={13} />
                      </span>

                      <div className="notifItemBody">
                        <span>{safeText(item.text)}</span>
                        <small>{relativeTime(item.time)}</small>
                      </div>

                      <button
                        type="button"
                        className="notifItemRemove"
                        aria-label="Dismiss notification"
                        onClick={() => onRemoveNotification?.(item.id)}
                      >
                        <Icon name="close" size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button className="accountTopButton" type="button" onClick={() => currentUser ? onLogout() : onLogin()}>
          <span className="accountTopAvatar">{currentUser ? safeText((currentUser.name || "U").charAt(0).toUpperCase()) : <Icon name="bidder" size={15} />}</span>
          <span>{currentUser ? safeText(currentUser.name || "Account") : "Log in / Create account"}</span>
        </button>

        <div
          className={`backendBadge ${
            backendOnline
              ? "online"
              : "offline"
          }`}
        >
          <span />

          {backendOnline
            ? "Engine online"
            : "Offline"}
        </div>
      </div>

      <style>{`
        .searchBox{position:relative;}
        .searchBox input{color:#0f172a !important;-webkit-text-fill-color:#0f172a !important;caret-color:#0f172a !important;background:transparent !important;opacity:1 !important;}
        .searchBox input::placeholder{color:#94a3b8 !important;-webkit-text-fill-color:#94a3b8 !important;opacity:1 !important;}
        :root[data-theme="dark"] .searchBox input{color:#f1f5f9 !important;-webkit-text-fill-color:#f1f5f9 !important;caret-color:#f1f5f9 !important;}
        @media(prefers-color-scheme:dark){:root:not([data-theme="light"]) .searchBox input{color:#f1f5f9 !important;-webkit-text-fill-color:#f1f5f9 !important;caret-color:#f1f5f9 !important;}}
        .searchClearButton{border:0;background:transparent;color:var(--muted,#94a3b8);cursor:pointer;display:grid;place-items:center;padding:2px;border-radius:6px;}
        .searchClearButton:hover{background:rgba(148,163,184,.18);}
        .searchDropdown{position:absolute;top:calc(100% + 8px);left:0;right:0;min-width:280px;background:var(--panel,#fff);border:1px solid var(--border,#e2e8f0);border-radius:12px;box-shadow:0 18px 40px rgba(15,23,42,.14);padding:6px;z-index:60;max-height:320px;overflow-y:auto;}
        .searchEmpty{padding:14px 10px;font-size:12.5px;color:var(--muted,#64748b);text-align:center;}
        .searchResultItem{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:0;background:transparent;padding:9px 10px;border-radius:8px;cursor:pointer;font:inherit;color:inherit;}
        .searchResultItem:hover,.searchResultItem.active{background:rgba(109,93,252,.1);}
        .searchResultType{flex:0 0 auto;font-size:10px;font-weight:750;text-transform:uppercase;letter-spacing:.06em;color:#6d5dfc;background:rgba(109,93,252,.12);padding:3px 7px;border-radius:6px;}
        .searchResultLabel{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .notifWrap{position:relative;}
        .notifDropdown{position:absolute;top:calc(100% + 10px);right:0;width:320px;background:var(--panel,#fff);border:1px solid var(--border,#e2e8f0);border-radius:14px;box-shadow:0 18px 40px rgba(15,23,42,.16);z-index:60;overflow:hidden;}
        .notifDropdownHeader{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border,#eef1f6);}
        .notifDropdownHeader strong{font-size:13.5px;}
        .notifDropdownHeader button{border:0;background:transparent;color:#6d5dfc;font-size:12px;font-weight:700;cursor:pointer;}
        .notifEmpty{padding:22px 14px;text-align:center;font-size:12.5px;color:var(--muted,#64748b);}
        .notifList{max-height:340px;overflow-y:auto;}
        .notifItem{display:flex;align-items:flex-start;gap:10px;padding:11px 14px;border-bottom:1px solid var(--border,#f1f4f9);}
        .notifItem:last-child{border-bottom:0;}
        .notifItemIcon{flex:0 0 auto;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:rgba(34,197,94,.14);color:#16a34a;}
        .notifItem.warning .notifItemIcon{background:rgba(244,63,94,.12);color:#be123c;}
        .notifItemBody{flex:1 1 auto;display:grid;gap:3px;min-width:0;}
        .notifItemBody span{font-size:12.5px;font-weight:600;line-height:1.4;word-break:break-word;}
        .notifItemBody small{font-size:10.5px;color:var(--muted,#94a3b8);}
        .notifItemRemove{flex:0 0 auto;border:0;background:transparent;color:var(--muted,#94a3b8);cursor:pointer;display:grid;place-items:center;padding:2px;border-radius:6px;}
        .notifItemRemove:hover{background:rgba(148,163,184,.18);}
        @media(max-width:600px){.searchDropdown{position:fixed;left:12px;right:12px;top:64px;}.notifDropdown{position:fixed;left:12px;right:12px;top:64px;width:auto;}}
      `}</style>
    </header>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function DashboardPage({
  tenders,
  selectedTender,
  requirements,
  bidderDocumentCount,
  analysis,
  navigate,
  isHome = false,
}) {
  const risk = calculateRisk(analysis);

  return (
    <div className={isHome ? "dashboardHomePage" : "dashboardPage"}>
      <PageHeader
        eyebrow="AI PROCUREMENT WORKSPACE"
        title="Good to see you."
        description="Review tenders, validate bidder evidence, and turn complex procurement documents into clear decisions."
      />

      <PortalHero navigate={navigate} />
      

      <section className="statsGrid">
        <div className="statCard">
          <div className="statIcon blue">
            <Icon name="tender" size={17} />
          </div>

          <span>Active Tenders</span>
          <strong>{tenders.length}</strong>
          <small>
            Uploaded workspace files
          </small>
        </div>

        <div className="statCard">
          <div className="statIcon violet">
            <Icon name="ai" size={17} />
          </div>

          <span>
            Requirements Extracted
          </span>

          <strong>
            {requirements.length}
          </strong>

          <small>
            AI procurement checks
          </small>
        </div>

        <div className="statCard">
          <div className="statIcon cyan">
            <Icon name="file" size={17} />
          </div>

          <span>
            Bidder Documents
          </span>

          <strong>
            {bidderDocumentCount}
          </strong>

          <small>
            Evidence processed
          </small>
        </div>

        <div className="statCard">
          <div className="statIcon amber">
            <Icon name="warning" size={17} />
          </div>

          <span>
            Compliance Risk
          </span>

          <strong>{risk}</strong>

          <small>
            {analysis
              ? `${riskLevelFromScore(
                  risk
                )} risk`
              : "No analysis yet"}
          </small>
        </div>
      </section>

      <section className="panel workflowPanel">
        <PanelHeader
          title="How BIDIFI works"
          description="A simple AI-assisted procurement workflow."
        />

        <div className="workflow">
          {[
            [
              "01",
              "Upload tender",
              "Add the procurement PDF.",
            ],
            [
              "02",
              "Extract rules",
              "AI identifies key requirements.",
            ],
            [
              "03",
              "Check evidence",
              "Compare bidder documents.",
            ],
            [
              "04",
              "Make decision",
              "Review risk and report.",
            ],
          ].map(
            ([number, title, text], index) => (
              <React.Fragment key={number}>
                <div className="workflowStep">
                  <div className="workflowNumber">
                    {number}
                  </div>

                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </div>

                {index < 3 && (
                  <div className="workflowLine" />
                )}
              </React.Fragment>
            )
          )}
        </div>
      </section>

      <div className="dashboardColumns">
        <section className="panel recentPanel">
          <PanelHeader
            title="Recent tenders"
            description="Your latest procurement work."
            action={
              <button
                className="textButton"
                onClick={() =>
                  navigate("Tenders")
                }
              >
                View all
                <Icon
                  name="arrow"
                  size={13}
                />
              </button>
            }
          />

          {tenders.length === 0 ? (
            <EmptyState
              icon="tender"
              title="No tenders yet"
              description="Upload your first tender to start extracting procurement requirements."
              action={
                <button
                  className="secondaryButton"
                  onClick={() =>
                    navigate("Tenders")
                  }
                >
                  Upload tender
                </button>
              }
            />
          ) : (
            <div className="recentTenderList">
              {tenders
                .slice(0, 5)
                .map((tender) => (
                  <div
                    className={`recentTender ${
                      selectedTender?.id ===
                      tender.id
                        ? "selected"
                        : ""
                    }`}
                    key={tender.id}
                  >
                    <div className="recentTenderIcon">
                      <Icon
                        name="file"
                        size={15}
                      />
                    </div>

                    <div>
                      <strong>
                        {safeText(
                          tender.name ||
                            tender.filename,
                          "Untitled tender"
                        )}
                      </strong>

                      <span>
                        {tender.requirements?.length || 0} requirements{" · "}
                        {tender.uploadedAt ? new Date(tender.uploadedAt).toLocaleDateString() : "Recently uploaded"}
                      </span>
                      <small style={{display:"block",marginTop:4,opacity:.68}}>Uploaded by {safeText(tender.uploadedBy?.companyName || tender.uploadedBy?.name || "Workspace user")}</small>
                    </div>

                    <StatusBadge
                      status={
                        tender.requirements
                          ?.length
                          ? "EXTRACTED"
                          : "UPLOADED"
                      }
                    />
                  </div>
                ))}
            </div>
          )}
        </section>

        <section className="panel activityPanel">
          <PanelHeader
            title="AI activity"
            description="Latest verification state."
          />

          <div className="activityList">
            <div className="activityItem">
              <div className="activityIcon blue">
                <Icon
                  name="tender"
                  size={15}
                />
              </div>

              <div>
                <strong>
                  {selectedTender
                    ? "Tender selected"
                    : "Waiting for tender"}
                </strong>

                <span>
                  {selectedTender
                    ? safeText(
                        selectedTender.name ||
                          selectedTender.filename,
                        "Selected tender"
                      )
                    : "Upload a procurement document"}
                </span>
              </div>
            </div>

            <div className="activityItem">
              <div className="activityIcon violet">
                <Icon name="ai" size={15} />
              </div>

              <div>
                <strong>
                  {requirements.length
                    ? "Requirements extracted"
                    : "AI extraction pending"}
                </strong>

                <span>
                  {requirements.length
                    ? `${requirements.length} checks identified`
                    : "Run requirement extraction"}
                </span>
              </div>
            </div>

            <div className="activityItem">
              <div className="activityIcon green">
                <Icon
                  name="verify"
                  size={15}
                />
              </div>

              <div>
                <strong>
                  {analysis
                    ? "Verification complete"
                    : "Verification pending"}
                </strong>

                <span>
                  {analysis
                    ? `${normalizeNumber(
                        analysis.compliancePercentage ??
                          analysis.compliancePercent
                      )}% compliance`
                    : "Upload bidder evidence to continue"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   TENDERS
========================================================= */

function TendersPage({
  tenders,
  selectedTender,
  selectedTenderFiles,
  requirements,
  loading,
  handleTenderFiles,
  uploadTenders,
  selectTender,
  extractRequirements,
  removeSelectedTenderFile,
  tenderInputRef,
  uploaderInfo,
  setUploaderInfo,
  currentUser,
}) {
  return (
    <>
      <PageHeader
        eyebrow="PROCUREMENT INPUT"
        title="Tender workspace"
        description="Upload tender documents and let BIDIFI identify the rules that matter."
        action={
          <button
            className="primaryButton"
            onClick={() =>
              tenderInputRef.current?.click()
            }
          >
            <Icon name="plus" size={14} />
            Add tender
          </button>
        }
      />

      <section className="panel entityInfoPanel">
        <PanelHeader title="Tender uploader / company information" description="Record who submitted this procurement tender so the workspace keeps a clear audit trail." />
        <div className="infoGrid">
          <label><span>Company name</span><input value={uploaderInfo.companyName} onChange={e => setUploaderInfo(v => ({...v, companyName:e.target.value}))} placeholder="Company / organisation" /></label>
          <label><span>Contact person</span><input value={uploaderInfo.contactName} onChange={e => setUploaderInfo(v => ({...v, contactName:e.target.value}))} placeholder="Contact name" /></label>
          <label><span>Email</span><input type="email" value={uploaderInfo.email} onChange={e => setUploaderInfo(v => ({...v, email:e.target.value}))} placeholder="name@company.com" /></label>
          <label><span>Phone</span><input value={uploaderInfo.phone} onChange={e => setUploaderInfo(v => ({...v, phone:e.target.value}))} placeholder="Phone number" /></label>
          <label><span>GSTIN</span><input value={uploaderInfo.gstin} onChange={e => setUploaderInfo(v => ({...v, gstin:e.target.value}))} placeholder="Optional" /></label>
          <label><span>Registration / CIN</span><input value={uploaderInfo.registrationNumber} onChange={e => setUploaderInfo(v => ({...v, registrationNumber:e.target.value}))} placeholder="Optional" /></label>
        </div>
        {currentUser && <small className="entityAuditNote">Signed in as <strong>{safeText(currentUser.name || currentUser.email)}</strong>{currentUser.companyName ? ` · ${safeText(currentUser.companyName)}` : ""}</small>}
      </section>

      <div className="tenderWorkspace">
        <section className="panel uploadPanel">
          <PanelHeader
            title="Upload tender documents"
            description="PDF files up to 25 MB are supported."
          />

          <input
            ref={tenderInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            hidden
            onChange={handleTenderFiles}
          />

          <button
            className="tenderDropzone"
            onClick={() =>
              tenderInputRef.current?.click()
            }
          >
            <div className="dropzoneIcon">
              <Icon
                name="upload"
                size={23}
              />
            </div>

            <strong>
              Drop tender PDFs here
            </strong>

            <span>
              Upload one or multiple tender
              documents for AI requirement
              extraction.
            </span>

            <small>
              PDF · Maximum 25 MB per file
            </small>
          </button>

          {selectedTenderFiles.length >
            0 && (
            <div className="selectedFiles">
              <div className="selectedFilesHeader">
                <strong>
                  Selected files
                </strong>

                <span>
                  {selectedTenderFiles.length}
                </span>
              </div>

              {selectedTenderFiles.map(
                (file, index) => (
                  <div
                    className="fileRow"
                    key={`${file.name}-${index}`}
                  >
                    <div className="fileRowIcon">
                      <Icon
                        name="file"
                        size={15}
                      />
                    </div>

                    <div>
                      <strong>
                        {file.name}
                      </strong>

                      <span>
                        {formatBytes(
                          file.size
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="removeFile"
                      onClick={() =>
                        removeSelectedTenderFile(
                          index
                        )
                      }
                    >
                      <Icon
                        name="close"
                        size={14}
                      />
                    </button>
                  </div>
                )
              )}

              <button
                className="primaryButton fullWidth"
                disabled={loading.tender}
                onClick={uploadTenders}
              >
                {loading.tender ? (
                  <>
                    <span className="spinner" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Icon
                      name="upload"
                      size={14}
                    />
                    Upload tender
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        <section className="panel tenderListPanel">
          <PanelHeader
            title="Tender library"
            description={`${tenders.length} tender${
              tenders.length === 1
                ? ""
                : "s"
            } in workspace`}
          />

          {tenders.length === 0 ? (
            <EmptyState
              icon="tender"
              title="Your tender library is empty"
              description="Uploaded tender documents will appear here."
            />
          ) : (
            <div className="tenderList">
              {tenders.map((tender) => (
                <button
                  className={`tenderListItem ${
                    selectedTender?.id ===
                    tender.id
                      ? "selected"
                      : ""
                  }`}
                  key={tender.id}
                  onClick={() =>
                    selectTender(tender)
                  }
                >
                  <div className="tenderListIcon">
                    <Icon
                      name="file"
                      size={17}
                    />
                  </div>

                  <div>
                    <strong>
                      {safeText(
                        tender.name ||
                          tender.filename,
                        "Untitled tender"
                      )}
                    </strong>

                    <span>
                      {tender.requirements?.length || 0} requirements{" · "}
                      {tender.uploadedAt ? new Date(tender.uploadedAt).toLocaleDateString() : "Recently"}
                    </span>
                    <small style={{display:"block",marginTop:4,opacity:.68}}>Uploaded by {safeText(tender.uploadedBy?.companyName || tender.uploadedBy?.name || "Workspace user")}</small>
                  </div>

                  <Icon
                    name="chevron"
                    size={14}
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel aiExtractionPanel">
        <div className="aiExtractionHeader">
          <div>
            <span className="aiLabel">
              <Icon name="ai" size={13} />
              AI REQUIREMENT ENGINE
            </span>

            <h2>
              {selectedTender
                ? safeText(
                    selectedTender.name ||
                      selectedTender.filename,
                    "Selected tender"
                  )
                : "Select a tender"}
            </h2>

            <p>
              BIDIFI will identify mandatory
              requirements, thresholds, documents,
              deadlines, eligibility rules, and
              other procurement conditions.
            </p>
          </div>

          <button
            className="aiButton"
            disabled={
              loading.requirements ||
              !selectedTender
            }
            onClick={extractRequirements}
          >
            {loading.requirements ? (
              <>
                <span className="spinner" />
                Extracting...
              </>
            ) : (
              <>
                <Icon name="ai" size={14} />
                Extract requirements
              </>
            )}
          </button>
        </div>

        {selectedTender ? (
          <div className="aiExplanation">
            <div>
              <Icon
                name="tender"
                size={17}
              />

              <strong>
                Tender context
              </strong>

              <span>
                {safeText(
                  selectedTender.name ||
                    selectedTender.filename,
                  "Selected tender"
                )}
              </span>
            </div>

            <div>
              <Icon name="ai" size={17} />

              <strong>
                AI extraction
              </strong>

              <span>
                {requirements.length
                  ? `${requirements.length} requirements found`
                  : "Ready to analyze"}
              </span>
            </div>

            <div>
              <Icon
                name="check"
                size={17}
              />

              <strong>
                Next step
              </strong>

              <span>
                Upload bidder evidence
              </span>
            </div>
          </div>
        ) : (
          <div className="tenderEmptyHint">
            <Icon
              name="file"
              size={18}
            />
            Select an uploaded tender to begin
            AI extraction.
          </div>
        )}
      </section>

      <section className="panel requirementsPanel">
        <PanelHeader
          title="Extracted requirements"
          description={
            requirements.length
              ? `${requirements.length} procurement requirements identified by AI.`
              : "Requirements will appear after AI extraction."
          }
          action={
            requirements.length > 0 && (
              <span className="countBadge">
                {requirements.length}
              </span>
            )
          }
        />

        {requirements.length === 0 ? (
          <EmptyState
            icon="ai"
            title="No requirements extracted"
            description="Select a tender and run AI extraction to create the compliance checklist."
          />
        ) : (
          <RequirementsSection
            requirements={requirements}
          />
        )}
      </section>
    </>
  );
}

function RequirementsSection({
  requirements,
}) {
  return (
    <div className="requirementsTable">
      <div className="requirementsHead">
        <span>ID</span>
        <span>CATEGORY</span>
        <span>REQUIREMENT</span>
        <span>MANDATORY</span>
      </div>

      {requirements.map((rawReq, index) => {
        const req = safeObject(
          rawReq
        );

        const mandatory =
          req?.mandatory === true ||
          safeText(req?.mandatory).toLowerCase() ===
            "yes" ||
          safeText(req?.mandatory).toLowerCase() ===
            "true";

        return (
          <div
            className="requirementRow"
            key={
              safeText(req.id) ||
              index
            }
          >
            <span className="requirementId">
              {safeText(
                req.id,
                `REQ-${String(
                  index + 1
                ).padStart(3, "0")}`
              )}
            </span>

            <span className="requirementCategory">
              {safeText(
                req.category ||
                  req.type,
                "General"
              )}
            </span>

            <div>
              <strong>
                {getRequirementTitle(
                  req,
                  index
                )}
              </strong>

              <p>
                {getRequirementDescription(
                  req
                )}
              </p>

              {req.threshold && (
                <small className="requirementThreshold">
                  Threshold:{" "}
                  {safeText(
                    req.threshold
                  )}
                </small>
              )}
            </div>

            <span
              className={`mandatoryBadge ${
                mandatory ? "yes" : "no"
              }`}
            >
              {mandatory
                ? "YES"
                : "NO"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   BIDDER WORKSPACE
========================================================= */

function BiddersPage({
  selectedTender,
  requirements,
  bidderDocuments,
  bidderDocumentCount,
  bidderId,
  loading,
  handleBidderDocuments,
  removeBidderDocument,
  uploadBidderDocuments,
  analyzeCompliance,
  bidderInputRef,
  batchBidders,
  batchResults,
  batchLoading,
  batchInputRefs,
  addBatchBidder,
  removeBatchBidder,
  updateBatchBidderName,
  handleBatchBidderDocuments,
  removeBatchBidderDocument,
  analyzeAllBids,
  bidderInfo,
  setBidderInfo,
  currentUser,
}) {
  const tenderReady =
    Boolean(selectedTender);

  const requirementsReady =
    requirements.length > 0;

  const bidderReady =
    Boolean(bidderId);

  return (
    <>
      <PageHeader
        eyebrow="EVIDENCE WORKSPACE"
        title="Bidder workspace"
        description="Build an evidence package and prepare it for AI compliance verification."
      />

      <div className="stepIndicator">
        <div className="stepIndicatorItem done">
          <span>01</span>

          <div>
            <strong>Tender</strong>

            <small>
              {tenderReady
                ? "Selected"
                : "Not selected"}
            </small>
          </div>
        </div>

        <div className="stepIndicatorConnector" />

        <div
          className={`stepIndicatorItem ${
            requirementsReady
              ? "done"
              : ""
          }`}
        >
          <span>02</span>

          <div>
            <strong>
              Requirements
            </strong>

            <small>
              {requirementsReady
                ? `${requirements.length} extracted`
                : "Pending"}
            </small>
          </div>
        </div>

        <div className="stepIndicatorConnector" />

        <div
          className={`stepIndicatorItem ${
            bidderReady
              ? "done"
              : ""
          }`}
        >
          <span>03</span>

          <div>
            <strong>
              Bidder evidence
            </strong>

            <small>
              {bidderReady
                ? `${bidderDocumentCount} documents`
                : "Pending"}
            </small>
          </div>
        </div>
      </div>

      <section className="panel entityInfoPanel">
        <PanelHeader title="Bidder information" description="Capture the bidder identity and organisation details attached to this evidence package." />
        <div className="infoGrid">
          <label><span>Bidder name</span><input value={bidderInfo.bidderName} onChange={e => setBidderInfo(v => ({...v, bidderName:e.target.value}))} placeholder="Bidder / vendor name" /></label>
          <label><span>Company name</span><input value={bidderInfo.companyName} onChange={e => setBidderInfo(v => ({...v, companyName:e.target.value}))} placeholder="Legal entity" /></label>
          <label><span>Contact person</span><input value={bidderInfo.contactName} onChange={e => setBidderInfo(v => ({...v, contactName:e.target.value}))} placeholder="Contact name" /></label>
          <label><span>Email</span><input type="email" value={bidderInfo.email} onChange={e => setBidderInfo(v => ({...v, email:e.target.value}))} placeholder="bidder@company.com" /></label>
          <label><span>Phone</span><input value={bidderInfo.phone} onChange={e => setBidderInfo(v => ({...v, phone:e.target.value}))} placeholder="Phone number" /></label>
          <label><span>Registration / GST / CIN</span><input value={bidderInfo.registrationNumber} onChange={e => setBidderInfo(v => ({...v, registrationNumber:e.target.value}))} placeholder="Optional" /></label>
        </div>
        {currentUser && <small className="entityAuditNote">Workspace user: <strong>{safeText(currentUser.name || currentUser.email)}</strong></small>}
      </section>

      <div className="bidderGrid">
        <section className="panel bidderUploadPanel">
          <PanelHeader
            title="Bidder evidence"
            description="Upload PDF, DOCX or TXT evidence documents."
          />

          <input
            ref={bidderInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            multiple
            hidden
            onChange={handleBidderDocuments}
          />

          <button
            className="bidderDropzone"
            onClick={() =>
              bidderInputRef.current?.click()
            }
          >
            <div className="dropzoneIcon">
              <Icon
                name="upload"
                size={22}
              />
            </div>

            <strong>
              Drop bidder documents here
            </strong>

            <span>
              Add certificates, declarations,
              registrations, financial evidence,
              technical documents and other
              bidder proof.
            </span>

            <small>
              PDF · DOCX · TXT
            </small>
          </button>

          {bidderDocuments.length >
            0 && (
            <div className="selectedFiles bidderFiles">
              <div className="selectedFilesHeader">
                <strong>
                  Documents ready
                </strong>

                <span>
                  {bidderDocuments.length}
                </span>
              </div>

              {bidderDocuments.map(
                (file, index) => (
                  <div
                    className="fileRow"
                    key={`${file.name}-${index}`}
                  >
                    <div className="fileRowIcon">
                      <Icon
                        name="file"
                        size={15}
                      />
                    </div>

                    <div>
                      <strong>
                        {file.name}
                      </strong>

                      <span>
                        {formatBytes(
                          file.size
                        )}
                      </span>
                    </div>

                    <button
                      className="removeFile"
                      onClick={() =>
                        removeBidderDocument(
                          index
                        )
                      }
                    >
                      <Icon
                        name="close"
                        size={14}
                      />
                    </button>
                  </div>
                )
              )}

              <button
                className="primaryButton fullWidth"
                disabled={loading.bidder}
                onClick={
                  uploadBidderDocuments
                }
              >
                {loading.bidder ? (
                  <>
                    <span className="spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon
                      name="ai"
                      size={14}
                    />
                    Process bidder evidence
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        <section className="panel verificationReadyPanel">
          <div className="readyIcon">
            <Icon
              name="verify"
              size={25}
            />
          </div>

          <h3>
            Verification readiness
          </h3>

          <p>
            BIDIFI checks every extracted
            requirement against the evidence
            submitted by the bidder.
          </p>

          <div className="readinessList">
            <div className="readinessRow">
              <div
                className={`readinessIcon ${
                  tenderReady
                    ? "done"
                    : ""
                }`}
              >
                <Icon
                  name={
                    tenderReady
                      ? "check"
                      : "clock"
                  }
                  size={12}
                />
              </div>

              <span>
                Tender selected
              </span>

              <strong>
                {tenderReady
                  ? "Ready"
                  : "Pending"}
              </strong>
            </div>

            <div className="readinessRow">
              <div
                className={`readinessIcon ${
                  requirementsReady
                    ? "done"
                    : ""
                }`}
              >
                <Icon
                  name={
                    requirementsReady
                      ? "check"
                      : "clock"
                  }
                  size={12}
                />
              </div>

              <span>
                Requirements extracted
              </span>

              <strong>
                {requirementsReady
                  ? `${requirements.length} found`
                  : "Pending"}
              </strong>
            </div>

            <div className="readinessRow">
              <div
                className={`readinessIcon ${
                  bidderReady
                    ? "done"
                    : ""
                }`}
              >
                <Icon
                  name={
                    bidderReady
                      ? "check"
                      : "clock"
                  }
                  size={12}
                />
              </div>

              <span>
                Bidder evidence uploaded
              </span>

              <strong>
                {bidderReady
                  ? `${bidderDocumentCount} docs`
                  : "Pending"}
              </strong>
            </div>
          </div>
          <button
  className="aiButton fullWidth"
  disabled={loading.analysis}
  onClick={analyzeCompliance}
>
            {loading.analysis ? (
              <>
                <span className="spinner" />
                Running AI verification...
              </>
            ) : (
              <>
                <Icon
                  name="ai"
                  size={14}
                />
                Run AI verification
              </>
            )}
          </button>

          {!tenderReady && (
            <div className="helperText">
              Select a tender first.
            </div>
          )}

          {tenderReady &&
            !requirementsReady && (
              <div className="helperText">
                Extract tender requirements
                before verification.
              </div>
            )}

          {requirementsReady &&
            !bidderReady && (
              <div className="helperText">
                Process bidder evidence before
                verification.
              </div>
            )}
        </section>
      </div>

      <section className="panel" style={{ marginTop: 20 }}>
        <PanelHeader
          title="Batch bid analysis"
          description="Add up to 20 separate bidders and upload multiple evidence documents for each bidder."
          action={
            <button
              className="primaryButton"
              disabled={batchBidders.length >= 20 || batchLoading}
              onClick={addBatchBidder}
            >
              <Icon name="plus" size={14} />
              Add bidder
            </button>
          }
        />

        <div style={{ display: "grid", gap: 14 }}>
          {batchBidders.map((bidder, bidderIndex) => (
            <div
              key={bidder.id}
              className="selectedFiles"
              style={{ marginTop: 0 }}
            >
              <div
                className="selectedFilesHeader"
                style={{ alignItems: "center" }}
              >
                <strong>
                  Bidder {bidderIndex + 1}
                </strong>

                <span>
                  {bidder.documents.length} docs
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <input
                  value={bidder.name}
                  onChange={(event) =>
                    updateBatchBidderName(
                      bidderIndex,
                      event.target.value
                    )
                  }
                  placeholder={`Bidder ${bidderIndex + 1} name`}
                  disabled={batchLoading}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "11px 12px",
                    border: "1px solid #dbe3f0",
                    borderRadius: 10,
                    outline: "none",
                    font: "inherit",
                    background: "#fff",
                  }}
                />

                {batchBidders.length > 1 && (
                  <button
                    className="removeFile"
                    onClick={() =>
                      removeBatchBidder(bidderIndex)
                    }
                    disabled={batchLoading}
                    title="Remove bidder"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>

              <input
                ref={(element) => {
                  batchInputRefs.current[bidder.id] = element;
                }}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                multiple
                hidden
                onChange={(event) =>
                  handleBatchBidderDocuments(
                    event,
                    bidderIndex
                  )
                }
              />

              <button
                className="bidderDropzone"
                onClick={() =>
                  batchInputRefs.current[bidder.id]?.click()
                }
                disabled={batchLoading}
              >
                <div className="dropzoneIcon">
                  <Icon name="upload" size={20} />
                </div>

                <strong>
                  Add documents for {
                    safeText(
                      bidder.name,
                      `Bidder ${bidderIndex + 1}`
                    )
                  }
                </strong>

                <span>
                  Multiple PDF, DOCX or TXT files are supported.
                </span>

                <small>
                  PDF · DOCX · TXT · 25 MB per file
                </small>
              </button>

              {bidder.documents.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {bidder.documents.map((file, documentIndex) => (
                    <div
                      className="fileRow"
                      key={`${file.name}-${documentIndex}`}
                    >
                      <div className="fileRowIcon">
                        <Icon name="file" size={15} />
                      </div>

                      <div>
                        <strong>{file.name}</strong>
                        <span>{formatBytes(file.size)}</span>
                      </div>

                      <button
                        className="removeFile"
                        onClick={() =>
                          removeBatchBidderDocument(
                            bidderIndex,
                            documentIndex
                          )
                        }
                        disabled={batchLoading}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          className="aiButton fullWidth"
          style={{ marginTop: 16 }}
          disabled={
            batchLoading ||
            !selectedTender ||
            !requirementsReady
          }
          onClick={analyzeAllBids}
        >
          {batchLoading ? (
            <>
              <span className="spinner" />
              Analyzing all bids...
            </>
          ) : (
            <>
              <Icon name="ai" size={14} />
              Analyze All Bids
            </>
          )}
        </button>

        {batchResults.length > 0 && (
          <div style={{ marginTop: 18, overflowX: "auto" }}>
            <div
              style={{
                minWidth: 680,
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr .8fr .8fr 1fr 1.4fr",
                  gap: 10,
                  padding: "11px 14px",
                  background: "#f8fafc",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#475569",
                }}
              >
                <span>Bidder</span>
                <span>Docs</span>
                <span>Compliance</span>
                <span>Risk</span>
                <span>Status</span>
              </div>

              {batchResults.map((item, index) => {
                const itemAnalysis = item.analysis || {};
                const compliance = clamp(
                  normalizeNumber(
                    itemAnalysis.compliancePercentage ??
                      itemAnalysis.compliancePercent
                  )
                );
                const risk = getAnalysisRisk(
                  itemAnalysis,
                  calculateRisk(itemAnalysis)
                );

                const status = item.success
                  ? safeText(
                      itemAnalysis.overallDecision,
                      compliance >= 80
                        ? "COMPLIANT"
                        : compliance >= 60
                        ? "REVIEW"
                        : "NON_COMPLIANT"
                    )
                  : "FAILED";

                return (
                  <div
                    key={`${item.bidderId}-${index}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr .8fr .8fr 1fr 1.4fr",
                      gap: 10,
                      alignItems: "center",
                      padding: "13px 14px",
                      borderTop: "1px solid #e2e8f0",
                      fontSize: 13,
                    }}
                  >
                    <strong style={{ color: "#0f172a" }}>
                      {safeText(item.bidderName, "Unnamed Bidder")}
                    </strong>
                    <span>{item.documentCount}</span>
                    <strong>{item.success ? `${Math.round(compliance)}%` : "—"}</strong>
                    <span>{item.success ? `${risk}/100` : "—"}</span>
                    <div>
                      <StatusBadge status={status}>
                        {item.success
                          ? status === "COMPLIANT"
                            ? "Compliant"
                            : status === "REVIEW"
                            ? "Review"
                            : "Non-compliant"
                          : "Analysis failed"}
                      </StatusBadge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!selectedTender && (
          <div className="helperText">
            Select a tender first.
          </div>
        )}

        {selectedTender && !requirementsReady && (
          <div className="helperText">
            Extract tender requirements before batch verification.
          </div>
        )}
      </section>
    </>
  );
}

/* =========================================================
   VERIFICATION
========================================================= */

function VerificationPage({
  
  analysis,
  navigate,
}) {
    const [
    editedRecommendations,
    setEditedRecommendations,
  ] = useState([]);

  const [
    recommendationsSaved,
    setRecommendationsSaved,
  ] = useState(false);
  const [
  recommendationsSubmitted,
  setRecommendationsSubmitted,
] = useState(false);
  if (!analysis) {
    return (
      <div className="emptyVerification">
        <div className="emptyVerificationIcon">
          <Icon
            name="verify"
            size={31}
          />
        </div>

        <h2>
          AI verification is waiting for
          evidence.
        </h2>

        <p>
          Upload a tender, extract its
          requirements, process bidder evidence,
          and BIDIFI will compare the two
          evidence sets.
        </p>

        <div className="verificationChecklist">
          <div>
            <Icon
              name="check"
              size={12}
            />
            Tender
          </div>

          <div>
            <Icon
              name="check"
              size={12}
            />
            Requirements
          </div>

          <div>
            <Icon
              name="check"
              size={12}
            />
            Evidence
          </div>

          <div>
            <Icon
              name="check"
              size={12}
            />
            AI decision
          </div>
        </div>

        <button
          className="primaryButton"
          onClick={() =>
            navigate(
              "Bidder Workspace"
            )
          }
        >
          Open evidence workspace
          <Icon
            name="arrow"
            size={14}
          />
        </button>
      </div>
    );
  }

  const items = safeArray(
    analysis.requirementsAnalysis
  ).map((item, index) =>
    normalizeAnalysisItem(
      item,
      index
    )
  );

    const statusItems = items.map(
    (item) => {
      const status = safeText(
        item.status ||
          item.complianceStatus ||
          item.verificationStatus ||
          item.matchStatus ||
          (item.compliant
            ? "COMPLIANT"
            : "REVIEW")
      )
        .toUpperCase()
        .trim();

      return {
        item,
        status,
      };
    }
  );

  const effectiveItems = items.map(
  (item) => {
    const bidderEvidence =
      getBidderEvidence(item);

    const hasEvidence =
      Boolean(
        bidderEvidence &&
        safeText(
          bidderEvidence.text
        ).trim()
      );

    const rawStatus =


      normalizeVerificationStatus(item);



    const effectiveStatus =


      !hasEvidence


        ? rawStatus === "NON_COMPLIANT"


          ? "NON_COMPLIANT"


          : "MISSING"


        : rawStatus;

return {
      ...item,
      status: effectiveStatus,
    };
  }
);

const compliantItems =
  effectiveItems.filter(
    (item) =>
      item.status === "COMPLIANT"
  );

const fallbackCompliance =
  effectiveItems.length > 0
    ? Math.round(
        (compliantItems.length /
          effectiveItems.length) *
        100
      )
    : 0;

/*
 * Backend verification is authoritative. The local count is only a fallback
 * for legacy responses that do not contain a server-calculated percentage.
 */
const compliance =
  getAnalysisCompliance(
    analysis,
    fallbackCompliance
  );

const risk =
  getAnalysisRisk(
    analysis,
    effectiveItems.length > 0
      ? calculateRisk({
          ...analysis,
          requirementsAnalysis:
            effectiveItems,
        })
      : 0
  );

  const riskLevel = riskLevelFromScore(risk);

  const overallDecision = safeText(
    analysis.overallDecision,
    "AI Review"
  );

  const bidderSummary = safeText(
    analysis.bidderSummary ||
      analysis.summary,
    "AI has compared the bidder evidence against the extracted tender requirements."
  );

  const confidenceValue =
    normalizeNumber(
      analysis.confidence,
      NaN
    );

  const compliantCount =
   effectiveItems.filter((item) => {
      const status = safeText(
        item.status ||
          (item.compliant
            ? "COMPLIANT"
            : "")
      ).toUpperCase();

      return (
        status === "COMPLIANT" ||
        status === "APPROVED" ||
        status === "PASS"
      );
    }).length;

  const missingCount =
     effectiveItems.filter((item) => {
      const status = safeText(
        item.status
      ).toUpperCase();

      return status.includes(
        "MISSING"
      );
    }).length;

  const failedCount =
    items.filter((item) => {
      const status = safeText(
        item.status
      ).toUpperCase();

      return (
        status.includes(
          "NON_COMPLIANT"
        ) ||
        status.includes(
          "CRITICAL"
        ) ||
        status.includes("FAIL") ||
        status.includes(
          "MISMATCH"
        )
      );
    }).length;

  const scoreStyle = {
    "--score": `${compliance}%`,
  };

  return (
    <>
      <PageHeader
        eyebrow="AI DECISION ENGINE"
        title="AI verification"
        description="Requirement-by-requirement comparison of tender rules against bidder evidence."
        action={
          <button
            className="secondaryButton"
            onClick={() =>
              navigate("Reports")
            }
          >
            <Icon
              name="report"
              size={14}
            />
            Open report
          </button>
        }
      />

      <section className="verificationHero">
        <div className="scoreBlock">
          <div
            className="scoreRing"
            style={scoreStyle}
          >
            <div className="scoreInner">
              <strong>
                {Math.round(
                  compliance
                )}
                %
              </strong>

              <span>
                COMPLIANCE
              </span>
            </div>
          </div>
        </div>

        <div className="decisionBlock">
          <StatusBadge
            status={
              overallDecision
                .toUpperCase()
                .includes("NON")
                ? "NON_COMPLIANT"
                : compliance >= 80
                ? "COMPLIANT"
                : "REVIEW"
            }
          >
            {overallDecision}
          </StatusBadge>

          <h2>
            {overallDecision ||
              (compliance >= 80
                ? "Bid appears compliant"
                : "Bid requires review")}
          </h2>

          <p>
            {bidderSummary}
          </p>

          <div className="decisionMeta">
            <span className="confidenceText">
              {Number.isFinite(
                confidenceValue
              )
                ? `Confidence ${Math.round(
                    clamp(
                      confidenceValue
                    )
                  )}%`
                : "AI-assisted assessment"}
            </span>

            <span className="decisionDivider" />

            <span className="confidenceText">
              {items.length}{" "}
              requirements checked
            </span>
          </div>
        </div>

        <div className="riskBlock">
          <span className="miniLabel">
            RISK SCORE
          </span>

          <strong>
            {risk}/100
          </strong>

          <div className="riskBar">
            <span
              style={{
                width: `${risk}%`,
              }}
            />
          </div>

          <span
            className={`riskLabel ${
              risk >= 70
                ? "danger"
                : risk >= 40
                ? "warning"
                : "success"
            }`}
          >
            {riskLevel} RISK
          </span>
        </div>
      </section>

      <section className="verificationStats">
        <VerificationStat
          icon="check"
          tone="success"
          value={compliantCount}
          label="Compliant"
        />

        <VerificationStat
          icon="warning"
          tone="warning"
          value={missingCount}
          label="Missing evidence"
        />

        <VerificationStat
          icon="warning"
          tone="danger"
          value={failedCount}
          label="Failed / mismatch"
        />

        <VerificationStat
          icon="file"
          tone="blue"
          value={items.length}
          label="Total requirements"
        />
      </section>

      <section className="panel evidencePanel">
        <PanelHeader
          title="Requirement verification"
          description="AI evidence match for each procurement requirement."
          action={
            <div className="aiVerifiedBadge">
              <Icon
                name="ai"
                size={12}
              />
              AI VERIFIED
            </div>
          }
        />

        {items.length === 0 ? (
          <EmptyState
            icon="verify"
            title="No requirement analysis available"
            description="The AI response did not contain requirement-level results."
          />
        ) : (
          <div className="evidenceList">
            {items.map(
              (item, index) => (
                <EvidenceRow
                  key={
                    safeText(
                      item.id
                    ) ||
                    index
                  }
                  item={item}
                  index={index}
                />
              )
            )}
          </div>
        )}
      </section>

      <div className="findingsGrid">
        <section className="panel criticalPanel">
          <PanelHeader
            title="Critical findings"
            description="Issues that may affect bid eligibility."
            action={
              <span className="dangerCount">
                {
                  safeArray(
                    analysis.criticalFindings
                  ).length
                }
              </span>
            }
          />

          <div className="findingList">
            {safeArray(
              analysis.criticalFindings
            ).length === 0 ? (
              <div className="panelEmptyText">
                <Icon
                  name="check"
                  size={15}
                />
                No critical findings
                reported.
              </div>
            ) : (
              safeArray(
                analysis.criticalFindings
              ).map(
                (rawFinding, index) => {
                  const finding =
                    safeObject(
                      rawFinding
                    );

                  const findingTitle =
                    typeof rawFinding ===
                    "string"
                      ? rawFinding
                      : safeText(
                          finding.title ||
                            finding.requirement,
                          "Critical issue"
                        );

                  const findingDescription =
                    typeof rawFinding ===
                    "string"
                      ? "AI identified a compliance concern."
                      : safeText(
                          finding.description ||
                            finding.reason,
                          "Review supporting evidence."
                        );

                  return (
                    <div
                      className="findingItem"
                      key={index}
                    >
                      <div className="findingIcon">
                        <Icon
                          name="warning"
                          size={14}
                        />
                      </div>

                      <div>
                        <strong>
                          {findingTitle}
                        </strong>

                        <span>
                          {findingDescription}
                        </span>
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>
<section className="panel recommendationPanel">
  <PanelHeader
    title="Recommendations"
    description="Suggested next actions before submission."
  />

  <div className="recommendationList">
    {safeArray(
      analysis.recommendations
    ).length === 0 ? (
      <div className="panelEmptyText">
        No additional
        recommendations.
      </div>
    ) : (
      <>
        {safeArray(
          analysis.recommendations
        ).map(
          (
            rawRecommendation,
            index
          ) => {
            const recommendation =
              safeObject(
                rawRecommendation
              );

            const text =
              typeof rawRecommendation ===
              "string"
                ? rawRecommendation
                : safeText(
                    recommendation.text ||
                      recommendation.description ||
                      recommendation.action,
                    "Review the identified issue."
                  );

            return (
              <div
                className="recommendationItem"
                key={index}
              >
                <span>
                  {index + 1}
                </span>

  <textarea
  value={
  recommendationsSubmitted
    ? ""
    : editedRecommendations[index] ?? text
}
  spellCheck={false}
  dir="ltr"
  rows={1}
  placeholder="Edit this recommendation or add your feedback before submitting."
  className="recommendationEditable"
  onChange={(event) => {
    const updatedText =
      event.target.value;

    setEditedRecommendations(
      (previous) => {
        const next = [...previous];

        next[index] =
          updatedText;

        return next;
      }
    );

    setRecommendationsSaved(false);
  }}
/>
              </div>
            );
          }
        )}

        <button
  type="button"
  className="primaryButton recommendationSubmitButton"
  onClick={async () => {
    try {
      setRecommendationsSaved(false);

      const rawRecommendations =
        safeArray(
          analysis?.recommendations
        );

      const recommendations =
        rawRecommendations.map(
          (
            rawRecommendation,
            index
          ) => {
            const recommendation =
              safeObject(
                rawRecommendation
              );

            const originalText =
              typeof rawRecommendation ===
              "string"
                ? rawRecommendation
                : safeText(
                    recommendation.text ||
                      recommendation.description ||
                      recommendation.action ||
                      recommendation.recommendation,
                    ""
                  );

            const submittedText =
              safeText(
                editedRecommendations[index],
                originalText
              ).trim();

            return {
              index,
              requirementId:
                safeText(
                  recommendation.requirementId,
                  ""
                ),
              title:
                safeText(
                  recommendation.title,
                  "Recommendation"
                ),
              originalRecommendation:
                originalText,
              submittedText,
            };
          }
        );

      const response =
        await fetch(
          `${API_URL}/api/recommendation-feedback`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              analysisId:
                safeText(
                  analysis?.id ||
                    analysis?.analysisId,
                  ""
                ),
              tenderId:
                safeText(
                  analysis?.tenderId,
                  ""
                ),
              bidderId:
                safeText(
                  analysis?.bidderId,
                  ""
                ),
              recommendations,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data?.message ||
            "Failed to save recommendations."
        );
      }

      setEditedRecommendations([]);
      setRecommendationsSubmitted(true);
      setRecommendationsSaved(true);
    } catch (error) {
      console.error(
        "Recommendation feedback save error:",
        error
      );

      alert(
        error?.message ||
          "Failed to save recommendation feedback."
      );
    }
  }}
>
  Submit recommendations
</button>

{recommendationsSaved && (
  <div className="recommendationsSavedMessage">
    Recommendations submitted successfully.
  </div>
)}
      </>
    )}
  </div>
</section>
      </div>
    </>
  );
}

function VerificationStat({
  icon,
  tone,
  value,
  label,
}) {
  return (
    <div className="verificationStat">
      <div
        className={`verificationStatIcon ${tone}`}
      >
        <Icon
          name={icon}
          size={15}
        />
      </div>

      <div>
        <strong>
          {safeText(value)}
        </strong>

        <span>
          {safeText(label)}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   EVIDENCE ROW
========================================================= */

function EvidenceRow({
  item,
  index,
}) {
  const normalizedItem =
    normalizeAnalysisItem(
      item,
      index
    );
const bidderEvidence =
  getBidderEvidence(
    normalizedItem
  );
   const hasEvidence =
    Boolean(
      bidderEvidence &&
      safeText(
        bidderEvidence.text
      ).trim()
    );

  const rawStatus =
    normalizeVerificationStatus(normalizedItem);

  /*
   * Frontend display guard:
   * - no evidence + non-compliant => NON_COMPLIANT
   * - no evidence + anything else => MISSING
   * - evidence present => preserve the backend's verified status
   *
   * We do NOT reject evidence just because it contains REQ-01/Requirement 1.
   */
  const status =
    !hasEvidence
      ? rawStatus === "NON_COMPLIANT"
        ? "NON_COMPLIANT"
        : "MISSING"
      : rawStatus;

  

  const evidence = bidderEvidence.text;

  const confidence =
  hasEvidence
    ? normalizeNumber(
        normalizedItem.confidence ??
          normalizedItem.matchConfidence ??
          normalizedItem.confidenceScore,
        NaN
      )
    : NaN;

  const title =
    safeText(
      normalizedItem.title ||
        normalizedItem.requirementTitle ||
        normalizedItem.requirement,
      `Requirement ${index + 1}`
    );

  const description =
    safeText(
      normalizedItem.description ||
        normalizedItem.requirementText ||
        normalizedItem.requirement,
      "Requirement details unavailable."
    );

  const fileName = bidderEvidence.sourceFile;

  return (
    <div className="evidenceRow">
      <div className="evidenceNumber">
        {String(index + 1).padStart(
          2,
          "0"
        )}
      </div>

      <div className="evidenceRequirement">
        <div className="evidenceTitle">
          <strong>{title}</strong>
          <StatusBadge status={status} />
        </div>
        <p>{description}</p>
      </div>

      <div className="evidenceMatch">
        <div className="matchLabel">
          <Icon name="file" size={12} />
          Matched evidence
        </div>

        {evidence ? (
          <div className="evidenceExcerpt">
            <strong>{safeText(evidence)}</strong>
            {fileName && (
              <span>
                Source: {safeText(fileName)}
              </span>
            )}
          </div>
        ) : (
          <span className="noEvidence">
            No bidder evidence found.
          </span>
        )}
      </div>

      <div className="evidenceDecision">
        <StatusBadge status={status} />

        {Number.isFinite(confidence) && (
          <small>
            Confidence {Math.round(clamp(confidence))}%
          </small>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   REPORTS
========================================================= */

function ReportsPage({
  analysis,
  selectedTender,
  requirements,
  exportReport,
  loadingReport,
}) {
  if (!analysis) {
    return (
      <div className="emptyVerification">
        <div className="emptyVerificationIcon">
          <Icon
            name="report"
            size={31}
          />
        </div>

        <h2>
          Your decision report will
          appear here.
        </h2>

        <p>
          Complete an AI verification
          first. BIDIFI will then prepare
          a structured compliance report
          containing the score, risk,
          evidence gaps, findings and
          recommendations.
        </p>

        <div className="verificationChecklist">
          <div>
            <Icon
              name="check"
              size={12}
            />
            Compliance
          </div>

          <div>
            <Icon
              name="check"
              size={12}
            />
            Risk
          </div>

          <div>
            <Icon
              name="check"
              size={12}
            />
            Findings
          </div>

          <div>
            <Icon
              name="check"
              size={12}
            />
            Recommendations
          </div>
        </div>
      </div>
    );
  }

  const items = safeArray(
    analysis.requirementsAnalysis
  ).map((item, index) =>
    normalizeAnalysisItem(
      item,
      index
    )
  );

  const effectiveItems = items.map(
    (item) => {
      const bidderEvidence =
        getBidderEvidence(item);

      const hasEvidence =
        Boolean(
          bidderEvidence &&
          safeText(
            bidderEvidence.text
          ).trim()
        );

      const rawStatus =


        normalizeVerificationStatus(item);



      const effectiveStatus =


        !hasEvidence


          ? rawStatus === "NON_COMPLIANT"


            ? "NON_COMPLIANT"


            : "MISSING"


          : rawStatus;

return {
        ...item,
        status: effectiveStatus,
        bidderEvidence,
      };
    }
  );

  const compliantItems =
    effectiveItems.filter(
      (item) =>
        item.status === "COMPLIANT"
    );

  const fallbackCompliance =
    effectiveItems.length > 0
      ? Math.round(
          (compliantItems.length /
            effectiveItems.length) *
          100
        )
      : 0;

  const compliance =
    getAnalysisCompliance(
      analysis,
      fallbackCompliance
    );

  const risk =
    getAnalysisRisk(
      analysis,
      effectiveItems.length > 0
        ? calculateRisk({
            ...analysis,
            requirementsAnalysis:
              effectiveItems,
          })
        : 0
    );

  const missing = effectiveItems.filter(
    (item) =>
      item.status === "MISSING" ||
      item.status === "EXPIRED" ||
      item.status === "NON_COMPLIANT"
  );

const recommendations =
  safeArray(
    analysis.recommendations
  );

  const reportStatus =
    compliance >= 80
      ? "COMPLIANT"
      : compliance >= 60
      ? "REVIEW"
      : "NON_COMPLIANT";

  const reportDecision =
    safeText(
      analysis.overallDecision,
      reportStatus
    );

  const tenderName = safeText(
    selectedTender?.name ||
      selectedTender?.filename ||
      analysis.tenderName,
    "Tender verification"
  );

 const summaryText =
  `BIDIFI reviewed ${
    items.length
  } tender requirements against the submitted bidder evidence. ${
    effectiveItems.filter(
      (item) =>
        item.status === "COMPLIANT"
    ).length
  } requirements were matched, ${
    effectiveItems.filter(
      (item) =>
        item.status === "NON_COMPLIANT"
    ).length
  } were identified as non-compliant, ${
    effectiveItems.filter(
      (item) =>
        item.status === "MISSING"
    ).length
  } had evidence gaps, and ${
    effectiveItems.filter(
      (item) =>
        item.status === "REVIEW"
    ).length
  } require human review.`;

  return (
    <>
      <PageHeader
        eyebrow="DECISION REPORT"
        title="Compliance report"
        description="A decision-ready summary of the latest AI verification."
        action={
          <button
            className="primaryButton"
            disabled={loadingReport}
            onClick={exportReport}
          >
            {loadingReport ? (
              <>
                <span className="spinner" />
                Preparing...
              </>
            ) : (
              <>
                <Icon
                  name="download"
                  size={14}
                />
                Export report
              </>
            )}
          </button>
        }
      />

      <section className="reportHeaderCard">
        <div className="reportBrand">
          <div className="reportMark">
            <Icon
              name="ai"
              size={18}
            />
          </div>

          <div>
            <strong>BIDIFI</strong>
            <span>
              AI BID COMPLIANCE
            </span>
          </div>
        </div>

        <div className="reportMeta">
          <span>TENDER</span>

          <strong>
            {tenderName}
          </strong>
        </div>

        <div className="reportStatus">
          <StatusBadge
            status={reportStatus}
          >
            {reportDecision}
          </StatusBadge>
        </div>
      </section>

      <section className="reportKpis">
        <ReportKPI
          label="Compliance"
          value={`${Math.round(
            compliance
          )}%`}
          tone={
            compliance >= 80
              ? "success"
              : compliance >= 60
              ? "warning"
              : "danger"
          }
          note="Overall requirement match"
        />

        <ReportKPI
          label="Risk score"
          value={`${risk}/100`}
          tone={
            risk >= 70
              ? "danger"
              : risk >= 40
              ? "warning"
              : "blue"
          }
          note={`${riskLevelFromScore(
            risk
          )} risk`}
        />

        <ReportKPI
          label="Requirements"
          value={
            items.length ||
            requirements.length
          }
          tone="blue"
          note="Requirements reviewed"
        />

        <ReportKPI
          label="Evidence gaps"
          value={missing.length}
          tone="warning"
          note="Missing bidder documents"
        />
      </section>

      <div className="reportGrid">
        <section className="panel reportSummary">
          <PanelHeader
            title="Executive summary"
            description="AI-generated decision context."
          />

          <p className="summaryText">
            {summaryText}
          </p>

          <div className="summaryPoints">
            <SummaryPoint
              icon="check"
              tone="success"
              value={
                effectiveItems.filter(
                  (x) =>
                    safeText(
                      x.status ||
                        (x.compliant
                          ? "COMPLIANT"
                          : "")
                    ).toUpperCase() ===
                    "COMPLIANT"
                ).length
              }
              label="Matched"
            />

            <SummaryPoint
              icon="warning"
              tone="warning"
              value={missing.length}
              label="Evidence gaps"
            />

            <SummaryPoint
              icon="warning"
              tone="danger"
              value={
                safeArray(
                  analysis.criticalFindings
                ).length
              }
              label="Critical findings"
            />
          </div>
        </section>

        <section className="panel bidderSummary">
          <PanelHeader
            title="Verification profile"
            description="Key assessment metadata."
          />

          <div className="profileRows">
            <ProfileRow
  label="Decision"
  value={
    compliance === 100
      ? "Compliant"
      : "Review"
  }
/>

           <ProfileRow
  label="Risk level"
  value={riskLevelFromScore(risk)}
/>

            <ProfileRow
              label="Tender"
              value={tenderName}
            />

            <ProfileRow
              label="Requirements"
              value={
                items.length ||
                requirements.length
              }
            />

            <ProfileRow
              label="Generated"
              value={new Date().toLocaleString()}
            />
          </div>
        </section>
      </div>

      <section className="panel missingPanel">
        <PanelHeader
          title="Missing evidence"
          description="Documents or evidence that may require bidder action."
        />

        {missing.length === 0 ? (
          <div className="panelEmptyText">
            <Icon
              name="check"
              size={15}
            />
            No missing documents were
            reported by the AI engine.
          </div>
        ) : (
          <div className="missingGrid">
            {missing.map(
              (rawItem, index) => {
                const item =
                  safeObject(
                    rawItem
                  );

                const reason =
                  typeof rawItem ===
                  "string"
                    ? "Evidence was not identified in the bidder submission."
                    : safeText(
                        item.reason ||
                          item.description,
                        "Supporting evidence could not be verified."
                      );

                return (
                  <div
                    className="missingItem"
                    key={index}
                  >
                    <div className="missingIcon">
                      <Icon
                        name="warning"
                        size={14}
                      />
                    </div>

                    <div>
                      <strong>
                        {getMissingDocumentName(
                          rawItem
                        )}
                      </strong>

                      <span>
                        {reason}
                      </span>

                      {item?.mandatory && (
                        <small>
                          Mandatory document
                        </small>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className="panel reportRecommendations">
        <PanelHeader
          title="Recommendations"
          description="Actions suggested by BIDIFI before final submission."
        />

        {recommendations.length ===
        0 ? (
          <div className="panelEmptyText">
            No additional
            recommendations.
          </div>
        ) : (
          <div className="reportRecommendationGrid">
            {recommendations.map(
              (
                rawRecommendation,
                index
              ) => {
                const recommendation =
                  safeObject(
                    rawRecommendation
                  );

                const text =
                  typeof rawRecommendation ===
                  "string"
                    ? rawRecommendation
                    : safeText(
                        recommendation.text ||
                          recommendation.description ||
                          recommendation.action,
                        "Review this recommendation."
                      );

                return (
                  <div
                    className="reportRecommendation"
                    key={index}
                  >
                    <span>
                      ACTION{" "}
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <p>
                      {text}
                    </p>

                    <Icon
                      name="arrow"
                      size={13}
                    />
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    </>
  );
}

function ReportKPI({
  label,
  value,
  tone,
  note,
}) {
  return (
    <div className="reportKpi">
      <span>
        {safeText(label)}
      </span>

      <strong className={tone}>
        {safeText(value)}
      </strong>

      <small>
        {safeText(note)}
      </small>
    </div>
  );
}

function SummaryPoint({
  icon,
  tone,
  value,
  label,
}) {
  return (
    <div className="summaryPoint">
      <div
        className={`summaryIcon ${tone}`}
      >
        <Icon
          name={icon}
          size={13}
        />
      </div>

      <div>
        <strong>
          {safeText(value)}
        </strong>

        <span>
          {safeText(label)}
        </span>
      </div>
    </div>
  );
}

function ProfileRow({
  label,
  value,
}) {
  return (
    <div className="profileRow">
      <span>
        {safeText(label)}
      </span>

      <strong>
        {safeText(value)}
      </strong>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */
export default function App() {
  const [activePage, setActivePage] = useState("Home");

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("bidifi_user") || "null");
    } catch {
      return null;
    }
  });

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [tenderUploaderInfo, setTenderUploaderInfo] = useState({
    companyName: "", contactName: "", email: "", phone: "", gstin: "", registrationNumber: ""
  });

  const [bidderInfo, setBidderInfo] = useState({
    bidderName: "", companyName: "", contactName: "", email: "", phone: "", registrationNumber: ""
  });

  const [backendOnline, setBackendOnline] = useState(false);

  const [tenders, setTenders] = useState([]);

  const [selectedTender, setSelectedTender] = useState(null);

  const [
    selectedTenderFiles,
    setSelectedTenderFiles,
  ] = useState([]);

  const [requirements, setRequirements] = useState([]);

  const [
    bidderDocuments,
    setBidderDocuments,
  ] = useState([]);

  const [
    bidderDocumentCount,
    setBidderDocumentCount,
  ] = useState(0);

  const [bidderId, setBidderId] = useState(null);

  const [
    editedRecommendations,
    setEditedRecommendations,
  ] = useState([]);

  const [
    recommendationsSaved,
    setRecommendationsSaved,
  ] = useState(false);

  const [
    recommendationsSubmitted,
    setRecommendationsSubmitted,
  ] = useState(false);
  /* =======================================================
     BATCH BIDDER ANALYSIS
  ======================================================= */

  const [batchBidders, setBatchBidders] =
    useState([
      {
        id: `bidder-${Date.now()}-1`,
        name: "Bidder 1",
        documents: [],
      },
    ]);

  const [batchResults, setBatchResults] =
    useState([]);

  const [batchLoading, setBatchLoading] =
    useState(false);

  const batchInputRefs = useRef({});

  const [analysis, setAnalysis] =
    useState(null);

  const [loading, setLoading] =
    useState({
      tender: false,
      requirements: false,
      bidder: false,
      analysis: false,
    });

  const [loadingReport, setLoadingReport] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [notifications, setNotifications] =
    useState([]);

  const tenderInputRef =
    useRef(null);

  const bidderInputRef =
    useRef(null);

  /* =======================================================
     AUTHENTICATION / USER PROFILE
  ======================================================= */

  function handleAuthSuccess(user) {
    setCurrentUser(user || null);
    try {
      if (user) window.localStorage.setItem("bidifi_user", JSON.stringify(user));
      else window.localStorage.removeItem("bidifi_user");
    } catch {}
    setAuthOpen(false);
    clearAlerts();
    showMessage(user ? `Signed in as ${user.name || user.email}.` : "Signed out.");
  }

  function handleLogout() {
    handleAuthSuccess(null);
    setActivePage("Home");
  }

  /* =======================================================
     ALERTS
  ======================================================= */

  function clearAlerts() {
    setMessage("");
    setError("");
  }

  /* =======================================================
     NOTIFICATIONS
     Every toast the workspace shows (uploads, extraction,
     analysis, exports, auth) is also logged here so the bell
     in the topbar reflects real activity instead of being
     decorative.
  ======================================================= */

  function pushNotification(text, type = "info") {
    const content = safeText(text);
    if (!content) return;

    setNotifications((prev) =>
      [
        {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: content,
          type,
          time: Date.now(),
          read: false,
        },
        ...prev,
      ].slice(0, 30)
    );
  }

  function markNotificationsRead() {
    setNotifications((prev) =>
      prev.map((item) => (item.read ? item : { ...item, read: true }))
    );
  }

  function removeNotification(id) {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }

  function clearNotifications() {
    setNotifications([]);
  }

  function showMessage(text) {
    setError("");
    setMessage(safeText(text));
    pushNotification(text, "success");

    window.setTimeout(() => {
      setMessage("");
    }, 5000);
  }

  function showError(text) {
    setMessage("");
    const content = safeText(text, "Something went wrong.");
    setError(content);
    pushNotification(content, "warning");

    window.setTimeout(() => {
      setError("");
    }, 7000);
  }

  /* =======================================================
     BACKEND STATUS
  ======================================================= */

  async function checkBackend() {
    try {
      const response =
        await fetch(
          `${API_URL}/api/status`,
          {
            method: "GET",
          }
        );

      setBackendOnline(
        response.ok
      );
    } catch {
      setBackendOnline(false);
    }
  }

  useEffect(() => {
    checkBackend();

    const interval =
      window.setInterval(
        checkBackend,
        10000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, []);

  /* =======================================================
     WORKSPACE LOAD
  ======================================================= */

  async function loadWorkspace() {
    try {
      const data =
        await fetchJson(
          `${API_URL}/api/workspace`
        );

      if (Array.isArray(data.tenders)) {
        // Merge instead of replacing local state. The initial workspace fetch
        // can finish after a tender upload and must never erase a just-uploaded
        // tender from React state.
        setTenders((prev) => {
          const incoming = data.tenders;
          const byId = new Map(incoming.filter((x) => x?.id).map((x) => [x.id, x]));
          const merged = prev.map((x) => byId.get(x.id) ? { ...x, ...byId.get(x.id) } : x);
          const existing = new Set(merged.map((x) => x.id));
          return [
            ...incoming.filter((x) => x?.id && !existing.has(x.id)),
            ...merged,
          ];
        });
      }

      const analyses =
        Array.isArray(
          data.analyses
        )
          ? data.analyses
          : [];

      if (analyses.length > 0) {
        const latest =
          analyses[
            analyses.length - 1
          ];

        setAnalysis(
          latest
        );

        if (latest?.tenderId) {
          try {
            const tenderData =
              await fetchJson(
                `${API_URL}/api/tenders/${latest.tenderId}`
              );

            const tender =
              tenderData.tender ||
              tenderData.data ||
              tenderData;

            if (tender) {
              setSelectedTender((prev) => prev?.id ? prev : tender);
              setRequirements((prev) =>
                prev.length ? prev : (Array.isArray(tender.requirements) ? tender.requirements : [])
              );
            }
          } catch {
            // Workspace restoration is best-effort.
          }
        }
      } else if (
        data.latestAnalysis
      ) {
        setAnalysis(
          data.latestAnalysis
        );
      }
    } catch {
      // Backend may not be started when the frontend loads.
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, []);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function navigate(page) {
    setActivePage(page);
    setMobileMenu(false);
    clearAlerts();
  }

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  /* =======================================================
     GLOBAL SEARCH INDEX
     Powers the topbar search box: pages, uploaded tenders,
     extracted requirements, and bidders being analysed.
  ======================================================= */

  const searchIndex = useMemo(() => {
    const items = [];

    const pages = [
      "Dashboard",
      "Tender Upload",
      "Bidder Analysis",
      "AI Verification",
      "Reports",
      "Settings",
    ];

    pages.forEach((page) => {
      items.push({
        id: `page-${page}`,
        type: "Page",
        label: page,
        action: () => navigate(page),
      });
    });

    tenders.forEach((tender) => {
      const label = safeText(
        tender?.name || tender?.fileName || tender?.title,
        "Untitled tender"
      );

      items.push({
        id: `tender-${tender?.id || label}`,
        type: "Tender",
        label,
        action: () => {
          setSelectedTender(tender);
          navigate("Bidder Analysis");
        },
      });
    });

    requirements.forEach((requirement, index) => {
      const label = safeText(
        requirement?.title || requirement?.name || requirement?.text || requirement?.description
      );

      if (!label) return;

      items.push({
        id: `requirement-${index}`,
        type: "Requirement",
        label,
        action: () => navigate("AI Verification"),
      });
    });

    batchBidders.forEach((bidder) => {
      const label = safeText(bidder?.name);
      if (!label) return;

      items.push({
        id: `bidder-${bidder.id}`,
        type: "Bidder",
        label,
        action: () => navigate("Bidder Analysis"),
      });
    });

    return items;
  }, [tenders, requirements, batchBidders]);

  /* =======================================================
     TENDER FILE SELECTION
  ======================================================= */

  function handleTenderFiles(event) {
    const files =
      Array.from(
        event.target.files || []
      );

    event.target.value = "";

    if (!files.length) return;

    const valid = [];
    const invalid = [];

    files.forEach((file) => {
      const isPdf =
        file.type ===
          "application/pdf" ||
        file.name
          .toLowerCase()
          .endsWith(".pdf");

      const isValidSize =
        file.size <=
        25 * 1024 * 1024;

      if (
        isPdf &&
        isValidSize
      ) {
        valid.push(file);
      } else {
        invalid.push(
          file.name
        );
      }
    });

    if (invalid.length) {
      showError(
        `Only PDF files up to 25 MB are supported. Invalid: ${invalid.join(
          ", "
        )}`
      );
    }

    if (valid.length) {
      setSelectedTenderFiles((prev) => {
        const existing = new Set(
          prev.map((file) => `${file.name}::${file.size}::${file.lastModified}`)
        );
        const merged = [...prev];
        valid.forEach((file) => {
          const key = `${file.name}::${file.size}::${file.lastModified}`;
          if (!existing.has(key)) {
            existing.add(key);
            merged.push(file);
          }
        });
        return merged;
      });

      clearAlerts();
    }
  }

  function removeSelectedTenderFile(
    index
  ) {
    setSelectedTenderFiles(
      (prev) =>
        prev.filter(
          (_, i) =>
            i !== index
        )
    );
  }

  /* =======================================================
     UPLOAD TENDERS
  ======================================================= */

  async function uploadTenders() {
    if (!selectedTenderFiles.length) {
      showError("Please select at least one tender PDF.");
      return;
    }

    setLoading((prev) => ({ ...prev, tender: true }));
    clearAlerts();

    try {
      const formData = new FormData();
      selectedTenderFiles.forEach((file) => formData.append("tenders", file));
      formData.append("uploadedBy", JSON.stringify({
        userId: currentUser?.id || null,
        name: currentUser?.name || tenderUploaderInfo.contactName || "",
        email: currentUser?.email || tenderUploaderInfo.email || "",
        companyName: tenderUploaderInfo.companyName || currentUser?.companyName || "",
        phone: tenderUploaderInfo.phone || "",
        gstin: tenderUploaderInfo.gstin || "",
        registrationNumber: tenderUploaderInfo.registrationNumber || ""
      }));

      // IMPORTANT: upload request is now fast. The backend no longer waits for
      // an LLM. It returns immediately after text extraction/local parsing.
      const data = await fetchJson(`${API_URL}/api/upload-tenders`, {
        method: "POST",
        body: formData
      });

      const uploaded = Array.isArray(data.tenders)
        ? data.tenders
        : Array.isArray(data.files)
          ? data.files
          : [];

      const successfulUploaded = uploaded.filter(
        (item) => item?.id && String(item?.status || "UPLOADED").toUpperCase() !== "ERROR"
      );
      const failedUploaded = uploaded.filter(
        (item) => !item?.id || String(item?.status || "").toUpperCase() === "ERROR"
      );

      if (!successfulUploaded.length) {
        const details = failedUploaded
          .map((item) => `${safeText(item?.filename, "Tender")}: ${safeText(item?.error, "processing failed")}`)
          .join(" | ");
        throw new Error(details || "Upload succeeded but no tender record was returned.");
      }

      setTenders((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        return [
          ...successfulUploaded.filter((item) => !existingIds.has(item.id)),
          ...prev
        ];
      });

      const firstTender = successfulUploaded[0];
      setSelectedTender(firstTender);
      const fastRequirements = Array.isArray(firstTender.requirements)
        ? firstTender.requirements
        : [];
      setRequirements(fastRequirements);
      setAnalysis(null);
      setSelectedTenderFiles([]);

      const warning = failedUploaded.length
        ? ` ${failedUploaded.length} tender${failedUploaded.length === 1 ? "" : "s"} could not be processed.`
        : "";
      showMessage(
        `${successfulUploaded.length} tender${successfulUploaded.length === 1 ? "" : "s"} uploaded successfully.${warning} Refining requirements...`
      );

      // The backend now returns the final grounded requirement list in the
      // same upload response. Do not start a second extraction request here.
      // This removes the race where the first tender could disappear/revert
      // and also prevents duplicate REQ rows from AI + local merging.
      showMessage(
        `${successfulUploaded.length} tender${successfulUploaded.length === 1 ? "" : "s"} uploaded and requirements extracted successfully.${warning}`
      );
    } catch (err) {
      showError(err.message || "Tender upload failed. Check that the backend is running.");
    } finally {
      setLoading((prev) => ({ ...prev, tender: false }));
    }
  }

  /* =======================================================
     SELECT TENDER
  ======================================================= */

  async function selectTender(
    tender
  ) {
    clearAlerts();

    setSelectedTender(
      tender
    );

    setAnalysis(null);

    if (
      Array.isArray(
        tender.requirements
      )
    ) {
      setRequirements(
        tender.requirements
      );
    } else {
      setRequirements(
        []
      );
    }

    if (!tender?.id) {
      return;
    }

    try {
      const data =
        await fetchJson(
          `${API_URL}/api/tenders/${tender.id}`
        );

      const fullTender =
        data.tender ||
        data.data ||
        data;

      if (fullTender) {
        setSelectedTender(
          fullTender
        );

        if (
          Array.isArray(
            fullTender.requirements
          )
        ) {
          setRequirements(
            fullTender.requirements
          );
        }
      }
    } catch {
      // Metadata from workspace is still usable.
    }
  }

  /* =======================================================
     AI REQUIREMENT EXTRACTION
  ======================================================= */

  async function extractRequirements() {
    if (!selectedTender?.id) {
      showError(
        "Please select a tender first."
      );

      return;
    }

    setLoading((prev) => ({
      ...prev,
      requirements: true,
    }));

    clearAlerts();

    try {
      const data =
        await fetchJson(
          `${API_URL}/api/extract-requirements`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              tenderId:
                selectedTender.id,
              tenderName:
                selectedTender.name ||
                selectedTender.filename ||
                "",
              text: "",
            }),
          }
        );

      const result =
        parseResponseValue(
          data
        );

      const extracted =
        safeArray(
          result?.requirements ||
            data?.requirements
        );

      if (!extracted.length) {
        throw new Error(
          "AI completed the request but no requirements were extracted."
        );
      }

      setRequirements(
        extracted
      );

      setSelectedTender(
        (prev) => ({
          ...prev,
          requirements:
            extracted,
          aiExtraction:
            result?.aiExtraction ||
            result?.tenderSummary ||
            null,
        })
      );

      setTenders(
        (prev) =>
          prev.map(
            (tender) =>
              tender.id ===
              selectedTender.id
                ? {
                    ...tender,
                    requirements:
                      extracted,
                  }
                : tender
          )
      );

      showMessage(
        `${extracted.length} tender requirements extracted successfully.`
      );
    } catch (err) {
      showError(
        err.message ||
          "AI requirement extraction failed."
      );
    } finally {
      setLoading((prev) => ({
        ...prev,
        requirements: false,
      }));
    }
  }

  /* =======================================================
     BIDDER DOCUMENTS
  ======================================================= */

  function handleBidderDocuments(
  event
) {
  const files =
    Array.from(
      event.target.files || []
    );

  event.target.value = "";

  if (!files.length) return;

  const allowedExtensions = [
    ".pdf",
    ".docx",
    ".txt",
  ];

  const valid = [];
  const invalid = [];

  files.forEach((file) => {
    const lowerName =
      file.name.toLowerCase();

    const validExtension =
      allowedExtensions.some(
        (ext) =>
          lowerName.endsWith(
            ext
          )
      );

    const validSize =
      file.size <=
      25 * 1024 * 1024;

    if (
      validExtension &&
      validSize
    ) {
      valid.push(file);
    } else {
      invalid.push(
        file.name
      );
    }
  });

  if (invalid.length) {
    showError(
      `Unsupported bidder document(s): ${invalid.join(
        ", "
      )}`
    );
  }

  if (!valid.length) {
    return;
  }

  setBidderDocuments(
    (prev) => [
      ...prev,
      ...valid,
    ]
  );

  clearAlerts();

  /*
   * Process the newly selected
   * bidder documents immediately.
   *
   * We pass "valid" directly because
   * React state updates asynchronously.
   */
  uploadBidderDocuments(
    valid
  );
}

  function removeBidderDocument(
    index
  ) {
    setBidderDocuments(
      (prev) =>
        prev.filter(
          (_, i) =>
            i !== index
        )
    );
  }

  /* =======================================================
     UPLOAD BIDDER DOCUMENTS
  ======================================================= */

  async function uploadBidderDocuments(filesOverride = null) {
    const documentsToUpload = Array.isArray(filesOverride)
      ? filesOverride
      : bidderDocuments;

    if (
      !documentsToUpload.length
    ) {
      showError(
        "Please select at least one bidder document."
      );

      return;
    }

    setLoading((prev) => ({
      ...prev,
      bidder: true,
    }));

    clearAlerts();

    try {
      const formData =
        new FormData();

      documentsToUpload.forEach(
        (file) => {
          formData.append(
            "documents",
            file
          );
        }
      );
      formData.append("bidderName", bidderInfo.bidderName || bidderInfo.companyName || "");
      formData.append("companyName", bidderInfo.companyName || "");
      formData.append("contactName", bidderInfo.contactName || currentUser?.name || "");
      formData.append("email", bidderInfo.email || currentUser?.email || "");
      formData.append("phone", bidderInfo.phone || "");
      formData.append("registrationNumber", bidderInfo.registrationNumber || "");
      formData.append("userId", currentUser?.id || "");
      formData.append("tenderId", selectedTender?.id || "");

      const data =
        await fetchJson(
          `${API_URL}/api/upload-bidder-documents`,
          {
            method: "POST",
            body: formData,
          }
        );

      const newBidderId =
        data.bidderId ||
        data.bidder?.id ||
        data.id;

      const count =
        normalizeNumber(
          data.count ??
            data.documentCount ??
            data.documents?.length
        );

      if (!newBidderId) {
        throw new Error(
          "Bidder documents were processed but bidder ID was not returned."
        );
      }

      setBidderId(
        newBidderId
      );

      setBidderDocumentCount(
        count ||
          documentsToUpload.length
      );

      showMessage(
        `${
          count ||
          documentsToUpload.length
        } bidder document${
          (count ||
            documentsToUpload.length) ===
          1
            ? ""
            : "s"
        } processed successfully.`
      );
    } catch (err) {
      showError(
        err.message ||
          "Bidder document processing failed."
      );
    } finally {
      setLoading((prev) => ({
        ...prev,
        bidder: false,
      }));
    }
  }

  /* =======================================================
     BATCH BIDDER ANALYSIS
  ======================================================= */

  function addBatchBidder() {
    if (batchBidders.length >= 20) {
      showError("You can add a maximum of 20 bidders at once.");
      return;
    }

    const nextNumber = batchBidders.length + 1;

    setBatchBidders((prev) => [
      ...prev,
      {
        id: `bidder-${Date.now()}-${nextNumber}`,
        name: `Bidder ${nextNumber}`,
        documents: [],
      },
    ]);

    clearAlerts();
  }

  function removeBatchBidder(index) {
    if (batchBidders.length <= 1) {
      showError("At least one bidder is required.");
      return;
    }

    setBatchBidders((prev) =>
      prev.filter((_, bidderIndex) => bidderIndex !== index)
    );

    setBatchResults((prev) =>
      prev.filter((_, bidderIndex) => bidderIndex !== index)
    );
  }

  function updateBatchBidderName(index, value) {
    setBatchBidders((prev) =>
      prev.map((bidder, bidderIndex) =>
        bidderIndex === index
          ? { ...bidder, name: value }
          : bidder
      )
    );
  }

  function handleBatchBidderDocuments(event, bidderIndex) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    const allowedExtensions = [".pdf", ".docx", ".txt"];
    const valid = [];
    const invalid = [];

    files.forEach((file) => {
      const lowerName = file.name.toLowerCase();
      const validExtension = allowedExtensions.some((ext) =>
        lowerName.endsWith(ext)
      );
      const validSize = file.size <= 25 * 1024 * 1024;

      if (validExtension && validSize) {
        valid.push(file);
      } else {
        invalid.push(file.name);
      }
    });

    if (invalid.length) {
      showError(
        `Unsupported bidder document(s): ${invalid.join(", ")}`
      );
    }

    if (valid.length) {
      setBatchBidders((prev) =>
        prev.map((bidder, index) =>
          index === bidderIndex
            ? {
                ...bidder,
                documents: [...bidder.documents, ...valid],
              }
            : bidder
        )
      );

      setBatchResults([]);
      clearAlerts();
    }
  }

  function removeBatchBidderDocument(bidderIndex, documentIndex) {
    setBatchBidders((prev) =>
      prev.map((bidder, index) =>
        index === bidderIndex
          ? {
              ...bidder,
              documents: bidder.documents.filter(
                (_, fileIndex) => fileIndex !== documentIndex
              ),
            }
          : bidder
      )
    );

    setBatchResults([]);
  }

  async function analyzeAllBids() {
    if (!selectedTender?.id) {
      showError("Please select a tender first.");
      return;
    }

    if (!requirements.length) {
      showError("Please extract tender requirements first.");
      return;
    }

    const validBidders = batchBidders.filter(
      (bidder) => bidder.documents.length > 0
    );

    if (!validBidders.length) {
      showError("Please add documents for at least one bidder.");
      return;
    }

    setBatchLoading(true);
    setBatchResults([]);
    clearAlerts();

    const results = [];

    try {
      for (const bidder of validBidders) {
        try {
          const formData = new FormData();

          bidder.documents.forEach((file) => {
            formData.append("documents", file);
          });

          formData.append("bidderName", bidder.name || "Unnamed Bidder");
          formData.append("tenderId", selectedTender.id);

          const uploadData = await fetchJson(
            `${API_URL}/api/upload-bidder-documents`,
            {
              method: "POST",
              body: formData,
            }
          );

          const newBidderId =
            uploadData.bidderId ||
            uploadData.bidder?.id ||
            uploadData.id;

          if (!newBidderId) {
            throw new Error("Bidder ID was not returned after document processing.");
          }

          const analysisData = await fetchJson(
            `${API_URL}/api/analyze-compliance`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tenderId: selectedTender.id,
                bidderId: newBidderId,
              }),
            }
          );

          const result = parseResponseValue(analysisData);

          if (
            !result ||
            (result.compliancePercentage === undefined &&
              result.compliancePercent === undefined &&
              !result.requirementsAnalysis)
          ) {
            throw new Error("AI returned an incomplete compliance analysis.");
          }
        const normalizedRequirements =
  safeArray(
    result.requirementsAnalysis
  ).map(
    (item, index) =>
      normalizeAnalysisItem(
        item,
        index
      )
  );

const totalRequirements =
  normalizedRequirements.length;

const fallbackCompliance =
  totalRequirements > 0
    ? Math.round(
        normalizedRequirements.filter(
          (item) =>
            normalizeVerificationStatus(item) ===
            "COMPLIANT"
        ).length /
          totalRequirements *
          100
      )
    : 0;

const calculatedCompliance =
  getAnalysisCompliance(
    result,
    fallbackCompliance
  );

const calculatedRisk =
  getAnalysisRisk(
    result,
    totalRequirements > 0
      ? Math.round(100 - calculatedCompliance)
      : 0
  );

const normalized = {
  ...result,

  bidderId:
    newBidderId,

  bidderName:
    bidder.name ||
    "Unnamed Bidder",

  documentCount:
    bidder.documents.length,

  compliancePercentage:
    clamp(
      calculatedCompliance
    ),

  riskScore:
    clamp(
      calculatedRisk
    ),

  requirementsAnalysis:
    normalizedRequirements,

  missingDocuments:
    safeArray(
      result.missingDocuments
    ),

  criticalFindings:
    safeArray(
      result.criticalFindings
    ),

  recommendations:
    safeArray(
      result.recommendations
    ),
};
          results.push({
            bidderId: newBidderId,
            bidderName: bidder.name || "Unnamed Bidder",
            documentCount: bidder.documents.length,
            success: true,
            analysis: normalized,
          });

          setBatchResults([...results]);
        } catch (err) {
          results.push({
            bidderId: bidder.id,
            bidderName: bidder.name || "Unnamed Bidder",
            documentCount: bidder.documents.length,
            success: false,
            error: err.message || "Bidder analysis failed.",
          });

          setBatchResults([...results]);
        }
      }

      const successful = results.filter((item) => item.success);

      if (!successful.length) {
        throw new Error("No bidder could be analyzed successfully.");
      }

      const best = [...successful].sort(
        (a, b) =>
          b.analysis.compliancePercentage -
          a.analysis.compliancePercentage
      )[0];

      setAnalysis(best.analysis);
      setBidderId(best.bidderId);
      setBidderDocumentCount(best.documentCount);

      showMessage(
        `Batch analysis complete — ${successful.length} of ${validBidders.length} bidder${
          validBidders.length === 1 ? "" : "s"
        } analyzed successfully.`
      );

      navigate("AI Verification");
    } catch (err) {
      showError(
        err.message ||
          "Batch bidder analysis failed."
      );
    } finally {
      setBatchLoading(false);
    }
  }

  /* =======================================================
     AI COMPLIANCE ANALYSIS
  ======================================================= */

  async function analyzeCompliance() {
    if (!selectedTender?.id) {
      showError(
        "Please select a tender."
      );

      return;
    }

    if (!requirements.length) {
      showError(
        "Please extract tender requirements first."
      );

      return;
    }

    if (!bidderId) {
      showError(
        "Please process bidder documents first."
      );

      return;
    }

    setLoading((prev) => ({
      ...prev,
      analysis: true,
    }));

    clearAlerts();

    try {
      const data =
        await fetchJson(
          `${API_URL}/api/analyze-compliance`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              tenderId:
                selectedTender.id,
              bidderId,
            }),
          }
        );

      const result =
        parseResponseValue(
          data
        );

      if (
        !result ||
        (!result.requirementsAnalysis &&
          result.compliancePercentage ===
            undefined &&
          result.compliancePercent ===
            undefined)
      ) {
        throw new Error(
          "AI returned an incomplete compliance analysis."
        );
      }
     const normalizedRequirements =
  safeArray(
    result.requirementsAnalysis
  ).map((item, index) =>
    normalizeAnalysisItem(
      item,
      index
    )
  );

const totalRequirements =
  normalizedRequirements.length;

const fallbackCompliance =
  totalRequirements > 0
    ? Math.round(
        normalizedRequirements.filter(
          (item) =>
            normalizeVerificationStatus(item) ===
            "COMPLIANT"
        ).length /
          totalRequirements *
          100
      )
    : 0;

const calculatedCompliance =
  getAnalysisCompliance(
    result,
    fallbackCompliance
  );

const calculatedRisk =
  getAnalysisRisk(
    result,
    totalRequirements > 0
      ? Math.round(100 - calculatedCompliance)
      : 0
  );

const normalized = {
  ...result,

  compliancePercentage:
    clamp(
      calculatedCompliance
    ),

  riskScore:
    clamp(
      calculatedRisk
    ),

  requirementsAnalysis:
    normalizedRequirements,

  missingDocuments:
    safeArray(
      result.missingDocuments
    ),

  criticalFindings:
    safeArray(
      result.criticalFindings
    ),

  recommendations:
    safeArray(
      result.recommendations
    ),
};

      setAnalysis(
        normalized
      );

      showMessage(
        `AI verification complete — ${Math.round(
          normalized.compliancePercentage
        )}% compliance.`
      );

      navigate(
        "AI Verification"
      );
    } catch (err) {
      showError(
        err.message ||
          "AI compliance verification failed."
      );
    } finally {
      setLoading((prev) => ({
        ...prev,
        analysis: false,
      }));
    }
  }

  /* =======================================================
     REPORT EXPORT
  ======================================================= */

  async function exportReport() {
    if (!analysis) {
      showError(
        "Complete an AI verification before exporting a report."
      );

      return;
    }

    setLoadingReport(true);
    clearAlerts();

    try {
      let response;

      if (
        analysis.analysisId
      ) {
        response =
          await fetch(
            `${API_URL}/api/reports/${analysis.analysisId}`
          );
      } else if (
        analysis.id
      ) {
        response =
          await fetch(
            `${API_URL}/api/reports/${analysis.id}`
          );
      } else {
        response =
          await fetch(
            `${API_URL}/api/reports`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                analysis,
                tender:
                  selectedTender,
                requirements,
              }),
            }
          );
      }

      if (response.ok) {
        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        if (
          contentType.includes(
            "application/pdf"
          ) ||
          contentType.includes(
            "application/octet-stream"
          )
        ) {
          const blob =
            await response.blob();

          const url =
            window.URL.createObjectURL(
              blob
            );

          const link =
            document.createElement(
              "a"
            );

          link.href = url;

          link.download = `BIDIFI-Compliance-Report-${Date.now()}.pdf`;

          document.body.appendChild(
            link
          );

          link.click();

          link.remove();

          window.URL.revokeObjectURL(
            url
          );

          showMessage(
            "Compliance report downloaded successfully."
          );

          return;
        }
      }

      throw new Error(
        "PDF report endpoint is not available yet."
      );
    } catch (err) {
      showError(
        err.message ||
          "Report export failed."
      );
    } finally {
      setLoadingReport(
        false
      );
    }
  }

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const pageContent =
    useMemo(() => {
      switch (activePage) {
        case "Tenders":
          return (
            <TendersPage
              tenders={tenders}
              selectedTender={
                selectedTender
              }
              selectedTenderFiles={
                selectedTenderFiles
              }
              requirements={
                requirements
              }
              loading={loading}
              handleTenderFiles={
                handleTenderFiles
              }
              uploadTenders={
                uploadTenders
              }
              selectTender={
                selectTender
              }
              extractRequirements={
                extractRequirements
              }
              removeSelectedTenderFile={
                removeSelectedTenderFile
              }
              tenderInputRef={tenderInputRef}
              uploaderInfo={tenderUploaderInfo}
              setUploaderInfo={setTenderUploaderInfo}
              currentUser={currentUser}
            />
          );

        case "Bidder Workspace":
          return (
            <BiddersPage
              selectedTender={
                selectedTender
              }
              requirements={
                requirements
              }
              bidderDocuments={
                bidderDocuments
              }
              bidderDocumentCount={
                bidderDocumentCount
              }
              bidderId={bidderId}
              loading={loading}
              handleBidderDocuments={
                handleBidderDocuments
              }
              removeBidderDocument={
                removeBidderDocument
              }
              uploadBidderDocuments={
                uploadBidderDocuments
              }
              analyzeCompliance={
                analyzeCompliance
              }
              bidderInputRef={
                bidderInputRef
              }
              batchBidders={
                batchBidders
              }
              batchResults={
                batchResults
              }
              batchLoading={
                batchLoading
              }
              batchInputRefs={
                batchInputRefs
              }
              addBatchBidder={
                addBatchBidder
              }
              removeBatchBidder={
                removeBatchBidder
              }
              updateBatchBidderName={
                updateBatchBidderName
              }
              handleBatchBidderDocuments={
                handleBatchBidderDocuments
              }
              removeBatchBidderDocument={
                removeBatchBidderDocument
              }
              analyzeAllBids={analyzeAllBids}
              bidderInfo={bidderInfo}
              setBidderInfo={setBidderInfo}
              currentUser={currentUser}
            />
          );

        case "AI Verification":
          return (
            <VerificationPage
              analysis={analysis}
              navigate={navigate}
            />
          );

        case "Settings":
          return <SettingsPage currentUser={currentUser} onLogin={() => { setAuthMode("login"); setAuthOpen(true); }} onLogout={handleLogout} />;

        case "Reports":
          return (
            <ReportsPage
              analysis={analysis}
              selectedTender={
                selectedTender
              }
              requirements={
                requirements
              }
              exportReport={
                exportReport
              }
              loadingReport={
                loadingReport
              }
            />
          );

        case "Home":
          return (
            <DashboardPage
              tenders={tenders}
              selectedTender={
                selectedTender
              }
              requirements={
                requirements
              }
              bidderDocumentCount={
                bidderDocumentCount
              }
              analysis={analysis}
              navigate={navigate}
              isHome={true}
            />
          );

        case "Dashboard":
        default:
          return (
            <DashboardPage
              tenders={tenders}
              selectedTender={
                selectedTender
              }
              requirements={
                requirements
              }
              bidderDocumentCount={
                bidderDocumentCount
              }
              analysis={analysis}
              navigate={navigate}
            />
          );
      }
    }, [
      activePage,
      tenders,
      selectedTender,
      selectedTenderFiles,
      requirements,
      bidderDocuments,
      bidderDocumentCount,
      bidderId,
      loading,
      analysis,
      loadingReport,
      batchBidders,
      batchResults,
      batchLoading,
      editedRecommendations,
      recommendationsSaved,
      recommendationsSubmitted,
      currentUser,
      tenderUploaderInfo,
      bidderInfo,
    ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <style>{`
        .entityInfoPanel{margin-bottom:18px;}
        .infoGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;}
        .infoGrid label{display:grid;gap:7px;font-size:12px;font-weight:700;color:var(--muted,#64748b);}
        .infoGrid input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid var(--border,#dbe3ef);border-radius:10px;background:var(--panel,#fff);color:inherit;outline:none;}
        .infoGrid input:focus{border-color:#6d5dfc;box-shadow:0 0 0 3px rgba(109,93,252,.10);}
        .entityAuditNote{display:block;margin-top:12px;color:var(--muted,#64748b);}
        .accountProfileGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:14px;align-items:center;}
        .accountProfileGrid>div{display:grid;gap:5px;padding:14px;border:1px solid var(--border,#e5e7eb);border-radius:12px;background:rgba(255,255,255,.55);}
        .accountProfileGrid strong{font-size:15px;} .accountProfileGrid small{opacity:.68;}
        .accountGuestRow{display:flex;justify-content:space-between;align-items:center;gap:18px;}
        .accountGuestRow>div{display:grid;gap:5px;} .accountGuestRow span{opacity:.68;font-size:13px;}
        .accountTopButton{display:flex;align-items:center;gap:8px;border:1px solid var(--border,#dbe3ef);background:var(--panel,#fff);color:inherit;border-radius:10px;padding:7px 10px;font-weight:700;cursor:pointer;max-width:240px;}
        .accountTopAvatar{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#5b6cff,#8d5cff);color:#fff;font-size:11px;flex:0 0 25px;}
        .authModalBackdrop{position:fixed;inset:0;z-index:10000;background:rgba(5,10,20,.62);backdrop-filter:blur(10px);display:grid;place-items:center;padding:20px;}
        .authModal{position:relative;width:min(470px,100%);background:#fff;color:#0b1220;border:1px solid rgba(255,255,255,.55);border-radius:22px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.28);}
        .authClose{position:absolute;right:14px;top:14px;border:0;background:transparent;cursor:pointer;color:#64748b;}
        .authBrand{display:flex;align-items:center;gap:10px;margin-bottom:20px;} .authBrand>div:last-child{display:grid;} .authBrand strong{font-size:18px;letter-spacing:-.03em;} .authBrand span{font-size:9px;letter-spacing:.12em;color:#7b8492;}
        .authTabs{display:grid;grid-template-columns:1fr 1fr;background:#f1f4f9;border-radius:10px;padding:4px;margin-bottom:20px;}
        .authTabs button{border:0;background:transparent;border-radius:8px;padding:9px;font-weight:750;cursor:pointer;color:#667085;} .authTabs button.active{background:#fff;color:#111827;box-shadow:0 2px 8px rgba(15,23,42,.08);}
        .authModal h2{margin:0 0 7px;font-size:27px;letter-spacing:-.035em;} .authModal>p{margin:0 0 20px;color:#64748b;line-height:1.6;font-size:13px;}
        .authForm{display:grid;gap:13px;} .authForm label{display:grid;gap:7px;font-size:12px;font-weight:750;color:#475467;} .authForm input{padding:12px;border:1px solid #dbe3ef;border-radius:10px;font:inherit;outline:none;} .authForm input:focus{border-color:#6d5dfc;box-shadow:0 0 0 3px rgba(109,93,252,.1);}
        .authError{padding:10px 12px;border-radius:9px;background:#fff1f2;color:#be123c;font-size:12px;font-weight:650;} .authSecurityNote{display:block;margin-top:15px;color:#98a2b3;line-height:1.5;}
        @media(max-width:900px){.infoGrid,.accountProfileGrid{grid-template-columns:1fr 1fr;}.accountProfileGrid .secondaryButton{grid-column:1/-1;}}
        @media(max-width:600px){.infoGrid,.accountProfileGrid{grid-template-columns:1fr;}.accountGuestRow{align-items:flex-start;flex-direction:column;}.accountTopButton span:last-child{display:none;}}
      `}</style>
      <div className="app">
      <Sidebar
        activePage={activePage}
        navigate={navigate}
        mobileMenu={mobileMenu}
        closeMobile={() =>
          setMobileMenu(false)
        }
        backendOnline={backendOnline}
        currentUser={currentUser}
      />

      {mobileMenu && (
        <button
          className="mobileOverlay"
          onClick={() =>
            setMobileMenu(false)
          }
          aria-label="Close navigation"
        />
      )}

      <div className="mainArea">
        <Topbar
          activePage={
            activePage
          }
          backendOnline={
            backendOnline
          }
          openMobile={() =>
            setMobileMenu(true)
          }
          hasAnalysis={Boolean(analysis)}
          currentUser={currentUser}
          onLogin={() => { setAuthMode("login"); setAuthOpen(true); }}
          onLogout={handleLogout}
          searchIndex={searchIndex}
          notifications={notifications}
          unreadNotifications={unreadNotifications}
          onOpenNotifications={markNotificationsRead}
          onClearNotifications={clearNotifications}
          onRemoveNotification={removeNotification}
        />

        <main className="content">
          {pageContent}
        </main>
      </div>

      {message && (
        <div className="toast successToast">
          <div className="toastIcon">
            <Icon
              name="check"
              size={14}
            />
          </div>

          <span>
            {safeText(
              message
            )}
          </span>

          <button
            onClick={() =>
              setMessage("")
            }
          >
            <Icon
              name="close"
              size={14}
            />
          </button>
        </div>
      )}

      {error && (
        <div className="toast errorToast">
          <div className="toastIcon">
            <Icon
              name="warning"
              size={14}
            />
          </div>

          <span>
            {safeText(
              error
            )}
          </span>

          <button
            onClick={() =>
              setError("")
            }
          >
            <Icon
              name="close"
              size={14}
            />
          </button>
        </div>
      )}
    </div>

      {authOpen && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthOpen(false)}
          onSuccess={handleAuthSuccess}
          apiUrl={API_URL}
        />
      )}
    </>
  );
}
