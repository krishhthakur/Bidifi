    import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
    import "./App.css";

    const API_URL =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD
        ? window.location.origin
        : "http://localhost:5000");

    /* =========================================================================
       BIDIFI FRONTEND — FILE MAP / NOTES
       (Ye poora frontend is ek hi file me hai, isliye sections ko clearly
       comment-marked rakha gaya hai. Neeche diya gaya map batata hai ki
       kaunsa block kya karta hai, taaki future me kuch dhoondhna easy ho.)

       1. ICONS            → sab SVG icons ek hi <Icon name="..." /> helper se
                              aate hain (bell, search, tender, ai, verify, etc.)

       2. AUTH MODAL        → login / signup form (email-password), currentUser
                              state App() me manage hota hai.

       3. TOPBAR            → top pe wali bar: breadcrumb, global search box
                              (⌘K se focus, live results dropdown), notification
                              bell (real events log karta hai — upload, extract,
                              analysis, export, login/logout), account button,
                              backend status badge.

       4. SIDEBAR           → left nav: Dashboard, Tender Upload, Bidder
                              Analysis, AI Verification, Reports, Settings.

       5. SHOWCASE CAROUSEL → naya 3D coverflow carousel (BidifiShowcaseCarousel)
                              jo BIDIFI ke core features (tender intake, bidder
                              verification, batch comparison, AI checks, reports)
                              ko visually highlight karta hai. Home/Dashboard
                              page ke sabse neeche render hota hai.

       6. PAGES             → DashboardPage (home), TendersPage, BidderAnalysis
                              page, AI Verification page, ReportsPage,
                              SettingsPage — har page apna data App() se props
                              ke through leta hai.

       7. APP (root)        → saara state (tenders, requirements, analysis,
                              notifications, searchIndex, currentUser, etc.),
                              API calls (fetch to API_URL), aur navigate()
                              function jo pages switch karta hai.
    ========================================================================= */

    /* =========================================================
       ICONS
    ========================================================= */

    function BidifiLogoIcon({ size = 18, strokeWidth = 2.4, className = "" }) {
      return (
        <svg
          className={className}
          width={size}
          height={size}
          viewBox="0 0 48 48"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M24 4 39 10v11c0 10.5-6.2 18.7-15 23C15.2 39.7 9 31.5 9 21V10l15-6Z"
            strokeWidth={strokeWidth}
          />
          <path
            d="m16 24 5 5 11-12"
            strokeWidth={Math.max(2, strokeWidth + 0.5)}
          />
        </svg>
      );
    }

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
       HOME HERO — BIDIFI CYLINDER CAROUSEL
       -------------------------------------------------------------------------
       The old stacked hero + galaxy animation has been removed.
       This keeps the same cylinder-carousel concept requested by the user,
       but uses BIDIFI-specific visual cards instead of the demo imagery/text.
    ========================================================= */

    const BIDIFI_CYLINDER_SVG = (kind) => {
      const designs = {
        tender: `
          <svg xmlns="http://www.w3.org/2000/svg" width="700" height="1000" viewBox="0 0 700 1000">
            <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#172554"/><stop offset="1" stop-color="#2563eb"/></linearGradient></defs>
            <rect width="700" height="1000" rx="42" fill="url(#g)"/>
            <circle cx="580" cy="130" r="150" fill="#60a5fa" opacity=".18"/>
            <circle cx="120" cy="850" r="210" fill="#22d3ee" opacity=".10"/>
            <rect x="105" y="180" width="490" height="590" rx="28" fill="#fff" opacity=".96"/>
            <rect x="150" y="235" width="210" height="24" rx="12" fill="#dbeafe"/>
            <rect x="150" y="290" width="390" height="14" rx="7" fill="#cbd5e1"/>
            <rect x="150" y="335" width="340" height="14" rx="7" fill="#e2e8f0"/>
            <rect x="150" y="405" width="390" height="88" rx="18" fill="#eff6ff"/>
            <path d="M175 452h120m25 0h180" stroke="#2563eb" stroke-width="12" stroke-linecap="round"/>
            <rect x="150" y="530" width="390" height="88" rx="18" fill="#f8fafc"/>
            <path d="M175 575h170m25 0h125" stroke="#94a3b8" stroke-width="11" stroke-linecap="round"/>
            <circle cx="490" cy="705" r="43" fill="#2563eb"/>
            <path d="m470 705 14 14 28-31" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
            <text x="350" y="875" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="38" font-weight="700">TENDER INTAKE</text>
            <text x="350" y="918" text-anchor="middle" fill="#bfdbfe" font-family="Arial,sans-serif" font-size="20">Requirements extracted</text>
          </svg>`,
        ai: `
          <svg xmlns="http://www.w3.org/2000/svg" width="700" height="1000" viewBox="0 0 700 1000">
            <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#312e81"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>
            <rect width="700" height="1000" rx="42" fill="url(#g)"/>
            <circle cx="350" cy="405" r="175" fill="#fff" opacity=".10"/>
            <rect x="150" y="235" width="400" height="340" rx="38" fill="#fff" opacity=".97"/>
            <path d="M350 285 390 385h-80z" fill="#7c3aed"/>
            <circle cx="350" cy="420" r="76" fill="#ede9fe"/>
            <path d="M350 366v108M296 420h108" stroke="#7c3aed" stroke-width="13" stroke-linecap="round"/>
            <circle cx="350" cy="420" r="108" fill="none" stroke="#c4b5fd" stroke-width="7" stroke-dasharray="10 16"/>
            <rect x="205" y="625" width="290" height="18" rx="9" fill="#ddd6fe"/>
            <rect x="245" y="665" width="210" height="14" rx="7" fill="#ede9fe"/>
            <text x="350" y="805" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="38" font-weight="700">AI VERIFICATION</text>
            <text x="350" y="848" text-anchor="middle" fill="#ede9fe" font-family="Arial,sans-serif" font-size="20">Clause-level intelligence</text>
          </svg>`,
        evidence: `
          <svg xmlns="http://www.w3.org/2000/svg" width="700" height="1000" viewBox="0 0 700 1000">
            <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#064e3b"/><stop offset="1" stop-color="#059669"/></linearGradient></defs>
            <rect width="700" height="1000" rx="42" fill="url(#g)"/>
            <rect x="105" y="190" width="490" height="540" rx="30" fill="#fff" opacity=".97"/>
            <path d="M350 245 475 295v105c0 88-52 157-125 197-73-40-125-109-125-197V295z" fill="#ecfdf5" stroke="#10b981" stroke-width="10"/>
            <path d="m290 405 42 42 82-92" fill="none" stroke="#059669" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="170" y="780" width="360" height="18" rx="9" fill="#a7f3d0" opacity=".8"/>
            <rect x="215" y="820" width="270" height="14" rx="7" fill="#d1fae5" opacity=".8"/>
            <text x="350" y="895" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="38" font-weight="700">EVIDENCE CHECK</text>
            <text x="350" y="938" text-anchor="middle" fill="#d1fae5" font-family="Arial,sans-serif" font-size="20">Bidder documents verified</text>
          </svg>`,
        compare: `
          <svg xmlns="http://www.w3.org/2000/svg" width="700" height="1000" viewBox="0 0 700 1000">
            <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#701a75"/><stop offset="1" stop-color="#db2777"/></linearGradient></defs>
            <rect width="700" height="1000" rx="42" fill="url(#g)"/>
            <rect x="105" y="210" width="490" height="420" rx="28" fill="#fff" opacity=".97"/>
            <rect x="145" y="255" width="105" height="315" rx="16" fill="#fce7f3"/>
            <rect x="270" y="255" width="105" height="315" rx="16" fill="#fdf2f8"/>
            <rect x="395" y="255" width="160" height="315" rx="16" fill="#fce7f3"/>
            <path d="M170 510h65M295 475h55M420 440h100" stroke="#db2777" stroke-width="15" stroke-linecap="round"/>
            <circle cx="203" cy="315" r="25" fill="#db2777"/><path d="m190 315 9 9 18-20" fill="none" stroke="#fff" stroke-width="7"/>
            <circle cx="328" cy="315" r="25" fill="#f472b6"/><path d="m315 315 9 9 18-20" fill="none" stroke="#fff" stroke-width="7"/>
            <circle cx="475" cy="315" r="25" fill="#be185d"/><path d="m462 315 9 9 18-20" fill="none" stroke="#fff" stroke-width="7"/>
            <text x="350" y="760" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="38" font-weight="700">BIDDER ANALYSIS</text>
            <text x="350" y="803" text-anchor="middle" fill="#fce7f3" font-family="Arial,sans-serif" font-size="20">Compare compliance evidence</text>
          </svg>`,
        report: `
          <svg xmlns="http://www.w3.org/2000/svg" width="700" height="1000" viewBox="0 0 700 1000">
            <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0f172a"/><stop offset="1" stop-color="#475569"/></linearGradient></defs>
            <rect width="700" height="1000" rx="42" fill="url(#g)"/>
            <rect x="130" y="160" width="440" height="610" rx="28" fill="#fff" opacity=".98"/>
            <rect x="180" y="225" width="240" height="25" rx="12" fill="#cbd5e1"/>
            <rect x="180" y="290" width="340" height="14" rx="7" fill="#e2e8f0"/>
            <rect x="180" y="340" width="340" height="130" rx="18" fill="#f8fafc"/>
            <path d="M210 430V390M250 430v-62M290 430v-94M330 430v-48M370 430v-75" stroke="#2563eb" stroke-width="20" stroke-linecap="round"/>
            <rect x="180" y="510" width="340" height="18" rx="9" fill="#e2e8f0"/>
            <rect x="180" y="550" width="280" height="18" rx="9" fill="#e2e8f0"/>
            <rect x="180" y="610" width="150" height="48" rx="14" fill="#dcfce7"/>
            <path d="m205 634 12 12 24-27" fill="none" stroke="#16a34a" stroke-width="7" stroke-linecap="round"/>
            <text x="350" y="840" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="38" font-weight="700">AUDIT REPORTS</text>
            <text x="350" y="883" text-anchor="middle" fill="#e2e8f0" font-family="Arial,sans-serif" font-size="20">Clear, shareable decisions</text>
          </svg>`,
        security: `
          <svg xmlns="http://www.w3.org/2000/svg" width="700" height="1000" viewBox="0 0 700 1000">
            <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#164e63"/><stop offset="1" stop-color="#0891b2"/></linearGradient></defs>
            <rect width="700" height="1000" rx="42" fill="url(#g)"/>
            <circle cx="350" cy="390" r="190" fill="#67e8f9" opacity=".12"/>
            <path d="M350 190 510 255v150c0 113-66 201-160 253-94-52-160-140-160-253V255z" fill="#fff" opacity=".96"/>
            <path d="M350 270 440 307v98c0 66-37 121-90 156-53-35-90-90-90-156v-98z" fill="#ecfeff"/>
            <path d="m305 400 32 32 61-70" fill="none" stroke="#0891b2" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
            <text x="350" y="760" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="38" font-weight="700">COMPLIANCE CONTROL</text>
            <text x="350" y="803" text-anchor="middle" fill="#cffafe" font-family="Arial,sans-serif" font-size="20">Secure procurement workflow</text>
          </svg>`,
      };
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(designs[kind] || designs.tender)}`;
    };

    const BIDIFI_CYLINDER_IMAGES = [
      { src: BIDIFI_CYLINDER_SVG("tender"), alt: "BIDIFI tender intake illustration" },
      { src: BIDIFI_CYLINDER_SVG("ai"), alt: "BIDIFI AI verification illustration" },
      { src: BIDIFI_CYLINDER_SVG("evidence"), alt: "BIDIFI bidder evidence illustration" },
      { src: BIDIFI_CYLINDER_SVG("compare"), alt: "BIDIFI bidder analysis illustration" },
      { src: BIDIFI_CYLINDER_SVG("report"), alt: "BIDIFI compliance report illustration" },
      { src: BIDIFI_CYLINDER_SVG("security"), alt: "BIDIFI compliance control illustration" },
    ];

    const BIDIFI_CYLINDER_LABELS = [
      { tag: "01", title: "Tender Intake", text: "Extract procurement requirements from uploaded tender documents." },
      { tag: "02", title: "AI Verification", text: "Match each requirement against bidder evidence." },
      { tag: "03", title: "Evidence Check", text: "Keep documentary proof separate from tender requirements." },
      { tag: "04", title: "Bidder Analysis", text: "Review bidder compliance requirement by requirement." },
      { tag: "05", title: "Audit Reports", text: "Turn verified results into clear procurement reports." },
      { tag: "06", title: "Compliance Control", text: "Surface missing, failed and verified evidence clearly." },
    ];

    function AgentWave({ className = "" }) {
      const canvasRef = useRef(null);

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const ctx = canvas.getContext("2d");
        if (!ctx) return undefined;

        let raf = 0;
        let width = 0;
        let height = 0;
        let dpr = 1;
        let paths = [];
        let particles = [];

        const makePaths = () => {
          const count = Math.max(44, Math.min(90, Math.floor(width / 14)));
          paths = Array.from({ length: count }, (_, i) => ({
            side: i % 2 === 0 ? -1 : 1,
            y: 0.10 + Math.random() * 0.80,
            bend: (Math.random() - 0.5) * 0.60,
            width: 0.35 + Math.random() * 1.45,
            speed: 0.00018 + Math.random() * 0.00034,
            phase: Math.random(),
            alpha: 0.12 + Math.random() * 0.30,
            curve: 0.72 + Math.random() * 0.28,
          }));

          particles = Array.from({ length: Math.max(26, Math.floor(width / 28)) }, () => ({
            side: Math.random() > 0.5 ? -1 : 1,
            y: 0.16 + Math.random() * 0.68,
            phase: Math.random(),
            speed: 0.00018 + Math.random() * 0.00042,
            size: 1 + Math.random() * 1.8,
          }));
        };

        const resize = () => {
          const rect = canvas.parentElement?.getBoundingClientRect();
          if (!rect) return;

          width = Math.max(1, rect.width);
          height = Math.max(1, rect.height);
          dpr = Math.min(window.devicePixelRatio || 1, 1.25);
          canvas.width = Math.floor(width * dpr);
          canvas.height = Math.floor(height * dpr);
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          makePaths();
        };

        const cubic = (t, p0, p1, p2, p3) => {
          const mt = 1 - t;
          return (
            mt * mt * mt * p0 +
            3 * mt * mt * t * p1 +
            3 * mt * t * t * p2 +
            t * t * t * p3
          );
        };

        const draw = (time) => {
          ctx.clearRect(0, 0, width, height);

          const cx = width * 0.5;
          const cy = height * 0.50;
          const maxRadius = Math.min(width, height) * 0.38;

          // Deep BIDIFI atmosphere.
          const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 1.8);
          bg.addColorStop(0, "rgba(37,99,235,.16)");
          bg.addColorStop(0.34, "rgba(59,130,246,.075)");
          bg.addColorStop(0.72, "rgba(124,58,237,.035)");
          bg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, width, height);

          // Small ambient particles.
          for (let i = 0; i < particles.length; i += 1) {
            const p = particles[i];
            const t = (p.phase + time * p.speed) % 1;
            const mt = 1 - t;
            const startX = p.side < 0 ? -30 : width + 30;
            const startY = height * p.y;
            const endX = cx + p.side * 8;
            const endY = cy + Math.sin(time * 0.0008 + i) * 18;
            const cp1X = width * (p.side < 0 ? 0.25 : 0.75);
            const cp2X = width * (p.side < 0 ? 0.43 : 0.57);
            const cp1Y = startY + Math.sin(i + time * 0.001) * 35;
            const cp2Y = cy - Math.sin(i * 0.8 + time * 0.0008) * 28;
            const x = cubic(t, startX, cp1X, cp2X, endX);
            const y = cubic(t, startY, cp1Y, cp2Y, endY);

            ctx.fillStyle = "rgba(191,219,254,.72)";
            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(59,130,246,.85)";
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          // Agent Wave: streams converge from both sides into BIDIFI's AI core.
          for (let i = 0; i < paths.length; i += 1) {
            const p = paths[i];
            const startX = p.side < 0 ? -55 : width + 55;
            const startY = height * p.y;
            const cp1X = width * (p.side < 0 ? 0.18 : 0.82);
            const cp2X = width * (p.side < 0 ? 0.42 : 0.58);
            const wave = Math.sin(time * p.speed * 1000 + p.phase * Math.PI * 2) * 22;
            const cp1Y = startY + p.bend * height + wave;
            const cp2Y = cy - p.bend * height * 0.46 - wave * 0.42;
            const endX = cx + p.side * 7;

            const gradient = ctx.createLinearGradient(startX, startY, endX, cy);
            gradient.addColorStop(0, "rgba(59,130,246,0)");
            gradient.addColorStop(.28, `rgba(56,189,248,${p.alpha * .42})`);
            gradient.addColorStop(.68, `rgba(96,165,250,${p.alpha * .80})`);
            gradient.addColorStop(1, `rgba(224,242,254,${Math.min(.88, p.alpha + .18)})`);

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, cy);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = p.width;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(59,130,246,.48)";
            ctx.stroke();
            ctx.shadowBlur = 0;

            const t = (p.phase + time * p.speed) % 1;
            const mt = 1 - t;
            const x = cubic(t, startX, cp1X, cp2X, endX);
            const y = cubic(t, startY, cp1Y, cp2Y, cy);

            ctx.fillStyle = "rgba(239,250,255,.94)";
            ctx.shadowBlur = 13;
            ctx.shadowColor = "rgba(96,165,250,.95)";
            ctx.beginPath();
            ctx.arc(x, y, 1.15 + p.width * .78, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          // Central AI core.
          const pulse = 1 + Math.sin(time * .0021) * .035;
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * .42);
          glow.addColorStop(0, "rgba(219,234,254,.28)");
          glow.addColorStop(.18, "rgba(96,165,250,.20)");
          glow.addColorStop(.48, "rgba(59,130,246,.075)");
          glow.addColorStop(1, "rgba(37,99,235,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(cx, cy, maxRadius * .43, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(pulse, pulse);

          const core = ctx.createRadialGradient(-8, -10, 2, 0, 0, 70);
          core.addColorStop(0, "rgba(255,255,255,.98)");
          core.addColorStop(.13, "rgba(191,219,254,.98)");
          core.addColorStop(.42, "rgba(59,130,246,.78)");
          core.addColorStop(1, "rgba(30,64,175,.06)");
          ctx.fillStyle = core;
          ctx.shadowBlur = 35;
          ctx.shadowColor = "rgba(59,130,246,.72)";
          ctx.beginPath();
          ctx.arc(0, 0, 42, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // AI waveform ring.
          ctx.strokeStyle = "rgba(219,234,254,.72)";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          for (let a = 0; a <= Math.PI * 2 + .05; a += .055) {
            const r = 52 + Math.sin(a * 8 + time * .004) * 3 + Math.sin(a * 17 - time * .002) * 2;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (a === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.restore();

          raf = window.requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener("resize", resize);
        raf = window.requestAnimationFrame(draw);

        return () => {
          window.removeEventListener("resize", resize);
          window.cancelAnimationFrame(raf);
        };
      }, []);

      return (
        <div className={`bidifiAgentWave ${className}`}>
          <canvas ref={canvasRef} aria-hidden="true" />
          <div className="bidifiAgentWaveCore" aria-hidden="true">
            <div className="bidifiAgentWaveCoreText">BIDIFI</div>
            <span>AI</span>
          </div>

          <div className="bidifiAgentWaveLabel labelTender">
            <b>TENDER</b><span>requirements</span>
          </div>
          <div className="bidifiAgentWaveLabel labelEvidence">
            <b>EVIDENCE</b><span>verification</span>
          </div>
          <div className="bidifiAgentWaveLabel labelReport">
            <b>REPORT</b><span>compliance result</span>
          </div>

          <div className="bidifiAgentWaveBadge">
            <strong>ABC</strong>
            <span>AI BID<br />COMPLIANCE</span>
          </div>
        </div>
      );
    }


    /* =========================================================
       HOME INTRO — interactive neon-tubes WebGL background
       (Reference: threejs-components "tubes1" cursor effect, adapted
       to plain JSX for this codebase — koi framer-motion/clsx nahi,
       sirf ek <canvas> jo dynamically CDN se three.js tubes module
       load karta hai. Sirf home page ke greeting header ke peeche
       render hota hai, baaki pages is heavy WebGL canvas ko touch
       nahi karte.

       Reliability note: CDN import ya WebGL kabhi bhi (network/CSP/
       browser support ki wajah se) fail ho sakta hai. Isliye ek
       guaranteed pure-CSS "ambient" animation hamesha peeche chalti
       rehti hai; jab 3D tubes successfully load ho jaate hain, wo
       uske upar fade-in ho jaate hain. Matlab home page par animation
       HAMESHA dikhega, chahe CDN load ho ya na ho.)
    ========================================================= */
    /* =========================================================
       HOME ANIMATION ISOLATION
       Each Home animation group gets its own composited section so
       page scrolling does not continuously reflow/repaint its layer.
    ========================================================= */
    function BidifiHomeAnimationSection({ children, className = "" }) {
      return (
        <section className={`bidifiHomeAnimationSection ${className}`}>
          {children}
        </section>
      );
    }

    function BidifiTextBeamAnimation() {
      const canvasRef = useRef(null);

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const ctx = canvas.getContext("2d");
        if (!ctx) return undefined;

        let raf = 0;
        let width = 0;
        let height = 0;
        let dpr = 1;
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const resize = () => {
          const rect = canvas.parentElement?.getBoundingClientRect();
          if (!rect) return;
          width = Math.max(1, rect.width);
          height = Math.max(1, rect.height);
          dpr = Math.min(window.devicePixelRatio || 1, 1.25);
          canvas.width = Math.floor(width * dpr);
          canvas.height = Math.floor(height * dpr);
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const move = (event) => {
          const rect = canvas.getBoundingClientRect();
          targetX = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
          targetY = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
        };

        const leave = () => {
          targetX = 0;
          targetY = 0;
        };

        const drawBeam = (time, index, direction, colorA, colorB) => {
          const centerX = width * 0.5 + mouseX * 12;
          const centerY = height * 0.47 + mouseY * 8;
          const spread = width * (0.30 + index * 0.045);
          const lift = height * (0.05 + index * 0.012);
          const wave = Math.sin(time * 0.0012 + index * 1.7) * 12;
          const side = direction;

          const startX = centerX + side * 8;
          const startY = centerY + Math.sin(time * 0.001 + index) * 3;
          const endX = centerX + side * spread;
          const endY = centerY - lift + wave * side;

          const cp1X = centerX + side * spread * 0.34;
          const cp1Y = centerY - 10 + wave;
          const cp2X = centerX + side * spread * 0.72;
          const cp2Y = endY + 18 * side;

          const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
          gradient.addColorStop(0, colorA);
          gradient.addColorStop(0.45, colorB);
          gradient.addColorStop(1, "rgba(255,255,255,0)");

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = index === 0 ? 2.4 : 1.15;
          ctx.globalAlpha = index === 0 ? 0.72 : 0.30;
          ctx.shadowBlur = 0;
          ctx.stroke();
        };

        const draw = (time) => {
          mouseX += (targetX - mouseX) * 0.035;
          mouseY += (targetY - mouseY) * 0.035;

          ctx.clearRect(0, 0, width, height);
          ctx.globalCompositeOperation = "screen";

          const cx = width * 0.5;
          const cy = height * 0.47;
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.32);
          glow.addColorStop(0, "rgba(56,189,248,.13)");
          glow.addColorStop(0.45, "rgba(168,85,247,.055)");
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, width, height);

          const beams = [
            ["rgba(34,211,238,.95)", "rgba(59,130,246,.9)"],
            ["rgba(99,102,241,.8)", "rgba(168,85,247,.9)"],
            ["rgba(236,72,153,.72)", "rgba(217,70,239,.85)"],
            ["rgba(45,212,191,.6)", "rgba(34,211,238,.78)"],
          ];

          for (let i = 0; i < beams.length; i += 1) {
            const [a, b] = beams[i];
            drawBeam(time, i, -1, a, b);
            drawBeam(time + 420, i, 1, b, a);
          }

          // A small luminous pulse makes the rays feel like they are emerging
          // directly from the centre of the hero text.
          const pulse = 4 + Math.sin(time * 0.003) * 1.5;
          ctx.beginPath();
          ctx.arc(cx + mouseX * 8, cy + mouseY * 5, pulse, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(224,242,254,.9)";
          ctx.shadowBlur = 0;
          ctx.fill();

          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
          raf = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener("resize", resize);
        canvas.addEventListener("pointermove", move, { passive: true });
        canvas.addEventListener("pointerleave", leave, { passive: true });
        raf = requestAnimationFrame(draw);

        return () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("resize", resize);
          canvas.removeEventListener("pointermove", move);
          canvas.removeEventListener("pointerleave", leave);
        };
      }, []);

      return <canvas ref={canvasRef} className="bidifiTextBeamCanvas" aria-hidden="true" />;
    }

    function BidifiHomeIntro({ eyebrow, title, description }) {
      return (
        <div className="bidifiHomeIntro">
          <div className="bidifiHomeIntroAmbient" aria-hidden="true">
            <span className="bidifiAmbientBlob blobA" />
            <span className="bidifiAmbientBlob blobB" />
          </div>

          <div className="bidifiTextBeamLayer" aria-hidden="true">
            <BidifiTextBeamAnimation />
          </div>

          <div className="bidifiHomeIntroScrim" />

          <div className="bidifiHomeIntroContent">
            <PageHeader eyebrow={eyebrow} title={title} description={description} />
          </div>

          <style>{`
            .bidifiHomeAnimationSection{
              position:relative;
              width:100%;
              isolation:isolate;
              contain:layout style paint;
              transform:translateZ(0);
              will-change:transform;
              backface-visibility:hidden;
              -webkit-backface-visibility:hidden;
            }

            .bidifiHomeAnimationSection--intro,.bidifiHomeAnimationSection--hero{
              z-index:0;
            }

            .bidifiHomeIntro{
              position:relative;
              overflow:hidden;
              border-radius:24px;
              min-height:280px;
              margin:4px 0 22px;
              isolation:isolate;
              background:
                radial-gradient(circle at 50% 48%,rgba(59,130,246,.09),transparent 34%),
                linear-gradient(135deg,#07101f 0%,#0c1730 52%,#11132d 100%);
              box-shadow:0 20px 60px rgba(15,23,42,.16);
            }

            .bidifiHomeIntroAmbient{
              position:absolute;
              inset:0;
              overflow:hidden;
              z-index:0;
            }

            .bidifiAmbientBlob{
              position:absolute;
              width:260px;
              height:260px;
              border-radius:50%;
              filter:blur(58px);
              opacity:.22;
            }

            .bidifiAmbientBlob.blobA{
              left:-100px;
              top:-130px;
              background:#4f46e5;
              animation:bidifiMiniBlobA 15s ease-in-out infinite;
            }

            .bidifiAmbientBlob.blobB{
              right:-100px;
              bottom:-150px;
              background:#06b6d4;
              animation:bidifiMiniBlobB 18s ease-in-out infinite;
            }

            @keyframes bidifiMiniBlobA{
              0%,100%{transform:translate(0,0)}
              50%{transform:translate(70px,45px)}
            }

            @keyframes bidifiMiniBlobB{
              0%,100%{transform:translate(0,0)}
              50%{transform:translate(-60px,-35px)}
            }

            .bidifiTextBeamLayer{
              position:absolute;
              inset:0;
              z-index:1;
              pointer-events:auto;
            }

            .bidifiTextBeamCanvas{
              will-change:transform;transform:translateZ(0);
              width:100%;
              height:100%;
              display:block;
  contain:strict;
  will-change:transform;
  transform:translateZ(0);
              opacity:.95;
              mix-blend-mode:screen;
            }

            .bidifiHomeIntroScrim{
              position:absolute;
              inset:0;
              z-index:2;
              pointer-events:none;
              background:
                linear-gradient(180deg,rgba(5,10,24,.12) 0%,rgba(5,10,24,.08) 46%,rgba(5,10,24,.48) 100%),
                radial-gradient(circle at 50% 48%,transparent 0%,rgba(5,10,24,.18) 62%,rgba(5,10,24,.5) 100%);
            }

            .bidifiHomeIntroContent{
              position:relative;
              z-index:3;
              min-height:280px;
              display:flex;
              align-items:center;
              justify-content:center;
              padding:52px 38px 32px;
              pointer-events:none;
            }

            .bidifiHomeIntroContent .pageHeader{
              pointer-events:auto;
              text-align:center;
              width:100%;
            }

            .bidifiHomeIntroContent .pageHeader > div{
              max-width:850px;
              margin:0 auto;
            }

            .bidifiHomeIntroContent .pageEyebrow{
              color:#bae6fd!important;
              text-shadow:0 0 16px rgba(34,211,238,.25);
            }

            .bidifiHomeIntroContent .pageHeader h1{
              color:#fff!important;
              text-shadow:
                0 0 18px rgba(59,130,246,.16),
                0 4px 24px rgba(0,0,0,.5);
            }

            .bidifiHomeIntroContent .pageHeader p{
              color:rgba(226,232,240,.84)!important;
              text-shadow:0 2px 14px rgba(0,0,0,.5);
              max-width:720px;
              margin-left:auto;
              margin-right:auto;
            }

            @media(max-width:820px){
              .bidifiHomeIntro{
                min-height:300px;
                border-radius:18px;
              }

              .bidifiHomeIntroContent{
                min-height:300px;
                padding:44px 20px 28px;
              }
            }

            @media(prefers-reduced-motion:reduce){
              .bidifiAmbientBlob{animation:none!important;}
              .bidifiTextBeamCanvas{opacity:.65;}
            }


            /* =========================================================
               REQUESTED TEXT / SURFACE CONTRAST FIXES
               - Tender: AI REQUIREMENT ENGINE surface is dark blue
               - Reports: LOW RISK + REVIEW text black
               - AI Verification: top REVIEW + AI VERIFIED text black
               - Reports: BIDIFI shield logo is white
               ========================================================= */

            /* ---------- TENDER: AI REQUIREMENT ENGINE ---------- */
            .blueWorkspacePage .aiExtractionPanel,
            .blueWorkspacePage .aiExtractionPanel .aiExtractionHeader,
            .blueWorkspacePage .aiExtractionPanel > div {
              background:linear-gradient(145deg,#142947,#0f2039) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
            }

            .blueWorkspacePage .aiExtractionPanel .aiLabel {
              color:#93c5fd !important;
              -webkit-text-fill-color:#93c5fd !important;
            }

            .blueWorkspacePage .aiExtractionPanel h2 {
              color:#f8fafc !important;
              -webkit-text-fill-color:#f8fafc !important;
            }

            .blueWorkspacePage .aiExtractionPanel p {
              color:#9fb5d3 !important;
              -webkit-text-fill-color:#9fb5d3 !important;
            }

            /* ---------- AI VERIFICATION: TOP REVIEW ---------- */
            .blueWorkspacePage .verificationHero .decisionBlock .statusBadge.warning,
            .blueWorkspacePage .verificationHero .decisionBlock .statusBadge {
              color:#000000 !important;
              -webkit-text-fill-color:#000000 !important;
              font-weight:900 !important;
            }

            /* ---------- AI VERIFICATION: AI VERIFIED ---------- */
            .blueWorkspacePage .evidencePanel .aiVerifiedBadge,
            .blueWorkspacePage .aiVerifiedBadge {
              color:#000000 !important;
              -webkit-text-fill-color:#000000 !important;
              font-weight:900 !important;
            }

            .blueWorkspacePage .evidencePanel .aiVerifiedBadge svg,
            .blueWorkspacePage .aiVerifiedBadge svg {
              color:#000000 !important;
              stroke:#000000 !important;
            }

            /* ---------- REPORTS: LOW RISK ---------- */
            .blueWorkspacePage .reportKpis .reportKpi:nth-child(2) small {
              color:#000000 !important;
              -webkit-text-fill-color:#000000 !important;
              font-weight:800 !important;
            }

            /* ---------- REPORTS: REVIEW ON THE RIGHT ---------- */
            .blueWorkspacePage .reportStatus .statusBadge,
            .blueWorkspacePage .reportStatus .statusBadge.warning {
              color:#000000 !important;
              -webkit-text-fill-color:#000000 !important;
              font-weight:900 !important;
            }

            /* ---------- REPORTS: BIDIFI SHIELD / LOGO ---------- */
            .blueWorkspacePage .reportMark svg,
            .blueWorkspacePage .reportMark svg path {
              color:#ffffff !important;
              stroke:#ffffff !important;
              -webkit-text-fill-color:#ffffff !important;
            }

            .blueWorkspacePage .reportMark {
              color:#ffffff !important;
            }

          `}</style>
        </div>
      );
    }

    function BidifiCylinderHero({ navigate }) {
      const heroRef = useRef(null);

      useEffect(() => {
        const root = heroRef.current;
        if (!root) return undefined;

        const nodes = Array.from(root.querySelectorAll(".bidifiAppear"));
        const markIn = (el) => el.classList.add("bidifiIsIn");

        const listeners = nodes.map((el) => {
          const onEnd = () => markIn(el);
          el.addEventListener("animationend", onEnd, { once: true });
          return { el, onEnd };
        });

        // Fallback: agar kisi reason se entrance animation fire na ho (reduced
        // motion, slow paint, style load timing), to bhi sara hero content
        // guaranteed visible ho jaye — home page kabhi blank/hidden nahi rehni chahiye.
        const fallbackTimer = window.setTimeout(() => {
          nodes.forEach(markIn);
        }, 1700);

        return () => {
          listeners.forEach(({ el, onEnd }) => el.removeEventListener("animationend", onEnd));
          window.clearTimeout(fallbackTimer);
        };
      }, []);

      return (
        <section className="bidifiCylinderHero" ref={heroRef}>
          <div className="bidifiCylinderHeroGlow glowOne" />
          <div className="bidifiCylinderHeroGlow glowTwo" />

          <div className="bidifiCylinderHeroContent">
            <div className="bidifiHeroBadge bidifiAppear bidifiAppear--pop" style={{ "--d": "0.12s" }}>
              <span className="bidifiHeroBadgeDot" />
              AI PROCUREMENT INTELLIGENCE
            </div>

            <h1>
              <span className="bidifiHeadlineLine">
                <span className="bidifiAppear bidifiAppear--mask" style={{ "--d": "0.28s" }}>
                  Turn Tender Requirements
                </span>
              </span>
              <span className="bidifiHeadlineLine">
                <span className="bidifiAppear bidifiAppear--mask bidifiHeroAccent" style={{ "--d": "0.44s" }}>
                  Into Clear Bid Decisions.
                </span>
              </span>
            </h1>

            <p className="bidifiAppear bidifiAppear--soft" style={{ "--d": "0.6s" }}>
              <strong>What BIDIFI does:</strong> upload a tender, and our AI reads
              every requirement, checks each bidder&apos;s submitted evidence
              clause-by-clause, flags what&apos;s missing or non-compliant, and
              turns the result into an audit-ready compliance report — so your
              team decides on verified facts, not manual re-reading.
            </p>

            <div className="bidifiCylinderHeroActions">
              <button
                type="button"
                className="bidifiPrimaryHeroBtn bidifiAppear bidifiAppear--btn"
                style={{ "--d": "0.76s" }}
                onClick={() => navigate("Tenders")}
              >
                <Icon name="upload" size={16} />
                Upload a Tender
                <Icon name="arrow" size={14} />
              </button>
              <button
                type="button"
                className="bidifiSecondaryHeroBtn bidifiAppear bidifiAppear--side"
                style={{ "--d": "0.9s" }}
                onClick={() => navigate("Bidder Analysis")}
              >
                <BidifiLogoIcon size={16} />
                Verify a Bidder
              </button>
            </div>

            <div className="bidifiHeroTrustRow bidifiAppear bidifiAppear--soft" style={{ "--d": "1.02s" }}>
              <span><Icon name="check" size={13} /> Requirement-specific checks</span>
              <span><Icon name="check" size={13} /> Bidder-document evidence</span>
              <span><Icon name="check" size={13} /> Audit-ready results</span>
            </div>
          </div>

          <div className="bidifiCylinderHeroVisual">
            <div className="bidifiCylinderKicker bidifiAppear bidifiAppear--pop" style={{ "--d": "0.2s" }}>
              <span className="bidifiCylinderKickerDot" />
              AI-Powered Bid Compliance
            </div>

            <AgentWave />

            <div className="bidifiCylinderCaption bidifiAppear bidifiAppear--soft" style={{ "--d": "0.5s" }}>
              <strong>Procurement intelligence in motion</strong>
              <span>Explore the core BIDIFI workflow</span>
            </div>
          </div>

          <div className="bidifiCylinderHeroFooter">
            {BIDIFI_CYLINDER_LABELS.map((item, i) => (
              <div
                key={item.tag}
                className="bidifiAppear bidifiAppear--stat"
                style={{ "--d": `${(1.1 + i * 0.08).toFixed(2)}s` }}
              >
                <span>{item.tag}</span>
                <strong>{item.title}</strong>
              </div>
            ))}
          </div>
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
            <div className="authBrand"><div className="brandMark"><BidifiLogoIcon size={20} /></div><div><strong>BIDIFI</strong><span>AI BID COMPLIANCE</span></div></div>
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
        { name: "Bid Readiness", icon: "verify" },
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
                <BidifiLogoIcon size={21} strokeWidth={2.1} />
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

    /* =========================================================================
       SHOWCASE CAROUSEL (3D coverflow)
       -------------------------------------------------------------------------
       Ye sirf ek "animation" component hai jo BIDIFI ke core features ko
       ek premium, 3D coverflow-style carousel me dikhata hai. Center wala
       card bada + sharp hota hai, uske dono side ke cards chhote + rotated +
       dim ho jaate hain (depth ka illusion). Autoplay (5s) + left/right
       arrows + dots + keyboard (← →) + swipe (mobile) sab supported hai.

       Note: is project me Tailwind / shadcn nahi hai, isliye original
       component (jo Tailwind classes use karta tha) ko yahan 100% inline
       styles me convert kar diya gaya hai — koi extra install nahi karna
       padega, seedha kaam karega. Icons bhi inline SVG hain (zero deps),
       naam clash na ho isliye "CF" prefix diya hai (rest of app ke Icon
       helper se alag).

       Props:
       - items          → array of { tag, titleLine1, titleLine2, desc, img,
                           ctaText, ctaUrl } (default: bidifiShowcaseItems neeche)
       - sectionLabel    → eyebrow text (default "WHY BIDIFI")
       - autoplay        → boolean (default true)
       - autoplayDelay   → ms (default 5000)
       - onCtaClick(item)→ optional click handler for the CTA button; agar diya
                           to <a href> ka default navigation rok kar isse call
                           hoga (SPA ke andar navigate() jaisa use ke liye)

       Usage: DashboardPage (Home) ke sabse neeche render hota hai.
    ========================================================================= */

    function CFChevronLeftIcon() {
      return (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      );
    }

    function CFChevronRightIcon() {
      return (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      );
    }

    function CFArrowRightIcon() {
      return (
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      );
    }

    /* BIDIFI ke real features ke basis par carousel content — restaurant/dish
       wala demo data hata kar apne platform ke hisaab se likha gaya hai. */
    const bidifiShowcaseItems = [
      {
        tag: "#SmartIntake",
        titleLine1: "TENDER PARSING",
        titleLine2: "— AI EXTRACTION",
        desc: "Upload any tender document and let BIDIFI automatically pull out every clause, eligibility rule and requirement.",
        img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop",
        ctaText: "Upload Tender",
        ctaUrl: "#",
      },
      {
        tag: "#ComplianceEngine",
        titleLine1: "BIDDER VERIFICATION",
        titleLine2: "— EVIDENCE CHECK",
        desc: "Every bidder document is cross-checked against tender requirements, clause by clause, with a clear pass/fail trail.",
        img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop",
        ctaText: "Start Verification",
        ctaUrl: "#",
      },
      {
        tag: "#BatchCompare",
        titleLine1: "MULTI-BIDDER",
        titleLine2: "— SIDE-BY-SIDE ANALYSIS",
        desc: "Analyse up to 20 bidders together and instantly see who meets the mark and who falls short.",
        img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
        ctaText: "Compare Bidders",
        ctaUrl: "#",
      },
      {
        tag: "#AIVerification",
        titleLine1: "DOCUMENT AI",
        titleLine2: "— CLAUSE-LEVEL CHECKS",
        desc: "BIDIFI's AI reads submitted evidence the way an expert evaluator would, flagging gaps before they become disputes.",
        img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop",
        ctaText: "See AI Verification",
        ctaUrl: "#",
      },
      {
        tag: "#InstantExport",
        titleLine1: "AUDIT-READY",
        titleLine2: "— ONE-CLICK REPORTS",
        desc: "Turn every analysis into a clean, shareable compliance report your procurement team can act on immediately.",
        img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
        ctaText: "View Reports",
        ctaUrl: "#",
      },
    ];

    function BidifiShowcaseCarousel({
      items = bidifiShowcaseItems,
      sectionLabel = "WHY BIDIFI",
      autoplay = true,
      autoplayDelay = 5000,
      onCtaClick,
    }) {
      const [currentIndex, setCurrentIndex] = useState(0);
      const [isHovered, setIsHovered] = useState(false);
      const touchStartX = useRef(0);
      const total = items.length;

      const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % total);
      }, [total]);

      const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + total) % total);
      }, [total]);

      const goToSlide = (idx) => {
        setCurrentIndex(idx % total);
      };

      // Autoplay — pauses while the user is hovering the carousel.
      useEffect(() => {
        if (!autoplay || isHovered || total <= 1) return;
        const interval = setInterval(nextSlide, autoplayDelay);
        return () => clearInterval(interval);
      }, [autoplay, autoplayDelay, isHovered, nextSlide, total]);

      // Keyboard navigation — Left/Right arrow keys.
      useEffect(() => {
        const handleKeyDown = (e) => {
          if (e.key === "ArrowLeft") prevSlide();
          if (e.key === "ArrowRight") nextSlide();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }, [nextSlide, prevSlide]);

      const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
      };

      const handleTouchEnd = (e) => {
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(diff) > 45) {
          if (diff < 0) nextSlide();
          else prevSlide();
        }
      };

      if (!items || items.length === 0) return null;

      return (
        <section
          style={{
            position: "relative",
            width: "100%",
            minHeight: 760,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            padding: "48px 0",
            userSelect: "none",
            backgroundColor: "#0c0a09",
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            borderRadius: 20,
            marginTop: 32,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Blurred ambience background, taken from the active slide's image */}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
            <img
              src={items[currentIndex]?.img}
              alt="ambience background"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.22) blur(32px)",
                transform: "scale(1.15)",
                transition: "opacity 1000ms ease, filter 1000ms ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at center, rgba(12,10,9,0.3) 0%, rgba(12,10,9,0.92) 100%)",
              }}
            />
          </div>

          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 1152,
              margin: "0 auto",
              padding: "0 16px",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Eyebrow */}
            {sectionLabel && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                <span style={{ width: 36, height: 1, background: "linear-gradient(90deg, transparent, #c5a880)" }} />
                <h3
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "#c5a880",
                    margin: 0,
                  }}
                >
                  {sectionLabel}
                </h3>
                <span style={{ width: 36, height: 1, background: "linear-gradient(90deg, #c5a880, transparent)" }} />
              </div>
            )}

            {/* 3D Coverflow Stage */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: 520,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 32,
                perspective: "1400px",
              }}
            >
              {items.map((item, idx) => {
                const offset = (idx - currentIndex + total) % total;

                let transform = "translateX(0px) scale(0.4) rotateY(0deg)";
                let opacity = 0;
                let zIndex = 0;
                let filter = "brightness(0.4) blur(2px)";
                let isCenter = false;

                if (offset === 0) {
                  isCenter = true;
                  transform = "translateX(0px) scale(1) rotateY(0deg)";
                  opacity = 1;
                  zIndex = 30;
                  filter = "brightness(1)";
                } else if (offset === 1) {
                  transform = "translateX(285px) scale(0.84) rotateY(-24deg)";
                  opacity = 0.65;
                  zIndex = 20;
                  filter = "brightness(0.75)";
                } else if (offset === 2) {
                  transform = "translateX(510px) scale(0.68) rotateY(-38deg)";
                  opacity = 0.38;
                  zIndex = 10;
                  filter = "brightness(0.55) blur(1px)";
                } else if (offset === total - 1) {
                  transform = "translateX(-285px) scale(0.84) rotateY(24deg)";
                  opacity = 0.65;
                  zIndex = 20;
                  filter = "brightness(0.75)";
                } else if (offset === total - 2) {
                  transform = "translateX(-510px) scale(0.68) rotateY(38deg)";
                  opacity = 0.38;
                  zIndex = 10;
                  filter = "brightness(0.55) blur(1px)";
                }

                return (
                  <div
                    key={item.id || idx}
                    onClick={() => !isCenter && goToSlide(idx)}
                    style={{
                      position: "absolute",
                      width: 330,
                      height: 500,
                      borderRadius: 18,
                      overflow: "hidden",
                      backgroundColor: "#171311",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      transform,
                      opacity,
                      zIndex,
                      filter,
                      transformOrigin: "center center",
                      transition: "all 800ms cubic-bezier(0.25, 1, 0.5, 1)",
                      boxShadow: isCenter
                        ? "0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(197,168,128,0.25)"
                        : "0 15px 35px rgba(0,0,0,0.5)",
                      cursor: isCenter ? "default" : "pointer",
                    }}
                  >
                    {/* Feature photo */}
                    <img
                      src={item.img}
                      alt={item.titleLine1}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    {/* Dark vignette so white text stays readable */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 25%, rgba(0,0,0,0.68) 60%, rgba(0,0,0,0.96) 100%)",
                        pointerEvents: "none",
                        zIndex: 10,
                      }}
                    />

                    {/* Content — only the centered card shows its text/CTA */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        padding: "20px 18px 22px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        textAlign: "center",
                        zIndex: 20,
                        opacity: isCenter ? 1 : 0,
                        transform: isCenter ? "translateY(0px)" : "translateY(16px)",
                        transition: "opacity 500ms ease, transform 500ms ease",
                        pointerEvents: isCenter ? "auto" : "none",
                      }}
                    >
                      <div style={{ textAlign: "right", width: "100%", paddingRight: 4 }}>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            color: "rgba(255,255,255,0.9)",
                            textShadow: "0 2px 6px rgba(0,0,0,0.8)",
                          }}
                        >
                          {item.tag}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 3,
                          marginTop: "auto",
                          paddingBottom: 4,
                        }}
                      >
                        <h2
                          style={{
                            fontSize: "1.65rem",
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: "#ffffff",
                            margin: 0,
                            lineHeight: 1.1,
                            textShadow: "0 3px 12px rgba(0,0,0,0.95)",
                          }}
                        >
                          {item.titleLine1}
                        </h2>

                        {item.titleLine2 && (
                          <span
                            style={{
                              fontSize: "1.1rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              color: "#f3f0ea",
                              lineHeight: 1.2,
                              textShadow: "0 3px 10px rgba(0,0,0,0.9)",
                            }}
                          >
                            {item.titleLine2}
                          </span>
                        )}

                        <div
                          style={{
                            width: 34,
                            height: 2,
                            backgroundColor: "#c5a880",
                            borderRadius: 2,
                            margin: "5px auto 4px",
                            boxShadow: "0 0 8px rgba(197,168,128,0.7)",
                          }}
                        />

                        {item.desc && (
                          <p
                            style={{
                              fontSize: "0.82rem",
                              fontStyle: "italic",
                              color: "rgba(255,255,255,0.9)",
                              maxWidth: 280,
                              margin: "0 0 10px",
                              lineHeight: 1.3,
                              textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                            }}
                          >
                            {item.desc}
                          </p>
                        )}

                        <a
                          href={item.ctaUrl || "#"}
                          onClick={(e) => {
                            if (onCtaClick) {
                              e.preventDefault();
                              onCtaClick(item);
                            }
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 18px",
                            borderRadius: 9999,
                            background: "linear-gradient(135deg, #c5a880 0%, #a48256 100%)",
                            color: "#110d0c",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            textDecoration: "none",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.4), 0 0 15px rgba(197,168,128,0.3)",
                            cursor: "pointer",
                            transition: "transform 200ms ease, box-shadow 200ms ease",
                          }}
                        >
                          <span>{item.ctaText || "Learn more"}</span>
                          <CFArrowRightIcon />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prev / Next arrows */}
            <button
              onClick={prevSlide}
              aria-label="Previous feature"
              type="button"
              style={{
                position: "absolute",
                left: 24,
                top: "50%",
                transform: "translateY(-50%)",
                width: 46,
                height: 46,
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                zIndex: 40,
                transition: "all 200ms ease",
              }}
            >
              <CFChevronLeftIcon />
            </button>

            <button
              onClick={nextSlide}
              aria-label="Next feature"
              type="button"
              style={{
                position: "absolute",
                right: 24,
                top: "50%",
                transform: "translateY(-50%)",
                width: 46,
                height: 46,
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                zIndex: 40,
                transition: "all 200ms ease",
              }}
            >
              <CFChevronRightIcon />
            </button>

            {/* Pagination dots */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, zIndex: 30 }}>
              {items.map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => goToSlide(idx)}
                  aria-label={`Go to feature ${idx + 1}`}
                  type="button"
                  style={{
                    height: 8,
                    width: idx === currentIndex ? 28 : 8,
                    borderRadius: 9999,
                    backgroundColor: idx === currentIndex ? "#c5a880" : "rgba(255,255,255,0.25)",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: idx === currentIndex ? "0 0 10px rgba(197,168,128,0.7)" : "none",
                    transition: "all 300ms ease",
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      );
    }

    /* =========================================================
       DASHBOARD
    ========================================================= */


    function BidifiHackathonCommandCenter({
      analysis,
      requirements,
      selectedTender,
      bidderDocuments,
      batchResults,
      navigate,
    }) {
      const items = safeArray(analysis?.requirementsAnalysis).map(
        (item, index) => normalizeAnalysisItem(item, index)
      );

      const statusOf = (item) =>
        normalizeVerificationStatus(item);

      const compliant = items.filter(
        (item) => statusOf(item) === "COMPLIANT"
      ).length;

      const missing = items.filter(
        (item) => statusOf(item) === "MISSING"
      ).length;

      const failed = items.filter((item) =>
        [
          "NON_COMPLIANT",
          "MISMATCH",
          "FAIL",
          "EXPIRED",
          "INCONSISTENT",
        ].includes(statusOf(item))
      ).length;

      const review = items.filter((item) =>
        ["REVIEW", "HUMAN_REVIEW"].includes(statusOf(item))
      ).length;

      const total = Math.max(
        requirements.length,
        items.length,
        0
      );

      const compliance = total
        ? clamp(
            getAnalysisCompliance(
              analysis,
              Math.round((compliant / total) * 100)
            )
          )
        : 0;

      const risk = total
        ? clamp(
            getAnalysisRisk(
              analysis,
              Math.round(100 - compliance)
            )
          )
        : 0;

      const mandatoryCount = safeArray(requirements).filter(
        (req) =>
          safeObject(req)?.mandatory === true ||
          ["yes", "true", "mandatory"].includes(
            safeText(safeObject(req)?.mandatory).toLowerCase()
          )
      ).length;

      const mandatoryFailed = items.filter((item) => {
        const req = safeObject(item);
        const mandatory =
          req?.mandatory === true ||
          ["yes", "true", "mandatory"].includes(
            safeText(req?.mandatory).toLowerCase()
          );
        return (
          mandatory &&
          [
            "NON_COMPLIANT",
            "MISMATCH",
            "FAIL",
            "EXPIRED",
            "MISSING",
          ].includes(statusOf(item))
        );
      }).length;

      const readiness = total
        ? clamp(
            Math.round(
              compliance -
                Math.min(35, mandatoryFailed * 12) -
                Math.min(20, review * 4)
            )
          )
        : 0;

      const redFlags = [
        ...items
          .filter((item) =>
            [
              "NON_COMPLIANT",
              "MISMATCH",
              "FAIL",
              "EXPIRED",
              "INCONSISTENT",
            ].includes(statusOf(item))
          )
          .map((item) => ({
            type: "Critical",
            title: getRequirementTitle(item, 0),
            detail:
              safeText(
                item.bidderEvidence?.text ||
                  item.evidence ||
                  item.reason ||
                  item.explanation
              ) || "Evidence does not satisfy the requirement.",
          })),
        ...items
          .filter((item) => statusOf(item) === "MISSING")
          .map((item) => ({
            type: "Evidence gap",
            title: getRequirementTitle(item, 0),
            detail: "No usable bidder evidence was identified for this requirement.",
          })),
        ...items
          .filter((item) =>
            ["REVIEW", "HUMAN_REVIEW"].includes(statusOf(item))
          )
          .map((item) => ({
            type: "Human review",
            title: getRequirementTitle(item, 0),
            detail: "AI could not establish a sufficiently clear decision.",
          })),
      ].slice(0, 6);

      const explainItems = items.slice(0, 5);

      const deadline =
        selectedTender?.deadline ||
        selectedTender?.submissionDeadline ||
        selectedTender?.dueDate ||
        selectedTender?.closingDate ||
        selectedTender?.bidSubmissionDeadline ||
        null;

      const comparisonRows = safeArray(batchResults).filter(
        (row) => row?.success && row?.analysis
      );

      const checklist = [
        {
          label: "Tender selected",
          done: Boolean(selectedTender),
        },
        {
          label: "Requirements extracted",
          done: requirements.length > 0,
        },
        {
          label: "Bidder evidence uploaded",
          done: bidderDocuments.length > 0,
        },
        {
          label: "AI verification completed",
          done: Boolean(analysis),
        },
        {
          label: "Mandatory gaps resolved",
          done: mandatoryFailed === 0,
        },
      ];

      return (
        <section className="bidifiCommandCenter">
          
<style>{`
  .bidifiCommandCenter{margin:24px 0 28px;padding:22px;border:1px solid rgba(96,165,250,.16);border-radius:24px;background:linear-gradient(145deg,rgba(8,15,32,.96),rgba(15,23,42,.82));box-shadow:0 18px 55px rgba(0,0,0,.18)}
  .bidifiCommandHeader{display:flex;justify-content:space-between;align-items:flex-start;gap:22px;margin-bottom:18px}
  .bidifiCommandEyebrow{font-size:10px;letter-spacing:.14em;color:#60a5fa;font-weight:800}
  .bidifiCommandHeader h2{margin:6px 0 5px;color:#f8fafc;font-size:23px}
  .bidifiCommandHeader p{margin:0;color:#94a3b8;font-size:12px;max-width:700px;line-height:1.6}
  .bidifiCommandActions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
  .bidifiFeatureGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:10px}
  .bidifiFeatureCard{min-width:0;padding:15px;border:1px solid rgba(148,163,184,.12);border-radius:16px;background:rgba(15,23,42,.72)}
  .bidifiFeatureCard>span{display:block;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.08em}
  .bidifiFeatureCard>strong{display:block;color:#f8fafc;font-size:24px;margin:7px 0 4px}
  .bidifiFeatureCard small{display:block;color:#64748b;font-size:10px;line-height:1.45}
  .bidifiFeatureIcon{width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:rgba(37,99,235,.12);color:#60a5fa;margin-bottom:10px}
  .bidifiFeatureTop{display:flex;justify-content:space-between;align-items:center;gap:8px}
  .bidifiFeatureTop>span{display:block;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.08em}
  .bidifiFeatureTop>strong{font-size:19px;color:#f8fafc}
  .bidifiProgress{height:6px;margin:11px 0 9px;border-radius:99px;background:rgba(148,163,184,.12);overflow:hidden}
  .bidifiProgress span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#2563eb,#7c3aed)}
  .bidifiCommandColumns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
  .bidifiCommandPanel{min-width:0;padding:16px;border:1px solid rgba(148,163,184,.12);border-radius:18px;background:rgba(2,6,23,.48)}
  .bidifiPanelTitle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
  .bidifiPanelTitle span:first-child{color:#64748b;font-size:9px;letter-spacing:.1em;text-transform:uppercase}
  .bidifiPanelTitle h3{margin:4px 0 0;color:#e2e8f0;font-size:14px}
  .bidifiRedFlags,.bidifiExplainList{display:flex;flex-direction:column;gap:7px}
  .bidifiRedFlag,.bidifiExplainRow{display:flex;gap:9px;padding:10px;border:1px solid rgba(148,163,184,.09);border-radius:12px;background:rgba(15,23,42,.45)}
  .bidifiFlagDot{width:7px;height:7px;flex:0 0 7px;margin-top:5px;border-radius:50%;background:#f59e0b}
  .bidifiFlagDot.critical{background:#ef4444}
  .bidifiRedFlag strong,.bidifiExplainRow strong{display:block;color:#e2e8f0;font-size:11px}
  .bidifiRedFlag small{display:block;color:#f59e0b;font-size:9px;margin:2px 0 3px}
  .bidifiRedFlag p,.bidifiExplainRow p{margin:0;color:#94a3b8;font-size:10px;line-height:1.45}
  .bidifiExplainRow>div{min-width:0}
  .bidifiExplainRow small{display:block;color:#64748b;font-size:9px;margin-top:4px}
  .statusPill{display:inline-flex;align-items:center;align-self:flex-start;padding:4px 6px;border-radius:7px;background:rgba(148,163,184,.1);color:#cbd5e1;font-size:8px;white-space:nowrap}
  .statusPill.compliant{color:#86efac}.statusPill.missing,.statusPill.non_compliant,.statusPill.mismatch,.statusPill.fail{color:#fca5a5}
  .statusPill.review,.statusPill.human_review{color:#fde68a}
  .bidifiEmptyFeature{padding:18px;color:#64748b;font-size:11px;line-height:1.55;border:1px dashed rgba(148,163,184,.14);border-radius:12px}
  .bidifiComparisonTable{display:flex;flex-direction:column;gap:5px}
  .bidifiComparisonHead,.bidifiComparisonRow{display:grid;grid-template-columns:1.5fr .8fr .7fr .7fr;gap:8px;align-items:center}
  .bidifiComparisonHead{padding:0 8px 6px;color:#64748b;font-size:8px;text-transform:uppercase;letter-spacing:.08em}
  .bidifiComparisonRow{padding:9px 8px;border-radius:10px;background:rgba(15,23,42,.55);color:#cbd5e1;font-size:10px}
  .bidifiComparisonRow strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e2e8f0}
  .bidifiCopilotOrb{width:28px;height:28px;display:grid;place-items:center;border-radius:50%;color:#fff;background:linear-gradient(135deg,#2563eb,#7c3aed)}
  .bidifiCopilotGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
  .bidifiCopilotGrid button{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;border:1px solid rgba(148,163,184,.12);border-radius:10px;background:rgba(15,23,42,.55);color:#cbd5e1;text-align:left;font-size:10px;cursor:pointer}
  .bidifiCopilotGrid button:hover{border-color:rgba(96,165,250,.3);background:rgba(30,41,59,.75)}
  .bidifiChecklist{display:grid;gap:6px;margin-top:12px;padding-top:11px;border-top:1px solid rgba(148,163,184,.09)}
  .bidifiChecklist div{display:flex;align-items:center;gap:7px;color:#94a3b8;font-size:9px}
  .bidifiChecklist div span{width:17px;height:17px;display:grid;place-items:center;border-radius:6px;background:rgba(148,163,184,.08);color:#64748b}
  .bidifiChecklist div span.done{color:#86efac;background:rgba(34,197,94,.1)}
  @media (max-width:900px){.bidifiFeatureGrid{grid-template-columns:1fr 1fr}.bidifiCommandColumns{grid-template-columns:1fr}.bidifiCommandHeader{flex-direction:column}.bidifiCommandActions{justify-content:flex-start}}
  @media (max-width:560px){.bidifiFeatureGrid{grid-template-columns:1fr}.bidifiCopilotGrid{grid-template-columns:1fr}.bidifiCommandCenter{padding:15px}.bidifiCommandHeader h2{font-size:19px}}
`}</style>

          <div className="bidifiCommandHeader">
            <div>
              <span className="bidifiCommandEyebrow">
                HACKATHON DECISION CENTER
              </span>
              <h2>From document upload to bid decision</h2>
              <p>
                One workspace for tender risk, bidder readiness, evidence
                traceability, comparison, and explainable AI decisions.
              </p>
            </div>

            <div className="bidifiCommandActions">
              <button
                className="secondaryButton"
                onClick={() => navigate("Bidder Workspace")}
              >
                <Icon name="file" size={14} />
                Open bidder workspace
              </button>
              <button
                className="primaryButton"
                onClick={() => navigate("AI Verification")}
              >
                <Icon name="verify" size={14} />
                Open AI verification
              </button>
            </div>
          </div>

          <div className="bidifiFeatureGrid">
            <div className="bidifiFeatureCard readinessCard">
              <div className="bidifiFeatureTop">
                <span>Bid Readiness</span>
                <strong>{readiness}/100</strong>
              </div>
              <div className="bidifiProgress">
                <span style={{ width: `${readiness}%` }} />
              </div>
              <small>
                {mandatoryCount
                  ? `${mandatoryFailed} mandatory gap${
                      mandatoryFailed === 1 ? "" : "s"
                    } detected`
                  : "Mandatory rules will be highlighted after extraction"}
              </small>
            </div>

            <div className="bidifiFeatureCard">
              <div className="bidifiFeatureIcon">
                <Icon name="warning" size={16} />
              </div>
              <span>AI Risk / Red Flags</span>
              <strong>{risk}/100</strong>
              <small>
                {redFlags.length
                  ? `${redFlags.length} issue${
                      redFlags.length === 1 ? "" : "s"
                    } need attention`
                  : analysis
                  ? "No red flags detected in the current analysis"
                  : "Run verification to detect red flags"}
              </small>
            </div>

            <div className="bidifiFeatureCard">
              <div className="bidifiFeatureIcon">
                <Icon name="check" size={16} />
              </div>
              <span>Compliance Control</span>
              <strong>{compliance}%</strong>
              <small>
                {compliant} compliant · {missing} missing · {failed} failed ·{" "}
                {review} review
              </small>
            </div>

            <div className="bidifiFeatureCard">
              <div className="bidifiFeatureIcon">
                <Icon name="calendar" size={16} />
              </div>
              <span>Submission Checklist</span>
              <strong>
                {checklist.filter((item) => item.done).length}/
                {checklist.length}
              </strong>
              <small>
                {deadline
                  ? `Deadline: ${safeText(deadline)}`
                  : "Deadline not available in tender data"}
              </small>
            </div>
          </div>

          <div className="bidifiCommandColumns">
            <div className="bidifiCommandPanel">
              <div className="bidifiPanelTitle">
                <div>
                  <span>01 · Tender Risk Detector</span>
                  <h3>What needs attention?</h3>
                </div>
                <span className="countBadge">{redFlags.length}</span>
              </div>

              {redFlags.length ? (
                <div className="bidifiRedFlags">
                  {redFlags.map((flag, index) => (
                    <div className="bidifiRedFlag" key={`${flag.title}-${index}`}>
                      <span className={`bidifiFlagDot ${flag.type === "Critical" ? "critical" : ""}`} />
                      <div>
                        <strong>{flag.title}</strong>
                        <small>{flag.type}</small>
                        <p>{flag.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bidifiEmptyFeature">
                  {analysis
                    ? "No requirement-level red flags are present in this analysis."
                    : "Upload bidder evidence and run AI verification to activate red-flag detection."}
                </div>
              )}
            </div>

            <div className="bidifiCommandPanel">
              <div className="bidifiPanelTitle">
                <div>
                  <span>02 · Explainable AI</span>
                  <h3>Why did BIDIFI decide this?</h3>
                </div>
                <button
                  className="textButton"
                  onClick={() => navigate("AI Verification")}
                >
                  View all
                </button>
              </div>

              {explainItems.length ? (
                <div className="bidifiExplainList">
                  {explainItems.map((item, index) => {
                    const status = statusOf(item);
                    const evidence =
                      item.bidderEvidence?.text ||
                      item.evidence ||
                      item.bidderResponse ||
                      "No evidence text available.";

                    return (
                      <div className="bidifiExplainRow" key={index}>
                        <span className={`statusPill ${status.toLowerCase()}`}>
                          {status.replaceAll("_", " ")}
                        </span>
                        <div>
                          <strong>{getRequirementTitle(item, index)}</strong>
                          <p>
                            <b>Evidence:</b>{" "}
                            {safeText(evidence).slice(0, 220)}
                            {safeText(evidence).length > 220 ? "…" : ""}
                          </p>
                          <small>
                            Confidence:{" "}
                            {safeText(
                              item.confidence ??
                                item.matchConfidence ??
                                item.score,
                              "Not supplied"
                            )}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bidifiEmptyFeature">
                  Verification evidence and AI reasoning will appear here.
                </div>
              )}
            </div>
          </div>

          <div className="bidifiCommandColumns">
            <div className="bidifiCommandPanel">
              <div className="bidifiPanelTitle">
                <div>
                  <span>03 · Bidder Comparison</span>
                  <h3>Side-by-side compliance view</h3>
                </div>
                <span className="countBadge">{comparisonRows.length}</span>
              </div>

              {comparisonRows.length > 0 ? (
                <div className="bidifiComparisonTable">
                  <div className="bidifiComparisonHead">
                    <span>Bidder</span>
                    <span>Compliance</span>
                    <span>Risk</span>
                    <span>Documents</span>
                  </div>
                  {comparisonRows.map((row, index) => (
                    <div className="bidifiComparisonRow" key={row.bidderId || index}>
                      <strong>{row.bidderName || "Unnamed Bidder"}</strong>
                      <span>
                        {clamp(
                          getAnalysisCompliance(
                            row.analysis,
                            0
                          )
                        )}%
                      </span>
                      <span>
                        {clamp(
                          getAnalysisRisk(
                            row.analysis,
                            100 -
                              getAnalysisCompliance(
                                row.analysis,
                                0
                              )
                          )
                        )}
                        /100
                      </span>
                      <span>{row.documentCount || 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bidifiEmptyFeature">
                  Add multiple bidders in the bidder workspace to generate a
                  live comparison matrix.
                </div>
              )}
            </div>

            <div className="bidifiCommandPanel">
              <div className="bidifiPanelTitle">
                <div>
                  <span>04 · Procurement Copilot</span>
                  <h3>Ask the workspace</h3>
                </div>
                <div className="bidifiCopilotOrb">
                  <BidifiLogoIcon size={16} />
                </div>
              </div>

              <div className="bidifiCopilotGrid">
                {[
                  "Explain the current risk",
                  "Show missing evidence",
                  "Check mandatory requirements",
                  "Prepare an audit summary",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => navigate("AI Verification")}
                  >
                    <span>{prompt}</span>
                    <Icon name="arrow" size={12} />
                  </button>
                ))}
              </div>

              <div className="bidifiChecklist">
                {checklist.map((item) => (
                  <div key={item.label}>
                    <span className={item.done ? "done" : ""}>
                      <Icon name={item.done ? "check" : "minus"} size={11} />
                    </span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      );
    }

    function DashboardPage({
      tenders,
      selectedTender,
      requirements,
      bidderDocumentCount,
      analysis,
      navigate,
      batchResults = [],
      bidderDocuments = [],
      isHome = false,
    }) {
      const risk = calculateRisk(analysis);

      return (
        <div className={isHome ? "dashboardHomePage" : "dashboardPage"}>
          {isHome ? (
            <BidifiHomeAnimationSection className="bidifiHomeAnimationSection--intro">
              <BidifiHomeIntro
                eyebrow="AI PROCUREMENT WORKSPACE"
                title="Good to see you."
                description="Review tenders, validate bidder evidence, and turn complex procurement documents into clear decisions."
              />
            </BidifiHomeAnimationSection>
          ) : (
            <PageHeader
              eyebrow="AI PROCUREMENT WORKSPACE"
              title="Good to see you."
              description="Review tenders, validate bidder evidence, and turn complex procurement documents into clear decisions."
            />
          )}

          {isHome ? (
            <BidifiHomeAnimationSection className="bidifiHomeAnimationSection--hero">
              <BidifiCylinderHero navigate={navigate} />
            </BidifiHomeAnimationSection>
          ) : null}

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
                <BidifiLogoIcon size={17} />
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

          {isHome ? <BidifiContactSection /> : null}

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
                    <BidifiLogoIcon size={15} />
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

          {/* Feature showcase — added at the bottom of the home page */}
          <BidifiShowcaseCarousel />
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
                  <BidifiLogoIcon size={13} />
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
                    <BidifiLogoIcon size={14} />
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
                  <BidifiLogoIcon size={17} />

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
                        <BidifiLogoIcon size={14} />
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
                    <BidifiLogoIcon size={14} />
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
                  <BidifiLogoIcon size={14} />
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
                  <BidifiLogoIcon size={12} />
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
                <BidifiLogoIcon size={18} />
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
       BIDIFI AI CHAT — FIXED BOTTOM ASSISTANT
       ========================================================= */
    const BIDIFI_CHAT_KB = [
      [["what is bidifi", "bidifi kya hai", "bidifi kya"], "BIDIFI is an AI-assisted tender and bidder verification platform. It extracts tender requirements, checks bidder documents against those requirements, and presents requirement-level results as Compliant, Non-Compliant, Missing, or review."],
      [["how does bidifi work", "how bidifi works", "bidifi kaise work", "bidifi kaise"], "BIDIFI works in stages: upload the tender, extract requirements, upload bidder documents, match requirements with bidder evidence, classify every requirement, and show compliance and risk results."],
      [["compliance percentage", "compliance percent", "compliant percentage", "compliance score"], "Compliance percentage represents the verified level of tender requirements satisfied by the bidder evidence. BIDIFI uses the analysis result rather than a hardcoded value."],
      [["risk score", "risk kaise", "risk calculate", "risk"], "BIDIFI shows a 0–100 risk score. Higher values indicate more verification risk. Missing evidence, mismatches, non-compliance, failed checks and critical findings can increase the risk."],
      [["compliant", "compliant kya"], "Compliant means the available bidder evidence sufficiently matches the applicable tender requirement."],
      [["non compliant", "non-compliant", "noncompliant", "failed"], "Non-Compliant or Failed means the verified bidder evidence does not satisfy the applicable tender requirement."],
      [["missing", "missing evidence", "evidence gap"], "Missing means BIDIFI could not find sufficient bidder evidence for that requirement. Supporting documentation or human review may be needed."],
      [["tender upload", "tender", "requirements"], "Tender Upload is used to add tender documents. BIDIFI extracts the procurement requirements so they can be checked against bidder evidence."],
      [["bidder analysis", "bidder", "bidder documents"], "Bidder Analysis compares bidder documents with the extracted tender requirements and shows requirement-level verification, evidence and risk information."],
      [["ai verification", "verification"], "AI Verification is the requirement-by-requirement checking stage where BIDIFI connects tender requirements with available bidder evidence and surfaces the verification status."],
      [["reports", "report", "pdf"], "Reports turn the verified BIDIFI analysis into a clear procurement result containing compliance, risk, findings and evidence where available."],
      [["contact", "contact us", "email", "phone", "gmail", "support"], "You can contact BIDIFI at krishhthakur99@gmail.com or call 9140145642."]
    ];

    function bidifiChatAnswer(question) {
      const q = String(question || "").toLowerCase().replace(/\s+/g, " ").trim();
      if (!q) return "Ask me about BIDIFI, for example: How does BIDIFI work? What is the risk score? What does Missing mean?";
      for (const [keys, answer] of BIDIFI_CHAT_KB) {
        if (keys.some((key) => q.includes(key))) return answer;
      }
      return "I can explain BIDIFI's tender upload, requirement extraction, bidder document matching, Compliant / Non-Compliant / Missing results, compliance percentage, risk score, AI Verification, reports and contact details.";
    }

    function BidifiAIChat() {
      const [open, setOpen] = useState(false);
      const [input, setInput] = useState("");
      const [messages, setMessages] = useState([
        {
          role: "assistant",
          text: "Hi! I'm BIDIFI AI. Ask me how BIDIFI works or anything about the BIDIFI workflow."
        }
      ]);

      const send = (text = input) => {
        const q = String(text || "").trim();
        if (!q) return;
        setMessages((m) => [
          ...m,
          { role: "user", text: q },
          { role: "assistant", text: bidifiChatAnswer(q) }
        ]);
        setInput("");
      };

      const quick = [
        "How does BIDIFI work?",
        "What is risk score?",
        "What does Missing mean?",
        "Contact details"
      ];

      return (
        <>
          <style>{`\
            .bidifi-ai-chat{position:fixed;right:28px;bottom:154px;z-index:99990;width:min(380px,calc(100vw - 24px));max-height:calc(100vh - 174px);font-family:inherit;color:#e2e8f0;pointer-events:none}\
            .bidifi-ai-panel{width:100%;max-height:calc(100vh - 174px);overflow:hidden;pointer-events:auto;border:1px solid rgba(96,165,250,.28);border-radius:22px;background:linear-gradient(145deg,rgba(3,10,25,.985),rgba(15,23,42,.985));box-shadow:0 24px 70px rgba(0,0,0,.48),0 0 30px rgba(37,99,235,.13);backdrop-filter:blur(18px);animation:bidifiChatIn .18s ease-out}\
            .bidifi-ai-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;cursor:default;border-bottom:1px solid rgba(148,163,184,.14);background:linear-gradient(90deg,rgba(37,99,235,.2),rgba(124,58,237,.13))}\
            .bidifi-ai-title{display:flex;align-items:center;gap:10px;min-width:0}.bidifi-ai-orb{width:37px;height:37px;display:grid;place-items:center;flex:0 0 37px;border-radius:50%;color:#fff;background:linear-gradient(135deg,#2563eb,#7c3aed);box-shadow:0 7px 20px rgba(37,99,235,.25)}\
            .bidifi-ai-title strong{display:block;color:#fff;font-size:12px;line-height:1.2;letter-spacing:.08em}.bidifi-ai-title small{display:block;color:#94a3b8;font-size:9px;margin-top:3px}\
            .bidifi-ai-close{width:31px;height:31px;display:grid;place-items:center;flex:0 0 31px;border:1px solid rgba(148,163,184,.18);border-radius:9px;color:#cbd5e1;background:rgba(15,23,42,.6);cursor:pointer}.bidifi-ai-close:hover{background:rgba(51,65,85,.75)}\
            .bidifi-ai-msgs{height:min(330px,38vh);min-height:180px;overflow:auto;display:flex;flex-direction:column;gap:9px;padding:13px;user-select:text;scroll-behavior:smooth}.bidifi-ai-msg{max-width:89%;padding:10px 12px;border-radius:14px;font-size:11px;line-height:1.55;white-space:pre-wrap;word-break:break-word}.bidifi-ai-msg.a{align-self:flex-start;background:rgba(30,41,59,.82);border:1px solid rgba(125,211,252,.12);border-top-left-radius:5px;color:#dbeafe}.bidifi-ai-msg.u{align-self:flex-end;background:linear-gradient(135deg,#2563eb,#4f46e5);border-top-right-radius:5px;color:#fff}\
            .bidifi-ai-quick{display:flex;gap:7px;padding:0 13px 10px;overflow-x:auto;scrollbar-width:none}.bidifi-ai-quick::-webkit-scrollbar{display:none}.bidifi-ai-quick button{flex:0 0 auto;padding:7px 9px;border:1px solid rgba(125,211,252,.16);border-radius:999px;color:#bfdbfe;background:rgba(15,23,42,.72);font-size:8px;cursor:pointer;white-space:nowrap}.bidifi-ai-quick button:hover{background:rgba(30,64,175,.32)}\
            .bidifi-ai-input{display:flex;gap:8px;padding:10px 13px;border-top:1px solid rgba(148,163,184,.11)}.bidifi-ai-input input{min-width:0;flex:1;border:1px solid rgba(125,211,252,.16);outline:none;border-radius:11px;padding:10px 11px;color:#e2e8f0;background:rgba(2,6,23,.72);font-size:10px}.bidifi-ai-input input:focus{border-color:rgba(96,165,250,.5);box-shadow:0 0 0 3px rgba(37,99,235,.08)}.bidifi-ai-input button{width:36px;height:36px;display:grid;place-items:center;flex:0 0 36px;border:0;border-radius:10px;color:#fff;background:linear-gradient(135deg,#2563eb,#7c3aed);cursor:pointer}.bidifi-ai-input button:hover{filter:brightness(1.08)}\
            .bidifi-ai-hint{padding:0 13px 10px;color:#64748b;font-size:8px;text-align:center}.bidifi-ai-launch-wrap{pointer-events:auto;position:fixed;right:28px;bottom:72px;z-index:99991;display:flex;flex-direction:column;align-items:center;gap:6px}.bidifi-ai-launch{width:62px;height:62px;padding:0;display:grid;place-items:center;border:1px solid rgba(96,165,250,.38);border-radius:50%;background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(30,41,59,.98));box-shadow:0 14px 34px rgba(0,0,0,.34),0 0 22px rgba(37,99,235,.18);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}.bidifi-ai-launch:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 18px 38px rgba(0,0,0,.4),0 0 28px rgba(37,99,235,.25)}.bidifi-ai-launch-orb{width:46px;height:46px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed)}.bidifi-ai-launch-label{font-size:10px;line-height:1;font-weight:800;letter-spacing:.08em;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.4)}\
            @keyframes bidifiChatIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}\
            @media(max-width:700px){.bidifi-ai-chat{right:12px;bottom:136px;width:calc(100vw - 24px);max-height:calc(100vh - 152px)}.bidifi-ai-panel{border-radius:19px;max-height:calc(100vh - 152px)}.bidifi-ai-msgs{height:min(310px,38vh);min-height:165px}.bidifi-ai-launch-wrap{right:16px;bottom:54px}.bidifi-ai-launch{width:58px;height:58px}.bidifi-ai-launch-orb{width:43px;height:43px}.bidifi-ai-launch-label{font-size:9px}}\
          `}</style>

          {open && (
            <div className="bidifi-ai-chat">
              <aside className="bidifi-ai-panel" aria-label="BIDIFI AI chat">
                <div className="bidifi-ai-head">
                  <div className="bidifi-ai-title">
                    <span className="bidifi-ai-orb">
                      <BidifiLogoIcon size={22} strokeWidth={2.7} />
                    </span>
                    <span>
                      <strong>Bidifi AI</strong>
                      <small>Ask about BIDIFI</small>
                    </span>
                  </div>
                  <button
                    className="bidifi-ai-close"
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close Bidifi AI"
                  >
                    <Icon name="close" size={15} />
                  </button>
                </div>

                <div className="bidifi-ai-msgs">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`bidifi-ai-msg ${m.role === "user" ? "u" : "a"}`}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>

                <div className="bidifi-ai-quick">
                  {quick.map((q) => (
                    <button key={q} type="button" onClick={() => send(q)}>
                      {q}
                    </button>
                  ))}
                </div>

                <div className="bidifi-ai-input">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Ask about BIDIFI..."
                    aria-label="Ask Bidifi AI"
                  />
                  <button type="button" onClick={() => send()} aria-label="Send message">
                    <Icon name="arrow" size={15} />
                  </button>
                </div>
                <div className="bidifi-ai-hint">Bidifi AI • Your BIDIFI workflow assistant</div>
              </aside>
            </div>
          )}

          {!open && (
            <div className="bidifi-ai-launch-wrap">
              <button
                className="bidifi-ai-launch"
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open Bidifi AI"
              >
                <span className="bidifi-ai-launch-orb">
                  <BidifiLogoIcon size={25} strokeWidth={2.7} />
                </span>
              </button>
              <span className="bidifi-ai-launch-label">Bidifi AI</span>
            </div>
          )}
        </>
      );
    }

    /* =========================================================
       CONTACT US — FLIP EMAIL + PHONE BUTTONS
       ========================================================= */
    function BidifiContactSection() {
      const Flip = ({ icon, label, value, href }) => (
        <a href={href} className="bidifi-contact-card" aria-label={`${label}: ${value}`}>
          <span className="bidifi-contact-inner">
            <span className="bidifi-contact-face bidifi-contact-front">{icon}</span>
            <span className="bidifi-contact-face bidifi-contact-back"><b>{label}</b><small>{value}</small></span>
          </span>
        </a>
      );
      return (
        <section className="bidifi-contact-section">
          <style>{`\
            .bidifi-contact-section{position:relative;width:100%;box-sizing:border-box;margin:26px 0 30px;padding:26px 30px;overflow:hidden;border-radius:24px;border:1px solid rgba(255,255,255,.10);background:transparent;box-shadow:none;text-align:left}\
            .bidifi-contact-section:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(96,165,250,.05),transparent)}\
            .bidifi-contact-layout{position:relative;display:flex;align-items:center;justify-content:space-between;gap:34px}.bidifi-contact-copy{flex:1;min-width:0}.bidifi-contact-actions{flex:0 0 auto;display:flex;justify-content:flex-end;align-items:center}.bidifi-contact-kicker{position:relative;color:#60a5fa;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.bidifi-contact-section h2{position:relative;margin:4px 0 9px;color:#fff;font-size:clamp(24px,3vw,36px);line-height:1.1;font-weight:900}.bidifi-contact-section p{position:relative;max-width:650px;margin:0 0 18px;color:rgba(255,255,255,.92);font-size:12px;line-height:1.7}\
            .bidifi-contact-track{position:relative;display:flex;justify-content:flex-end;gap:12px;width:max-content;max-width:100%;margin:0 0 0 auto;padding:9px;border:1px solid rgba(148,163,184,.18);border-radius:20px;background:rgba(255,255,255,.045);box-shadow:none;backdrop-filter:none}.bidifi-contact-card{width:150px;height:64px;display:block;text-decoration:none;color:inherit;perspective:1000px}.bidifi-contact-inner{position:relative;display:block;width:100%;height:100%;transform-style:preserve-3d;transition:transform .72s cubic-bezier(.2,.8,.2,1)}.bidifi-contact-card:hover .bidifi-contact-inner,.bidifi-contact-card:focus-visible .bidifi-contact-inner{transform:rotateY(180deg)}.bidifi-contact-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:15px;border:1px solid rgba(125,211,252,.22);backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}.bidifi-contact-front{color:#67e8f9;background:radial-gradient(circle at 50% 0%,rgba(34,211,238,.14),transparent 60%),rgba(15,23,42,.94)}.bidifi-contact-back{transform:rotateY(180deg);flex-direction:column;gap:4px;padding:7px;color:#fff;background:linear-gradient(135deg,#0891b2,#6366f1 58%,#a855f7)}.bidifi-contact-back b{font-size:9px;letter-spacing:.12em;text-transform:uppercase}.bidifi-contact-back small{max-width:100%;font-size:8px;line-height:1.2;text-align:center;word-break:break-all}\
            @media(max-width:700px){.bidifi-contact-layout{flex-direction:column;align-items:stretch;gap:18px}.bidifi-contact-actions{justify-content:flex-start}.bidifi-contact-track{width:100%;gap:8px}.bidifi-contact-card{width:calc(50vw - 28px);min-width:125px;max-width:150px;height:58px}}\
          `}</style>
          <div className="bidifi-contact-layout">
            <div className="bidifi-contact-copy">
              <span className="bidifi-contact-kicker">Contact Us</span>
              <h2>Need help with BIDIFI?</h2>
              <p>Hover over the email or phone icon to reveal the contact details. Click an option to email or call directly.</p>
            </div>
            <div className="bidifi-contact-actions">
              <div className="bidifi-contact-track">
            <Flip href="mailto:krishhthakur99@gmail.com" label="Email" value="krishhthakur99@gmail.com" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>} />
            <Flip href="tel:9140145642" label="Contact" value="9140145642" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 3.5h3l1.5 4-2 1.5a15 15 0 0 0 6 6l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C10.5 19.5 4.5 13.5 4.5 6c0-1.4.9-2.5 2-2.5Z"/></svg>} />
              </div>
            </div>
          </div>
        </section>
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
                  batchResults={batchResults}
                  bidderDocuments={bidderDocuments}
                />
              );

            case "Bid Readiness":
              return (
                <BidifiHackathonCommandCenter
                  analysis={analysis}
                  requirements={requirements}
                  selectedTender={selectedTender}
                  bidderDocuments={bidderDocuments}
                  batchResults={batchResults}
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
                  batchResults={batchResults}
                  bidderDocuments={bidderDocuments}
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
            .accountTopButton{display:flex;align-items:center;gap:6px;border:1px solid var(--border,#dbe3ef);background:var(--panel,#fff);color:inherit;border-radius:8px;padding:5px 9px;height:34px;font-size:12.5px;font-weight:650;cursor:pointer;max-width:200px;transition:transform .15s ease,box-shadow .15s ease;}
            .accountTopButton:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(15,23,42,.08);}
            .accountTopAvatar{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#5b6cff,#8d5cff);color:#fff;font-size:9.5px;flex:0 0 20px;}
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

            .bidifiCylinderHero{
              position:relative;
              min-height:690px;
              margin:4px 0 28px;
              padding:52px 42px 28px;
              box-sizing:border-box;
              overflow:hidden;
              border-radius:28px;
              color:#fff;
              background:
                radial-gradient(circle at 76% 48%,rgba(59,130,246,.22),transparent 27%),
                radial-gradient(circle at 20% 20%,rgba(99,102,241,.14),transparent 30%),
                linear-gradient(135deg,#07111f 0%,#0b1730 52%,#101b3b 100%);
              box-shadow:0 26px 80px rgba(15,23,42,.18);
              isolation:isolate;
              display:grid;
              grid-template-columns:minmax(0,1.02fr) minmax(430px,.98fr);
              grid-template-rows:1fr auto;
              gap:10px 20px;
            }
            .bidifiCylinderHeroGlow{position:absolute;border-radius:999px;filter:blur(18px);pointer-events:none;z-index:-1;}
            .bidifiCylinderHeroGlow.glowOne{width:300px;height:300px;right:20%;top:12%;background:rgba(37,99,235,.16);}
            .bidifiCylinderHeroGlow.glowTwo{width:230px;height:230px;left:10%;bottom:8%;background:rgba(124,58,237,.12);}
            .bidifiCylinderHeroContent{
              align-self:center;
              max-width:680px;
              padding:34px 0 36px 10px;
              z-index:3;
            }
            .bidifiHeroBadge{
              display:inline-flex;align-items:center;gap:8px;
              padding:7px 11px;border:1px solid rgba(147,197,253,.22);
              border-radius:999px;background:rgba(255,255,255,.055);
              color:#bfdbfe;font-size:10px;font-weight:800;letter-spacing:.16em;
              backdrop-filter:blur(10px);
            }
            .bidifiHeroBadgeDot{width:7px;height:7px;border-radius:50%;background:#60a5fa;box-shadow:0 0 14px #60a5fa;animation:bidifiPulse 2s ease-in-out infinite;}
            .bidifiCylinderHero h1{
              margin:20px 0 0;
              max-width:650px;
              font-size:clamp(42px,5vw,70px);
              line-height:1.02;
              letter-spacing:-.055em;
              font-weight:800;
              color:#f8fafc;
            }
            .bidifiCylinderHero h1 span{display:block;color:#93c5fd;}
            .bidifiCylinderHeroContent>p{
              max-width:625px;
              margin:22px 0 0;
              color:rgba(226,232,240,.78);
              font-size:clamp(14px,1.25vw,17px);
              line-height:1.72;
            }
            .bidifiCylinderHeroActions{display:flex;flex-wrap:wrap;gap:11px;margin-top:27px;}
            .bidifiPrimaryHeroBtn,.bidifiSecondaryHeroBtn{
              min-height:44px;border-radius:11px;padding:0 16px;
              display:inline-flex;align-items:center;justify-content:center;gap:8px;
              font:700 13px/1 system-ui,sans-serif;cursor:pointer;
              transition:transform .18s ease,box-shadow .18s ease,background .18s ease;
            }
            .bidifiPrimaryHeroBtn{border:1px solid rgba(147,197,253,.5);color:#fff;background:linear-gradient(135deg,#2563eb,#4f46e5);box-shadow:0 12px 30px rgba(37,99,235,.24);}
            .bidifiSecondaryHeroBtn{border:1px solid rgba(255,255,255,.16);color:#e2e8f0;background:rgba(255,255,255,.065);}
            .bidifiPrimaryHeroBtn:hover,.bidifiSecondaryHeroBtn:hover{transform:translateY(-2px);}
            .bidifiPrimaryHeroBtn:active,.bidifiSecondaryHeroBtn:active{transform:scale(.98);}
            .bidifiHeroTrustRow{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:26px;color:rgba(203,213,225,.68);font-size:10.5px;font-weight:650;}
            .bidifiHeroTrustRow span{display:inline-flex;align-items:center;gap:5px;}
            .bidifiHeroTrustRow svg{color:#60a5fa;}
            .bidifiAgentWave{
              position:relative;
              width:100%;
              min-height:560px;
              height:100%;
              overflow:hidden;
              border-radius:28px;
              background:
                radial-gradient(circle at 50% 50%,rgba(37,99,235,.10),transparent 32%),
                linear-gradient(180deg,rgba(2,6,23,.10),rgba(2,6,23,.52));
              border:1px solid rgba(147,197,253,.08);
              box-shadow:inset 0 0 70px rgba(30,64,175,.05);
              isolation:isolate;
            }

            .bidifiAgentWave canvas{
              position:absolute;
              inset:0;
              width:100%;
              height:100%;
              display:block;
            }

            .bidifiAgentWave::before{
              content:"";
              position:absolute;
              inset:0;
              z-index:1;
              pointer-events:none;
              background:
                linear-gradient(90deg,rgba(2,6,23,.62),transparent 20%,transparent 80%,rgba(2,6,23,.62)),
                linear-gradient(180deg,rgba(2,6,23,.38),transparent 25%,transparent 76%,rgba(2,6,23,.58));
            }

            .bidifiAgentWaveCore{
              position:absolute;
              left:50%;
              top:50%;
              z-index:4;
              width:116px;
              height:116px;
              transform:translate(-50%,-50%);
              display:grid;
              place-items:center;
              border-radius:50%;
              border:1px solid rgba(191,219,254,.35);
              background:radial-gradient(circle at 38% 32%,rgba(255,255,255,.96),rgba(96,165,250,.25) 28%,rgba(15,23,42,.64) 72%);
              box-shadow:0 0 45px rgba(59,130,246,.28),inset 0 0 28px rgba(255,255,255,.13);
              backdrop-filter:blur(7px);
              animation:bidifiWaveCorePulse 2.8s ease-in-out infinite;
            }

            .bidifiAgentWaveCoreText{
              color:#eff6ff;
              font-size:15px;
              line-height:1;
              font-weight:950;
              letter-spacing:.08em;
              text-shadow:0 0 18px rgba(191,219,254,.75);
            }

            .bidifiAgentWaveCore span{
              margin-top:-30px;
              color:#93c5fd;
              font-size:7px;
              font-weight:900;
              letter-spacing:.22em;
            }

            .bidifiAgentWaveLabel{
              position:absolute;
              z-index:5;
              display:grid;
              gap:3px;
              min-width:110px;
              padding:9px 11px;
              border:1px solid rgba(147,197,253,.15);
              border-radius:11px;
              background:rgba(3,10,24,.68);
              backdrop-filter:blur(12px);
              box-shadow:0 12px 28px rgba(0,0,0,.25);
              animation:bidifiWaveFloat 4.8s ease-in-out infinite;
            }

            .bidifiAgentWaveLabel b{
              color:#dbeafe;
              font-size:9px;
              font-weight:900;
              letter-spacing:.12em;
            }

            .bidifiAgentWaveLabel span{
              color:#64748b;
              font-size:7px;
            }

            .bidifiAgentWaveLabel::before{
              content:"";
              position:absolute;
              width:6px;
              height:6px;
              border-radius:50%;
              background:#60a5fa;
              box-shadow:0 0 13px rgba(96,165,250,.9);
            }

            .labelTender{left:6%;top:22%;}
            .labelTender::before{right:-3px;top:50%;transform:translate(50%,-50%);}
            .labelEvidence{right:5%;top:28%;animation-delay:-1.4s;}
            .labelEvidence::before{left:-3px;top:50%;transform:translate(-50%,-50%);}
            .labelReport{right:10%;bottom:17%;animation-delay:-2.6s;}
            .labelReport::before{left:-3px;top:50%;transform:translate(-50%,-50%);}

            .bidifiAgentWaveBadge{
              position:absolute;
              z-index:6;
              top:7%;
              right:8%;
              width:82px;
              height:82px;
              display:grid;
              place-items:center;
              text-align:center;
              border-radius:50%;
              background:linear-gradient(145deg,#2563eb,#7c3aed);
              border:1px solid rgba(255,255,255,.18);
              box-shadow:0 0 34px rgba(59,130,246,.28);
              animation:bidifiWaveBadge 3.8s ease-in-out infinite;
            }

            .bidifiAgentWaveBadge strong{
              display:block;
              color:#fff;
              font-size:14px;
              line-height:1;
              letter-spacing:.04em;
            }

            .bidifiAgentWaveBadge span{
              display:block;
              margin-top:-22px;
              color:#dbeafe;
              font-size:6px;
              line-height:1.25;
              font-weight:900;
              letter-spacing:.1em;
            }

            @keyframes bidifiWaveCorePulse{
              0%,100%{transform:translate(-50%,-50%) scale(.97);box-shadow:0 0 38px rgba(59,130,246,.25),inset 0 0 28px rgba(255,255,255,.11);}
              50%{transform:translate(-50%,-50%) scale(1.045);box-shadow:0 0 62px rgba(59,130,246,.40),inset 0 0 34px rgba(255,255,255,.16);}
            }

            @keyframes bidifiWaveFloat{
              0%,100%{transform:translateY(0);}
              50%{transform:translateY(-7px);}
            }

            @keyframes bidifiWaveBadge{
              0%,100%{transform:rotate(-3deg) scale(.98);}
              50%{transform:rotate(4deg) scale(1.04);}
            }

            .bidifiCylinderHeroVisual{
              position:relative;
              min-width:0;
              min-height:560px;
              display:flex;
              flex-direction:column;
              align-items:center;
              justify-content:center;
              z-index:2;
            }
            .bidifiCylinderKicker{
              position:absolute;top:4px;left:50%;
              transform:translateX(-50%);
              z-index:4;
              display:inline-flex;align-items:center;gap:7px;
              padding:7px 13px;border-radius:999px;
              border:1px solid rgba(147,197,253,.3);
              background:rgba(8,15,32,.6);
              backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);
              color:#bfdbfe;font-size:10px;font-weight:800;letter-spacing:.09em;
              white-space:nowrap;
              box-shadow:0 10px 26px rgba(2,6,23,.35);
            }
            .bidifiCylinderKickerDot{
              width:6px;height:6px;border-radius:50%;
              background:#60a5fa;box-shadow:0 0 12px #60a5fa;
              animation:bidifiPulse 2s ease-in-out infinite;
            }
            .bidifiCylinderCaption{
              position:absolute;bottom:2px;right:10px;
              display:grid;gap:4px;text-align:right;
              padding:9px 12px;border:1px solid rgba(255,255,255,.09);
              border-radius:11px;background:rgba(2,6,23,.38);backdrop-filter:blur(10px);
            }
            .bidifiCylinderCaption strong{font-size:11px;color:#e2e8f0;}
            .bidifiCylinderCaption span{font-size:9px;color:#94a3b8;}
            .bidifiCylinderHeroFooter{
              grid-column:1/-1;
              display:grid;
              grid-template-columns:repeat(6,minmax(0,1fr));
              border-top:1px solid rgba(255,255,255,.09);
              padding-top:17px;
              gap:10px;
            }
            .bidifiCylinderHeroFooter div{display:grid;gap:4px;min-width:0;}
            .bidifiCylinderHeroFooter span{font-size:9px;color:#60a5fa;font-weight:800;letter-spacing:.08em;}
            .bidifiCylinderHeroFooter strong{font-size:10px;color:rgba(226,232,240,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
            @keyframes bidifiPulse{0%,100%{opacity:.55;transform:scale(.9)}50%{opacity:1;transform:scale(1.15)}}

            /* ===== Hero entrance-motion system ===== */
            .bidifiHeadlineLine{display:block;overflow:hidden;padding:.06em .12em .14em;}
            .bidifiHeroAccent{color:#93c5fd;}
            .bidifiAppear{
              display:inline-block;
              opacity:1;
              animation-duration:1.05s;
              animation-fill-mode:both;
              animation-timing-function:cubic-bezier(.16,1,.3,1);
              animation-delay:var(--d,.08s);
            }
            .bidifiHeroBadge.bidifiAppear,
            .bidifiCylinderKicker.bidifiAppear,
            .bidifiCylinderHeroActions .bidifiAppear,
            .bidifiCylinderHeroFooter .bidifiAppear{display:inline-flex;}
            .bidifiCylinderHeroContent>p.bidifiAppear,
            .bidifiHeroTrustRow.bidifiAppear,
            .bidifiCylinderCaption.bidifiAppear{display:block;}
            .bidifiAppear.bidifiIsIn{
              animation:none!important;
              opacity:1!important;
              transform:none!important;
              filter:none!important;
            }
            .bidifiAppear--scale{animation-name:bidifiInScale;}
            .bidifiAppear--soft{animation-name:bidifiInSoft;}
            .bidifiAppear--mask{animation-name:bidifiInMask;}
            .bidifiAppear--pop{animation-name:bidifiInPop;}
            .bidifiAppear--btn{animation-name:bidifiInBtn;}
            .bidifiAppear--side{animation-name:bidifiInSide;}
            .bidifiAppear--stat{animation-name:bidifiInStat;}

            @keyframes bidifiInScale{from{opacity:0;transform:scale(.84);}to{opacity:1;transform:scale(1);}}
            @keyframes bidifiInSoft{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
            @keyframes bidifiInMask{from{opacity:0;transform:translateY(55%);}to{opacity:1;transform:translateY(0);}}
            @keyframes bidifiInPop{0%{opacity:0;transform:scale(.9);}70%{opacity:1;transform:scale(1.03);}100%{opacity:1;transform:scale(1);}}
            @keyframes bidifiInBtn{from{opacity:0;transform:translateY(18px) scale(.94);}to{opacity:1;transform:translateY(0) scale(1);}}
            @keyframes bidifiInSide{from{opacity:0;transform:translateX(22px);}to{opacity:1;transform:translateX(0);}}
            @keyframes bidifiInStat{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}

            @media(prefers-reduced-motion:reduce){
              .bidifiCylinderTrack3d,.bidifiHeroBadgeDot,.bidifiCylinderKickerDot,.bidifiAppear{
                animation:none!important;
              }
              .bidifiAppear{opacity:1!important;transform:none!important;filter:none!important;}
            }
            @media(max-width:1100px){
              .bidifiCylinderHero{grid-template-columns:minmax(0,1fr) minmax(360px,.85fr);padding-left:30px;padding-right:30px;}
              .bidifiCylinderHero h1{font-size:clamp(40px,5.5vw,60px);}
              .bidifiAgentWave{min-height:500px;}
              .bidifiCylinderHeroVisual{min-height:500px;}
              .bidifiCylinderHeroFooter{grid-template-columns:repeat(3,minmax(0,1fr));}
            }
            @media(max-width:820px){
              .bidifiCylinderHero{
                grid-template-columns:1fr;
                grid-template-rows:auto auto auto;
                min-height:auto;
                padding:34px 20px 22px;
              }
              .bidifiCylinderHeroContent{padding:10px 0 0;text-align:center;max-width:none;}
              .bidifiCylinderHeroContent>p{margin-left:auto;margin-right:auto;}
              .bidifiCylinderHeroActions,.bidifiHeroTrustRow{justify-content:center;}
              .bidifiCylinderHeroVisual{min-height:500px;}
              .bidifiCylinderKicker{right:0;}
              .bidifiAgentWave{min-height:500px;}
              .bidifiCylinderHeroFooter{grid-row:auto;grid-template-columns:repeat(2,minmax(0,1fr));}
            }
            @media(max-width:520px){
              .bidifiCylinderHero{border-radius:20px;padding:28px 15px 18px;}
              .bidifiCylinderHero h1{font-size:clamp(36px,11vw,48px);}
              .bidifiCylinderHeroContent>p{font-size:13px;line-height:1.65;}
              .bidifiCylinderHeroVisual{min-height:410px;}
              .bidifiCylinder{height:410px;min-height:410px;}
              .bidifiCylinderTrack{transform:none;}
              .bidifiCylinderCaption{right:0;bottom:0;}
              .bidifiHeroTrustRow{font-size:9.5px;}
              .bidifiHeroTrustRow span:nth-child(3){display:none;}
              .bidifiCylinderHeroFooter{gap:9px 14px;}
              .bidifiCylinderHeroFooter strong{font-size:9px;}
              .bidifiPrimaryHeroBtn,.bidifiSecondaryHeroBtn{width:100%;}
            }


            /* ===== NON-HOME WORKSPACE BLUE SURFACE =====
               Home keeps its original visual treatment. Every other workspace
               page gets the same deep-blue visual language as Bid Readiness,
               while keeping controls/content readable. */
            .blueWorkspaceContent{
              --workspace-bg:#07111f;
              --workspace-bg-2:#0b1730;
              --workspace-bg-3:#101b3b;
              --workspace-panel:rgba(15,27,50,.94);
              --workspace-panel-2:rgba(18,32,58,.96);
              --workspace-border:rgba(147,197,253,.14);
              --workspace-text:#eaf2ff;
              --workspace-muted:#9fb2cf;
              position:relative;
              isolation:isolate;
              min-height:calc(100vh - 68px);
              color:var(--workspace-text);
              background:
                radial-gradient(circle at 88% 10%,rgba(34,211,238,.12),transparent 24%),
                radial-gradient(circle at 12% 80%,rgba(59,130,246,.10),transparent 28%),
                linear-gradient(135deg,var(--workspace-bg) 0%,var(--workspace-bg-2) 52%,var(--workspace-bg-3) 100%);
            }

            .blueWorkspaceContent .pageHeader{
              color:var(--workspace-text);
            }
            .blueWorkspaceContent .pageHeader h1{
              color:#f8fbff !important;
            }
            .blueWorkspaceContent .pageHeader p,
            .blueWorkspaceContent .pageEyebrow{
              color:var(--workspace-muted) !important;
            }

            .blueWorkspaceContent .panel,
            .blueWorkspaceContent .statCard,
            .blueWorkspaceContent .emptyState,
            .blueWorkspaceContent .emptyVerification,
            .blueWorkspaceContent .verificationHero,
            .blueWorkspaceContent .verificationStat,
            .blueWorkspaceContent .reportHeaderCard,
            .blueWorkspaceContent .reportKpi,
            .blueWorkspaceContent .reportRecommendation,
            .blueWorkspaceContent .reportSummary{
              background:
                linear-gradient(145deg,var(--workspace-panel-2),var(--workspace-panel));
              color:var(--workspace-text);
              border-color:var(--workspace-border) !important;
              box-shadow:0 18px 55px rgba(2,6,23,.18);
            }

            .blueWorkspaceContent .panelHeader h3,
            .blueWorkspaceContent .panel h2,
            .blueWorkspaceContent .panel h3,
            .blueWorkspaceContent .statCard strong,
            .blueWorkspaceContent .emptyState h3,
            .blueWorkspaceContent .emptyVerification h2,
            .blueWorkspaceContent .verificationHero h2,
            .blueWorkspaceContent .reportHeaderCard h2{
              color:#f1f6ff !important;
            }

            .blueWorkspaceContent .panelHeader p,
            .blueWorkspaceContent .panel p,
            .blueWorkspaceContent .panel small,
            .blueWorkspaceContent .statCard small,
            .blueWorkspaceContent .emptyState p,
            .blueWorkspaceContent .emptyVerification p,
            .blueWorkspaceContent .verificationHero p,
            .blueWorkspaceContent .reportHeaderCard p{
              color:var(--workspace-muted) !important;
            }

            .blueWorkspaceContent input,
            .blueWorkspaceContent textarea,
            .blueWorkspaceContent select{
              background:rgba(7,17,31,.72) !important;
              color:#edf5ff !important;
              border-color:rgba(147,197,253,.18) !important;
            }
            .blueWorkspaceContent input::placeholder,
            .blueWorkspaceContent textarea::placeholder{
              color:#7185a5 !important;
            }

            .blueWorkspaceContent .requirementsTable,
            .blueWorkspaceContent .bidifiComparisonTable{
              background:rgba(7,17,31,.34);
              color:var(--workspace-text);
              border-color:var(--workspace-border) !important;
            }
            .blueWorkspaceContent .requirementsTable th,
            .blueWorkspaceContent .requirementsTable td,
            .blueWorkspaceContent .bidifiComparisonTable th,
            .blueWorkspaceContent .bidifiComparisonTable td{
              border-color:rgba(147,197,253,.12) !important;
            }
            .blueWorkspaceContent .requirementsTable th,
            .blueWorkspaceContent .bidifiComparisonTable th{
              color:#cfe0f8 !important;
              background:rgba(30,58,95,.34);
            }

            .blueWorkspaceContent .requirementRow,
            .blueWorkspaceContent .verificationChecklist > div,
            .blueWorkspaceContent .reportMeta,
            .blueWorkspaceContent .reportStatus{
              border-color:rgba(147,197,253,.12) !important;
            }

            .blueWorkspaceContent .emptyStateIcon,
            .blueWorkspaceContent .emptyVerificationIcon{
              background:rgba(37,99,235,.18);
              color:#93c5fd;
              border-color:rgba(147,197,253,.20);
            }

            .blueWorkspaceContent .secondaryButton{
              background:rgba(148,163,184,.10);
              color:#dbeafe;
              border-color:rgba(147,197,253,.18);
            }

            .blueWorkspaceContent .panel a,
            .blueWorkspaceContent .emptyState a,
            .blueWorkspaceContent .emptyVerification a{
              color:#93c5fd;
            }

            .blueWorkspaceContent .statsGrid{
              color:var(--workspace-text);
            }

            @media(max-width:820px){
              .blueWorkspaceContent{
                min-height:calc(100vh - 58px);
              }
            }

            /* ===== NON-HOME WORKSPACE CONTRAST FIX =====
               Keep Bid Readiness exactly as its own blue treatment.
               Other workspace pages use a consistent deep-blue surface so
               cards, labels, numbers, icons and form controls remain readable. */
            .blueWorkspacePage{
              --page-bg:#071326;
              --page-bg-2:#0a1b36;
              --page-panel:#101f3a;
              --page-panel-2:#142747;
              --page-panel-3:#182d50;
              --page-border:rgba(126,173,232,.24);
              --page-text:#f4f8ff;
              --page-text-2:#d7e5f8;
              --page-muted:#9fb5d3;
              background:
                radial-gradient(circle at 85% 8%,rgba(0,191,255,.10),transparent 24%),
                radial-gradient(circle at 10% 75%,rgba(59,130,246,.09),transparent 30%),
                linear-gradient(135deg,#061225 0%,#091a33 52%,#0d2342 100%) !important;
              color:var(--page-text) !important;
            }

            .blueWorkspacePage > *{
              color:var(--page-text);
            }

            /* Common cards/panels across Tender, Bidder Workspace,
               AI Verification, Reports and Settings. */
            .blueWorkspacePage .panel,
            .blueWorkspacePage .card,
            .blueWorkspacePage .section,
            .blueWorkspacePage .statCard,
            .blueWorkspacePage .emptyState,
            .blueWorkspacePage .emptyVerification,
            .blueWorkspacePage .verificationHero,
            .blueWorkspacePage .verificationStat,
            .blueWorkspacePage .reportHeaderCard,
            .blueWorkspacePage .reportKpi,
            .blueWorkspacePage .reportRecommendation,
            .blueWorkspacePage .reportSummary,
            .blueWorkspacePage [class*="Card"],
            .blueWorkspacePage [class*="card"],
            .blueWorkspacePage [class*="Panel"],
            .blueWorkspacePage [class*="panel"]{
              background:linear-gradient(145deg,var(--page-panel-2),var(--page-panel)) !important;
              color:var(--page-text) !important;
              border-color:var(--page-border) !important;
              box-shadow:0 12px 35px rgba(0,0,0,.22) !important;
            }

            /* Keep large workspace containers dark too, instead of the
               washed-out light-grey surfaces visible in the screenshot. */
            .blueWorkspacePage form,
            .blueWorkspacePage .workspace,
            .blueWorkspacePage .workspaceSection,
            .blueWorkspacePage .uploadSection,
            .blueWorkspacePage .evidenceSection,
            .blueWorkspacePage .batchSection,
            .blueWorkspacePage .requirementsSection,
            .blueWorkspacePage .verificationSection{
              background:transparent !important;
              color:var(--page-text) !important;
            }

            /* Typography: headings, labels, values, numbers and helper text. */
            .blueWorkspacePage h1,
            .blueWorkspacePage h2,
            .blueWorkspacePage h3,
            .blueWorkspacePage h4,
            .blueWorkspacePage h5,
            .blueWorkspacePage h6,
            .blueWorkspacePage strong,
            .blueWorkspacePage b,
            .blueWorkspacePage label,
            .blueWorkspacePage th,
            .blueWorkspacePage .title,
            .blueWorkspacePage .value,
            .blueWorkspacePage .statValue{
              color:#f5f9ff !important;
              text-shadow:0 1px 10px rgba(0,0,0,.18);
            }

            .blueWorkspacePage p,
            .blueWorkspacePage small,
            .blueWorkspacePage span,
            .blueWorkspacePage li,
            .blueWorkspacePage td,
            .blueWorkspacePage .muted,
            .blueWorkspacePage .helperText,
            .blueWorkspacePage .description{
              color:var(--page-text-2) !important;
            }

            .blueWorkspacePage .pageHeader h1{
              color:#ffffff !important;
            }
            .blueWorkspacePage .pageHeader p,
            .blueWorkspacePage .pageEyebrow{
              color:#a9bdd8 !important;
            }

            /* Inputs / selects / textareas. */
            .blueWorkspacePage input,
            .blueWorkspacePage textarea,
            .blueWorkspacePage select,
            .blueWorkspacePage .input,
            .blueWorkspacePage [role="textbox"]{
              background:#0b182d !important;
              color:#f1f6ff !important;
              border:1px solid rgba(126,173,232,.30) !important;
              box-shadow:inset 0 1px 0 rgba(255,255,255,.03) !important;
            }
            .blueWorkspacePage input::placeholder,
            .blueWorkspacePage textarea::placeholder{
              color:#7890b1 !important;
              opacity:1 !important;
            }
            .blueWorkspacePage option{
              background:#0b182d !important;
              color:#f1f6ff !important;
            }

            /* Upload/drop zones and empty areas. */
            .blueWorkspacePage .dropzone,
            .blueWorkspacePage .uploadZone,
            .blueWorkspacePage [class*="dropZone"],
            .blueWorkspacePage [class*="uploadZone"],
            .blueWorkspacePage .emptyState,
            .blueWorkspacePage .emptyVerification{
              background:linear-gradient(145deg,#122544,#0e1d36) !important;
              color:#edf5ff !important;
              border-color:rgba(126,173,232,.34) !important;
            }

            /* Tables/lists. */
            .blueWorkspacePage table,
            .blueWorkspacePage .requirementsTable,
            .blueWorkspacePage .bidifiComparisonTable{
              background:#0d1b31 !important;
              color:#eef5ff !important;
              border-color:rgba(126,173,232,.22) !important;
            }
            .blueWorkspacePage th{
              background:#142947 !important;
              color:#f5f9ff !important;
              border-color:rgba(126,173,232,.20) !important;
            }
            .blueWorkspacePage td{
              background:#0e1d35 !important;
              color:#dbe8f8 !important;
              border-color:rgba(126,173,232,.16) !important;
            }
            .blueWorkspacePage tr:nth-child(even) td{
              background:#10213b !important;
            }

            /* Buttons and interactive controls remain visibly distinct. */
            .blueWorkspacePage button:not(.mobileOverlay),
            .blueWorkspacePage .secondaryButton{
              color:#f3f7ff !important;
              border-color:rgba(126,173,232,.28) !important;
            }
            .blueWorkspacePage button:not(.mobileOverlay):not([disabled]):hover{
              filter:brightness(1.08);
            }

            /* Icons, badges and status chips. */
            .blueWorkspacePage svg{
              color:currentColor;
            }
            .blueWorkspacePage .icon,
            .blueWorkspacePage [class*="Icon"],
            .blueWorkspacePage [class*="icon"]{
              color:#dcecff;
            }
            .blueWorkspacePage .badge,
            .blueWorkspacePage .statusBadge,
            .blueWorkspacePage .status{
              border-color:rgba(126,173,232,.25) !important;
            }

            /* Do not let generic overrides wash out disabled controls. */
            .blueWorkspacePage input:disabled,
            .blueWorkspacePage textarea:disabled,
            .blueWorkspacePage select:disabled,
            .blueWorkspacePage button:disabled{
              opacity:.62 !important;
            }


            /* =========================================================
               FINAL NON-HOME BLUE SURFACE FIX
               Removes remaining white/light surfaces while keeping
               text, numbers, icons and controls clearly visible.
               HOME IS NOT TARGETED.
               ========================================================= */

            .blueWorkspacePage .stepIndicatorItem,
            .blueWorkspacePage .stepIndicatorItem.done,
            .blueWorkspacePage .stepIndicatorItem:not(.done),
            .blueWorkspacePage .stepIndicatorItem > div {
              background:linear-gradient(145deg,#162b4b,#10213b) !important;
              color:#e2e8f0 !important;
              border:1px solid rgba(126,173,232,.24) !important;
              box-shadow:0 8px 24px rgba(0,0,0,.16) !important;
            }

            .blueWorkspacePage .stepIndicatorItem strong,
            .blueWorkspacePage .stepIndicatorItem small,
            .blueWorkspacePage .stepIndicatorItem span {
              color:#e2e8f0 !important;
            }

            .blueWorkspacePage .stepIndicatorItem strong {
              color:#f8fafc !important;
            }

            .blueWorkspacePage .stepIndicatorItem > span:first-child {
              color:#60a5fa !important;
            }

            .blueWorkspacePage .stepIndicatorConnector {
              background:linear-gradient(90deg,#2563eb,#7c3aed) !important;
              opacity:.8 !important;
            }

            /* Bidder information and every form surface. */
            .blueWorkspacePage .entityInfoPanel,
            .blueWorkspacePage .bidderUploadPanel,
            .blueWorkspacePage .verificationReadyPanel,
            .blueWorkspacePage .panel {
              background:linear-gradient(145deg,#142947,#10213b) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
            }

            .blueWorkspacePage .infoGrid input,
            .blueWorkspacePage .infoGrid select,
            .blueWorkspacePage .infoGrid textarea,
            .blueWorkspacePage .selectedFiles input {
              background:#0a1930 !important;
              color:#f1f6ff !important;
              -webkit-text-fill-color:#f1f6ff !important;
              border-color:rgba(126,173,232,.32) !important;
            }

            .blueWorkspacePage .infoGrid input::placeholder,
            .blueWorkspacePage .selectedFiles input::placeholder {
              color:#7890b1 !important;
              -webkit-text-fill-color:#7890b1 !important;
              opacity:1 !important;
            }

            /* Kill the inline white background used by the batch bidder name input. */
            .blueWorkspacePage .selectedFiles input[style*="background"],
            .blueWorkspacePage .selectedFiles input[style*="backgroundColor"] {
              background:#0a1930 !important;
              color:#f1f6ff !important;
              -webkit-text-fill-color:#f1f6ff !important;
            }

            /* Upload area: same navy treatment as Bid Readiness. */
            .blueWorkspacePage .bidderDropzone,
            .blueWorkspacePage .dropzone,
            .blueWorkspacePage .uploadZone,
            .blueWorkspacePage [class*="dropzone"],
            .blueWorkspacePage [class*="Dropzone"],
            .blueWorkspacePage [class*="uploadZone"],
            .blueWorkspacePage [class*="UploadZone"] {
              background:linear-gradient(145deg,#0f2341,#0b1a31) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.42) !important;
              box-shadow:inset 0 1px 0 rgba(255,255,255,.025) !important;
            }

            .blueWorkspacePage .bidderDropzone strong,
            .blueWorkspacePage .bidderDropzone span,
            .blueWorkspacePage .bidderDropzone small,
            .blueWorkspacePage .bidderDropzone svg,
            .blueWorkspacePage .dropzoneIcon {
              color:#e2e8f0 !important;
            }

            .blueWorkspacePage .bidderDropzone strong {
              color:#f8fafc !important;
            }

            .blueWorkspacePage .bidderDropzone small {
              color:#7fb4f5 !important;
            }

            .blueWorkspacePage .dropzoneIcon {
              background:rgba(59,130,246,.18) !important;
              border-color:rgba(96,165,250,.28) !important;
            }

            /* Documents / batch bidder cards. */
            .blueWorkspacePage .selectedFiles,
            .blueWorkspacePage .bidderFiles,
            .blueWorkspacePage .selectedFilesHeader,
            .blueWorkspacePage .fileRow {
              background:#0f2039 !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
            }

            .blueWorkspacePage .selectedFilesHeader strong,
            .blueWorkspacePage .selectedFilesHeader span,
            .blueWorkspacePage .fileRow strong,
            .blueWorkspacePage .fileRow span {
              color:#e2e8f0 !important;
            }

            .blueWorkspacePage .fileRow strong {
              color:#f8fafc !important;
            }

            /* Verification readiness rows were the grey/white blocks in the screenshot. */
            .blueWorkspacePage .readinessList,
            .blueWorkspacePage .readinessRow {
              background:transparent !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.20) !important;
            }

            .blueWorkspacePage .readinessRow {
              background:linear-gradient(145deg,#132743,#0e1e36) !important;
              border:1px solid rgba(126,173,232,.20) !important;
            }

            .blueWorkspacePage .readinessRow span,
            .blueWorkspacePage .readinessRow strong,
            .blueWorkspacePage .readinessRow div {
              color:#e2e8f0 !important;
            }

            .blueWorkspacePage .readinessRow strong {
              color:#f8fafc !important;
            }

            .blueWorkspacePage .readinessIcon {
              background:#172f52 !important;
              color:#93c5fd !important;
              border-color:rgba(96,165,250,.25) !important;
            }

            .blueWorkspacePage .readinessIcon.done {
              background:rgba(16,185,129,.14) !important;
              color:#6ee7b7 !important;
            }

            /* Generic white/light children inside non-home panels. */
            .blueWorkspacePage .panel > .white,
            .blueWorkspacePage .panel > .light,
            .blueWorkspacePage .panel .whiteCard,
            .blueWorkspacePage .panel .lightCard,
            .blueWorkspacePage .panel .surfaceLight {
              background:#132743 !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
            }

            /* Prevent common inline white surfaces from surviving inside these pages. */
            .blueWorkspacePage [style*="background: #fff"],
            .blueWorkspacePage [style*="background:#fff"],
            .blueWorkspacePage [style*="background: \"#fff\""],
            .blueWorkspacePage [style*="background: '#fff'"],
            .blueWorkspacePage [style*="background: #ffffff"],
            .blueWorkspacePage [style*="background:#ffffff"] {
              background:#10213b !important;
              color:#e2e8f0 !important;
            }

            /* Keep disabled controls readable instead of turning white/grey. */
            .blueWorkspacePage button:disabled,
            .blueWorkspacePage input:disabled,
            .blueWorkspacePage textarea:disabled,
            .blueWorkspacePage select:disabled {
              background:#162945 !important;
              color:#a9bdd8 !important;
              -webkit-text-fill-color:#a9bdd8 !important;
              opacity:.9 !important;
            }


            /* =========================================================
               FINAL ALL-PAGE BLUE SURFACE / CONTRAST FIX
               - Tender workspace: remove remaining white surfaces
               - AI Verification: dark risk block + readable compliance ring
               - Reports: remove remaining white report cards/sections
               - Home: only light/white content surfaces are converted;
                 animation layers are intentionally untouched
               ========================================================= */

            /* ---------- HOME: CONTENT SURFACES ONLY ---------- */
            .homeContent .statsGrid .statCard,
            .homeContent .workflowPanel,
            .homeContent .recentPanel,
            .homeContent .activityPanel,
            .homeContent .dashboardColumns > .panel,
            .homeContent .showcaseCard,
            .homeContent .featureCard,
            .homeContent .showcaseItem {
              background:linear-gradient(145deg,#142947,#0f2039) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
              box-shadow:0 14px 40px rgba(0,0,0,.20) !important;
            }

            .homeContent .statCard span,
            .homeContent .statCard small,
            .homeContent .workflowStep p,
            .homeContent .recentTender span,
            .homeContent .recentTender small,
            .homeContent .activityItem span,
            .homeContent .panel p,
            .homeContent .panel small {
              color:#9fb5d3 !important;
            }

            .homeContent .statCard strong,
            .homeContent .workflowStep strong,
            .homeContent .recentTender strong,
            .homeContent .activityItem strong,
            .homeContent .panel h2,
            .homeContent .panel h3 {
              color:#f8fafc !important;
            }

            .homeContent .workflowNumber,
            .homeContent .recentTenderIcon,
            .homeContent .activityIcon {
              background:#17345d !important;
              color:#93c5fd !important;
              border-color:rgba(126,173,232,.24) !important;
            }

            .homeContent .workflowLine {
              background:linear-gradient(90deg,#2563eb,#7c3aed) !important;
              opacity:.75 !important;
            }

            .homeContent .recentTender,
            .homeContent .activityItem {
              background:rgba(7,17,31,.34) !important;
              border-color:rgba(126,173,232,.16) !important;
            }

            /* Do not touch Home animation sections/canvas. */
            .homeContent .bidifiHomeAnimationSection,
            .homeContent .bidifiHomeAnimationSection * {
              /* animation components keep their existing visual rules */
            }

            /* ---------- TENDER WORKSPACE ---------- */
            .blueWorkspacePage .tenderWorkspace > .panel,
            .blueWorkspacePage .entityInfoPanel,
            .blueWorkspacePage .uploadPanel,
            .blueWorkspacePage .tenderListPanel,
            .blueWorkspacePage .aiExtractionPanel,
            .blueWorkspacePage .requirementsPanel {
              background:linear-gradient(145deg,#142947,#0f2039) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
              box-shadow:0 14px 40px rgba(0,0,0,.20) !important;
            }

            .blueWorkspacePage .tenderDropzone,
            .blueWorkspacePage .tenderList,
            .blueWorkspacePage .tenderListItem,
            .blueWorkspacePage .aiExplanation,
            .blueWorkspacePage .tenderEmptyHint {
              background:linear-gradient(145deg,#0f2341,#0b1a31) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
            }

            .blueWorkspacePage .tenderListItem strong,
            .blueWorkspacePage .aiExtractionPanel h2,
            .blueWorkspacePage .aiExplanation strong {
              color:#f8fafc !important;
            }

            .blueWorkspacePage .tenderListItem span,
            .blueWorkspacePage .tenderListItem small,
            .blueWorkspacePage .aiExtractionPanel p,
            .blueWorkspacePage .aiExplanation span,
            .blueWorkspacePage .tenderEmptyHint {
              color:#9fb5d3 !important;
            }

            .blueWorkspacePage .tenderListItem:hover,
            .blueWorkspacePage .tenderListItem.selected {
              background:linear-gradient(145deg,#17345d,#102744) !important;
              border-color:rgba(96,165,250,.42) !important;
            }

            .blueWorkspacePage .tenderListIcon,
            .blueWorkspacePage .aiExplanation > div > svg {
              color:#93c5fd !important;
            }

            .blueWorkspacePage .requirementsTable,
            .blueWorkspacePage .requirementsHead,
            .blueWorkspacePage .requirementRow {
              background:#0e1e36 !important;
              color:#e2e8f0 !important;
            }

            .blueWorkspacePage .requirementsHead {
              color:#93c5fd !important;
              border-color:rgba(126,173,232,.18) !important;
            }

            .blueWorkspacePage .requirementRow strong {
              color:#f8fafc !important;
            }

            .blueWorkspacePage .requirementRow p,
            .blueWorkspacePage .requirementThreshold,
            .blueWorkspacePage .requirementCategory {
              color:#9fb5d3 !important;
            }

            /* ---------- AI VERIFICATION ---------- */
            .blueWorkspacePage .verificationHero {
              background:linear-gradient(145deg,#142947,#0d1e37) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.26) !important;
            }

            .blueWorkspacePage .riskBlock {
              background:linear-gradient(145deg,#10213b,#0b192e) !important;
              color:#e2e8f0 !important;
              border:1px solid rgba(126,173,232,.24) !important;
              border-radius:16px !important;
              box-shadow:inset 0 1px 0 rgba(255,255,255,.025) !important;
            }

            .blueWorkspacePage .riskBlock .miniLabel {
              color:#93c5fd !important;
            }

            .blueWorkspacePage .riskBlock > strong {
              color:#f8fafc !important;
              font-weight:900 !important;
            }

            .blueWorkspacePage .riskBar {
              background:#071326 !important;
              border:1px solid rgba(126,173,232,.16) !important;
            }

            .blueWorkspacePage .scoreRing {
              background:conic-gradient(#2563eb var(--score),rgba(148,163,184,.16) 0) !important;
              box-shadow:0 0 28px rgba(37,99,235,.18) !important;
            }

            .blueWorkspacePage .scoreRing::before {
              background:#edf4ff !important;
            }

            .blueWorkspacePage .scoreInner {
              background:#edf4ff !important;
              color:#000000 !important;
              border:1px solid rgba(15,23,42,.08) !important;
            }

            .blueWorkspacePage .scoreInner strong {
              color:#000000 !important;
              -webkit-text-fill-color:#000000 !important;
              font-weight:900 !important;
              text-shadow:none !important;
            }

            .blueWorkspacePage .scoreInner span {
              color:#111827 !important;
              -webkit-text-fill-color:#111827 !important;
              font-weight:800 !important;
            }

            .blueWorkspacePage .verificationStats .verificationStat {
              background:linear-gradient(145deg,#142947,#0f2039) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.22) !important;
            }

            /* ---------- REPORTS: REMOVE WHITE THREE-CARD / SECTION LOOK ---------- */
            .blueWorkspacePage .reportHeaderCard,
            .blueWorkspacePage .reportKpi,
            .blueWorkspacePage .reportSummary,
            .blueWorkspacePage .bidderSummary,
            .blueWorkspacePage .missingPanel,
            .blueWorkspacePage .reportRecommendations,
            .blueWorkspacePage .reportRecommendation,
            .blueWorkspacePage .profileRow,
            .blueWorkspacePage .summaryPoint,
            .blueWorkspacePage .missingItem {
              background:linear-gradient(145deg,#142947,#0f2039) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
            }

            .blueWorkspacePage .reportHeaderCard strong,
            .blueWorkspacePage .reportHeaderCard h2,
            .blueWorkspacePage .reportKpi strong,
            .blueWorkspacePage .reportSummary strong,
            .blueWorkspacePage .bidderSummary strong,
            .blueWorkspacePage .missingItem strong,
            .blueWorkspacePage .reportRecommendation p {
              color:#f8fafc !important;
            }

            .blueWorkspacePage .reportHeaderCard span,
            .blueWorkspacePage .reportKpi span,
            .blueWorkspacePage .reportKpi small,
            .blueWorkspacePage .reportSummary p,
            .blueWorkspacePage .bidderSummary span,
            .blueWorkspacePage .profileRow span,
            .blueWorkspacePage .missingItem span,
            .blueWorkspacePage .reportRecommendation > span {
              color:#9fb5d3 !important;
            }

            .blueWorkspacePage .reportMeta,
            .blueWorkspacePage .reportStatus {
              background:rgba(7,17,31,.30) !important;
              color:#dbeafe !important;
              border-color:rgba(126,173,232,.18) !important;
            }

            .blueWorkspacePage .reportKpi {
              box-shadow:0 10px 28px rgba(0,0,0,.18) !important;
            }

            .blueWorkspacePage .reportRecommendation:hover,
            .blueWorkspacePage .missingItem:hover {
              background:linear-gradient(145deg,#17345d,#102744) !important;
            }

            /* ---------- GENERIC LIGHT SURFACES INSIDE NON-HOME PAGES ---------- */
            .blueWorkspacePage .lightSurface,
            .blueWorkspacePage .lightPanel,
            .blueWorkspacePage .whiteSurface,
            .blueWorkspacePage .whitePanel,
            .blueWorkspacePage .surfaceLight,
            .blueWorkspacePage .surfaceWhite {
              background:#10213b !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.22) !important;
            }

            .blueWorkspacePage [style*="backgroundColor: \"#fff\""],
            .blueWorkspacePage [style*="backgroundColor: '#fff'"],
            .blueWorkspacePage [style*="backgroundColor: \"#ffffff\""],
            .blueWorkspacePage [style*="backgroundColor: '#ffffff'"] {
              background:#10213b !important;
              color:#e2e8f0 !important;
            }


            /* =========================================================
               GLOBAL FINAL CONTRAST OVERRIDE
               IMPORTANT: this block is in the ROOT App style so it is
               loaded on every page. Previous page-specific overrides
               were inside Home and therefore were not active elsewhere.
               ========================================================= */

            /* ---------- ALL NON-HOME WORKSPACES ---------- */
            .blueWorkspaceContent .aiExtractionPanel,
            .blueWorkspaceContent .aiExtractionPanel .aiExtractionHeader,
            .blueWorkspaceContent .aiExtractionPanel > div {
              background:linear-gradient(145deg,#142947,#0f2039) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
            }

            .blueWorkspaceContent .aiExtractionPanel .aiLabel {
              color:#93c5fd !important;
              -webkit-text-fill-color:#93c5fd !important;
            }

            .blueWorkspaceContent .aiExtractionPanel h2 {
              color:#f8fafc !important;
              -webkit-text-fill-color:#f8fafc !important;
            }

            .blueWorkspaceContent .aiExtractionPanel p {
              color:#c5d5ea !important;
              -webkit-text-fill-color:#c5d5ea !important;
            }

            /* ---------- AI VERIFICATION: TOP REVIEW ---------- */
            .blueWorkspaceContent .verificationHero .decisionBlock .statusBadge,
            .blueWorkspaceContent .verificationHero .decisionBlock .statusBadge.warning {
              color:#000000 !important;
              -webkit-text-fill-color:#000000 !important;
              font-weight:900 !important;
            }

            /* ---------- AI VERIFICATION: AI VERIFIED ---------- */
            .blueWorkspaceContent .evidencePanel .aiVerifiedBadge,
            .blueWorkspaceContent .aiVerifiedBadge {
              color:#000000 !important;
              -webkit-text-fill-color:#000000 !important;
              font-weight:900 !important;
            }

            .blueWorkspaceContent .evidencePanel .aiVerifiedBadge svg,
            .blueWorkspaceContent .aiVerifiedBadge svg {
              color:#000000 !important;
              stroke:#000000 !important;
            }

            /* =========================================================
               NON-HOME TYPOGRAPHY — MATCH BID READINESS
               Home is intentionally excluded.
               Bid Readiness uses bright primary text, soft secondary
               text and blue accents; apply the same visual language
               to every other workspace.
               ========================================================= */

            .blueWorkspaceContent {
              color:#6f91b5 !important;
            }

            .blueWorkspaceContent h1,
            .blueWorkspaceContent h2,
            .blueWorkspaceContent h3,
            .blueWorkspaceContent h4,
            .blueWorkspaceContent h5,
            .blueWorkspaceContent h6 {
              color:#3f6f9f !important;
              -webkit-text-fill-color:#3f6f9f !important;
            }

            .blueWorkspaceContent p,
            .blueWorkspaceContent li,
            .blueWorkspaceContent label,
            .blueWorkspaceContent td,
            .blueWorkspaceContent th,
            .blueWorkspaceContent strong,
            .blueWorkspaceContent b {
              color:#5f82a8 !important;
              -webkit-text-fill-color:#5f82a8 !important;
            }

            .blueWorkspaceContent small,
            .blueWorkspaceContent .muted,
            .blueWorkspaceContent .hint,
            .blueWorkspaceContent .description,
            .blueWorkspaceContent .subtitle,
            .blueWorkspaceContent .caption {
              color:#6f91b5 !important;
              -webkit-text-fill-color:#6f91b5 !important;
            }

            .blueWorkspaceContent input,
            .blueWorkspaceContent textarea,
            .blueWorkspaceContent select {
              color:#4f7299 !important;
              -webkit-text-fill-color:#4f7299 !important;
            }

            .blueWorkspaceContent input::placeholder,
            .blueWorkspaceContent textarea::placeholder {
              color:#7898b8 !important;
              -webkit-text-fill-color:#7898b8 !important;
              opacity:1 !important;
            }

            /* Most normal inline labels/spans follow Bid Readiness text.
               Specific status/accent selectors below intentionally override. */
            .blueWorkspaceContent span {
              color:#5f82a8 !important;
              -webkit-text-fill-color:#5f82a8 !important;
            }

            .blueWorkspaceContent .aiLabel,
            .blueWorkspaceContent .eyebrow,
            .blueWorkspaceContent .sectionEyebrow,
            .blueWorkspaceContent .accent {
              color:#2563eb !important;
              -webkit-text-fill-color:#2563eb !important;
            }

            .blueWorkspaceContent svg {
              color:#356b9e !important;
            }

            /* AI Verification LOW RISK only — black as requested. */
            .blueWorkspaceContent .verificationHero .riskLabel {
              color:#000000 !important;
              -webkit-text-fill-color:#000000 !important;
              font-weight:900 !important;
            }


            /* Reports LOW RISK: keep its original readable report colour;
               only AI Verification LOW RISK is black. */
            .blueWorkspaceContent .reportKpi small {
              color:#9fb5d3 !important;
              -webkit-text-fill-color:#9fb5d3 !important;
              font-weight:inherit !important;
            }

            /* ---------- REPORTS: RIGHT-SIDE REVIEW ---------- */
            .blueWorkspaceContent .reportStatus .statusBadge,
            .blueWorkspaceContent .reportStatus .statusBadge.warning {
              color:#000000 !important;
              -webkit-text-fill-color:#000000 !important;
              font-weight:900 !important;
            }

            /* ---------- REPORTS: WHITE SHIELD ---------- */
            .blueWorkspaceContent .reportMark,
            .blueWorkspaceContent .reportMark svg,
            .blueWorkspaceContent .reportMark svg path {
              color:#ffffff !important;
              stroke:#ffffff !important;
              -webkit-text-fill-color:#ffffff !important;
            }

            /* ---------- AI VERIFICATION RISK AREA ---------- */
            .blueWorkspaceContent .riskBlock,
            .blueWorkspaceContent .riskBlock > div {
              background:linear-gradient(145deg,#10213b,#0b192e) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
            }

            .blueWorkspaceContent .riskBlock .miniLabel {
              color:#93c5fd !important;
            }

            .blueWorkspaceContent .riskBlock > strong {
              color:#f8fafc !important;
              -webkit-text-fill-color:#f8fafc !important;
              font-weight:900 !important;
            }

            /* ---------- COMPLIANCE CIRCLE ---------- */
            .blueWorkspaceContent .scoreInner {
              background:#edf4ff !important;
              color:#000000 !important;
            }

            .blueWorkspaceContent .scoreInner strong {
              color:#000000 !important;
              -webkit-text-fill-color:#000000 !important;
              font-weight:900 !important;
              text-shadow:none !important;
            }

            .blueWorkspaceContent .scoreInner span {
              color:#111827 !important;
              -webkit-text-fill-color:#111827 !important;
              font-weight:800 !important;
            }

            /* ---------- REPORT SURFACES ---------- */
            .blueWorkspaceContent .reportHeaderCard,
            .blueWorkspaceContent .reportKpi,
            .blueWorkspaceContent .reportSummary,
            .blueWorkspaceContent .bidderSummary,
            .blueWorkspaceContent .missingPanel,
            .blueWorkspaceContent .reportRecommendations,
            .blueWorkspaceContent .reportRecommendation,
            .blueWorkspaceContent .profileRow,
            .blueWorkspaceContent .summaryPoint,
            .blueWorkspaceContent .missingItem {
              background:linear-gradient(145deg,#142947,#0f2039) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
            }

            /* ---------- NO WHITE GENERIC SURFACES ---------- */
            .blueWorkspaceContent .lightSurface,
            .blueWorkspaceContent .lightPanel,
            .blueWorkspaceContent .whiteSurface,
            .blueWorkspaceContent .whitePanel,
            .blueWorkspaceContent .surfaceLight,
            .blueWorkspaceContent .surfaceWhite {
              background:#10213b !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.22) !important;
            }

            /* Inline white backgrounds used by generated UI */
            .blueWorkspaceContent [style*="#fff"],
            .blueWorkspaceContent [style*="#FFF"],
            .blueWorkspaceContent [style*="#ffffff"],
            .blueWorkspaceContent [style*="#FFFFFF"] {
              background:#10213b !important;
              color:#e2e8f0 !important;
            }

            /* ---------- HOME: ONLY LIGHT CONTENT SURFACES ----------
               Animation/canvas layers are deliberately untouched. */
            .homeContent .panel,
            .homeContent .statCard,
            .homeContent .card,
            .homeContent .lightSurface,
            .homeContent .lightPanel,
            .homeContent .whiteSurface,
            .homeContent .whitePanel {
              background:linear-gradient(145deg,#142947,#0f2039) !important;
              color:#e2e8f0 !important;
              border-color:rgba(126,173,232,.24) !important;
            }

            .homeContent .panel h2,
            .homeContent .panel h3,
            .homeContent .card h2,
            .homeContent .card h3 {
              color:#f8fafc !important;
            }

            .homeContent .panel p,
            .homeContent .card p,
            .homeContent .panel span,
            .homeContent .card span {
              color:#c5d5ea !important;
            }

            /* =========================================================
               FINAL UI SURFACE FIX — REMOVE REMAINING WHITE BOXES
               Requested areas:
               - Home workflow cards
               - Home recent-tender / AI-activity cards + hover
               - AI Verification Tender / Requirements / Evidence / AI decision checklist
               - Verification readiness logo tile + white shield
               - Tender Library list cards + hover
               - Sidebar/taskbar visual treatment
               ========================================================= */

            /* ---------- HOME: HOW BIDIFI WORKS ---------- */
            .homeContent .workflowPanel,
            .homeContent .workflow,
            .homeContent .workflowStep {
              background:linear-gradient(145deg,#162f50,#0f223b) !important;
              color:#5f82a8 !important;
              border-color:rgba(96,165,250,.22) !important;
            }

            .homeContent .workflowStep {
              border:1px solid rgba(96,165,250,.20) !important;
              border-radius:14px !important;
              box-shadow:0 8px 24px rgba(0,0,0,.16) !important;
            }

            .homeContent .workflowStep strong {
              color:#5f82a8 !important;
              -webkit-text-fill-color:#5f82a8 !important;
            }

            .homeContent .workflowStep p {
              color:#6f91b5 !important;
              -webkit-text-fill-color:#6f91b5 !important;
            }

            /* ---------- HOME: RECENT TENDERS / AI ACTIVITY ---------- */
            .homeContent .recentTender,
            .homeContent .activityItem {
              background:linear-gradient(145deg,#122844,#0d1e35) !important;
              color:#5f82a8 !important;
              border-color:rgba(96,165,250,.18) !important;
            }

            .homeContent .recentTender:hover,
            .homeContent .recentTender.selected,
            .homeContent .activityItem:hover {
              background:linear-gradient(145deg,#17365b,#102744) !important;
              color:#5f82a8 !important;
              border-color:rgba(96,165,250,.34) !important;
              box-shadow:0 8px 24px rgba(0,0,0,.16) !important;
            }

            .homeContent .recentTender strong,
            .homeContent .activityItem strong {
              color:#5f82a8 !important;
              -webkit-text-fill-color:#5f82a8 !important;
            }

            .homeContent .recentTender span,
            .homeContent .recentTender small,
            .homeContent .activityItem span {
              color:#6f91b5 !important;
              -webkit-text-fill-color:#6f91b5 !important;
            }

            /* ---------- AI VERIFICATION: EMPTY CHECKLIST ---------- */
            .blueWorkspaceContent .verificationChecklist,
            .blueWorkspaceContent .verificationChecklist > div {
              background:linear-gradient(145deg,#132946,#0e2038) !important;
              color:#5f82a8 !important;
              border-color:rgba(96,165,250,.20) !important;
            }

            .blueWorkspaceContent .verificationChecklist > div {
              border:1px solid rgba(96,165,250,.20) !important;
              border-radius:12px !important;
              box-shadow:0 6px 18px rgba(0,0,0,.12) !important;
            }

            .blueWorkspaceContent .verificationChecklist > div svg {
              color:#5f82a8 !important;
              stroke:#5f82a8 !important;
            }

            /* ---------- VERIFICATION READINESS: LOGO TILE ---------- */
            .blueWorkspaceContent .readyIcon,
            .blueWorkspacePage .readyIcon {
              background:linear-gradient(145deg,#315be8,#6941e8) !important;
              color:#ffffff !important;
              border:1px solid rgba(147,197,253,.24) !important;
              box-shadow:0 10px 24px rgba(37,99,235,.20) !important;
            }

            .blueWorkspaceContent .readyIcon svg,
            .blueWorkspacePage .readyIcon svg {
              color:#ffffff !important;
              stroke:#ffffff !important;
              width:27px !important;
              height:27px !important;
            }

            /* ---------- TENDER LIBRARY: DARK LIST CARDS ---------- */
            .blueWorkspaceContent .tenderList,
            .blueWorkspaceContent .tenderListItem,
            .blueWorkspacePage .tenderList,
            .blueWorkspacePage .tenderListItem {
              background:linear-gradient(145deg,#122844,#0d1e35) !important;
              color:#5f82a8 !important;
              border-color:rgba(96,165,250,.20) !important;
            }

            .blueWorkspaceContent .tenderListItem:hover,
            .blueWorkspaceContent .tenderListItem.selected,
            .blueWorkspacePage .tenderListItem:hover,
            .blueWorkspacePage .tenderListItem.selected {
              background:linear-gradient(145deg,#17365b,#102744) !important;
              color:#5f82a8 !important;
              border-color:rgba(96,165,250,.38) !important;
              box-shadow:0 8px 24px rgba(0,0,0,.16) !important;
            }

            .blueWorkspaceContent .tenderListItem strong,
            .blueWorkspacePage .tenderListItem strong {
              color:#5f82a8 !important;
              -webkit-text-fill-color:#5f82a8 !important;
            }

            .blueWorkspaceContent .tenderListItem span,
            .blueWorkspaceContent .tenderListItem small,
            .blueWorkspacePage .tenderListItem span,
            .blueWorkspacePage .tenderListItem small {
              color:#6f91b5 !important;
              -webkit-text-fill-color:#6f91b5 !important;
            }

            .blueWorkspaceContent .tenderListIcon,
            .blueWorkspacePage .tenderListIcon {
              background:#17365b !important;
              color:#5f82a8 !important;
              border-color:rgba(96,165,250,.22) !important;
            }

            /* ---------- SIDEBAR / TASKBAR ---------- */
            .sidebar {
              background:linear-gradient(180deg,#081a31 0%,#0a2039 52%,#0b2541 100%) !important;
              border-right:1px solid rgba(96,165,250,.20) !important;
              box-shadow:10px 0 35px rgba(0,0,0,.18) !important;
            }

            .sidebar .brandMark {
              background:linear-gradient(145deg,#315be8,#6941e8) !important;
              color:#ffffff !important;
              border:1px solid rgba(147,197,253,.22) !important;
              box-shadow:0 8px 22px rgba(37,99,235,.18) !important;
            }

            .sidebar .brandMark svg {
              color:#ffffff !important;
              stroke:#ffffff !important;
            }

            .sidebar .workspaceLabel {
              color:#5f82a8 !important;
              -webkit-text-fill-color:#5f82a8 !important;
            }

            .sidebar .navItem {
              background:transparent !important;
              color:#6f91b5 !important;
              border:1px solid transparent !important;
            }

            .sidebar .navItem > span,
            .sidebar .navItem .navIcon {
              color:#6f91b5 !important;
              -webkit-text-fill-color:#6f91b5 !important;
            }

            .sidebar .navItem:hover {
              background:rgba(37,99,235,.14) !important;
              color:#5f82a8 !important;
              border-color:rgba(96,165,250,.16) !important;
            }

            .sidebar .navItem.active {
              background:linear-gradient(90deg,rgba(37,99,235,.24),rgba(59,130,246,.10)) !important;
              color:#5f82a8 !important;
              border-color:rgba(96,165,250,.28) !important;
              box-shadow:inset 3px 0 0 #2563eb !important;
            }

            .sidebar .navItem.active > span,
            .sidebar .navItem.active .navIcon {
              color:#5f82a8 !important;
              -webkit-text-fill-color:#5f82a8 !important;
            }

            .sidebar .navIcon {
              background:rgba(59,130,246,.08) !important;
              border-color:rgba(96,165,250,.12) !important;
            }

            .sidebar .systemCard {
              background:linear-gradient(145deg,#102744,#0d1e35) !important;
              border-color:rgba(96,165,250,.18) !important;
              color:#6f91b5 !important;
            }

            .sidebar .systemHeader,
            .sidebar .systemText {
              color:#6f91b5 !important;
              -webkit-text-fill-color:#6f91b5 !important;
            }

            /* =========================================================
               SIDEBAR GREY-WASH REMOVAL — FINAL DIRECT OVERRIDE
               Paint the sidebar itself dark and place a solid dark
               layer behind its existing content. This specifically
               removes the light/grey wash visible in the screenshot.
               ========================================================= */
            html body .app > aside.sidebar {
              position: relative !important;
              z-index: 20 !important;
              isolation: isolate !important;
              overflow: hidden !important;
              background: #071a2e !important;
              background-color: #071a2e !important;
              background-image: none !important;
              opacity: 1 !important;
              filter: none !important;
              mix-blend-mode: normal !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }

            html body .app > aside.sidebar::before {
              content: "" !important;
              position: absolute !important;
              inset: 0 !important;
              z-index: -1 !important;
              display: block !important;
              background: linear-gradient(180deg,#071a2e 0%,#081e35 52%,#0a243d 100%) !important;
              opacity: 1 !important;
              pointer-events: none !important;
              box-shadow: inset -1px 0 0 rgba(96,165,250,.18) !important;
            }

            html body .app > aside.sidebar::after {
              content: none !important;
              display: none !important;
            }

            html body .app > aside.sidebar > * {
              position: relative !important;
              z-index: 1 !important;
              background: transparent !important;
              background-image: none !important;
            }

            html body .app > aside.sidebar .sidebarTop,
            html body .app > aside.sidebar .sidebarBottom,
            html body .app > aside.sidebar .nav,
            html body .app > aside.sidebar .brand {
              background: transparent !important;
              background-color: transparent !important;
              background-image: none !important;
            }

            html body .app > aside.sidebar .brandName {
              color: #8fb7dc !important;
              -webkit-text-fill-color: #8fb7dc !important;
            }

            html body .app > aside.sidebar .brandSub,
            html body .app > aside.sidebar .workspaceLabel {
              color: #6197c3 !important;
              -webkit-text-fill-color: #6197c3 !important;
            }

            html body .app > aside.sidebar .navItem {
              background: #102b49 !important;
              background-image: none !important;
              color: #8fb6d8 !important;
              -webkit-text-fill-color: #8fb6d8 !important;
              border-color: rgba(96,165,250,.12) !important;
            }

            html body .app > aside.sidebar .navItem:hover {
              background: #173b60 !important;
              background-image: none !important;
              color: #c0ddf3 !important;
              -webkit-text-fill-color: #c0ddf3 !important;
            }

            html body .app > aside.sidebar .navItem.active {
              background: #1b4d7b !important;
              background-image: none !important;
              color: #d4e9f8 !important;
              -webkit-text-fill-color: #d4e9f8 !important;
              border-color: rgba(96,165,250,.35) !important;
              box-shadow: inset 3px 0 0 #55a7f7 !important;
            }

            html body .app > aside.sidebar .navItem > span,
            html body .app > aside.sidebar .navItem .navIcon {
              color: inherit !important;
              -webkit-text-fill-color: inherit !important;
            }

            html body .app > aside.sidebar .navIcon {
              background: #173a5d !important;
              border-color: rgba(96,165,250,.18) !important;
            }

            html body .app > aside.sidebar .systemCard {
              background: #0b2947 !important;
              background-image: none !important;
            }

            html body .app > aside.sidebar .profile {
              background: #102b46 !important;
              background-image: none !important;
            }



/* =========================================================
   BIDIFI ALL-PLATFORM RESPONSIVE HARDENING
   Existing components/animations preserved.
   This layer only adapts sizing, wrapping and spacing.
   ========================================================= */

html, body, #root { max-width:100%; min-width:0; overflow-x:hidden !important; }
*, *::before, *::after { box-sizing:border-box; }
img, svg, canvas, video { max-width:100%; }
button, input, textarea, select { max-width:100%; }

/* Prevent long tender/file/user values from creating horizontal overflow */
.dashboardHomePage, .app, .mainContent, .pageContent, main,
.tenderCard, .recentTender, .activityItem, .card, .panel {
  min-width:0;
}

/* Flexible grids: preserve desktop layout, collapse naturally on smaller screens */
.grid, .cardsGrid, .statsGrid, .featureGrid, .metricsGrid, .formGrid,
.requirementGrid, .reportGrid, .workspaceGrid { min-width:0; }

/* Tables remain usable instead of breaking the viewport */
.tableWrap, .tableContainer, .dataTableWrap, .reportTableWrap {
  max-width:100%;
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
}

/* Touch devices should not rely on hover to reveal important content */
@media (hover:none) and (pointer:coarse) {
  .recentTender:hover,
  .activityItem:hover,
  .navItem:hover,
  button:hover { transform:none; }
}

@media (max-width: 1100px) {
  .dashboardHomePage { padding-left:16px !important; padding-right:16px !important; }
  .bidifiCylinderHero { gap:24px !important; padding-left:28px !important; padding-right:28px !important; }
  .bidifiCylinderHeroVisual { min-width:0 !important; }
}

@media (max-width: 900px) {
  .dashboardHomePage .bidifiCylinderHero {
    grid-template-columns:minmax(0,1fr) !important;
    min-height:unset !important;
    height:auto !important;
  }
  .bidifiCylinderHeroVisual {
    width:100% !important;
    min-width:0 !important;
  }
  .bidifiAgentWave {
    width:100% !important;
    max-width:100% !important;
  }
  .featureGrid, .cardsGrid, .statsGrid, .metricsGrid, .formGrid, .requirementGrid, .reportGrid {
    grid-template-columns:repeat(2,minmax(0,1fr)) !important;
  }
}

@media (max-width: 760px) {
  .dashboardHomePage { padding-left:12px !important; padding-right:12px !important; }
  .bidifiCylinderHero {
    padding:24px 20px !important;
    border-radius:22px !important;
  }
  .featureGrid, .cardsGrid, .statsGrid, .metricsGrid, .formGrid, .requirementGrid, .reportGrid,
  .workspaceGrid { grid-template-columns:minmax(0,1fr) !important; }

  /* Keep the right animation visible, but make it fit the phone */
  .bidifiCylinderHeroVisual { min-height:360px !important; height:auto !important; }
  .bidifiAgentWave { min-height:360px !important; height:360px !important; max-height:360px !important; }

  .contactGrid, .contactSection, .contactUsGrid { grid-template-columns:minmax(0,1fr) !important; }
  .twoColumn, .twoCol, .splitLayout { grid-template-columns:minmax(0,1fr) !important; }

  input, textarea, select { width:100% !important; min-width:0 !important; }
  .buttonRow, .actionRow, .toolbar, .filterRow { flex-wrap:wrap !important; }
  .buttonRow > *, .actionRow > * { max-width:100%; }

  .bidifiChatWindow {
    left:12px !important;
    right:12px !important;
    width:auto !important;
    max-width:none !important;
    bottom:84px !important;
  }
  .bidifiChatLauncher { right:16px !important; bottom:16px !important; }
}

@media (max-width: 520px) {
  .dashboardHomePage { padding-left:8px !important; padding-right:8px !important; }
  .bidifiCylinderHero { padding:20px 14px !important; border-radius:18px !important; }
  .bidifiCylinderHeroVisual { min-height:310px !important; }
  .bidifiAgentWave { min-height:310px !important; height:310px !important; max-height:310px !important; }

  h1 { font-size:clamp(28px,8vw,42px) !important; line-height:1.05 !important; }
  h2 { font-size:clamp(22px,6vw,32px) !important; }
  h3 { font-size:clamp(18px,5vw,24px) !important; }

  .card, .panel, .sectionCard { padding-left:14px !important; padding-right:14px !important; }
  .recentTender, .activityItem { min-width:0 !important; }
  .recentTender * , .activityItem * { min-width:0; overflow-wrap:anywhere; }
}

@media (max-width: 380px) {
  .bidifiCylinderHero { padding:16px 10px !important; }
  .bidifiCylinderHeroVisual { min-height:280px !important; }
  .bidifiAgentWave { min-height:280px !important; height:280px !important; max-height:280px !important; }
  .bidifiChatWindow { left:8px !important; right:8px !important; }
  .bidifiChatLauncher { right:12px !important; bottom:12px !important; }
}

/* Landscape phones: avoid excessive vertical blocks */
@media (max-height: 600px) and (orientation:landscape) and (max-width:900px) {
  .bidifiCylinderHero { padding-top:18px !important; padding-bottom:18px !important; }
  .bidifiCylinderHeroVisual { min-height:300px !important; }
  .bidifiAgentWave { min-height:300px !important; height:300px !important; max-height:300px !important; }
}

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

            <main className={"content " + (activePage === "Home" ? "homeContent" : "blueWorkspaceContent " + (activePage === "Bid Readiness" ? "bidReadinessPage" : "blueWorkspacePage"))}>
              {pageContent}
            </main>
          </div>

          <BidifiAIChat />

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
