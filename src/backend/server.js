// ============================================================
// BIDIFI - AI BID COMPLIANCE BACKEND
// ============================================================

const path = require("path");
const fs = require("fs");

// ============================================================
// ENVIRONMENT
// ============================================================

const envPath = path.resolve(__dirname, "../../.env");

require("dotenv").config({
  path: envPath,
});

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const OpenAI = require("openai");

const app = express();

const PORT = 5000;

// ============================================================
// BASIC CONFIG
// ============================================================

app.use(cors());

app.use(
  express.json({
    limit: "30mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "30mb",
  })
);

// ============================================================
// UPLOAD DIRECTORY
// ============================================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ============================================================
// MULTER
// ============================================================

const upload = multer({
  dest: uploadDir,

  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 30,
  },

  fileFilter: (req, file, cb) => {
    const extension = path
      .extname(file.originalname || "")
      .toLowerCase();

    const allowed = [
      ".pdf",
      ".docx",
      ".txt",
    ];

    if (!allowed.includes(extension)) {
      return cb(
        new Error(
          `Unsupported file type: ${extension}. Use PDF, DOCX or TXT.`
        )
      );
    }

    cb(null, true);
  },
});

// ============================================================
// OPENAI CONFIGURATION
// ============================================================

const apiKey = process.env.OPENAI_API_KEY
  ? process.env.OPENAI_API_KEY.trim()
  : "";

const OPENAI_MODEL =
  process.env.OPENAI_MODEL?.trim() ||
  "gpt-5.6-luna";

const openai = apiKey
  ? new OpenAI({
      apiKey,
    })
  : null;

// ============================================================
// TEMPORARY MEMORY DATABASE
// ============================================================

const tenderStore = new Map();

const bidderStore = new Map();

const analysisStore = new Map();

// ============================================================
// HELPERS
// ============================================================

function createId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

// ============================================================
// CLEAN TEXT
// ============================================================

function cleanText(text) {
  if (!text) {
    return "";
  }

  return String(text)
    .replace(/\r/g, "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ============================================================
// NORMALIZE ARRAY
// ============================================================

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

// ============================================================
// SAFE NUMBER
// ============================================================

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

// ============================================================
// CLAMP NUMBER
// ============================================================

function clamp(value, min, max) {
  return Math.min(
    max,
    Math.max(min, value)
  );
}

// ============================================================
// SAFE JSON PARSER
// ============================================================

function safeJsonParse(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  let text = value.trim();

  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch (error) {}

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    const jsonText = text.substring(
      firstBrace,
      lastBrace + 1
    );

    try {
      return JSON.parse(jsonText);
    } catch (error) {}
  }

  return null;
}

// ============================================================
// DELETE TEMP FILE
// ============================================================

function deleteFile(filePath) {
  try {
    if (
      filePath &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.log(
      "Could not delete temporary file:",
      error.message
    );
  }
}

// ============================================================
// REQUIRE AI
// ============================================================

function requireAI() {
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Check the .env file at the project root."
    );
  }

  if (!openai) {
    throw new Error(
      "OpenAI client could not be initialized."
    );
  }
}

// ============================================================
// OPENAI ERROR FORMATTER
// ============================================================

function getOpenAIErrorMessage(error) {
  if (!error) {
    return "Unknown OpenAI error.";
  }

  const status = error.status;

  if (status === 400) {
    return (
      error.message ||
      "OpenAI rejected the request. Check the request or model configuration."
    );
  }

  if (status === 401) {
    return "OpenAI API key is invalid or unauthorized.";
  }

  if (status === 403) {
    return "OpenAI API access is forbidden for this API key.";
  }

  if (status === 404) {
    return (
      "OpenAI model or endpoint was not found. Check the configured model name."
    );
  }

  if (status === 429) {
    return "OpenAI API rate limit or quota exceeded.";
  }

  if (status >= 500) {
    return "OpenAI server error. Please try again.";
  }

  return (
    error.message ||
    error.error?.message ||
    "OpenAI request failed."
  );
}

// ============================================================
// FILE TEXT EXTRACTION
// ============================================================

async function extractFileContent(file) {
  if (!file) {
    throw new Error("File not found.");
  }

  const filePath = file.path;

  const originalName =
    file.originalname || "unknown";

  const extension = path
    .extname(originalName)
    .toLowerCase();

  try {
    // ========================================================
    // PDF
    // ========================================================

    if (extension === ".pdf") {
      const buffer =
        fs.readFileSync(filePath);

      const data =
        await pdfParse(buffer);

      const text =
        cleanText(data.text);

      if (
        !text ||
        text.length < 20
      ) {
        throw new Error(
          "PDF uploaded but no readable text was found. The PDF may be scanned/image-only."
        );
      }

      return {
        text,
        pages: data.numpages || 0,
        type: "pdf",
      };
    }

    // ========================================================
    // DOCX
    // ========================================================

    if (extension === ".docx") {
      const result =
        await mammoth.extractRawText({
          path: filePath,
        });

      const text =
        cleanText(result.value);

      if (
        !text ||
        text.length < 20
      ) {
        throw new Error(
          "DOCX contains too little readable text."
        );
      }

      return {
        text,
        pages: 0,
        type: "docx",
      };
    }

    // ========================================================
    // TXT
    // ========================================================

    if (extension === ".txt") {
      const text =
        cleanText(
          fs.readFileSync(
            filePath,
            "utf8"
          )
        );

      if (
        !text ||
        text.length < 20
      ) {
        throw new Error(
          "TXT file contains too little readable text."
        );
      }

      return {
        text,
        pages: 0,
        type: "txt",
      };
    }

    throw new Error(
      `Unsupported file type: ${extension}. Use PDF, DOCX or TXT.`
    );
  } finally {
    deleteFile(filePath);
  }
}

// ============================================================
// AI TENDER REQUIREMENT EXTRACTION
// ============================================================

async function extractTenderRequirementsWithAI(
  tenderText,
  filename
) {
  requireAI();

  if (
    !tenderText ||
    tenderText.length < 20
  ) {
    throw new Error(
      "Tender document contains too little readable text."
    );
  }

  const MAX_TENDER_CHARS = 120000;

  const finalTenderText =
    tenderText.length >
    MAX_TENDER_CHARS
      ? tenderText.substring(
          0,
          MAX_TENDER_CHARS
        )
      : tenderText;

  console.log("");
  console.log(
    "=============================================="
  );
  console.log(
    "AI REQUIREMENT EXTRACTION STARTED"
  );
  console.log(
    "=============================================="
  );
  console.log("File:", filename);
  console.log(
    "Text length:",
    finalTenderText.length
  );

  const prompt = `
You are BIDIFI, an expert AI government procurement
and tender compliance analyst.

Analyze the tender document below.

Identify ALL meaningful requirements that a bidder
must satisfy.

Understand the actual meaning of the tender.
Do not rely only on keywords.

Look for:

- Eligibility
- Company registration
- GST
- PAN
- Tax compliance
- Legal requirements
- Bidder experience
- Similar work experience
- Turnover
- Net worth
- Financial capability
- Technical specifications
- Product specifications
- Quantity
- Model numbers
- Brand requirements
- Certifications
- Licenses
- Quality standards
- Manpower
- Equipment
- Infrastructure
- Delivery
- Installation
- Training
- Warranty
- AMC
- Bid validity
- EMD
- Performance security
- Tender fee
- Mandatory forms
- Supporting documents
- Commercial terms
- Payment terms
- Penalties
- Contract conditions
- Any other mandatory or conditional requirement

IMPORTANT:

1. Do not invent requirements.
2. Only use information present in the tender.
3. Preserve important numbers.
4. Preserve dates.
5. Preserve thresholds.
6. Preserve quantities.
7. Preserve technical specifications.
8. Identify evidence needed to prove each requirement.
9. Include conditional requirements.
10. Include important commercial and contractual conditions.
11. If something is unclear, explain it.
12. sourceText must come from the tender.

Return ONLY valid JSON.

Use exactly this structure:

{
  "tenderSummary": "",
  "tenderTitle": "",
  "issuingAuthority": "",
  "requirements": [
    {
      "id": "REQ-001",
      "category": "",
      "title": "",
      "requirement": "",
      "threshold": "",
      "mandatory": true,
      "condition": "",
      "evidenceNeeded": [],
      "sourceText": ""
    }
  ]
}

Tender filename:
${filename}

Tender document:

${finalTenderText}
`;

  let response;

  try {
    response =
      await openai.responses.create({
        model: OPENAI_MODEL,
        input: prompt,
      });
  } catch (error) {
    console.error(
      "OPENAI REQUIREMENT ERROR:",
      error
    );

    throw new Error(
      getOpenAIErrorMessage(error)
    );
  }

  const output =
    response?.output_text || "";

  if (!output) {
    throw new Error(
      "OpenAI returned an empty response."
    );
  }

  const parsed =
    safeJsonParse(output);

  if (!parsed) {
    console.error(
      "AI RAW OUTPUT:",
      output.substring(0, 5000)
    );

    throw new Error(
      "AI returned invalid JSON while extracting requirements."
    );
  }

  parsed.requirements =
    normalizeArray(
      parsed.requirements
    );

  parsed.requirements =
    parsed.requirements.map(
      (requirement, index) => ({
        id:
          requirement.id ||
          `REQ-${String(
            index + 1
          ).padStart(3, "0")}`,

        category:
          requirement.category ||
          "General",

        title:
          requirement.title ||
          "Untitled Requirement",

        requirement:
          requirement.requirement ||
          "",

        threshold:
          requirement.threshold ||
          "",

        mandatory:
          typeof requirement.mandatory ===
          "boolean"
            ? requirement.mandatory
            : true,

        condition:
          requirement.condition ||
          "",

        evidenceNeeded:
          normalizeArray(
            requirement.evidenceNeeded
          ),

        sourceText:
          requirement.sourceText ||
          "",
      })
    );

  console.log(
    "Requirements extracted:",
    parsed.requirements.length
  );

  return parsed;
}

// ============================================================
// CALCULATE COMPLIANCE
// ============================================================

function calculateCompliance(
  requirements,
  requirementsAnalysis
) {
  const reqs =
    normalizeArray(requirements);

  const analyses =
    normalizeArray(
      requirementsAnalysis
    );

  if (reqs.length === 0) {
    return {
      compliancePercentage: 0,
      statusCounts: {},
    };
  }

  const analysisMap = new Map();

  for (const item of analyses) {
    if (
      item?.requirementId
    ) {
      analysisMap.set(
        item.requirementId,
        item
      );
    }
  }

  let compliantPoints = 0;
  let applicableRequirements = 0;

  const statusCounts = {};

  for (const requirement of reqs) {
    const analysis =
      analysisMap.get(
        requirement.id
      );

    const status =
      String(
        analysis?.status ||
          "MISSING"
      ).toUpperCase();

    statusCounts[status] =
      (statusCounts[status] || 0) + 1;

    if (
      status ===
      "NOT_APPLICABLE"
    ) {
      continue;
    }

    applicableRequirements++;

    if (
      status ===
      "COMPLIANT"
    ) {
      compliantPoints++;
    }
  }

  const compliancePercentage =
    applicableRequirements === 0
      ? 0
      : Math.round(
          (compliantPoints /
            applicableRequirements) *
            100
        );

  return {
    compliancePercentage:
      clamp(
        compliancePercentage,
        0,
        100
      ),

    statusCounts,
  };
}

// ============================================================
// CALCULATE RISK
// ============================================================

function calculateRiskScore(
  requirements,
  requirementsAnalysis,
  existingRiskScore = 0
) {
  const reqs =
    normalizeArray(requirements);

  const analyses =
    normalizeArray(
      requirementsAnalysis
    );

  let score = 0;

  const mandatoryIds =
    new Set(
      reqs
        .filter(
          (r) =>
            r &&
            r.mandatory === true
        )
        .map(
          (r) => r.id
        )
    );

  for (const item of analyses) {
    const status =
      String(
        item?.status || ""
      ).toUpperCase();

    const isMandatory =
      mandatoryIds.has(
        item?.requirementId
      );

    if (
      status ===
      "NON_COMPLIANT"
    ) {
      score +=
        isMandatory
          ? 15
          : 8;
    }

    if (
      status ===
      "MISSING"
    ) {
      score +=
        isMandatory
          ? 14
          : 6;
    }

    if (
      status ===
      "EXPIRED"
    ) {
      score +=
        isMandatory
          ? 12
          : 5;
    }

    if (
      status ===
      "MISMATCH"
    ) {
      score +=
        isMandatory
          ? 13
          : 7;
    }

    if (
      status ===
      "INCONSISTENT"
    ) {
      score +=
        isMandatory
          ? 10
          : 5;
    }

    if (
      status ===
      "NEEDS_HUMAN_REVIEW"
    ) {
      score +=
        isMandatory
          ? 5
          : 2;
    }
  }

  const aiScore =
    safeNumber(
      existingRiskScore,
      0
    );

  // Use AI score as a supporting signal,
  // not as the only source.
  score =
    Math.round(
      (score * 0.75) +
        (aiScore * 0.25)
    );

  return clamp(
    score,
    0,
    100
  );
}

// ============================================================
// RISK LEVEL
// ============================================================

function getRiskLevel(score) {
  if (score >= 70) {
    return "HIGH";
  }

  if (score >= 40) {
    return "MEDIUM";
  }

  return "LOW";
}

// ============================================================
// OVERALL DECISION
// ============================================================

function calculateOverallDecision(
  requirements,
  requirementsAnalysis
) {
  const reqs =
    normalizeArray(requirements);

  const analyses =
    normalizeArray(
      requirementsAnalysis
    );

  const mandatoryIds =
    new Set(
      reqs
        .filter(
          (r) =>
            r &&
            r.mandatory === true
        )
        .map(
          (r) => r.id
        )
    );

  let mandatoryFailure = false;
  let anyFailure = false;

  for (const item of analyses) {
    const status =
      String(
        item?.status || ""
      ).toUpperCase();

    const isMandatory =
      mandatoryIds.has(
        item?.requirementId
      );

    if (
      [
        "NON_COMPLIANT",
        "MISSING",
        "EXPIRED",
        "MISMATCH",
        "INCONSISTENT",
      ].includes(status)
    ) {
      anyFailure = true;

      if (isMandatory) {
        mandatoryFailure = true;
      }
    }
  }

  if (mandatoryFailure) {
    return "NON_COMPLIANT";
  }

  if (anyFailure) {
    return "PARTIALLY_COMPLIANT";
  }

  return "COMPLIANT";
}

// ============================================================
// AI BIDDER COMPLIANCE ANALYSIS
// ============================================================

async function analyzeBidderDocumentsWithAI(
  tender,
  bidderDocuments
) {
  requireAI();

  const requirements =
    normalizeArray(
      tender.requirements
    );

  if (
    requirements.length === 0
  ) {
    throw new Error(
      "No tender requirements found. Extract requirements first."
    );
  }

  if (
    !bidderDocuments ||
    bidderDocuments.length === 0
  ) {
    throw new Error(
      "No bidder documents uploaded."
    );
  }

  console.log("");
  console.log(
    "=============================================="
  );
  console.log(
    "AI COMPLIANCE ANALYSIS STARTED"
  );
  console.log(
    "=============================================="
  );

  // ==========================================================
  // REQUIREMENTS TEXT
  // ==========================================================

  const requirementText =
    requirements
      .map(
        (r, index) => `
REQUIREMENT ${index + 1}

ID:
${r.id}

Category:
${r.category}

Title:
${r.title}

Requirement:
${r.requirement}

Threshold:
${r.threshold || "N/A"}

Mandatory:
${r.mandatory}

Condition:
${r.condition || "None"}

Evidence Needed:
${normalizeArray(
  r.evidenceNeeded
).join(", ")}

Tender Source:
${r.sourceText || "Not provided"}
`
      )
      .join("\n");

  // ==========================================================
  // BIDDER DOCUMENT TEXT
  // ==========================================================

  const documentText =
    bidderDocuments
      .map(
        (doc, index) => `
BIDDER DOCUMENT ${index + 1}

Filename:
${doc.filename}

Type:
${doc.type}

Extracted Content:
${doc.text}
`
      )
      .join("\n");

  const MAX_BIDDER_CHARS =
    150000;

  const finalDocumentText =
    documentText.length >
    MAX_BIDDER_CHARS
      ? documentText.substring(
          0,
          MAX_BIDDER_CHARS
        )
      : documentText;

  // ==========================================================
  // PROMPT
  // ==========================================================

  const prompt = `
You are BIDIFI, an expert AI tender and bid compliance
verification engine.

Compare bidder documents against EVERY tender requirement.

Read actual document content.
Do not judge based only on filenames.

For every requirement:

1. Search all bidder documents.
2. Find relevant evidence.
3. Compare evidence with the requirement.
4. Check names.
5. Check registration numbers.
6. Check GST.
7. Check PAN.
8. Check dates.
9. Check thresholds.
10. Check quantities.
11. Check technical specifications.
12. Check experience.
13. Check turnover.
14. Check certifications.
15. Check licenses.
16. Detect missing evidence.
17. Detect expired documents.
18. Detect contradictions.
19. Detect company identity mismatch.
20. Detect unsupported claims.
21. If evidence is unclear, use NEEDS_HUMAN_REVIEW.
22. Never invent facts.

Allowed statuses:

COMPLIANT
NON_COMPLIANT
MISSING
EXPIRED
MISMATCH
INCONSISTENT
NEEDS_HUMAN_REVIEW
NOT_APPLICABLE

Definitions:

COMPLIANT:
Evidence sufficiently proves the requirement.

NON_COMPLIANT:
Evidence exists but fails the requirement.

MISSING:
Required evidence is not present.

EXPIRED:
Required document exists but appears expired.

MISMATCH:
Information does not match the requirement or bidder identity.

INCONSISTENT:
Different bidder documents contain contradictory information.

NEEDS_HUMAN_REVIEW:
Evidence is ambiguous or insufficient.

NOT_APPLICABLE:
The requirement condition does not apply.

IMPORTANT:

- Never invent facts.
- If information is not found, say:
  "Not found in submitted documents."
- Evidence must come from bidder documents.
- Include the exact filename whenever possible.
- Keep excerpts short.
- Compare numbers carefully.
- Compare dates carefully.
- Compare company names carefully.
- Treat mandatory requirements seriously.
- If a requirement is conditional and the condition is not triggered,
  use NOT_APPLICABLE.
- Confidence must be between 0 and 100.

Return ONLY valid JSON.

Use exactly this structure:

{
  "bidderSummary": {
    "companyName": "",
    "registrationNumber": "",
    "gstNumber": "",
    "panNumber": "",
    "address": "",
    "authorizedPerson": ""
  },

  "overallDecision": "",

  "compliancePercentage": 0,

  "riskScore": 0,

  "riskLevel": "",

  "requirementsAnalysis": [
    {
      "requirementId": "",
      "category": "",
      "requirementTitle": "",
      "status": "",
      "compliant": false,
      "severity": "",
      "evidence": [
        {
          "document": "",
          "excerpt": ""
        }
      ],
      "comparison": "",
      "reason": "",
      "confidence": 0
    }
  ],

  "documentIssues": [
    {
      "document": "",
      "issue": "",
      "severity": "",
      "reason": ""
    }
  ],

  "missingDocuments": [
    {
      "document": "",
      "reason": "",
      "relatedRequirement": ""
    }
  ],

  "criticalFindings": [
    {
      "finding": "",
      "severity": "",
      "relatedRequirement": ""
    }
  ],

  "recommendations": [
    ""
  ]
}

TENDER REQUIREMENTS:

${requirementText}

BIDDER DOCUMENTS:

${finalDocumentText}
`;

  let response;

  try {
    console.log(
      "Sending bidder documents to OpenAI..."
    );

    response =
      await openai.responses.create({
        model: OPENAI_MODEL,
        input: prompt,
      });

    console.log(
      "Compliance AI response received."
    );
  } catch (error) {
    console.error(
      "OPENAI COMPLIANCE ERROR:",
      error
    );

    throw new Error(
      getOpenAIErrorMessage(error)
    );
  }

  const output =
    response?.output_text || "";

  if (!output) {
    throw new Error(
      "OpenAI returned an empty compliance analysis."
    );
  }

  const parsed =
    safeJsonParse(output);

  if (!parsed) {
    console.error(
      "AI COMPLIANCE RAW OUTPUT:",
      output.substring(0, 5000)
    );

    throw new Error(
      "AI returned invalid JSON while analyzing bidder documents."
    );
  }

  // ==========================================================
  // NORMALIZE RESULT
  // ==========================================================

  parsed.bidderSummary =
    parsed.bidderSummary &&
    typeof parsed.bidderSummary ===
      "object"
      ? parsed.bidderSummary
      : {};

  parsed.requirementsAnalysis =
    normalizeArray(
      parsed.requirementsAnalysis
    );

  parsed.documentIssues =
    normalizeArray(
      parsed.documentIssues
    );

  parsed.missingDocuments =
    normalizeArray(
      parsed.missingDocuments
    );

  parsed.criticalFindings =
    normalizeArray(
      parsed.criticalFindings
    );

  parsed.recommendations =
    normalizeArray(
      parsed.recommendations
    );

  // ==========================================================
  // NORMALIZE REQUIREMENT ANALYSIS
  // ==========================================================

  parsed.requirementsAnalysis =
    parsed.requirementsAnalysis.map(
      (item) => {
        const status =
          String(
            item?.status ||
              "NEEDS_HUMAN_REVIEW"
          ).toUpperCase();

        return {
          requirementId:
            item?.requirementId ||
            "",

          category:
            item?.category ||
            "General",

          requirementTitle:
            item?.requirementTitle ||
            "",

          status,

          compliant:
            status ===
            "COMPLIANT",

          severity:
            item?.severity ||
            (
              status ===
              "COMPLIANT"
                ? "LOW"
                : "MEDIUM"
            ),

          evidence:
            normalizeArray(
              item?.evidence
            ),

          comparison:
            item?.comparison ||
            "",

          reason:
            item?.reason ||
            "",

          confidence:
            clamp(
              safeNumber(
                item?.confidence,
                0
              ),
              0,
              100
            ),
        };
      }
    );

  // ==========================================================
  // CALCULATE REAL COMPLIANCE
  // ==========================================================

  const compliance =
    calculateCompliance(
      requirements,
      parsed.requirementsAnalysis
    );

  // ==========================================================
  // CALCULATE REAL RISK
  // ==========================================================

  const riskScore =
    calculateRiskScore(
      requirements,
      parsed.requirementsAnalysis,
      parsed.riskScore
    );

  // ==========================================================
  // CALCULATE DECISION
  // ==========================================================

  const overallDecision =
    calculateOverallDecision(
      requirements,
      parsed.requirementsAnalysis
    );

  const riskLevel =
    getRiskLevel(
      riskScore
    );

  parsed.compliancePercentage =
    compliance.compliancePercentage;

  parsed.riskScore =
    riskScore;

  parsed.riskLevel =
    riskLevel;

  parsed.overallDecision =
    overallDecision;

  parsed.statusCounts =
    compliance.statusCounts;

  console.log(
    "Compliance:",
    parsed.compliancePercentage + "%"
  );

  console.log(
    "Risk score:",
    parsed.riskScore
  );

  console.log(
    "Risk level:",
    parsed.riskLevel
  );

  console.log(
    "Decision:",
    parsed.overallDecision
  );

  console.log(
    "=============================================="
  );

  console.log(
    "AI COMPLIANCE ANALYSIS COMPLETED"
  );

  console.log(
    "=============================================="
  );

  return parsed;
}

// ============================================================
// HOME
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,

    project: "BIDIFI",

    message:
      "AI Bid Compliance Backend is running.",

    port: PORT,

    model:
      OPENAI_MODEL,
  });
});

// ============================================================
// API STATUS
// ============================================================

app.get(
  "/api/status",
  (req, res) => {
    res.json({
      success: true,

      backend: "online",

      aiConfigured:
        Boolean(apiKey),

      aiEngine:
        apiKey
          ? "CONNECTED"
          : "NOT_CONFIGURED",

      model:
        OPENAI_MODEL,

      envFile:
        envPath,

      tenders:
        tenderStore.size,

      bidders:
        bidderStore.size,

      analyses:
        analysisStore.size,

      timestamp:
        new Date().toISOString(),
    });
  }
);

// ============================================================
// UPLOAD MULTIPLE TENDERS
// ============================================================

app.post(
  "/api/upload-tenders",
  upload.array("tenders", 10),

  async (req, res) => {
    const files =
      req.files || [];

    if (
      files.length === 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "No tender files uploaded.",
      });
    }

    const uploaded = [];

    try {
      for (
        const file of files
      ) {
        try {
          const content =
            await extractFileContent(
              file
            );

          const tenderId =
            createId("tender");

          const tender = {
            id:
              tenderId,

            filename:
              file.originalname,

            name:
              file.originalname,

            text:
              content.text,

            pages:
              content.pages,

            type:
              content.type,

            requirements: [],

            uploadedAt:
              new Date().toISOString(),
          };

          tenderStore.set(
            tenderId,
            tender
          );

          uploaded.push({
            id:
              tenderId,

            filename:
              tender.filename,

            name:
              tender.name,

            pages:
              tender.pages,

            textLength:
              tender.text.length,

            status:
              "UPLOADED",
          });

          console.log(
            `Tender uploaded: ${file.originalname}`
          );
        } catch (error) {
          console.error(
            "Tender file error:",
            error.message
          );

          uploaded.push({
            filename:
              file.originalname,

            status:
              "ERROR",

            error:
              error.message,
          });
        }
      }

      return res.json({
        success: true,

        message:
          "Tender documents uploaded successfully.",

        tenders:
          uploaded,
      });
    } catch (error) {
      console.error(
        "Tender upload error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  }
);

// ============================================================
// SINGLE TENDER UPLOAD
// ============================================================

app.post(
  "/api/upload-tender",
  upload.single("tender"),

  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,

        message:
          "No tender file uploaded.",
      });
    }

    try {
      const content =
        await extractFileContent(
          req.file
        );

      const tenderId =
        createId("tender");

      const tender = {
        id:
          tenderId,

        filename:
          req.file.originalname,

        name:
          req.file.originalname,

        text:
          content.text,

        pages:
          content.pages,

        type:
          content.type,

        requirements: [],

        uploadedAt:
          new Date().toISOString(),
      };

      tenderStore.set(
        tenderId,
        tender
      );

      console.log(
        "TENDER UPLOAD SUCCESS"
      );

      console.log(
        "File:",
        tender.filename
      );

      console.log(
        "Tender ID:",
        tender.id
      );

      return res.json({
        success: true,

        tender: {
          id:
            tender.id,

          filename:
            tender.filename,

          name:
            tender.name,

          pages:
            tender.pages,

          textLength:
            tender.text.length,

          status:
            "UPLOADED",
        },
      });
    } catch (error) {
      console.error(
        "Single tender upload error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  }
);

// ============================================================
// EXTRACT REQUIREMENTS
// ============================================================

app.post(
  "/api/extract-requirements",

  async (req, res) => {
    try {
      const {
        tenderId,
        tenderName,
        text,
      } = req.body || {};

      let tender = null;

      // ======================================================
      // FIND BY ID
      // ======================================================

      if (
        tenderId &&
        tenderStore.has(tenderId)
      ) {
        tender =
          tenderStore.get(
            tenderId
          );
      }

      // ======================================================
      // FIND BY NAME
      // ======================================================

      if (
        !tender &&
        tenderName
      ) {
        for (
          const item
          of tenderStore.values()
        ) {
          if (
            item.name ===
              tenderName ||
            item.filename ===
              tenderName
          ) {
            tender = item;
            break;
          }
        }
      }

      // ======================================================
      // FALLBACK TEXT
      // ======================================================

      const tenderText =
        tender
          ? tender.text
          : text;

      if (!tenderText) {
        return res.status(400).json({
          success: false,

          message:
            "Tender text not found. Provide tenderId, tenderName or text.",
        });
      }

      if (
        tenderText.length < 20
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Tender text is too short for AI extraction.",
        });
      }

      const filename =
        tender?.filename ||
        tenderName ||
        "Tender Document";

      // ======================================================
      // AI
      // ======================================================

      const aiResult =
        await extractTenderRequirementsWithAI(
          tenderText,
          filename
        );

      // ======================================================
      // SAVE
      // ======================================================

      if (tender) {
        tender.requirements =
          aiResult.requirements;

        tender.aiExtraction =
          aiResult;

        tenderStore.set(
          tender.id,
          tender
        );
      }

      return res.json({
        success: true,

        tenderId:
          tender?.id || null,

        ...aiResult,
      });
    } catch (error) {
      console.error(
        "Requirement extraction failed:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Requirement extraction failed.",

        error: {
          name:
            error?.name ||
            null,

          status:
            error?.status ||
            null,

          code:
            error?.code ||
            null,

          type:
            error?.type ||
            null,
        },
      });
    }
  }
);

// ============================================================
// GET TENDER
// ============================================================

app.get(
  "/api/tenders/:id",

  (req, res) => {
    const tender =
      tenderStore.get(
        req.params.id
      );

    if (!tender) {
      return res.status(404).json({
        success: false,

        message:
          "Tender not found.",
      });
    }

    const safeTender = {
      ...tender,
    };

    delete safeTender.text;

    return res.json({
      success: true,

      tender:
        safeTender,
    });
  }
);

// ============================================================
// UPLOAD BIDDER DOCUMENTS
// ============================================================

app.post(
  "/api/upload-bidder-documents",

  upload.array(
    "documents",
    30
  ),

  async (req, res) => {
    const files =
      req.files || [];

    if (
      files.length === 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "No bidder documents uploaded.",
      });
    }

    const bidderId =
      createId("bidder");

    const documents = [];

    const errors = [];

    for (
      const file of files
    ) {
      try {
        const content =
          await extractFileContent(
            file
          );

        documents.push({
          id:
            createId("doc"),

          filename:
            file.originalname,

          type:
            content.type,

          pages:
            content.pages,

          text:
            content.text,

          uploadedAt:
            new Date().toISOString(),
        });
      } catch (error) {
        console.error(
          `Bidder document error (${file.originalname}):`,
          error.message
        );

        errors.push({
          filename:
            file.originalname,

          error:
            error.message,
        });
      }
    }

    if (
      documents.length === 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "None of the bidder documents could be read.",

        errors,
      });
    }

    bidderStore.set(
      bidderId,
      {
        id:
          bidderId,

        documents,

        createdAt:
          new Date().toISOString(),
      }
    );

    return res.json({
      success: true,

      bidderId,

      documentCount:
        documents.length,

      documents:
        documents.map(
          (doc) => ({
            id:
              doc.id,

            filename:
              doc.filename,

            type:
              doc.type,

            pages:
              doc.pages,

            textLength:
              doc.text.length,
          })
        ),

      errors,
    });
  }
);

// ============================================================
// ANALYZE COMPLIANCE
// ============================================================

app.post(
  "/api/analyze-compliance",

  async (req, res) => {
    try {
      const {
        tenderId,
        bidderId,
      } = req.body || {};

      if (!tenderId) {
        return res.status(400).json({
          success: false,

          message:
            "tenderId is required.",
        });
      }

      if (!bidderId) {
        return res.status(400).json({
          success: false,

          message:
            "bidderId is required.",
        });
      }

      const tender =
        tenderStore.get(
          tenderId
        );

      const bidder =
        bidderStore.get(
          bidderId
        );

      if (!tender) {
        return res.status(404).json({
          success: false,

          message:
            "Tender not found.",
        });
      }

      if (!bidder) {
        return res.status(404).json({
          success: false,

          message:
            "Bidder documents not found.",
        });
      }

      if (
        !tender.requirements ||
        tender.requirements.length ===
          0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Tender requirements have not been extracted yet.",
        });
      }

      if (
        !bidder.documents ||
        bidder.documents.length ===
          0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "No bidder documents available for analysis.",
        });
      }

      console.log("");
      console.log(
        "=============================================="
      );
      console.log(
        "STARTING BID COMPLIANCE ANALYSIS"
      );
      console.log(
        "=============================================="
      );

      const result =
        await analyzeBidderDocumentsWithAI(
          tender,
          bidder.documents
        );

      const analysisId =
        createId("analysis");

      const analysis = {
        id:
          analysisId,

        tenderId,

        bidderId,

        tenderName:
          tender.name,

        createdAt:
          new Date().toISOString(),

        result,
      };

      analysisStore.set(
        analysisId,
        analysis
      );

      return res.json({
        success: true,

        analysisId,

        ...result,
      });
    } catch (error) {
      console.error(
        "Compliance analysis error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Compliance analysis failed.",
      });
    }
  }
);

// ============================================================
// GET ANALYSIS
// ============================================================

app.get(
  "/api/analysis/:id",

  (req, res) => {
    const analysis =
      analysisStore.get(
        req.params.id
      );

    if (!analysis) {
      return res.status(404).json({
        success: false,

        message:
          "Analysis not found.",
      });
    }

    return res.json({
      success: true,

      analysis,
    });
  }
);

// ============================================================
// WORKSPACE
// ============================================================

app.get(
  "/api/workspace",

  (req, res) => {
    const tenders =
      Array.from(
        tenderStore.values()
      ).map(
        (tender) => ({
          id:
            tender.id,

          name:
            tender.name,

          filename:
            tender.filename,

          pages:
            tender.pages,

          requirementCount:
            tender.requirements
              ?.length || 0,

          uploadedAt:
            tender.uploadedAt,
        })
      );

    const bidders =
      Array.from(
        bidderStore.values()
      ).map(
        (bidder) => ({
          id:
            bidder.id,

          documentCount:
            bidder.documents
              ?.length || 0,

          createdAt:
            bidder.createdAt,
        })
      );

    const analyses =
      Array.from(
        analysisStore.values()
      ).map(
        (analysis) => ({
          id:
            analysis.id,

          tenderId:
            analysis.tenderId,

          bidderId:
            analysis.bidderId,

          tenderName:
            analysis.tenderName,

          createdAt:
            analysis.createdAt,

          overallDecision:
            analysis.result
              ?.overallDecision,

          compliancePercentage:
            analysis.result
              ?.compliancePercentage,

          riskScore:
            analysis.result
              ?.riskScore,

          riskLevel:
            analysis.result
              ?.riskLevel,
        })
      );

    return res.json({
      success: true,

      tenders,

      bidders,

      analyses,
    });
  }
);

// ============================================================
// EXPLICIT GET ERROR
// ============================================================

app.get(
  "/api/extract-requirements",

  (req, res) => {
    return res.status(405).json({
      success: false,

      message:
        "This endpoint requires POST. Do not open /api/extract-requirements directly in the browser.",
    });
  }
);

// ============================================================
// MULTER / FILE ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      return res.status(400).json({
        success: false,

        message:
          `Upload error: ${error.message}`,
      });
    }

    if (
      error &&
      error.message &&
      error.message.startsWith(
        "Unsupported file type"
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          error.message,
      });
    }

    next(error);
  }
);

// ============================================================
// 404
// ============================================================

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,

      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "GLOBAL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Internal server error.",
    });
  }
);

// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,

  () => {
    console.log("");

    console.log(
      "=============================================="
    );

    console.log(
      "       BIDIFI AI COMPLIANCE ENGINE"
    );

    console.log(
      "=============================================="
    );

    console.log(
      `Backend: http://localhost:${PORT}`
    );

    console.log(
      "Environment file:"
    );

    console.log(
      envPath
    );

    console.log(
      `Environment file exists: ${fs.existsSync(
        envPath
      )}`
    );

    console.log(
      `AI Engine: ${
        apiKey
          ? "CONNECTED"
          : "NOT CONFIGURED"
      }`
    );

    console.log(
      `AI Model: ${OPENAI_MODEL}`
    );

    console.log(
      `API key loaded: ${
        apiKey ? "YES" : "NO"
      }`
    );

    console.log(
      "=============================================="
    );

    console.log("");
  }
);