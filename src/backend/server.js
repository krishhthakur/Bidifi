// ============================================================
// BIDIFI - AI BID COMPLIANCE BACKEND
// ============================================================

// IMPORTANT:
// .env is located at:
// C:\Users\krish\programs\bidifi\.env
//
// server.js is located at:
// C:\Users\krish\programs\bidifi\src\backend\server.js
//
// Therefore we explicitly load ../../.env

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
  },
});

// ============================================================
// OPENAI CONFIGURATION
// ============================================================

const apiKey = process.env.OPENAI_API_KEY
  ? process.env.OPENAI_API_KEY.trim()
  : "";

const openai = apiKey
  ? new OpenAI({
      apiKey: apiKey,
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

// ------------------------------------------------------------
// Clean extracted text
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Safe array
// ------------------------------------------------------------

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
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

  // Remove markdown fences
  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Direct JSON parse
  try {
    return JSON.parse(text);
  } catch (error) {}

  // Find JSON object inside response
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
// DELETE TEMPORARY FILE
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
    return (
      "OpenAI API key is invalid or unauthorized."
    );
  }

  if (status === 403) {
    return (
      "OpenAI API access is forbidden for this API key."
    );
  }

  if (status === 404) {
    return (
      "OpenAI model or endpoint was not found. Check the configured model name."
    );
  }

  if (status === 429) {
    return (
      "OpenAI API rate limit or quota exceeded."
    );
  }

  if (status >= 500) {
    return (
      "OpenAI server error. Please try again."
    );
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

        pages:
          data.numpages || 0,

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

  console.log(
    "File:",
    filename
  );

  console.log(
    "Text length:",
    tenderText.length
  );

  console.log(
    "=============================================="
  );

  // Keep request within reasonable size
  const MAX_TENDER_CHARS = 120000;

  let finalTenderText =
    tenderText;

  if (
    tenderText.length >
    MAX_TENDER_CHARS
  ) {
    console.log(
      `Tender text truncated from ${tenderText.length} to ${MAX_TENDER_CHARS} characters.`
    );

    finalTenderText =
      tenderText.substring(
        0,
        MAX_TENDER_CHARS
      );
  }

  // ==========================================================
  // PROMPT
  // ==========================================================

  const prompt = `
You are BIDIFI, an expert AI government procurement
and tender compliance analyst.

Analyze the tender document below.

Your objective is to identify ALL meaningful requirements
that a bidder must satisfy.

Do not rely only on keywords.
Understand the actual meaning of the tender.

Look for requirements involving:

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
3. Preserve important numbers, dates, thresholds and conditions.
4. If a requirement has a financial threshold, include it.
5. If a requirement has a date, include it.
6. If a requirement has a quantity, include it.
7. If a requirement has a technical specification, include it.
8. Identify documents/evidence needed to prove each requirement.
9. Include conditional requirements.
10. Include important commercial and contractual conditions.
11. If something is unclear, explain it instead of guessing.
12. sourceText must be a short relevant excerpt from the tender.

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

  // ==========================================================
  // OPENAI REQUEST
  // ==========================================================

  let response;

  try {
    console.log(
      "Sending tender to OpenAI..."
    );

    response =
      await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
      });

    console.log(
      "OpenAI request completed."
    );
  } catch (error) {
    console.error("");
    console.error(
      "=============================================="
    );
    console.error(
      "OPENAI API ERROR"
    );
    console.error(
      "=============================================="
    );

    console.error(
      "Name:",
      error?.name
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Code:",
      error?.code
    );

    console.error(
      "Type:",
      error?.type
    );

    console.error(
      "=============================================="
    );

    throw new Error(
      getOpenAIErrorMessage(error)
    );
  }

  // ==========================================================
  // READ RESPONSE
  // ==========================================================

  const output =
    response?.output_text || "";

  console.log(
    "AI response received."
  );

  console.log(
    "AI output length:",
    output.length
  );

  if (!output) {
    throw new Error(
      "OpenAI returned an empty response."
    );
  }

  // ==========================================================
  // PARSE JSON
  // ==========================================================

  const parsed =
    safeJsonParse(output);

  if (!parsed) {
    console.error(
      "AI RAW OUTPUT:"
    );

    console.error(
      output.substring(0, 5000)
    );

    throw new Error(
      "AI returned invalid JSON while extracting requirements."
    );
  }

  // ==========================================================
  // NORMALIZE RESULT
  // ==========================================================

  if (
    !Array.isArray(
      parsed.requirements
    )
  ) {
    parsed.requirements = [];
  }

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

  console.log(
    "=============================================="
  );

  console.log(
    "AI EXTRACTION COMPLETED"
  );

  console.log(
    "=============================================="
  );

  console.log("");

  return parsed;
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
Evidence is ambiguous or insufficient for a reliable automated decision.

NOT_APPLICABLE:
The requirement condition does not apply.

IMPORTANT:

Do not invent facts.

If information is not found,
say "Not found in submitted documents."

Every decision should contain evidence whenever
evidence exists.

Calculate compliancePercentage from actual
requirements, not number of documents.

riskScore:

0 = very low risk
100 = extremely high risk

Consider:

- Missing mandatory requirements
- Failed financial thresholds
- Technical mismatch
- Expired certificates
- Identity mismatch
- Contradictory information
- Missing mandatory forms
- Serious contractual/commercial failures

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

  // ==========================================================
  // OPENAI
  // ==========================================================

  let response;

  try {
    console.log(
      "Sending bidder documents to OpenAI..."
    );

    response =
      await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
      });

    console.log(
      "Compliance AI response received."
    );
  } catch (error) {
    console.error("");
    console.error(
      "=============================================="
    );

    console.error(
      "OPENAI COMPLIANCE API ERROR"
    );

    console.error(
      "=============================================="
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Code:",
      error?.code
    );

    console.error(
      "Type:",
      error?.type
    );

    console.error(
      "=============================================="
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
      "AI COMPLIANCE RAW OUTPUT:"
    );

    console.error(
      output.substring(0, 5000)
    );

    throw new Error(
      "AI returned invalid JSON while analyzing bidder documents."
    );
  }

  // ==========================================================
  // NORMALIZE ARRAYS
  // ==========================================================

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

  console.log(
    "Compliance requirements analyzed:",
    parsed.requirementsAnalysis.length
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

  console.log("");

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

          console.log(
            `Extracted text: ${content.text.length} characters`
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

      console.log("");

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

      console.log(
        "Pages:",
        tender.pages
      );

      console.log(
        "Text length:",
        tender.text.length
      );

      console.log("");

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
    console.log("");

    console.log(
      "=============================================="
    );

    console.log(
      "EXTRACT REQUIREMENTS REQUEST"
    );

    console.log(
      "=============================================="
    );

    try {
      const {
        tenderId,
        tenderName,
        text,
      } = req.body || {};

      console.log(
        "Tender ID:",
        tenderId ||
          "NOT PROVIDED"
      );

      console.log(
        "Tender Name:",
        tenderName ||
          "NOT PROVIDED"
      );

      console.log(
        "Request text length:",
        text?.length || 0
      );

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

        console.log(
          "Tender found by ID."
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

        if (tender) {
          console.log(
            "Tender found by name."
          );
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

      console.log(
        "Final tender text length:",
        tenderText.length
      );

      console.log(
        "Starting AI extraction..."
      );

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

        console.log(
          "AI requirements saved to tender."
        );
      }

      console.log(
        "Extraction request successful."
      );

      console.log(
        "=============================================="
      );

      return res.json({
        success: true,

        tenderId:
          tender?.id || null,

        ...aiResult,
      });
    } catch (error) {
      console.error("");

      console.error(
        "=============================================="
      );

      console.error(
        "REQUIREMENT EXTRACTION FAILED"
      );

      console.error(
        "=============================================="
      );

      console.error(
        "Name:",
        error?.name
      );

      console.error(
        "Message:",
        error?.message
      );

      console.error(
        "Status:",
        error?.status
      );

      console.error(
        "Code:",
        error?.code
      );

      console.error(
        "Type:",
        error?.type
      );

      console.error(
        "Stack:",
        error?.stack
      );

      console.error(
        "=============================================="
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
        `Starting compliance analysis: ${tender.name}`
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
// EXPLICIT GET ERROR FOR EXTRACT REQUIREMENTS
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

    // Never print the actual API key
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