import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

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
  if (!analysis) return 0;

  const directScore = Number(analysis.riskScore);

  if (Number.isFinite(directScore)) {
    return Math.round(clamp(directScore));
  }

  const items = Array.isArray(
    analysis.requirementsAnalysis
  )
    ? analysis.requirementsAnalysis
    : [];

  let score = 0;

  items.forEach((rawItem) => {
    const item = normalizeAnalysisItem(rawItem);

    const status = safeText(
      item.status ||
        (item.compliant ? "COMPLIANT" : "REVIEW")
    ).toUpperCase();

    if (status.includes("CRITICAL")) score += 25;
    else if (status.includes("NON_COMPLIANT")) score += 20;
    else if (status.includes("MISSING")) score += 15;
    else if (status.includes("EXPIRED")) score += 15;
    else if (status.includes("MISMATCH")) score += 12;
    else if (status.includes("NEEDS_HUMAN_REVIEW")) score += 8;
  });

  return Math.round(clamp(score));
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

function getEvidenceText(item) {
  if (!item) return "";

  if (typeof item === "string") {
    return item;
  }

  if (Array.isArray(item)) {
    return item
      .map((entry) => safeText(entry, ""))
      .filter(Boolean)
      .join(", ");
  }

  return (
    safeText(item?.excerpt) ||
    safeText(item?.text) ||
    safeText(item?.evidence) ||
    safeText(item?.document) ||
    safeText(item?.fileName) ||
    safeText(item?.filename) ||
    ""
  );
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
  const response = await fetch(url, options);

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Server returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      safeText(
        data?.error ||
          data?.message ||
          `Request failed with status ${response.status}.`
      )
    );
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
   SIDEBAR
========================================================= */

function Sidebar({
  activePage,
  navigate,
  mobileMenu,
  closeMobile,
  backendOnline,
}) {
  const items = [
    { name: "Dashboard", icon: "dashboard" },
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
            <div className="brandName">BIDIFI</div>
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
          className="navItem"
          onClick={() =>
            window.alert(
              "Settings module is reserved for the next BIDIFI release."
            )
          }
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
          <div className="profileAvatar">
            P
          </div>

          <div>
            <strong>Procurement User</strong>
            <span>Administrator</span>
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
}) {
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
        <div className="searchBox">
          <Icon name="search" size={16} />

          <input
            type="text"
            placeholder="Search workspace..."
            readOnly
          />

          <kbd>⌘ K</kbd>
        </div>

        <button
          className="iconButton"
          title="Notifications"
        >
          <Icon name="bell" size={17} />

          {hasAnalysis && (
            <span className="notificationDot" />
          )}
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
}) {
  const risk = calculateRisk(analysis);

  return (
    <>
      <PageHeader
        eyebrow="AI PROCUREMENT WORKSPACE"
        title="Good to see you."
        description="Review tenders, validate bidder evidence, and turn complex procurement documents into clear decisions."
      />

      <section className="dashboardHero">
        <div className="heroContent">
          <span className="heroEyebrow">
            <Icon name="ai" size={13} />
            AI-POWERED COMPLIANCE
          </span>

          <h2>
            Turn complex tender documents into clear
            decisions.
          </h2>

          <p>
            BIDIFI extracts requirements, checks bidder
            evidence, calculates compliance risk, and
            prepares a decision-ready report.
          </p>

          <div className="heroActions">
            <button
              className="heroButton"
              onClick={() =>
                navigate("Tenders")
              }
            >
              Start verification
              <Icon name="arrow" size={15} />
            </button>

            <button
              className="heroSecondary"
              onClick={() =>
                navigate("Reports")
              }
            >
              View reports
            </button>
          </div>
        </div>

        <div className="heroVisual">
          <div className="aiOrb">
            <div className="aiOrbCore">
              <Icon name="ai" size={28} />
            </div>
          </div>

          <div className="floatingCard floatingTop">
            <span>
              <Icon name="check" size={12} />
            </span>

            <div>
              <strong>
                Requirement matched
              </strong>

              <small>
                AI evidence check
              </small>
            </div>
          </div>

          <div className="floatingCard floatingBottom">
            <span>
              <Icon name="warning" size={12} />
            </span>

            <div>
              <strong>
                Risk identified
              </strong>

              <small>
                Requires review
              </small>
            </div>
          </div>
        </div>
      </section>

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
                        {tender.requirements
                          ?.length || 0}{" "}
                        requirements
                        {" · "}
                        {tender.uploadedAt
                          ? new Date(
                              tender.uploadedAt
                            ).toLocaleDateString()
                          : "Recently uploaded"}
                      </span>
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
    </>
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
                      {tender.requirements
                        ?.length || 0}{" "}
                      requirements
                      {" · "}
                      {tender.uploadedAt
                        ? new Date(
                            tender.uploadedAt
                          ).toLocaleDateString()
                        : "Recently"}
                    </span>
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
            disabled={
              loading.analysis ||
              !tenderReady ||
              !requirementsReady ||
              !bidderReady
            }
            onClick={
              analyzeCompliance
            }
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
                const risk = calculateRisk(itemAnalysis);
                const status = item.success
                  ? compliance >= 80
                    ? "COMPLIANT"
                    : compliance >= 60
                    ? "REVIEW"
                    : "NON_COMPLIANT"
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

  const compliance = clamp(
    normalizeNumber(
      analysis.compliancePercentage ??
        analysis.compliancePercent,
      0
    )
  );

  const risk = calculateRisk(
    analysis
  );

  const riskLevel = safeText(
    analysis.riskLevel ||
      riskLevelFromScore(risk),
    riskLevelFromScore(risk)
  ).toUpperCase();

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
    items.filter((item) => {
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
    items.filter((item) => {
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
              safeArray(
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

                      <p>
                        {text}
                      </p>
                    </div>
                  );
                }
              )
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

  const status = safeText(
    normalizedItem.status ||
      (normalizedItem.compliant === true
        ? "COMPLIANT"
        : "REVIEW"),
    "REVIEW"
  );

  const evidence =
    getEvidenceText(
      normalizedItem.evidence
    ) ||
    getEvidenceText(
      normalizedItem.matchedEvidence
    ) ||
    getEvidenceText(
      normalizedItem.document
    ) ||
    getEvidenceText(
      normalizedItem
    );

  const confidence =
    normalizeNumber(
      normalizedItem.confidence ??
        normalizedItem.matchConfidence ??
        normalizedItem.confidenceScore,
      NaN
    );

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

  const fileName =
    safeText(
      normalizedItem.fileName ||
        normalizedItem.filename ||
        normalizedItem.documentName,
      "Bidder evidence"
    );

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
          <strong>
            {title}
          </strong>

          <StatusBadge
            status={status}
          />
        </div>

        <p>
          {description}
        </p>
      </div>

      <div className="evidenceMatch">
        <div className="matchLabel">
          <Icon
            name="file"
            size={12}
          />
          Matched evidence
        </div>

        {evidence ? (
          <div className="evidenceExcerpt">
            <strong>
              {safeText(
                evidence
              )}
            </strong>

            <span>
              {fileName}
            </span>
          </div>
        ) : (
          <span className="noEvidence">
            No supporting evidence
            found.
          </span>
        )}
      </div>

      <div className="evidenceDecision">
        <StatusBadge
          status={status}
        />

        {Number.isFinite(
          confidence
        ) && (
          <small>
            Confidence{" "}
            {Math.round(
              clamp(
                confidence
              )
            )}
            %
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

  const compliance = clamp(
    normalizeNumber(
      analysis.compliancePercentage ??
        analysis.compliancePercent
    )
  );

  const risk =
    calculateRisk(analysis);

  const items = safeArray(
    analysis.requirementsAnalysis
  ).map((item, index) =>
    normalizeAnalysisItem(
      item,
      index
    )
  );

  const missing = safeArray(
    analysis.missingDocuments
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
    safeText(
      analysis.bidderSummary ||
        analysis.summary,
      "The AI engine reviewed the available bidder evidence against the tender requirements and generated a compliance assessment."
    );

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
                items.filter(
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
              value={safeText(
                analysis.overallDecision,
                "Review"
              )}
            />

            <ProfileRow
              label="Risk level"
              value={safeText(
                analysis.riskLevel,
                riskLevelFromScore(
                  risk
                )
              )}
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
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [backendOnline, setBackendOnline] =
    useState(false);

  const [tenders, setTenders] =
    useState([]);

  const [selectedTender, setSelectedTender] =
    useState(null);

  const [
    selectedTenderFiles,
    setSelectedTenderFiles,
  ] = useState([]);

  const [requirements, setRequirements] =
    useState([]);

  const [
    bidderDocuments,
    setBidderDocuments,
  ] = useState([]);

  const [
    bidderDocumentCount,
    setBidderDocumentCount,
  ] = useState(0);

  const [bidderId, setBidderId] =
    useState(null);

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

  const tenderInputRef =
    useRef(null);

  const bidderInputRef =
    useRef(null);

  /* =======================================================
     ALERTS
  ======================================================= */

  function clearAlerts() {
    setMessage("");
    setError("");
  }

  function showMessage(text) {
    setError("");
    setMessage(safeText(text));

    window.setTimeout(() => {
      setMessage("");
    }, 5000);
  }

  function showError(text) {
    setMessage("");
    setError(
      safeText(
        text,
        "Something went wrong."
      )
    );

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

      if (
        Array.isArray(
          data.tenders
        )
      ) {
        setTenders(
          data.tenders
        );
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
              setSelectedTender(
                tender
              );

              if (
                Array.isArray(
                  tender.requirements
                )
              ) {
                setRequirements(
                  tender.requirements
                );
              }
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
      setSelectedTenderFiles(
        valid
      );

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
    if (
      !selectedTenderFiles.length
    ) {
      showError(
        "Please select at least one tender PDF."
      );

      return;
    }

    setLoading((prev) => ({
      ...prev,
      tender: true,
    }));

    clearAlerts();

    try {
      const formData =
        new FormData();

      selectedTenderFiles.forEach(
        (file) => {
          formData.append(
            "tenders",
            file
          );
        }
      );

      const data =
        await fetchJson(
          `${API_URL}/api/upload-tenders`,
          {
            method: "POST",
            body: formData,
          }
        );

      const uploaded =
        Array.isArray(
          data.tenders
        )
          ? data.tenders
          : Array.isArray(
              data.files
            )
          ? data.files
          : [];

      if (!uploaded.length) {
        throw new Error(
          "Upload succeeded but no tender record was returned."
        );
      }

      setTenders(
        (prev) => {
          const existingIds =
            new Set(
              prev.map(
                (item) =>
                  item.id
              )
            );

          return [
            ...uploaded.filter(
              (item) =>
                !existingIds.has(
                  item.id
                )
            ),
            ...prev,
          ];
        }
      );

      const firstTender =
        uploaded[0];

      setSelectedTender(
        firstTender
      );

      setRequirements(
        Array.isArray(
          firstTender.requirements
        )
          ? firstTender.requirements
          : []
      );

      setAnalysis(null);

      setSelectedTenderFiles(
        []
      );

      showMessage(
        `${uploaded.length} tender${
          uploaded.length ===
          1
            ? ""
            : "s"
        } uploaded successfully.`
      );
    } catch (err) {
      showError(
        err.message ||
          "Tender upload failed. Check that the backend is running."
      );
    } finally {
      setLoading((prev) => ({
        ...prev,
        tender: false,
      }));
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

    if (valid.length) {
      setBidderDocuments(
        (prev) => [
          ...prev,
          ...valid,
        ]
      );

      clearAlerts();
    }
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

  async function uploadBidderDocuments() {
    if (
      !bidderDocuments.length
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

      bidderDocuments.forEach(
        (file) => {
          formData.append(
            "documents",
            file
          );
        }
      );

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
          bidderDocuments.length
      );

      showMessage(
        `${
          count ||
          bidderDocuments.length
        } bidder document${
          (count ||
            bidderDocuments.length) ===
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

          const normalized = {
            ...result,
            bidderId: newBidderId,
            bidderName: bidder.name || "Unnamed Bidder",
            documentCount: bidder.documents.length,
            compliancePercentage: clamp(
              normalizeNumber(
                result.compliancePercentage ?? result.compliancePercent
              )
            ),
            riskScore: clamp(
              normalizeNumber(
                result.riskScore,
                calculateRisk(result)
              )
            ),
            requirementsAnalysis: safeArray(result.requirementsAnalysis),
            missingDocuments: safeArray(result.missingDocuments),
            criticalFindings: safeArray(result.criticalFindings),
            recommendations: safeArray(result.recommendations),
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

      const normalized = {
        ...result,

        compliancePercentage:
          clamp(
            normalizeNumber(
              result.compliancePercentage ??
                result.compliancePercent
            )
          ),

        riskScore: clamp(
          normalizeNumber(
            result.riskScore,
            calculateRisk(
              result
            )
          )
        ),

        requirementsAnalysis:
          safeArray(
            result.requirementsAnalysis
          ),

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
              tenderInputRef={
                tenderInputRef
              }
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
              analyzeAllBids={
                analyzeAllBids
              }
            />
          );

        case "AI Verification":
          return (
            <VerificationPage
              analysis={analysis}
              navigate={navigate}
            />
          );

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
    ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        navigate={navigate}
        mobileMenu={mobileMenu}
        closeMobile={() =>
          setMobileMenu(false)
        }
        backendOnline={
          backendOnline
        }
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
          hasAnalysis={Boolean(
            analysis
          )}
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
  );
}