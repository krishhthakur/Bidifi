    /* ============================================================
       BIDIFI AI BID COMPLIANCE ENGINE
       Evidence-grounded deterministic validation
       Generic tender + multi-bidder support

       CORE RULES
       1. Tender text and bidder text remain strictly separated.
       2. Evidence can ONLY originate from bidder documents.
       3. Requirement labels, REQ IDs, tender headings and filenames
          can NEVER become bidder evidence.
       4. Requirement matching is requirement-specific.
       5. Generic keyword overlap alone is not enough for compliance.
       6. Partial evidence cannot become full compliance.
       7. Missing evidence can NEVER be COMPLIANT.
       8. Deterministic validation is authoritative.
       9. AI is secondary and cannot invent evidence.
       10. Existing frontend-compatible response aliases are preserved.
       ============================================================ */

    const path = require("path");
    const fs = require("fs");
    const crypto = require("crypto");

    require("dotenv").config();

    const express = require("express");
    const cors = require("cors");
    const multer = require("multer");

    let pdfParse = null;
    let mammoth = null;
    let PDFDocument = null;
    let OpenAI = null;

    try {
      pdfParse = require("pdf-parse");
    } catch (_) {}

    try {
      mammoth = require("mammoth");
    } catch (_) {}

    try {
      PDFDocument = require("pdfkit");
    } catch (_) {}

    try {
      OpenAI =
        require("openai").default ||
        require("openai");
    } catch (_) {}

    /* ============================================================
       APP CONFIGURATION
       ============================================================ */

    const app = express();

    const PORT =
      Number(
        process.env.PORT || 5000
      );

    app.use(
      cors({
        origin: true,
        credentials: true,
      })
    );

    app.use(
      express.json({
        limit: "20mb",
      })
    );

    app.use(
      express.urlencoded({
        extended: true,
        limit: "20mb",
      })
    );

    /* ============================================================
       ROBUST BROWSER / FRONTEND CONNECTION SUPPORT
       ============================================================ */
    app.options(/.*/, cors());

    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

      if (req.method === "OPTIONS") {
        return res.sendStatus(204);
      }

      next();
    });

    app.use((req, _res, next) => {
      console.log(`[BIDIFI HTTP] ${req.method} ${req.originalUrl}`);
      next();
    });
    /* ============================================================
       BIDIFI RECOMMENDATION FEEDBACK - DIRECT STORAGE
       ============================================================ */

    const FEEDBACK_FILE =
      path.join(
        __dirname,
        "data",
        "recommendation_feedback.json"
      );

    function ensureFeedbackFile() {
      const feedbackDir =
        path.dirname(FEEDBACK_FILE);

      if (!fs.existsSync(feedbackDir)) {
        fs.mkdirSync(feedbackDir, {
          recursive: true,
        });
      }

      if (!fs.existsSync(FEEDBACK_FILE)) {
        fs.writeFileSync(
          FEEDBACK_FILE,
          "[]",
          "utf8"
        );
      }
    }

    function getFeedback() {
      ensureFeedbackFile();

      try {
        const raw =
          fs.readFileSync(
            FEEDBACK_FILE,
            "utf8"
          );

        const parsed =
          JSON.parse(raw || "[]");

        return Array.isArray(parsed)
          ? parsed
          : [];
      } catch (error) {
        console.error(
          "[BIDIFI FEEDBACK] Read error:",
          error
        );

        return [];
      }
    }

    /* SAVE RECOMMENDATION FEEDBACK */

    app.post(
      "/api/recommendation-feedback",
      (req, res) => {
        try {
          const body =
            req.body || {};

          const recommendations =
            Array.isArray(
              body.recommendations
            )
              ? body.recommendations
              : [];

          if (
            recommendations.length === 0
          ) {
            return res.status(400).json({
              success: false,
              message:
                "No recommendation feedback was submitted.",
            });
          }

          const existing =
            getFeedback();

          const saved =
            recommendations
              .filter(
                (item) =>
                  String(
                    item?.submittedText || ""
                  ).trim()
              )
              .map(
                (item, index) => ({
                  id:
                    `feedback_${Date.now()}_${index}`,

                  analysisId:
                    body.analysisId || null,

                  tenderId:
                    body.tenderId || null,

                  bidderId:
                    body.bidderId || null,

                  recommendationIndex:
                    item.index ?? index,

                  requirementId:
                    item.requirementId || null,

                  title:
                    item.title ||
                    "Recommendation",

                  originalRecommendation:
                    String(
                      item.originalRecommendation ||
                        ""
                    ),

                  submittedText:
                    String(
                      item.submittedText || ""
                    ).trim(),

                  submittedAt:
                    new Date().toISOString(),
                })
              );

          if (saved.length === 0) {
            return res.status(400).json({
              success: false,
              message:
                "No non-empty recommendation feedback was submitted.",
            });
          }

          const updated = [
            ...existing,
            ...saved,
          ];

          fs.writeFileSync(
            FEEDBACK_FILE,
            JSON.stringify(
              updated,
              null,
              2
            ),
            "utf8"
          );

          console.log(
            `[BIDIFI FEEDBACK] ${saved.length} recommendation(s) saved.`
          );

          return res.json({
            success: true,

            message:
              "Recommendation feedback saved successfully.",

            savedCount:
              saved.length,

            feedback:
              saved,
          });
        } catch (error) {
          console.error(
            "[BIDIFI FEEDBACK] Save error:",
            error
          );

          return res.status(500).json({
            success: false,

            message:
              error?.message ||
              "Failed to save recommendation feedback.",
          });
        }
      }
    );

    /* CHECK FEEDBACK STORAGE */

    app.get(
      "/api/recommendation-feedback/status",
      (req, res) => {
        try {
          const feedback =
            getFeedback();

          return res.json({
            success: true,
            storage: "file",
            file:
              "src/backend/data/recommendation_feedback.json",
            count:
              feedback.length,
            persistent: true,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message:
              error?.message ||
              "Feedback storage unavailable.",
          });
        }
      }
    );

    /* GET ALL FEEDBACK */

    app.get(
      "/api/recommendation-feedback",
      (req, res) => {
        try {
          const feedback =
            getFeedback();

          return res.json({
            success: true,
            count:
              feedback.length,
            feedback,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message:
              error?.message ||
              "Failed to retrieve feedback.",
          });
        }
      }
    );

    ensureFeedbackFile();
    /* ============================================================
       DIRECTORIES
       ============================================================ */

    const ROOT_DIR =
      __dirname;

    const DATA_DIR =
      path.join(
        ROOT_DIR,
        "data"
      );

    const UPLOAD_DIR =
      path.join(
        DATA_DIR,
        "uploads"
      );

    const TENDER_DIR =
      path.join(
        UPLOAD_DIR,
        "tenders"
      );

    const BIDDER_DIR =
      path.join(
        UPLOAD_DIR,
        "bidders"
      );

    const REPORT_DIR =
      path.join(
        DATA_DIR,
        "reports"
      );

    [
      DATA_DIR,
      UPLOAD_DIR,
      TENDER_DIR,
      BIDDER_DIR,
      REPORT_DIR,
    ].forEach(
      (dir) => {
        fs.mkdirSync(
          dir,
          {
            recursive: true,
          }
        );
      }
    );

    /* ============================================================
       AI CONFIG
       ============================================================ */

    const apiKey =
      String(
        process.env.OPENAI_API_KEY ||
          ""
      ).trim();

    const OPENAI_MODEL =
      String(
        process.env.BIDIFI_VERIFIER_MODEL ||
          process.env.OPENAI_MODEL ||
          "gpt-5.6-luna"
      ).trim();

    const openai =
      apiKey && OpenAI
        ? new OpenAI({
            apiKey,
          })
        : null;

    /* ============================================================
       MEMORY STORES
       ============================================================ */

    const tenderStore =
      new Map();

    const bidderStore =
      new Map();

    const analysisStore =
      new Map();

    const reportStore =
      new Map();

    /* ============================================================
       ACCOUNT / IDENTITY STORAGE
       ============================================================ */

    const USERS_FILE = path.join(DATA_DIR, "users.json");
    const SESSION_STORE = new Map();

    function ensureUsersFile() {
      if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, "[]", "utf8");
      }
    }

    function readUsers() {
      ensureUsersFile();
      try {
        const parsed = JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function writeUsers(users) {
      ensureUsersFile();
      fs.writeFileSync(USERS_FILE, JSON.stringify(Array.isArray(users) ? users : [], null, 2), "utf8");
    }

    function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
      const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
      return { salt, hash };
    }

    function verifyPassword(password, user) {
      try {
        const hash = crypto.scryptSync(String(password), user.passwordSalt, 64).toString("hex");
        return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(user.passwordHash, "hex"));
      } catch {
        return false;
      }
    }

    function publicUser(user) {
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        companyName: user.companyName || "",
        phone: user.phone || "",
        role: user.role || "Administrator",
        createdAt: user.createdAt,
      };
    }

    function createSession(userId) {
      const token = crypto.randomBytes(32).toString("hex");
      SESSION_STORE.set(token, { userId, createdAt: nowIso() });
      return token;
    }

    function getAuthenticatedUser(req) {
      const header = String(req.headers.authorization || "");
      const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
      const session = token ? SESSION_STORE.get(token) : null;
      if (!session) return null;
      return readUsers().find((user) => user.id === session.userId) || null;
    }

    /* ============================================================
       GENERIC HELPERS
       ============================================================ */

    function safeString(value) {
      if (
        value === null ||
        value === undefined
      ) {
        return "";
      }

      if (
        typeof value ===
        "string"
      ) {
        return value;
      }

      if (
        typeof value ===
        "number" ||
        typeof value ===
        "boolean"
      ) {
        return String(value);
      }

      try {
        return JSON.stringify(
          value
        );
      } catch (_) {
        return String(value);
      }
    }

    function safeArray(value) {
      return Array.isArray(
        value
      )
        ? value
        : [];
    }

    function clamp(
      value,
      min = 0,
      max = 100
    ) {
      const number =
        Number(value);

      if (
        Number.isNaN(number)
      ) {
        return min;
      }

      return Math.min(
        max,
        Math.max(
          min,
          number
        )
      );
    }

    function nowIso() {
      return new Date().toISOString();
    }

    function withTimeout(promise, ms, label = "Operation") {
      const timeoutMs = Math.max(1000, Number(ms) || 15000);
      let timer = null;
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error(`${label} timed out after ${timeoutMs}ms.`);
          error.code = "BIDIFI_TIMEOUT";
          reject(error);
        }, timeoutMs);
      });
      return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => {
        if (timer) clearTimeout(timer);
      });
    }

    function createId(
      prefix
    ) {
      return `${prefix}_${Date.now()}_${crypto
        .randomBytes(5)
        .toString("hex")}`;
    }

    function cleanFilename(
      value
    ) {
      return path
        .basename(
          safeString(value)
        )
        .replace(
          /[<>:"/\\|?*\x00-\x1F]/g,
          "_"
        )
        .trim();
    }

    function normalizeWhitespace(
      value
    ) {
      return safeString(value)
        .replace(
          /\u00a0/g,
          " "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();
    }

    function normalizeForCompare(
      value
    ) {
      return normalizeWhitespace(
        value
      )
        .toLowerCase()
        .replace(
          /[\u2018\u2019]/g,
          "'"
        )
        .replace(
          /[\u201c\u201d]/g,
          '"'
        )
        .replace(
          /[^a-z0-9%₹$.,+\- ]/g,
          " "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();
    }

    function escapeRegex(
      value
    ) {
      return safeString(
        value
      ).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
    }

    function unique(
      values
    ) {
      return [
        ...new Set(
          safeArray(values)
            .map(
              (x) =>
                safeString(x).trim()
            )
            .filter(Boolean)
        ),
      ];
    }

    function firstNonEmpty(
      ...values
    ) {
      for (
        const value of values
      ) {
        const text =
          safeString(
            value
          ).trim();

        if (text) {
          return text;
        }
      }

      return "";
    }

    function safeJsonParse(
      value
    ) {
      try {
        return JSON.parse(
          safeString(value)
        );
      } catch (_) {
        return null;
      }
    }

    function deleteFile(
      filePath
    ) {
      try {
        if (
          filePath &&
          fs.existsSync(
            filePath
          )
        ) {
          fs.unlinkSync(
            filePath
          );
        }
      } catch (_) {}
    }

    /* ============================================================
       TEXT CLEANING
       ============================================================ */

    function stripFilenameArtifacts(
      text
    ) {
      return safeString(
        text
      )
        .replace(
          /\b(?:bidder|vendor|supplier|company|tender|proposal|submission|response|document|attachment)[\w .()_-]*\.(?:pdf|docx?|txt)\b/gi,
          " "
        )
        .replace(
          /\b[\w ._-]+(?:proposal|submission|response|bid)[\w ._-]*\.(?:pdf|docx?|txt)\b/gi,
          " "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();
    }

    function cleanEvidenceText(
      text
    ) {
      return stripFilenameArtifacts(
        safeString(text)
      )
        .replace(
          /^\s*(?:bidder|vendor|supplier|candidate)\s*(?:response|answer|statement|evidence)?\s*:\s*/i,
          ""
        )
        .replace(
          /^\s*(?:matched\s+)?evidence\s*:\s*/i,
          ""
        )
        .replace(
          /^\s*(?:response|answer)\s*:\s*/i,
          ""
        )
        .replace(
          /^\s*source\s*:\s*.*$/i,
          ""
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();
    }

    /* ============================================================
       DOCUMENT EXTRACTION
       ============================================================ */

    const storage =
      multer.diskStorage({
        destination:
          (
            req,
            file,
            cb
          ) => {
            const tenderField =
              String(
                file.fieldname ||
                ""
              )
                .toLowerCase()
                .replace(/\[\]$/g, "");

            const isTender =
              tenderField ===
                "tenders" ||
              tenderField ===
                "tender" ||
              tenderField ===
                "files" ||
              tenderField ===
                "file";

            cb(
              null,
              isTender
                ? TENDER_DIR
                : BIDDER_DIR
            );
          },

        filename:
          (
            req,
            file,
            cb
          ) => {
            const original =
              cleanFilename(
                file.originalname
              );

            const ext =
              path.extname(
                original
              );

            const base =
              path
                .basename(
                  original,
                  ext
                )
                .replace(
                  /[^a-zA-Z0-9_-]/g,
                  "_"
                );

            cb(
              null,
              `${Date.now()}_${crypto
                .randomBytes(3)
                .toString("hex")}_${base}${ext}`
            );
          },
      });

    const upload =
      multer({
        storage,

        limits: {
          fileSize:
            25 * 1024 * 1024,
          files: 100,
        },

        fileFilter:
          (
            req,
            file,
            cb
          ) => {
            const ext =
              path
                .extname(
                  file.originalname
                )
                .toLowerCase();

            const allowed =
              [
                ".pdf",
                ".doc",
                ".docx",
                ".txt",
              ];

            if (
              allowed.includes(
                ext
              )
            ) {
              cb(
                null,
                true
              );
            } else {
              cb(
                new Error(
                  `Unsupported file type: ${ext}`
                )
              );
            }
          },
      });

    function splitDocumentLines(
      text
    ) {
      return safeString(
        text
      )
        .split(
          /\r?\n/
        )
        .map(
          (line) =>
            normalizeWhitespace(
              line
            )
        )
        .filter(Boolean);
    }

    function splitSentences(
      text
    ) {
      return safeString(text)
        .replace(/\r/g, "")
        .split(/\n+|(?<=[.!?])\s+|(?<=;)\s+/)
        .map((x) => normalizeWhitespace(x))
        .filter((x) => x.length >= 12);
    }

    function splitBidderEvidenceFragments(text) {
      const source = safeString(text);
      if (!source.trim()) return [];
      const lines = source.split(/\r?\n+/).map((line) => normalizeWhitespace(line)).filter(Boolean);
      const fragments = [];
      for (const line of lines) {
        const pieces = line.split(/(?=\b(?:not\s+complied|non\s*[-]?\s*compliant|complied|compliant|missing)\b)/i).map((piece) => normalizeWhitespace(piece)).filter((piece) => piece.length >= 12);
        if (pieces.length > 1) {
          fragments.push(...pieces);
        } else {
          const cells = line.split(/(?=\b(?:REQ[-_\s]?\d+|Clause\s*\d+|Requirement\s*\d+)\b)/i).map((piece) => normalizeWhitespace(piece)).filter((piece) => piece.length >= 12);
          fragments.push(...(cells.length > 1 ? cells : [line]));
        }
      }
      return fragments;
    }

    function buildDocumentUnits(
      text,
      documentMeta
    ) {
      const lines =
        splitDocumentLines(
          text
        );

      const units = [];

      for (
        let i = 0;
        i < lines.length;
        i++
      ) {
        const line =
          lines[i];

        const fragments =
          splitBidderEvidenceFragments(line);

        const chunks = [];
        for (const fragment of fragments.length ? fragments : [line]) {
          const sentences = splitSentences(fragment);
          if (sentences.length) chunks.push(...sentences);
          else chunks.push(fragment);
        }

        for (
          let j = 0;
          j < chunks.length;
          j++
        ) {
          const chunk =
            normalizeWhitespace(
              chunks[j]
            );

          if (
            !chunk ||
            chunk.length <
              12
          ) {
            continue;
          }

          units.push({
            id:
              `${documentMeta?.sourceDocumentId || "doc"}_${i}_${j}`,

            text:
              chunk,

            sourceType:
              safeString(
                documentMeta?.sourceType
              ).trim()
                .toLowerCase() ||
              "unknown",

            sourceDocument:
              firstNonEmpty(
                documentMeta?.sourceDocument,
                documentMeta?.filename,
                documentMeta?.fileName
              ),

            sourceDocumentId:
              firstNonEmpty(
                documentMeta?.sourceDocumentId,
                documentMeta?.id
              ),

            filename:
              firstNonEmpty(
                documentMeta?.filename,
                documentMeta?.fileName,
                documentMeta?.sourceDocument
              ),
          });
        }
      }

      return units;
    }

    /* ============================================================
       DOCUMENT FILE CONTENT EXTRACTION
       ============================================================ */

    async function extractFileContent(
      file
    ) {
      const ext =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      if (
        !fs.existsSync(
          file.path
        )
      ) {
        throw new Error(
          "Uploaded file was not found on disk."
        );
      }

      if (
        ext === ".txt"
      ) {
        return {
          text:
            fs.readFileSync(
              file.path,
              "utf8"
            ),
          pages: 1,
          type: "text/plain",
        };
      }

      if (
        ext === ".pdf"
      ) {
        if (!pdfParse) {
          throw new Error(
            "pdf-parse package is not installed."
          );
        }

        const buffer =
          fs.readFileSync(
            file.path
          );

        const parsed =
          await pdfParse(
            buffer
          );

        return {
          text:
            safeString(
              parsed.text
            ),
          pages:
            Number(
              parsed.numpages
            ) || 1,
          type:
            "application/pdf",
        };
      }

      if (
        ext === ".docx"
      ) {
        if (!mammoth) {
          throw new Error(
            "mammoth package is not installed."
          );
        }

        const result =
          await mammoth.extractRawText(
            {
              path:
                file.path,
            }
          );

        return {
          text:
            safeString(
              result.value
            ),
          pages: 1,
          type:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        };
      }

      if (
        ext === ".doc"
      ) {
        throw new Error(
          "Legacy .doc extraction is not supported. Please upload .docx, .pdf or .txt."
        );
      }

      throw new Error(
        `Unsupported file type: ${ext}`
      );
    }

    /* ============================================================
       TEXT / KEYWORD ANALYSIS
       ============================================================ */

    const STOP_WORDS =
      new Set([
        "a",
        "an",
        "and",
        "are",
        "as",
        "at",
        "be",
        "by",
        "for",
        "from",
        "has",
        "have",
        "in",
        "is",
        "it",
        "of",
        "on",
        "or",
        "that",
        "the",
        "their",
        "this",
        "to",
        "with",
        "will",
        "shall",
        "must",
        "should",
        "may",
        "can",
        "provide",
        "provided",
        "required",
        "requirement",
        "requirements",
        "bidder",
        "vendor",
        "supplier",
        "company",
        "contractor",
        "system",
        "service",
        "solution",
        "proposal",
        "tender",
        "document",
        "documents",
      ]);

    function meaningfulWords(
      text
    ) {
      return unique(
        normalizeForCompare(
          text
        )
          .split(
            /\s+/
          )
          .map(
            (word) =>
              word.replace(
                /^[^a-z0-9]+|[^a-z0-9]+$/g,
                ""
              )
          )
          .filter(
            (word) =>
              word.length >=
                3 &&
              !STOP_WORDS.has(
                word
              )
          )
      );
    }

    function keywordOverlap(
      a,
      b
    ) {
      const first =
        new Set(
          meaningfulWords(
            a
          )
        );

      const second =
        new Set(
          meaningfulWords(
            b
          )
        );

      if (
        !first.size ||
        !second.size
      ) {
        return 0;
      }

      let matched =
        0;

      for (
        const word of
          first
      ) {
        if (
          second.has(
            word
          )
        ) {
          matched++;
        }
      }

      return matched /
        Math.max(
          first.size,
          second.size
        );
    }

    /* ============================================================
       ATTRIBUTE / CONDITION DICTIONARIES
       ============================================================ */

    const ATTRIBUTE_ALIASES = {
      support: [
        "support",
        "technical support",
        "customer support",
        "help desk",
        "helpdesk",
        "service desk",
        "support team",
        "support services",
      ],

      experience: [
        "experience",
        "track record",
        "past performance",
        "implemented",
        "implementation",
        "deployment",
        "project experience",
        "similar project",
        "similar projects",
      ],

      eligibility: [
        "eligible",
        "eligibility",
        "registered",
        "registration",
        "gst",
        "pan",
        "incorporation",
        "company registration",
        "statutory",
        "legal entity",
      ],

      bidValidity: [
        "bid validity",
        "bid valid",
        "validity",
        "valid for",
      ],

      penalty: [
        "penalty",
        "liquidated damages",
        "ld",
        "damages",
        "fine",
      ],

      availability: [
        "availability",
        "available",
        "uptime",
        "service availability",
      ],

      security: [
        "security",
        "secure",
        "cybersecurity",
        "cyber security",
        "information security",
      ],

      backup: [
        "backup",
        "backups",
        "data backup",
        "backup policy",
        "backup system",
      ],

      disasterRecovery: [
        "disaster recovery",
        "dr",
        "recovery",
        "business continuity",
      ],

      encryption: [
        "encryption",
        "encrypted",
        "aes",
        "tls",
        "ssl",
      ],

      audit: [
        "audit",
        "auditing",
        "audit trail",
        "logs",
        "logging",
      ],

      monitoring: [
        "monitoring",
        "monitor",
        "observability",
        "alerting",
      ],

      sla: [
        "sla",
        "service level agreement",
        "service level",
      ],

      training: [
        "training",
        "trained",
        "user training",
        "staff training",
      ],

      warranty: [
        "warranty",
        "warrantee",
        "warranty period",
      ],

      implementation: [
        "implementation",
        "deployment",
        "installation",
        "commissioning",
        "rollout",
      ],

      maintenance: [
        "maintenance",
        "annual maintenance",
        "amc",
        "support and maintenance",
      ],
    };

    const CATEGORY_MAP = {
      experience:
        "experience",

      support:
        "support",

      eligibility:
        "eligibility",

      security:
        "security",

      certification:
        "certification",

      financial:
        "financial",

      technical:
        "technical",

      commercial:
        "commercial",

      availability:
        "availability",

      cloud:
        "cloud",

      infrastructure:
        "infrastructure",

      service:
        "service",

      implementation:
        "implementation",

      maintenance:
        "maintenance",

      general:
        "general",
    };

    function detectAttributes(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      const result =
        [];

      for (
        const [
          attribute,
          aliases,
        ] of Object.entries(
          ATTRIBUTE_ALIASES
        )
      ) {
        if (
          aliases.some(
            (alias) =>
              normalized.includes(
                normalizeForCompare(
                  alias
                )
              )
          )
        ) {
          result.push(
            attribute
          );
        }
      }

      return unique(
        result
      );
    }

    function detectCloudPlatforms(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      const aliases = {
        aws: [
          "aws",
          "amazon web services",
        ],

        azure: [
          "azure",
          "microsoft azure",
        ],

        gcp: [
          "gcp",
          "google cloud",
          "google cloud platform",
        ],

        oracle: [
          "oracle cloud",
          "oci",
          "oracle cloud infrastructure",
        ],

        alibaba: [
          "alibaba cloud",
          "aliyun",
        ],
      };

      const result =
        [];

      for (
        const [
          key,
          values,
        ] of Object.entries(
          aliases
        )
      ) {
        if (
          values.some(
            (value) =>
              normalized.includes(
                normalizeForCompare(
                  value
                )
              )
          )
        ) {
          result.push(
            key
          );
        }
      }

      return unique(
        result
      );
    }

    function detectSecurityControls(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      const controls = {
        encryption: [
          "encryption",
          "encrypted",
          "aes",
          "tls",
          "ssl",
        ],

        mfa: [
          "mfa",
          "multi factor authentication",
          "multifactor authentication",
          "two factor authentication",
          "2fa",
        ],

        iam: [
          "iam",
          "identity and access management",
          "access control",
          "role based access",
          "rbac",
        ],

        backup: [
          "backup",
          "backups",
          "data backup",
        ],

        disasterRecovery: [
          "disaster recovery",
          "business continuity",
          "recovery site",
          "dr site",
        ],

        audit: [
          "audit log",
          "audit trail",
          "logging",
          "logs",
        ],

        antivirus: [
          "antivirus",
          "anti virus",
          "endpoint protection",
        ],

        firewall: [
          "firewall",
          "web application firewall",
          "waf",
        ],

        vulnerability: [
          "vulnerability assessment",
          "vulnerability scanning",
          "penetration testing",
          "penetration test",
          "vapt",
        ],
      };

      const result =
        [];

      for (
        const [
          key,
          values,
        ] of Object.entries(
          controls
        )
      ) {
        if (
          values.some(
            (value) =>
              normalized.includes(
                normalizeForCompare(
                  value
                )
              )
          )
        ) {
          result.push(
            key
          );
        }
      }

      return unique(
        result
      );
    }

    function has24x7Support(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      return (
        /\b24\s*(?:x|×|\/)\s*7(?:\s*x\s*365)?\b/i.test(
          normalized
        ) ||
        /\b24\s*\/\s*7\b/i.test(
          normalized
        ) ||
        /\b24\s*hours?\s*(?:a\s*day)?\s*,?\s*7\s*days?\b/i.test(
          normalized
        ) ||
        /\baround\s*the\s*clock\b/i.test(
          normalized
        )
      );
    }

    function hasExplicitNegative(text) {
      const normalized =
        normalizeForCompare(text);

      if (!normalized) {
        return false;
      }

      /*
       * Only explicit negative statements are treated as a failure.
       * Words such as "noted", "network", "without" in unrelated
       * context must not turn a valid bidder statement into NON_COMPLIANT.
       */
      return (
        /\b(?:does\s+not|do\s+not|cannot|can't|unable\s+to|not\s+available|unavailable|no\s+support|will\s+not|won't|doesn't|don't|not\s+provide|not\s+provided|not\s+supported|unsupported|lack(?:s)?|lacks|fails?\s+to|failed\s+to|unable|cannot\s+meet|does\s+not\s+meet|does\s+not\s+comply|not\s+comply|non[-\s]?compliant)\b/i.test(
          normalized
        )
      );
    }

    function isConditionalEvidence(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      return (
        /\b(?:will\s+provide|shall\s+provide|planned|plan\s+to|proposed|proposal\s+includes|upon\s+award|after\s+award|on\s+award|can\s+provide|could\s+provide|would\s+provide|subject\s+to|if\s+awarded|after\s+contract|future|to\s+be\s+implemented|will\s+be\s+implemented|will\s+be\s+provided|can\s+be\s+provided)\b/i.test(
          normalized
        )
      );
    }

    function isAnalysisArtifact(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      return (
        /\b(?:matched\s+attributes?|matched\s+cloud|matched\s+security|matched\s+certifications?|candidate\s+score|evidence\s+score|deterministic|ai\s+confidence|confidence\s+score|compliance\s+percentage|risk\s+score|critical\s+finding|recommendation|requirements?\s+analysis|verification\s+status|match\s+status)\b/i.test(
          normalized
        ) ||
        /\b(?:score|confidence)\s*[:=]\s*\d+(?:\.\d+)?\s*%?\b/i.test(
          normalized
        )
      );
    }

    /* ============================================================
       BIDDER ASSERTION / TENDER ECHO PROTECTION
       ============================================================ */

    function hasBidderAssertion(
      text
    ) {
      const value =
        normalizeWhitespace(
          text
        );

      if (!value) {
        return false;
      }

      const normalized =
        normalizeForCompare(
          value
        );

      if (
        isAnalysisArtifact(
          value
        )
      ) {
        return false;
      }

      if (
        isConditionalEvidence(
          value
        )
      ) {
        return false;
      }

      /*
       * Direct first-person / bidder-owned assertions.
       */

      if (
        /\b(?:we|our|the\s+bidder|the\s+company|our\s+company|our\s+organization|our\s+organisation|we\s+provide|we\s+have|we\s+maintain|we\s+support|we\s+operate|we\s+offer|we\s+implemented|we\s+deployed|we\s+delivered|we\s+hold|we\s+are)\b/i.test(
          normalized
        )
      ) {
        return true;
      }

      /*
       * Concrete documentary facts can be bidder evidence
       * even when the sentence is not first-person.
       */

      if (
        /\b(?:project|projects|client|clients|customer|customers|certificate|certification|registration|gstin|gst|pan|license|licence|contract|order|purchase\s+order|implementation|deployment|installation|years?|months?|days?|tb|gb|mb|percent|%|sla|uptime)\b/i.test(
          normalized
        ) &&
        /\b(?:\d+(?:\.\d+)?|\b(?:certified|registered|implemented|deployed|installed|maintained|provided|delivered|operational|active|valid)\b)/i.test(
          normalized
        )
      ) {
        return true;
      }

      return false;
    }

    function isLikelyRequirementEcho(
      text,
      req
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      if (!normalized) {
        return true;
      }

      const requirement =
        normalizeForCompare(
          firstNonEmpty(
            req?.requirement,
            req?.description,
            req?.title
          )
        );

      if (!requirement) {
        return false;
      }

      const overlap =
        keywordOverlap(
          requirement,
          normalized
        );

      /*
       * Exact / near-exact tender text without bidder assertion
       * is never evidence.
       */

      if (
        normalizeForCompare(
          requirement
        ) ===
        normalizeForCompare(
          normalized
        )
      ) {
        return true;
      }

      if (
        overlap >=
          0.88 &&
        !hasBidderAssertion(
          text
        )
      ) {
        return true;
      }

      /*
       * Requirement-style wording often describes what the bidder
       * MUST do rather than what the bidder HAS done.
       */

      if (
        /\b(?:shall|must|required|required to|should|minimum|mandatory|bidder shall|vendor shall|contractor shall|the bidder must|the vendor must)\b/i.test(
          normalized
        ) &&
        !hasBidderAssertion(
          text
        )
      ) {
        return true;
      }

      return false;
    }

    function cleanBidderEvidence(
      candidate
    ) {
      if (
        !candidate ||
        !isBidderSourceType(
          candidate.sourceType
        )
      ) {
        return null;
      }

      const cleaned =
        cleanEvidenceText(
          candidate.text
        );

      if (!cleaned) {
        return null;
      }

      if (
        isAnalysisArtifact(
          cleaned
        )
      ) {
        return null;
      }

      return {
        ...candidate,
        text:
          cleaned,
        sourceType:
          "bidder",
        sourceDocument:
          firstNonEmpty(
            candidate.sourceDocument,
            candidate.filename,
            candidate.fileName
          ),
        sourceDocumentId:
          firstNonEmpty(
            candidate.sourceDocumentId,
            candidate.documentId
          ),
      };
    }

    /* ============================================================
       NUMERIC EXTRACTION
       ============================================================ */

    function extractYears(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      const match =
        normalized.match(
          /(\d+(?:\.\d+)?)\s*(?:\+|or\s+more)?\s*(?:years?|yrs?)/i
        );

      return match
        ? Number(
            match[1]
          )
        : null;
    }

    function extractMonths(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      const match =
        normalized.match(
          /(\d+(?:\.\d+)?)\s*(?:months?|mos?)/i
        );

      return match
        ? Number(
            match[1]
          )
        : null;
    }

    function extractDays(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      const match =
        normalized.match(
          /(\d+(?:\.\d+)?)\s*(?:days?|working\s+days?)/i
        );

      return match
        ? Number(
            match[1]
          )
        : null;
    }

    function extractPercentage(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      const match =
        normalized.match(
          /(\d+(?:\.\d+)?)\s*%/i
        );

      return match
        ? Number(
            match[1]
          )
        : null;
    }

    function extractAmount(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      const match =
        normalized.match(
          /(?:₹|rs\.?|inr|\$|usd)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(crore|cr|lakh|lac|million|mn|billion|bn|k|thousand)?\b/i
        );

      if (!match) {
        return null;
      }

      const value =
        Number(
          safeString(
            match[1]
          ).replace(
            /,/g,
            ""
          )
        );

      if (
        !Number.isFinite(
          value
        )
      ) {
        return null;
      }

      return {
        value,
        unit:
          safeString(
            match[2]
          ).toLowerCase(),
      };
    }

    function convertAmount(
      amount
    ) {
      if (
        !amount ||
        !Number.isFinite(
          Number(
            amount.value
          )
        )
      ) {
        return null;
      }

      const value =
        Number(
          amount.value
        );

      const unit =
        safeString(
          amount.unit
        ).toLowerCase();

      if (
        [
          "crore",
          "cr",
        ].includes(
          unit
        )
      ) {
        return value * 10000000;
      }

      if (
        [
          "lakh",
          "lac",
        ].includes(
          unit
        )
      ) {
        return value * 100000;
      }

      if (
        [
          "million",
          "mn",
        ].includes(
          unit
        )
      ) {
        return value * 1000000;
      }

      if (
        [
          "billion",
          "bn",
        ].includes(
          unit
        )
      ) {
        return value * 1000000000;
      }

      if (
        [
          "thousand",
          "k",
        ].includes(
          unit
        )
      ) {
        return value * 1000;
      }

      return value;
    }

    function extractStorage(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      const match =
        normalized.match(
          /(\d+(?:\.\d+)?)\s*(tb|gb|mb)\b/i
        );

      if (!match) {
        return null;
      }

      const value =
        Number(
          match[1]
        );

      const unit =
        safeString(
          match[2]
        ).toLowerCase();

      let gb =
        value;

      if (
        unit === "tb"
      ) {
        gb =
          value *
          1024;
      } else if (
        unit === "mb"
      ) {
        gb =
          value /
          1024;
      }

      return {
        value,
        unit,
        gb,
      };
    }

    function extractCertification(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      const known = [
        "iso 9001",
        "iso 27001",
        "iso 20000",
        "iso 22301",
        "iso 45001",
        "soc 1",
        "soc 2",
        "soc 2 type 1",
        "soc 2 type 2",
        "pci dss",
        "hipaa",
        "gdpr",
        "cis",
        "cmmi",
        "cmm i",
        "cmmi level 2",
        "cmmi level 3",
        "cmmi level 4",
        "cmmi level 5",
        "cmmmi",
        "stqc",
      ];

      return known.filter(
        (cert) =>
          normalized.includes(
            normalizeForCompare(
              cert
            )
          )
      );
    }

    /* ============================================================
       REQUIREMENT TITLE / CATEGORY
       ============================================================ */

    function inferRequirementTitle(
      value
    ) {
      const text =
        normalizeWhitespace(
          value
        );

      if (!text) {
        return "Requirement";
      }

      const lower =
        text.toLowerCase();

      if (
        /\b(?:experience|track record|past performance|similar project)\b/i.test(
          value
        )
      ) {
        return "Experience / Past Performance";
      }

      if (
        /\b(?:support|helpdesk|help desk|service desk|24x7|24\/7)\b/i.test(
          lower
        )
      ) {
        return "Support & Availability";
      }

      if (
        /\b(?:security|cybersecurity|cyber security|encryption|mfa|firewall|audit)\b/i.test(
          lower
        )
      ) {
        return "Security & Controls";
      }

      if (
        /\b(?:certification|iso|soc\s*2|pci\s*dss|hipaa)\b/i.test(
          lower
        )
      ) {
        return "Certification";
      }

      if (
        /\b(?:eligibility|eligible|gst|pan|registration|incorporation)\b/i.test(
          lower
        )
      ) {
        return "Eligibility";
      }

      if (
        /\b(?:financial|turnover|revenue|net\s*worth|annual\s*turnover)\b/i.test(
          lower
        )
      ) {
        return "Financial Requirement";
      }

      if (
        /\b(?:cloud|aws|azure|gcp|oracle|alibaba)\b/i.test(
          lower
        )
      ) {
        return "Cloud / Infrastructure";
      }

      if (
        /\b(?:bid validity|validity period|valid for)\b/i.test(
          lower
        )
      ) {
        return "Bid Validity";
      }

      if (
        /\b(?:penalty|liquidated damages|ld)\b/i.test(
          lower
        )
      ) {
        return "Penalty / Damages";
      }

      if (
        /\b(?:implementation|deployment|installation|commissioning)\b/i.test(
          lower
        )
      ) {
        return "Implementation";
      }

      if (
        /\b(?:maintenance|amc|annual maintenance)\b/i.test(
          lower
        )
      ) {
        return "Maintenance";
      }

      const words =
        text.split(
          /\s+/
        );

      return words
        .slice(
          0,
          8
        )
        .join(" ")
        .replace(
          /[:.;,]+$/,
          ""
        );
    }

    function inferRequirementCategory(
      attributes
    ) {
      const attrs =
        safeArray(
          attributes
        );

      if (
        attrs.includes(
          "experience"
        )
      ) {
        return "experience";
      }

      if (
        attrs.includes(
          "support"
        )
      ) {
        return "support";
      }

      if (
        attrs.includes(
          "eligibility"
        )
      ) {
        return "eligibility";
      }

      if (
        attrs.includes(
          "security"
        ) ||
        attrs.includes(
          "encryption"
        ) ||
        attrs.includes(
          "audit"
        )
      ) {
        return "security";
      }

      if (
        attrs.includes(
          "bidValidity"
        )
      ) {
        return "commercial";
      }

      if (
        attrs.includes(
          "penalty"
        )
      ) {
        return "commercial";
      }

      if (
        attrs.includes(
          "implementation"
        )
      ) {
        return "implementation";
      }

      if (
        attrs.includes(
          "maintenance"
        )
      ) {
        return "maintenance";
      }

      return "general";
    }

    function detectMandatory(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      return (
        /\b(?:mandatory|must|shall|required|required to|compulsory|essential|minimum requirement|bidder shall|vendor shall|contractor shall)\b/i.test(
          normalized
        )
      );
    }

    /* ============================================================
       REQUIREMENT CLAUSE SPLITTING
       ============================================================ */

    function splitRequirementClauses(
      requirement
    ) {
      const text =
        normalizeWhitespace(
          requirement
        );

      if (!text) {
        return [];
      }

      return text
        .split(
          /(?:\s*;\s*|\s+\band\b\s+|\s+\bor\b\s+|\n+|\.\s+)/i
        )
        .map(
          (part) =>
            normalizeWhitespace(
              part
            )
        )
        .filter(
          (part) =>
            part.length >=
            8
        );
    }

    function requirementHasStrongSignal(
      text
    ) {
      const normalized =
        normalizeForCompare(
          text
        );

      return (
        /\b(?:minimum|at least|not less than|shall|must|required|mandatory|eligible|experience|support|security|certified|certification|validity|penalty|uptime|availability|storage|turnover|revenue|years?|months?|days?|percent|%|crore|lakh|tb|gb|aws|azure|gcp|iso|soc\s*2|pci)\b/i.test(
          normalized
        )
      );
    }

    /* ============================================================
       REQUIREMENT NORMALIZATION
       ============================================================ */

    function normalizeRequirementObject(
      raw,
      index = 0
    ) {
      const source =
        raw &&
        typeof raw ===
          "object"
          ? {
              ...raw,
            }
          : {
              requirement:
                safeString(
                  raw
                ),
            };

      const sourceText =
        firstNonEmpty(
          source.requirement,
          source.description,
          source.text,
          source.requirementText,
          source.title
        );

      const requirement =
        normalizeWhitespace(
          sourceText
        );

      const description =
        firstNonEmpty(
          source.description,
          requirement
        );

      const title =
        firstNonEmpty(
          source.title,
          source.requirementTitle,
          inferRequirementTitle(
            requirement
          )
        );

      const id =
        firstNonEmpty(
          source.id,
          source.requirementId,
          `REQ-${String(
            index + 1
          ).padStart(
            2,
            "0"
          )}`
        );

      const attributes =
        unique(
          [
            ...detectAttributes(
              requirement
            ),
            ...safeArray(
              source.attributes
            ),
          ]
        );

      const cloudPlatforms =
        unique(
          [
            ...detectCloudPlatforms(
              requirement
            ),
            ...safeArray(
              source.cloudPlatforms
            ),
            ...safeArray(
              source.requiredCloudPlatforms
            ),
          ]
        );

      const securityControls =
        unique(
          [
            ...detectSecurityControls(
              requirement
            ),
            ...safeArray(
              source.securityControls
            ),
            ...safeArray(
              source.requiredSecurityControls
            ),
          ]
        );

      const certifications =
        unique(
          [
            ...extractCertification(
              requirement
            ),
            ...safeArray(
              source.requiredCertifications
            ),
            ...safeArray(
              source.certifications
            ),
          ]
        );

      const years =
        Number.isFinite(
          Number(
            source.requiredYears
          )
        )
          ? Number(
              source.requiredYears
            )
          : extractYears(
              requirement
            );

      const months =
        Number.isFinite(
          Number(
            source.requiredMonths
          )
        )
          ? Number(
              source.requiredMonths
            )
          : extractMonths(
              requirement
            );

      const days =
        Number.isFinite(
          Number(
            source.requiredDays
          )
        )
          ? Number(
              source.requiredDays
            )
          : extractDays(
              requirement
            );

      const percentage =
        Number.isFinite(
          Number(
            source.requiredPercentage
          )
        )
          ? Number(
              source.requiredPercentage
            )
          : extractPercentage(
              requirement
            );

      const amount =
        source.requiredAmount &&
        typeof source.requiredAmount ===
          "object"
          ? convertAmount(
              source.requiredAmount
            )
          : convertAmount(
              extractAmount(
                requirement
              )
            );

      const storage =
        source.requiredStorage &&
        typeof source.requiredStorage ===
          "object"
          ? source.requiredStorage
          : extractStorage(
              requirement
            );

      const requires24x7 =
        Boolean(
          source.requires24x7
        ) ||
        has24x7Support(
          requirement
        );

      const structured = {
        attributes,
        requiredCloudPlatforms:
          cloudPlatforms,

        requiredSecurityControls:
          securityControls,

        requiredCertifications:
          certifications,

        requiredYears:
          years,

        requiredMonths:
          months,

        requiredDays:
          days,

        requiredPercentage:
          percentage,

        requiredAmount:
          Number.isFinite(
            amount
          )
            ? amount
            : null,

        requiredStorage:
          storage,

        requires24x7,

        clauses:
          splitRequirementClauses(
            requirement
          ),
      };

      return {
        ...source,

        id,

        requirementId:
          id,

        title,

        requirementTitle:
          title,

        requirement,

        description,

        requirementText:
          description,

        sourceText,

        category:
          firstNonEmpty(
            source.category,
            inferRequirementCategory(
              attributes
            )
          ),

        mandatory:
          source.mandatory !==
          undefined
            ? Boolean(
                source.mandatory
              )
            : detectMandatory(
                requirement
              ),

        threshold:
          source.threshold ||
          null,

        condition:
          source.condition ||
          null,

        evidenceNeeded:
          firstNonEmpty(
            source.evidenceNeeded,
            source.evidence,
            "Documentary evidence from bidder submission"
          ),

        structured,
      };
    }

    /* ============================================================
       REQUIREMENT DEDUPLICATION
       ============================================================ */

    function conditionSignature(
      req
    ) {
      const r =
        normalizeRequirementObject(
          req
        );

      return [
        normalizeForCompare(
          r.requirement
        ),

        ...r.structured.attributes
          .slice()
          .sort(),

        ...r.structured.requiredCloudPlatforms
          .slice()
          .sort(),

        ...r.structured.requiredSecurityControls
          .slice()
          .sort(),

        ...r.structured.requiredCertifications
          .slice()
          .sort(),

        r.structured.requiredYears,
        r.structured.requiredMonths,
        r.structured.requiredDays,
        r.structured.requiredPercentage,
        r.structured.requiredAmount,
        r.structured.requiredStorage?.gb,
        r.structured.requires24x7,
      ].join("|");
    }

    function requirementSemanticKey(req) {
      const r = normalizeRequirementObject(req);
      const raw = [r.title, r.requirement, r.description, r.requirementText].filter(Boolean).join(" ");
      const text = normalizeForCompare(raw)
        .replace(/\breq(?:uirement)?[-_\s]?\d{1,3}\b/g, " ")
        .replace(/\bclause[-_\s]?\d{1,3}\b/g, " ")
        .replace(/\s+/g, " ").trim();
      const years = r.structured.requiredYears ?? "";
      const amount = r.structured.requiredAmount ?? "";
      const pct = r.structured.requiredPercentage ?? "";
      const days = r.structured.requiredDays ?? "";
      const months = r.structured.requiredMonths ?? "";
      const certNames = unique([
        ...safeArray(r.structured.requiredCertifications),
        ...(text.match(/\b(?:iso\s*\d{4,5}|cmmi(?:\s*level\s*\d+)?|soc\s*\d(?:\s*type\s*[12])?|pci\s*dss|stqc)\b/gi) || [])
      ].map((x) => normalizeForCompare(x).replace(/\s+/g, "").trim())).sort();
      if (/\b(?:turnover|revenue|financial|annual\s+sales|gross\s+receipts)\b/.test(text)) {
        const fiscalYears = (text.match(/\b(?:last|past|previous)\s+\d+\s+(?:financial\s+)?years?\b/) || [""])[0];
        return `FINANCIAL|${amount}|${fiscalYears}|${pct}`;
      }
      if (certNames.length) return `CERT|${certNames.join(",")}`;
      const clouds = safeArray(r.structured.requiredCloudPlatforms).map(normalizeForCompare).sort();
      if (clouds.length) return `CLOUD|${clouds.join(",")}|${years}|${amount}`;
      const security = safeArray(r.structured.requiredSecurityControls).map(normalizeForCompare).sort();
      if (security.length) return `SECURITY|${security.join(",")}`;
      if (/\b(?:experience|past\s+performance|track\s+record|years?\s+of\s+(?:relevant\s+)?experience|commercial\s+experience|deployment\s+experience)\b/.test(text)) {
        const domain = text.replace(/\b(?:must|shall|required|minimum|at|least|years?|year|experience|experienced|active|demonstrated|possess|possesses|company|bidder|vendor|supplier|of|for|in|the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
        return `EXPERIENCE|${years}|${domain}`;
      }
      const attrs = safeArray(r.structured.attributes).map(normalizeForCompare).sort().join(",");
      if (attrs) return `ATTRIBUTE|${attrs}|${years}|${months}|${days}|${pct}|${amount}`;
      return `TEXT|${text}`;
    }

    function dedupeRequirements(requirements) {
      const output = [];
      const keys = new Map();
      for (const raw of safeArray(requirements)) {
        if (!raw) continue;
        const req = normalizeRequirementObject(raw, output.length);
        if (req.requirement.length < 15) continue;
        const key = requirementSemanticKey(req);
        if (keys.has(key)) {
          const i = keys.get(key);
          if (JSON.stringify(req).length > JSON.stringify(output[i]).length) output[i] = req;
          continue;
        }
        const fuzzy = output.some((existing) => normalizeForCompare(existing.requirement) === normalizeForCompare(req.requirement) || requirementSemanticKey(existing) === key || keywordOverlap(existing.requirement, req.requirement) >= 0.965);
        if (fuzzy) continue;
        keys.set(key, output.length);
        output.push(req);
      }
      return output.map((req, index) => ({ ...req, id: `REQ-${String(index + 1).padStart(2, "0")}`, requirementId: `REQ-${String(index + 1).padStart(2, "0")}` }));
    }

    /* ============================================================
       EVIDENCE SOURCE SAFETY
       ============================================================ */

    function isBidderSourceType(
      sourceType
    ) {
      const normalized =
        normalizeForCompare(
          sourceType
        ).replace(
          /\s+/g,
          "_"
        );

      return [
        "bidder",
        "bidder_document",
        "bidder-document",
        "bidderdocument",
        "bidder_doc",
        "bidder-doc",
      ].includes(
        normalized
      );
    }

    function isFilenameOnly(
      text,
      sourceDocument
    ) {
      const normalizedText =
        normalizeForCompare(
          text
        );

      const normalizedSource =
        normalizeForCompare(
          sourceDocument
        );

      if (
        !normalizedText ||
        !normalizedSource
      ) {
        return false;
      }

      return (
        normalizedText ===
        normalizedSource
      );
    }

    function textSimilarity(
      a,
      b
    ) {
      const aWords =
        new Set(
          meaningfulWords(
            a
          )
        );

      const bWords =
        new Set(
          meaningfulWords(
            b
          )
        );

      if (
        !aWords.size ||
        !bWords.size
      ) {
        return 0;
      }

      let intersection =
        0;

      for (
        const word of
          aWords
      ) {
        if (
          bWords.has(
            word
          )
        ) {
          intersection++;
        }
      }

      const union =
        new Set([
          ...aWords,
          ...bWords,
        ]).size;

      return union
        ? intersection /
            union
        : 0;
    }

    function strictTenderEchoFilter(
      req,
      text,
      candidate
    ) {
      const cleaned =
        cleanEvidenceText(
          text
        );

      if (!cleaned) {
        return false;
      }

      if (
        !isBidderSourceType(
          candidate?.sourceType ||
            "bidder"
        )
      ) {
        return false;
      }

      if (
        isAnalysisArtifact(
          cleaned
        )
      ) {
        return false;
      }

      if (
        /^(?:req[-\s]?\d+|requirement\s*\d+)\s*[:.\-]/i.test(
          cleaned
        )
      ) {
        return false;
      }

      if (
        /^req[-\s]?\d+$/i.test(
          cleaned
        )
      ) {
        return false;
      }

      if (
        isLikelyRequirementEcho(
          cleaned,
          req
        )
      ) {
        return false;
      }

      const sourceDocument =
        firstNonEmpty(
          candidate?.sourceDocument,
          candidate?.fileName,
          candidate?.filename
        );

      if (
        isFilenameOnly(
          cleaned,
          sourceDocument
        )
      ) {
        return false;
      }

      const requirementText =
        firstNonEmpty(
          req.requirement,
          req.description
        );

      const similarity =
        textSimilarity(
          cleaned,
          requirementText
        );

      if (
        similarity >=
          0.82 &&
        !hasBidderAssertion(
          cleaned
        )
      ) {
        return false;
      }

      if (
        /^(?:technical|commercial|eligibility|scope|experience|support|security|compliance|requirement|qualification)\s*(?:requirement|criteria)?\s*[:\-]?$/i.test(
          cleaned
        )
      ) {
        return false;
      }

      return true;
    }
    /* ============================================================
       BIDDER EVIDENCE CANDIDATE VALIDATION
       ============================================================ */

    function bidderEvidenceCandidateAllowed(req, candidate) {
      if (!candidate || typeof candidate !== "object") return false;

      const sourceType = safeString(candidate.sourceType || "bidder").trim().toLowerCase();
      if (!["bidder", "bidder_document", "bidder-document"].includes(sourceType)) return false;

      const sourceDocument = firstNonEmpty(
        candidate.sourceDocument,
        candidate.sourceFile,
        candidate.fileName,
        candidate.filename,
        candidate.documentName,
        ""
      );

      const text = sanitizeBidderEvidenceText(
        firstNonEmpty(candidate.text, candidate.excerpt, candidate.evidence, candidate.evidenceText, candidate.bidderEvidence, ""),
        sourceDocument
      );
      if (!text) return false;
      if (isAnalysisArtifact(text)) return false;
      if (isForbiddenBidderEvidence(text)) return false;
      if (/no bidder evidence found/i.test(text)) return false;

      // Do NOT reject a genuine bidder statement just because a bidder's own
      // compliance matrix contains REQ/Clause numbers. Sanitisation strips the
      // metadata while retaining the response.
      if (sourceDocument && normalizeForCompare(text) === normalizeForCompare(sourceDocument)) return false;

      candidate.text = text;
      candidate.sourceType = "bidder";
      candidate.sourceDocument = sourceDocument;
      return true;
    }



    /* ============================================================
       CLEAN BIDDER EVIDENCE CANDIDATE
       ============================================================ */

    function cleanBidderEvidenceCandidate(candidate) {
      if (!candidate || typeof candidate !== "object") return null;

      const cleaned = { ...candidate };
      const sourceDocument = firstNonEmpty(
        cleaned.sourceDocument,
        cleaned.sourceFile,
        cleaned.fileName,
        cleaned.filename,
        cleaned.documentName,
        ""
      );

      const rawText = firstNonEmpty(
        cleaned.text,
        cleaned.excerpt,
        cleaned.evidence,
        cleaned.evidenceText,
        cleaned.bidderEvidence,
        ""
      );

      const text = sanitizeBidderEvidenceText(rawText, sourceDocument);
      if (!text) return null;
      if (isAnalysisArtifact(text)) return null;
      if (isForbiddenBidderEvidence(text)) return null;
      if (/no bidder evidence found/i.test(text)) return null;

      cleaned.text = text;
      cleaned.sourceType = "bidder";
      cleaned.sourceDocument = sourceDocument;
      cleaned.filename = firstNonEmpty(cleaned.filename, cleaned.fileName, sourceDocument, "");
      cleaned.fileName = firstNonEmpty(cleaned.fileName, cleaned.filename, sourceDocument, "");
      return cleaned;
    }


    /* ============================================================
       REQUIREMENT-SPECIFIC MATCHING
       ============================================================ */

    function attributeEvidenceMatch(
      attribute,
      evidence
    ) {
      const aliases =
        ATTRIBUTE_ALIASES[attribute] || [];

      const normalized =
        normalizeForCompare(evidence);

      if (
        !normalized ||
        !aliases.length
      ) {
        return false;
      }

      /*
       * Requirement-specific topic detection.
       *
       * IMPORTANT:
       * A generic word must not prove a specialized requirement.
       * For example:
       *   "deploys" != cloud experience
       *   "support" != 24/7 support
       *   "security" != ISO 27001
       */
      if (
        attribute === "experience"
      ) {
        return /\b(?:experience|experienced|track\s+record|past\s+performance|project(?:s)?|client(?:s)?|customer(?:s)?|contract(?:s)?|engagement(?:s)?|implementation(?:s)?|deployment(?:s)?|delivered|delivery|years?\s+of)\b/i.test(
          normalized
        );
      }

      if (
        attribute === "support"
      ) {
        return /\b(?:support|technical\s+support|customer\s+support|help\s*desk|service\s*desk|technical\s+assistance|support\s+team|support\s+services|sla|service\s+level|uptime)\b/i.test(
          normalized
        );
      }

      if (
        attribute === "availability"
      ) {
        return /\b(?:availability|available|uptime|service\s+availability|24\s*\/\s*7|24x7|around\s+the\s+clock)\b/i.test(
          normalized
        );
      }

      if (
        attribute === "security"
      ) {
        return /\b(?:security|secure|cybersecurity|cyber\s+security|information\s+security|security\s+controls?|security\s+standard)\b/i.test(
          normalized
        );
      }

      if (
        attribute === "encryption"
      ) {
        return /\b(?:encrypt(?:ion|ed)?|aes(?:[-\s]?\d+)?|tls(?:\s*[\d.]+)?|ssl)\b/i.test(
          normalized
        );
      }

      if (
        attribute === "implementation"
      ) {
        return /\b(?:implementation|implemented|deployment|deployed|installation|installed|commissioning|commissioned|rollout|rolled\s+out)\b/i.test(
          normalized
        );
      }

      if (
        attribute === "maintenance"
      ) {
        return /\b(?:maintenance|maintained|annual\s+maintenance|amc|support\s+and\s+maintenance)\b/i.test(
          normalized
        );
      }

      return aliases.some(
        (alias) =>
          normalized.includes(
            normalizeForCompare(alias)
          )
      );
    }

    function hasNumericEvidenceForRequirement(
      req,
      evidence
    ) {
      const s =
        req.structured;

      if (
        s.requiredYears !==
          null &&
        extractYears(
          evidence
        ) === null
      ) {
        return false;
      }

      if (
        s.requiredMonths !==
          null &&
        extractMonths(
          evidence
        ) === null
      ) {
        return false;
      }

      if (
        s.requiredDays !==
          null &&
        extractDays(
          evidence
        ) === null
      ) {
        return false;
      }

      if (
        s.requiredPercentage !==
          null &&
        extractPercentage(
          evidence
        ) === null
      ) {
        return false;
      }

      if (
        s.requiredAmount !==
          null &&
        extractAmount(
          evidence
        ) === null
      ) {
        return false;
      }

      if (
        s.requiredStorage &&
        !extractStorage(
          evidence
        )
      ) {
        return false;
      }

      return true;
    }

    function requirementSpecificity(
      req,
      evidence
    ) {
      const reasons =
        [];

      const matchedAttributes =
        req.structured.attributes.filter(
          (attribute) =>
            attributeEvidenceMatch(
              attribute,
              evidence
            )
        );

      if (
        matchedAttributes.length
      ) {
        reasons.push(
          `matched ${matchedAttributes.join(
            ", "
          )}`
        );
      }

      const matchedCloud =
        req.structured.requiredCloudPlatforms.filter(
          (platform) =>
            detectCloudPlatforms(
              evidence
            ).includes(
              platform
            )
        );

      const matchedSecurity =
        req.structured.requiredSecurityControls.filter(
          (control) =>
            detectSecurityControls(
              evidence
            ).includes(
              control
            )
        );

      const certifications =
        req.structured.requiredCertifications;

      const foundCertifications =
        extractCertification(
          evidence
        );

      const matchedCertifications =
        certifications.filter(
          (cert) =>
            foundCertifications.some(
              (found) =>
                normalizeForCompare(
                  found
                ) ===
                normalizeForCompare(
                  cert
                )
            )
        );

      if (
        matchedCloud.length
      ) {
        reasons.push(
          `cloud: ${matchedCloud.join(
            ", "
          )}`
        );
      }

      if (
        matchedSecurity.length
      ) {
        reasons.push(
          `security: ${matchedSecurity.join(
            ", "
          )}`
        );
      }

      if (
        matchedCertifications.length
      ) {
        reasons.push(
          `certification: ${matchedCertifications.join(
            ", "
          )}`
        );
      }

      const numericEvidence =
        hasNumericEvidenceForRequirement(
          req,
          evidence
        );

      const overlap =
        keywordOverlap(
          [
            req.requirement,
            req.description,
            req.title,
          ]
            .filter(Boolean)
            .join(" "),
          evidence
        );

      return {
        overlap,

        matchedAttributes,

        matchedCloud,

        matchedSecurity,

        matchedCertifications,

        numericEvidence,

        bidderAssertion:
          hasBidderAssertion(
            evidence
          ),

        reasons,
      };
    }
    /* ============================================================
       FAST DIRECT BIDDER-EVIDENCE FALLBACK
       ============================================================ */
    function buildDirectEvidenceFallbacks(requirement, bidderDocuments) {
      const req = normalizeRequirementObject(requirement);
      const out = [];
      const seen = new Set();

      for (const document of safeArray(bidderDocuments)) {
        if (!document || typeof document !== "object") continue;
        const sourceType = safeString(document.sourceType).toLowerCase();
        if (["tender", "requirement", "procurement", "system"].includes(sourceType)) continue;

        const fullText = cleanEvidenceText(firstNonEmpty(
          document.text, document.extractedText, document.content,
          document.rawText, document.parsedText, ""
        ));
        if (!fullText) continue;

        const sourceDocument = firstNonEmpty(
          document.sourceDocument, document.filename, document.fileName,
          document.name, "Bidder Document"
        );
        const sourceDocumentId = firstNonEmpty(
          document.sourceDocumentId, document.id, sourceDocument
        );

        const pieces = fullText
          .split(/(?:\r?\n){2,}|(?<=[.!?])\s+(?=[A-Z0-9])/)
          .map(x => cleanEvidenceText(x))
          .filter(Boolean);

        /* Also inspect the complete document for table-extracted PDFs,
           where useful evidence may be spread across one long line. */
        if (fullText.length <= 12000) pieces.push(fullText);

        for (const piece of pieces) {
          if (!piece || isAnalysisArtifact(piece)) continue;
          if (/\bREQ[-_\s]?\d+\b/i.test(piece)) continue;
          if (/no bidder evidence found/i.test(piece)) continue;

          const specificity = requirementSpecificity(req, piece);
          const direct = (
            specificity.matchedAttributes.length ||
            specificity.matchedCloud.length ||
            specificity.matchedSecurity.length ||
            specificity.matchedCertifications.length ||
            specificity.numericEvidence
          );

          if (!direct) continue;
          if (!semanticCandidateAllowed(req, {
            text: piece,
            sourceType: "bidder",
            sourceDocument,
            sourceDocumentId,
            filename: sourceDocument,
            fileName: sourceDocument
          })) continue;

          const signature = normalizeForCompare(piece);
          if (!signature || seen.has(signature)) continue;
          seen.add(signature);

          out.push({
            text: piece,
            sourceType: "bidder",
            sourceDocument,
            sourceDocumentId,
            filename: sourceDocument,
            fileName: sourceDocument,
            score: scoreEvidenceCandidate(req, { text: piece }),
            relevance: Math.round(scoreEvidenceCandidate(req, { text: piece })),
            matchedAttributes: specificity.matchedAttributes,
            matchedCloud: specificity.matchedCloud,
            matchedSecurity: specificity.matchedSecurity,
            matchedCertifications: specificity.matchedCertifications,
            overlap: specificity.overlap,
            numericEvidence: specificity.numericEvidence,
            bidderAssertion: specificity.bidderAssertion
          });
        }
      }

      return out.sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).slice(0, 8);
    }

    /* ============================================================
       FIND BIDDER EVIDENCE CANDIDATES
       ============================================================ */

    function findEvidenceCandidates(requirement, bidderDocuments, precomputedSegments = null) {
      const req = normalizeRequirementObject(requirement);
      const segments = Array.isArray(precomputedSegments)
        ? precomputedSegments
        : extractBidderEvidenceSegments(bidderDocuments);

      const candidates = [];

      for (const segment of segments) {
        if (!segment || typeof segment !== "object") continue;

        const text = sanitizeBidderEvidenceText(
          segment.text,
          firstNonEmpty(segment.sourceDocument, segment.filename, segment.fileName)
        );
        if (!text) continue;

        const candidate = {
          ...segment,
          text,
          sourceType: "bidder",
          sourceDocument: firstNonEmpty(segment.sourceDocument, segment.filename, segment.fileName),
          sourceDocumentId: firstNonEmpty(segment.sourceDocumentId, segment.id),
          filename: firstNonEmpty(segment.filename, segment.fileName, segment.sourceDocument),
          fileName: firstNonEmpty(segment.fileName, segment.filename, segment.sourceDocument)
        };

        if (!bidderEvidenceCandidateAllowed(req, candidate)) continue;

        /*
         * Deterministic evaluator recovery: a legitimate bidder statement that
         * directly satisfies a specialized procurement rule must not disappear
         * because lexical/semantic gating was too conservative.
         */
        let semanticAllowed = false;
        try {
          semanticAllowed = semanticCandidateAllowed(req, candidate);
        } catch (_) {
          semanticAllowed = false;
        }

        if (!semanticAllowed) {
          try {
            const evaluatorProof = evaluateConditions(req, text);
            semanticAllowed = safeArray(evaluatorProof).some(
              (item) => item && item.status === "PASS"
            );
          } catch (_) {}
        }

        if (!semanticAllowed) continue;

        const specificity = requirementSpecificity(req, text);
        const score = scoreEvidenceCandidate(req, candidate);

        candidates.push({
          ...candidate,
          score,
          matchedAttributes: specificity.matchedAttributes,
          matchedCloud: specificity.matchedCloud,
          matchedSecurity: specificity.matchedSecurity,
          matchedCertifications: specificity.matchedCertifications,
          overlap: specificity.overlap,
          numericEvidence: specificity.numericEvidence,
          bidderAssertion: specificity.bidderAssertion
        });
      }

      return candidates
        .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
        .slice(0, 12);
    }

    function semanticCandidateAllowed(
      requirement,
      candidate
    ) {
      if (
        !candidate ||
        typeof candidate !== "object"
      ) {
        return false;
      }

      if (
        !isBidderSourceType(
          candidate.sourceType
        )
      ) {
        return false;
      }

      const text =
        sanitizeBidderEvidenceText(
          candidate.text,
          firstNonEmpty(
            candidate.sourceDocument,
            candidate.filename,
            candidate.fileName
          )
        );

      if (!text) {
        return false;
      }

      /*
       * Reject analysis-generated text instead of
       * treating it as bidder-document evidence.
       */
      if (
        typeof isAnalysisArtifact ===
          "function" &&
        isAnalysisArtifact(text)
      ) {
        return false;
      }

      if (
        /no bidder evidence found/i.test(text)
      ) {
        return false;
      }

      const req =
        normalizeRequirementObject(
          requirement
        );

      const specificity =
        requirementSpecificity(
          req,
          text
        );

      /*
       * Specialized experience requirements need their domain
       * in the same bidder evidence candidate. This prevents a
       * generic "5 years active" or unrelated project statement
       * from being accepted for "5 years enterprise cloud experience".
       */
      if (
        isExperienceRequirement(req) &&
        experienceRequirementSignals(req).length &&
        !experienceEvidenceMatchesDomain(
          req,
          text
        )
      ) {
        return false;
      }

      /*
       * Versioned security requirements need the actual control
       * in the same bidder evidence candidate. "Security" alone
       * must not prove AES-256/TLS 1.3.
       */
      const reqSecurityText =
        normalizeForCompare(
          [
            req?.title,
            req?.requirement,
            req?.description
          ]
            .filter(Boolean)
            .join(" ")
        );

      if (
        /\baes\s*[- ]?\s*256\b/i.test(
          reqSecurityText
        ) &&
        !/\baes\s*[- ]?\s*256\b/i.test(
          text
        )
      ) {
        return false;
      }

      if (
        /\btls\s*1\.3\b/i.test(
          reqSecurityText
        ) &&
        !/\btls\s*1\.3\b/i.test(
          text
        )
      ) {
        return false;
      }

      if (
        req?.structured?.requires24x7 &&
        !has24x7Support(text) &&
        !/\b(?:16\s*\/\s*7|12\s*\/\s*7|8\s*\/\s*5|less\s+than\s+24\s*\/\s*7)\b/i.test(
          text
        )
      ) {
        return false;
      }

      const structured =
        req.structured;

      const hasStructuredSignal =
        Boolean(
          structured.attributes.length ||
          structured.requiredCloudPlatforms.length ||
          structured.requiredSecurityControls.length ||
          structured.requiredCertifications.length ||
          structured.requiredYears !== null ||
          structured.requiredMonths !== null ||
          structured.requiredDays !== null ||
          structured.requiredPercentage !== null ||
          structured.requiredAmount !== null ||
          structured.requiredStorage ||
          structured.requires24x7
        );

      /*
       * For structured requirements, at least one
       * concrete requirement-specific signal must
       * appear in the bidder evidence.
       */
      if (
        hasStructuredSignal
      ) {
        const structuredMatch =
          Boolean(
            specificity
              .matchedAttributes
              .length ||

            specificity
              .matchedCloud
              .length ||

            specificity
              .matchedSecurity
              .length ||

            specificity
              .matchedCertifications
              .length ||

            specificity.numericEvidence ||

            (
              structured.requires24x7 &&
              has24x7Support(text)
            )
          );

        if (!structuredMatch) {
          return false;
        }
      }

      /*
       * Generic semantic evidence signal.
       * This is intentionally more permissive than
       * the previous 0.45 overlap rule so genuine
       * bidder documents are not rejected merely
       * because their wording differs from the tender.
       */
      const semanticSignal =
        Boolean(
          specificity
            .matchedAttributes
            .length ||

          specificity
            .matchedCloud
            .length ||

          specificity
            .matchedSecurity
            .length ||

          specificity
            .matchedCertifications
            .length ||

          specificity.numericEvidence ||

          specificity.bidderAssertion
        );

      if (!semanticSignal) {
        return false;
      }

      /*
       * Common bidder-document language.
       * This helps identify real statements such as
       * certifications, experience, projects,
       * support, implementation, SLA, etc.
       */
      const evidenceLanguage =
        /\b(?:has|have|holds|hold|is|are|provides|provide|providing|provided|delivered|delivers|implemented|implements|deployed|deploys|installed|maintained|maintains|operates|operated|supported|supports|certified|certification|experience|experienced|projects|project|clients|customers|contracts|contract|sla|uptime|support|years|months|days|percent|percentage|%|amount|revenue|turnover|crore|lakh|million|thousand|aws|azure|gcp|google cloud|iso|aes|tls)\b/i.test(
          text
        );

      if (
        specificity.bidderAssertion ||
        evidenceLanguage
      ) {
        return true;
      }

      return false;
    }

    /* ============================================================
       BIDDER EVIDENCE EXTRACTION
       ============================================================ */

    function isBidderSummaryArtifact(text) {
      const value = normalizeWhitespace(text);
      if (!value) return true;

      const patterns = [
        /\b(?:tender\s+requirements?\s+document|tender\s+requirement|procurement\s+requirement)\b/i,
        /\b(?:total\s+clauses?|key\s+requirements?|weightage|qualification\s+status)\b/i,
        /\b(?:complied|non[\s-]*complied|non[\s-]*compliant)\s*:\s*\d+\s*(?:clauses?|requirements?)/i,
        /\b(?:complied|non[\s-]*complied|non[\s-]*compliant)\s*:\s*\d+\s*\/\s*\d+\s*(?:clauses?|requirements?)/i,
        /\b(?:overall\s+status|qualification\s+status)\s*:\s*(?:qualified|rejected|accepted|disqualified|compliant|non[\s-]*compliant)/i,
        /\b(?:8|9|10|[0-9]+)\s+clauses?\s*\(\s*\d+%\s*\)/i,
        /\b(?:clause[-\s]*by[-\s]*clause|compliance\s+matrix)\b/i,
        /\b(?:bidder\s+response\s*&?\s*proof|response\s*&?\s*proof)\b/i,
        /\b(?:clause\s+requirement\s+status)\b/i,
        /\b(?:source\s*:)\s*bidder[_\s-]*document/i,
        /\b(?:ai\s+verified|requirement\s+verification|matched\s+evidence|evidence\s+match)\b/i,
        /\b(?:qualification\s+status)\s*:\s*(?:rejected|qualified|accepted|disqualified)\b/i,
        /\b(?:complied|non[\s-]*complied|non[\s-]*compliant)\s*:\s*\d+\s*\/\s*\d+\b/i,
        /\b(?:clause|requirement)\s+requirement\s+status\s+bidder\s+response\s*(?:&|and)?\s*proof\b/i,
        /\b(?:bidder\s+compliance\s+evaluation|compliance\s+evaluation\s+matrix)\b/i,
      ];

      return patterns.some((pattern) => pattern.test(value));
    }

    // Hard evidence firewall. These strings are document-level summaries,
    // headers, tender-copy text, or generated UI/report artifacts. They are NEVER
    // allowed to become requirement evidence, even when an LLM selects them.
    function isForbiddenBidderEvidence(text) {
      const value = normalizeWhitespace(text);
      if (!value) return true;
      if (isBidderSummaryArtifact(value)) return true;
      if (/^source\s*:/i.test(value)) return true;
      if (/\b(?:ai\s+verified|requirement\s+verification|matched\s+evidence|confidence\s*\d+%?)\b/i.test(value)) return true;
      if (/\b(?:tender\s+requirements?|tender\s+requirements?\s+specifications|procurement\s+requirements?)\b/i.test(value)) return true;
      if (/\b(?:issue\s+date|document\s+ref|confidential\s+document|smart\s+city\s+it\s+infrastructure\s+upgrade)\b/i.test(value)) return true;
      if (/\b(?:complied|non[\s-]*complied|non[\s-]*compliant)\s*:\s*\d+/i.test(value) && /\b(?:clauses?|requirements?)\b/i.test(value)) return true;
      if (/\b(?:overall\s+status|qualification\s+status)\s*:/i.test(value)) return true;
      return false;
    }

    function extractBidderResponseFragments(text) {
      const source = safeString(text);
      if (!source.trim()) return [];

      const lines = source
        .replace(/\r/g, "")
        .split(/\n+/)
        .map((line) => normalizeWhitespace(line))
        .filter(Boolean);

      const fragments = [];

      for (const rawLine of lines) {
        let line = rawLine;
        if (isBidderSummaryArtifact(line)) continue;

        // Split concatenated compliance-matrix rows before sanitisation.
        const rowParts = line
          .split(/(?=\bREQ[-_\s]?\d+\b)/i)
          .map((x) => normalizeWhitespace(x))
          .filter(Boolean);

        for (let part of rowParts) {
          if (isBidderSummaryArtifact(part)) continue;

          // Prefer the actual bidder response/proof portion of a matrix row.
          const status = part.match(
            /\b(?:non[\s-]*complied|non[\s-]*compliant|not[\s-]*compliant|complied|compliant|missing)\b\s*[:\-]?\s*/i
          );

          if (status && status.index != null) {
            const before = part.slice(0, status.index);
            const after = part.slice(status.index + status[0].length).trim();

            // "Complied: 5/10 clauses" is a document-level summary, never evidence.
            if (/^\s*\d+\s*\/\s*\d+\s*(?:clauses?|requirements?)/i.test(after)) {
              continue;
            }

            if (after.length >= 8) {
              part = after;
            } else {
              part = `${before} ${status[0].trim()}`.trim();
            }
          }

          part = part
            .replace(/^\s*(?:REQ[-_\s]?\d+|Requirement\s*\d+|Clause\s*\d+(?:\.\d+)*)\s*[:.)\-]?\s*/i, "")
            .replace(/^\s*\d+(?:\.\d+){0,3}\s*[:.)\-]\s*/i, "")
            .replace(/^\s*(?:company\s+experience|annual\s+turnover|cmmi\s+level\s*3|on[\s-]?site\s+engineers?)\s*/i, (match) => {
              // Only remove obvious matrix title prefixes when they are followed by
              // a real response. Do not use titles as evidence themselves.
              return "";
            })
            .trim();

          if (!part || part.length < 12) continue;
          if (isForbiddenBidderEvidence(part)) continue;
          if (/^(?:company experience|annual turnover|cmmi level 3|on-site engineers)$/i.test(part)) continue;
          if (/^source\s*:/i.test(part)) continue;

          fragments.push(part);
        }
      }

      return [...new Set(fragments)];
    }

    function sanitizeBidderEvidenceText(rawText, sourceDocument = "") {
      const raw = safeString(rawText);
      if (!raw.trim()) return "";

      const sourceBase = safeString(sourceDocument)
        .trim()
        .replace(/\\/g, "/")
        .split("/")
        .pop();

      const fragments = extractBidderResponseFragments(raw);
      const output = [];

      for (let line of fragments) {
        if (sourceBase) {
          const escaped = escapeRegex(sourceBase);
          line = line
            .replace(new RegExp("\\bSource\\s*:\\s*" + escaped + "\\b", "ig"), "")
            .replace(new RegExp("\\b" + escaped + "\\b", "ig"), "")
            .trim();
        }

        line = line
          .replace(/\bSource\s*:\s*[^|;\n]+$/i, "")
          .replace(/\b(?:filename|file\s*name|document\s*name)\s*:\s*[^|;\n]+$/i, "")
          .replace(/^\s*(?:remarks?|deviation|response|bidder\s+response|bidder\s+remarks?)\s*[:\-]\s*/i, "")
          .trim();

        if (!line) continue;
        if (isBidderSummaryArtifact(line)) continue;
        if (/no bidder evidence found/i.test(line)) continue;
        if (isAnalysisArtifact(line)) continue;

        output.push(normalizeWhitespace(line));
      }

      return [...new Set(output)].join("\n");
    }

    function extractBidderEvidenceSegments(bidderDocuments) {
      const segments = [];

      safeArray(bidderDocuments).forEach((document, documentIndex) => {
        if (!document || typeof document !== "object") return;

        const declaredSourceType = safeString(document.sourceType).trim().toLowerCase();
        if (["tender", "requirement", "procurement", "system"].includes(declaredSourceType)) return;

        const documentSourceName = firstNonEmpty(
          document.sourceDocument,
          document.filename,
          document.fileName,
          document.name,
          `Bidder Document ${documentIndex + 1}`
        );
        const documentId = firstNonEmpty(
          document.sourceDocumentId,
          document.id,
          `bidder_document_${documentIndex + 1}`
        );

        const rawText = firstNonEmpty(
          document.text,
          document.extractedText,
          document.content,
          document.rawText,
          ""
        );
        if (!safeString(rawText).trim()) return;

        const cleanedDocument = sanitizeBidderEvidenceText(rawText, documentSourceName);
        if (!cleanedDocument) return;

        // Keep short evidence units so each requirement can select the exact
        // sentence instead of inheriting unrelated text from a whole PDF page.
        const units = buildDocumentUnits(cleanedDocument, {
          ...document,
          sourceType: "bidder",
          sourceDocument: documentSourceName,
          sourceDocumentId: documentId,
          filename: firstNonEmpty(document.filename, document.fileName, document.name, documentSourceName),
          fileName: firstNonEmpty(document.fileName, document.filename, document.name, documentSourceName)
        });

        const usableUnits = units.length > 0
          ? units
          : extractBidderResponseFragments(cleanedDocument).map((text, unitIndex) => ({
              id: `${documentId}_${unitIndex}`,
              text
            }));

        usableUnits.forEach((unit, unitIndex) => {
          if (!unit || typeof unit !== "object") return;
          const cleaned = sanitizeBidderEvidenceText(unit.text, documentSourceName);
          if (!cleaned) return;
          if (isAnalysisArtifact(cleaned)) return;
          if (/no bidder evidence found/i.test(cleaned)) return;

          segments.push({
            ...unit,
            id: firstNonEmpty(unit.id, `${documentId}_${unitIndex}`),
            text: cleaned,
            sourceType: "bidder",
            sourceDocument: documentSourceName,
            sourceDocumentId: documentId,
            filename: firstNonEmpty(unit.filename, document.filename, document.fileName, documentSourceName),
            fileName: firstNonEmpty(unit.fileName, document.fileName, document.filename, documentSourceName)
          });
        });
      });

      // Deduplicate identical text from repeated PDF table extraction.
      const seen = new Set();
      return segments.filter((segment) => {
        const key = `${segment.sourceDocumentId}|${normalizeForCompare(segment.text)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }


    /* ============================================================
       EVIDENCE CANDIDATE SCORING
       ============================================================ */

    function scoreEvidenceCandidate(
      requirement,
      candidate
    ) {
      const req =
        normalizeRequirementObject(
          requirement
        );

      const text =
        cleanEvidenceText(
          candidate.text
        );

      const specificity =
        requirementSpecificity(
          req,
          text
        );

      let score =
        specificity.overlap *
        45;

      score +=
        specificity.matchedAttributes.length *
        10;

      score +=
        specificity.matchedCloud.length *
        8;

      score +=
        specificity.matchedSecurity.length *
        8;

      score +=
        specificity.matchedCertifications.length *
        8;

      if (
        specificity.numericEvidence
      ) {
        score +=
          12;
      }

      if (
        specificity.bidderAssertion
      ) {
        score +=
          8;
      }

      if (
        isConditionalEvidence(
          text
        )
      ) {
        score -=
          18;
      }

      if (
        hasExplicitNegative(
          text
        )
      ) {
        score -=
          8;
      }

      if (
        text.length >=
        30
      ) {
        score +=
          4;
      }

      return clamp(
        score
      );
    }
    function semanticCandidateAllowed(
      requirement,
      candidate
    ) {
      if (
        !candidate ||
        typeof candidate !== "object"
      ) {
        return false;
      }

      if (
        !isBidderSourceType(
          candidate.sourceType
        )
      ) {
        return false;
      }

      const text =
        cleanEvidenceText(
          candidate.text
        );

      if (!text) {
        return false;
      }

      if (
        typeof isAnalysisArtifact ===
          "function" &&
        isAnalysisArtifact(text)
      ) {
        return false;
      }

      if (
        /\bREQ[-_\s]?\d+\b/i.test(
          text
        )
      ) {
        return false;
      }

      if (
        /no bidder evidence found/i.test(
          text
        )
      ) {
        return false;
      }

      const req =
        normalizeRequirementObject(
          requirement
        );

      /*
       * AUTHORITATIVE EVALUATOR OVERRIDE:
       *
       * Candidate gating must never reject a bidder sentence merely because
       * its wording does not share enough literal keywords with the tender.
       * The deterministic requirement evaluators are more precise than raw
       * lexical overlap for measurable procurement controls (amounts, years,
       * project counts, infrastructure, warranty, incorporation, local service,
       * certifications, security, support, etc.).
       *
       * If a bidder-only candidate independently satisfies one of those
       * evaluators, keep the candidate and let evaluateEvidence make the final
       * status decision. This fixes the systematic one-requirement/10-percent
       * undercount caused by overly strict candidate filtering while preserving
       * the bidder-source and negative-evidence safeguards below.
       */
      try {
        const evaluatorProof = evaluateConditions(
          req,
          text
        );

        if (
          safeArray(evaluatorProof).some(
            (item) => item && item.status === "PASS"
          )
        ) {
          return true;
        }
      } catch (_) {}

      const structured =
        req.structured || {};

      const specificity =
        requirementSpecificity(
          req,
          text
        );

      const requirementText =
        [
          req.title,
          req.requirementTitle,
          req.requirement,
          req.description,
          req.requirementText
        ]
          .filter(Boolean)
          .join(" ");

      const lexicalOverlap =
        keywordOverlap(
          requirementText,
          text
        );

      const matchedAttributes =
        safeArray(
          specificity.matchedAttributes
        );

      const matchedCloud =
        safeArray(
          specificity.matchedCloud
        );

      const matchedSecurity =
        safeArray(
          specificity.matchedSecurity
        );

      const matchedCertifications =
        safeArray(
          specificity.matchedCertifications
        );

      const numericEvidence =
        Boolean(
          specificity.numericEvidence
        );

      const hasRequiredYears =
        structured.requiredYears !==
          null &&
        structured.requiredYears !==
          undefined;

      const hasRequiredMonths =
        structured.requiredMonths !==
          null &&
        structured.requiredMonths !==
          undefined;

      const hasRequiredDays =
        structured.requiredDays !==
          null &&
        structured.requiredDays !==
          undefined;

      const hasRequiredPercentage =
        structured.requiredPercentage !==
          null &&
        structured.requiredPercentage !==
          undefined;

      const hasRequiredAmount =
        structured.requiredAmount !==
          null &&
        structured.requiredAmount !==
          undefined;

      const hasRequiredStorage =
        Boolean(
          structured.requiredStorage
        );

      const requires24x7 =
        Boolean(
          structured.requires24x7
        );

      const hasStructuredSignal =
        Boolean(
          matchedAttributes.length ||
          structured.attributes?.length ||
          matchedCloud.length ||
          structured.requiredCloudPlatforms?.length ||
          matchedSecurity.length ||
          structured.requiredSecurityControls?.length ||
          matchedCertifications.length ||
          structured.requiredCertifications?.length ||
          hasRequiredYears ||
          hasRequiredMonths ||
          hasRequiredDays ||
          hasRequiredPercentage ||
          hasRequiredAmount ||
          hasRequiredStorage ||
          requires24x7
        );
    /*
     * Requirement-category isolation.
     *
     * A bidder statement must match the specific
     * type of requirement, not merely a broad topic
     * such as "security" or "support".
     */

    const requirementLower =
      String(
        requirementText || ""
      ).toLowerCase();

    const evidenceLower =
      String(
        text || ""
      ).toLowerCase();

    /*
     * Certification requirement:
     * generic security evidence must NOT satisfy
     * a certification requirement.
     */
    const certificationRequested =
      /\b(certif(?:y|ied|ication|icate)|iso\s*27001|iso\s*9001|iso\s*14001|certificate)\b/i.test(
        requirementLower
      );

    const certificationEvidence =
      /\b(iso\s*27001|iso\s*9001|iso\s*14001|certif(?:y|ied|ication|icate)|certificate|certified)\b/i.test(
        evidenceLower
      );

    if (
      certificationRequested &&
      !certificationEvidence
    ) {
      return false;
    }

    /*
     * 24/7 support requirement:
     * generic "support" or "GCP" evidence must NOT
     * satisfy a 24/7 SLA requirement.
     */
    const support247Requested =
      /\b24\s*\/\s*7\b|\b24x7\b|\b24\s*hours?\b.*\b7\s*days?\b/i.test(
        requirementLower
      );

    const support247Evidence =
      /\b24\s*\/\s*7\b|\b24x7\b|\b24\s*hours?\b.*\b7\s*days?\b/i.test(
        evidenceLower
      );

    if (
      support247Requested &&
      !support247Evidence
    ) {
      return false;
    }

    /*
     * Multi-cloud requirement:
     * require actual cloud-platform evidence.
     */
    const cloudRequested =
      /\b(?:aws|amazon web services|azure|microsoft azure|gcp|google cloud|multi[-\s]?cloud|hybrid cloud)\b/i.test(
        requirementLower
      );

    const cloudEvidence =
      /\b(?:aws|amazon web services|azure|microsoft azure|gcp|google cloud)\b/i.test(
        evidenceLower
      );

    if (
      cloudRequested &&
      !cloudEvidence
    ) {
      return false;
    }
      const strongStructuredMatch =
        Boolean(
          matchedAttributes.length ||
          matchedCloud.length ||
          matchedSecurity.length ||
          matchedCertifications.length ||
          numericEvidence ||
          (
            requires24x7 &&
            has24x7Support(
              text
            )
          )
        );

      const hasNumericRequirement =
        Boolean(
          hasRequiredYears ||
          hasRequiredMonths ||
          hasRequiredDays ||
          hasRequiredPercentage ||
          hasRequiredAmount ||
          hasRequiredStorage
        );

      /*
       * Numeric requirement ke liye actual
       * numeric evidence compulsory hai.
       */
      if (
        hasNumericRequirement &&
        !numericEvidence
      ) {
        return false;
      }

      /*
       * Cloud requirement ko actual cloud
       * platform match karna hi hoga.
       */
      if (
        safeArray(
          structured.requiredCloudPlatforms
        ).length > 0 &&
        matchedCloud.length === 0
      ) {
        return false;
      }

      /*
       * Security requirement ko actual security
       * control match karna hi hoga.
       */
      if (
        safeArray(
          structured.requiredSecurityControls
        ).length > 0 &&
        matchedSecurity.length === 0
      ) {
        return false;
      }

      /*
       * Certification requirement ko actual
       * certification match karna hi hoga.
       */
      if (
        safeArray(
          structured.requiredCertifications
        ).length > 0 &&
        matchedCertifications.length === 0
      ) {
        return false;
      }

      /*
       * 24/7 requirement ke liye actual 24/7
       * evidence compulsory hai.
       */
      if (
        requires24x7 &&
        !has24x7Support(
          text
        )
      ) {
        return false;
      }

      /*
       * Structured requirements:
       *
       * Generic "we provide..." type statement
       * alone kabhi sufficient nahi hoga.
       */
      if (
        hasStructuredSignal
      ) {
        if (
          !strongStructuredMatch &&
          lexicalOverlap <
            0.18
        ) {
          return false;
        }

        if (
          !strongStructuredMatch &&
          lexicalOverlap <
            0.28
        ) {
          return false;
        }

        return true;
      }

      /*
       * Non-structured requirements ke liye
       * bidder assertion + meaningful overlap
       * required hai.
       */
      const bidderAssertion =
        Boolean(
          specificity.bidderAssertion
        );

      if (
        lexicalOverlap >=
          0.30 &&
        bidderAssertion
      ) {
        return true;
      }

      if (
        lexicalOverlap >=
          0.45
      ) {
        return true;
      }

      return false;
    }

    /* ============================================================
       CONDITION EVALUATORS
       ============================================================ */

    function isExperienceRequirement(req) {
      const normalized =
        normalizeForCompare(
          [
            req?.title,
            req?.requirement,
            req?.description,
            req?.requirementText
          ]
            .filter(Boolean)
            .join(" ")
        );

      return (
        safeArray(
          req?.structured?.attributes
        ).includes("experience") ||
        /\b(?:experience|experienced|track\s+record|past\s+performance|commercial\s+experience|relevant\s+experience)\b/i.test(
          normalized
        )
      );
    }

    function experienceRequirementSignals(req) {
      const normalized =
        normalizeForCompare(
          [
            req?.title,
            req?.requirement,
            req?.description,
            req?.requirementText
          ]
            .filter(Boolean)
            .join(" ")
        );

      const signals = [];

      if (
        /\b(?:enterprise|enterprise[-\s]?grade|commercial)\b/i.test(
          normalized
        )
      ) {
        signals.push("enterprise");
      }

      if (
        /\b(?:cloud|cloud\s+computing|cloud\s+platform|cloud\s+service|saas|paas|iaas|aws|azure|gcp|google\s+cloud|oracle\s+cloud|oci|alibaba\s+cloud)\b/i.test(
          normalized
        )
      ) {
        signals.push("cloud");
      }

      if (
        /\b(?:software|application|it|information\s+technology|technology|digital)\b/i.test(
          normalized
        )
      ) {
        signals.push("technology");
      }

      if (
        /\b(?:government|public\s+sector|government\s+sector)\b/i.test(
          normalized
        )
      ) {
        signals.push("government");
      }

      return unique(signals);
    }

    function experienceEvidenceMatchesDomain(
      req,
      evidence
    ) {
      const signals =
        experienceRequirementSignals(
          req
        );

      const normalized =
        normalizeForCompare(
          evidence
        );

      if (
        !signals.length
      ) {
        return true;
      }

      /*
       * Each specialized domain requested by the tender
       * must be represented in the bidder evidence.
       */
      for (
        const signal of signals
      ) {
        if (
          signal === "enterprise" &&
          !/\b(?:enterprise|commercial|corporate)\b/i.test(
            normalized
          )
        ) {
          return false;
        }

        if (
          signal === "cloud" &&
          !/\b(?:cloud|aws|azure|gcp|google\s+cloud|oracle\s+cloud|oci|alibaba\s+cloud)\b/i.test(
            normalized
          )
        ) {
          return false;
        }

        if (
          signal === "technology" &&
          !/\b(?:software|application|it|technology|digital|system)\b/i.test(
            normalized
          )
        ) {
          return false;
        }

        if (
          signal === "government" &&
          !/\b(?:government|public\s+sector|government\s+sector|psu|public\s+sector\s+undertaking|state\s+owned|government\s+owned)\b/i.test(
            normalized
          )
        ) {
          return false;
        }
      }

      return true;
    }

    function extractClaimedExperienceYears(
      evidence
    ) {
      const text =
        normalizeWhitespace(
          evidence
        );

      if (!text) {
        return null;
      }

      /*
       * Bidder compliance matrices often repeat the tender's
       * "minimum X years" in the same row and then state the
       * bidder's actual value later:
       *
       *   Minimum 3 Years ... Compliant ... 5 Years active
       *
       * Do NOT read the repeated minimum as the bidder's actual
       * experience. Collect all year values and ignore values
       * explicitly framed as a requirement/threshold.
       */
      const matches = [];
      const regex =
        /(\d+(?:\.\d+)?)\s*(?:\+|or\s+more)?\s*(?:years?|yrs?)/gi;

      let match;

      while (
        (match = regex.exec(text))
      ) {
        const value =
          Number(match[1]);

        const before =
          text
            .slice(
              Math.max(
                0,
                match.index - 70
              ),
              match.index
            )
            .toLowerCase();

        const isRequirementNumber =
          /\b(?:minimum|at\s+least|required|required\s+experience|required\s+to|must\s+have|shall\s+have|not\s+less\s+than)\b/.test(
            before
          );

        if (
          !isRequirementNumber &&
          Number.isFinite(value)
        ) {
          matches.push(value);
        }
      }

      if (!matches.length) {
        return null;
      }

      /*
       * The strongest remaining numeric claim is used.
       * This handles "5 years experience across 10 projects"
       * while ignoring an echoed "minimum 3 years".
       */
      return Math.max(
        ...matches
      );
    }

    function evaluateYears(
      req,
      evidence
    ) {
      if (
        req.structured.requiredYears ===
        null
      ) {
        return null;
      }

      const experienceRequirement =
        isExperienceRequirement(
          req
        );

      const actual =
        experienceRequirement
          ? extractClaimedExperienceYears(
              evidence
            )
          : extractYears(
              evidence
            );

      if (
        actual ===
        null
      ) {
        return {
          name:
            experienceRequirement
              ? "Experience"
              : "Required Years",

          status:
            "UNKNOWN",

          reason:
            experienceRequirement
              ? "The bidder evidence does not state a verifiable bidder-owned experience duration."
              : "The bidder evidence does not state a verifiable number of years."
        };
      }

      if (
        experienceRequirement &&
        !experienceEvidenceMatchesDomain(
          req,
          evidence
        )
      ) {
        return {
          name:
            "Experience Relevance",

          status:
            "FAIL",

          actual,

          required:
            req.structured.requiredYears,

          reason:
            "The bidder states an experience duration, but the evidence does not demonstrate the specialized experience domain required by the tender."
        };
      }

      if (
        actual >=
        req.structured.requiredYears
      ) {
        return {
          name:
            experienceRequirement
              ? "Experience"
              : "Required Years",

          status:
            "PASS",

          actual,

          required:
            req.structured.requiredYears,

          reason:
            experienceRequirement
              ? `The bidder states ${actual} years of relevant experience against the required ${req.structured.requiredYears} years.`
              : `The bidder states ${actual} years against the required ${req.structured.requiredYears} years.`
        };
      }

      return {
        name:
          experienceRequirement
            ? "Experience"
            : "Required Years",

        status:
          "FAIL",

        actual,

        required:
          req.structured.requiredYears,

        reason:
          experienceRequirement
            ? `The bidder states only ${actual} years of relevant experience, below the required ${req.structured.requiredYears} years.`
            : `The bidder states only ${actual} years, below the required ${req.structured.requiredYears} years.`
      };
    }

    function evaluateAmountRequirement(
      req,
      evidence
    ) {
      if (
        req.structured.requiredAmount ===
        null
      ) {
        return null;
      }

      const actualRaw =
        extractAmount(
          evidence
        );

      const actual =
        actualRaw === null
          ? null
          : convertAmount(actualRaw);

      if (
        actual ===
        null
      ) {
        return {
          name:
            "Amount",

          status:
            "UNKNOWN",

          reason:
            "The bidder evidence does not contain a verifiable amount.",
        };
      }

      if (
        actual >=
        req.structured.requiredAmount
      ) {
        return {
          name:
            "Amount",

          status:
            "PASS",

          actual,

          required:
            req.structured.requiredAmount,

          reason:
            "The bidder-provided amount meets or exceeds the required threshold.",
        };
      }

      return {
        name:
          "Amount",

        status:
          "FAIL",

        actual,

        required:
          req.structured.requiredAmount,

        reason:
          "The bidder-provided amount is below the required threshold.",
      };
    }

    function evaluateStorage(
      req,
      evidence
    ) {
      if (
        !req.structured.requiredStorage
      ) {
        return null;
      }

      const actual =
        extractStorage(
          evidence
        );

      if (
        !actual
      ) {
        return {
          name:
            "Storage",

          status:
            "UNKNOWN",

          reason:
            "The bidder evidence does not contain a verifiable storage capacity.",
        };
      }

      if (
        actual.gb >=
        req.structured.requiredStorage.gb
      ) {
        return {
          name:
            "Storage",

          status:
            "PASS",

          actual:
            actual.original,

          required:
            req.structured.requiredStorage.original,

          reason:
            "The bidder-provided storage capacity meets the requirement.",
        };
      }

      return {
        name:
          "Storage",

        status:
          "FAIL",

        actual:
          actual.original,

        required:
          req.structured.requiredStorage.original,

        reason:
          "The bidder-provided storage capacity is below the requirement.",
      };
    }

    function evaluatePercentage(
      req,
      evidence
    ) {
      if (
        req.structured.requiredPercentage ===
        null
      ) {
        return null;
      }

      const actual =
        extractPercentage(
          evidence
        );

      if (
        actual ===
        null
      ) {
        return {
          name:
            "Percentage",

          status:
            "UNKNOWN",

          reason:
            "The bidder evidence does not contain a verifiable percentage.",
        };
      }

      if (
        actual >=
        req.structured.requiredPercentage
      ) {
        return {
          name:
            "Percentage",

          status:
            "PASS",

          actual,

          required:
            req.structured.requiredPercentage,

          reason:
            "The bidder-provided percentage meets or exceeds the requirement.",
        };
      }

      return {
        name:
          "Percentage",

        status:
          "FAIL",

        actual,

        required:
          req.structured.requiredPercentage,

        reason:
          "The bidder-provided percentage is below the requirement.",
      };
    }

    function evaluateDays(
      req,
      evidence
    ) {
      if (
        req.structured.requiredDays ===
        null
      ) {
        return null;
      }

      const actual =
        extractDays(
          evidence
        );

      if (
        actual ===
        null
      ) {
        return {
          name:
            "Timeline",

          status:
            "UNKNOWN",

          reason:
            "The bidder evidence does not state a verifiable number of days.",
        };
      }

      if (
        actual <=
        req.structured.requiredDays
      ) {
        return {
          name:
            "Timeline",

          status:
            "PASS",

          actual,

          required:
            req.structured.requiredDays,

          reason:
            "The bidder-provided delivery or response timeline meets the requirement.",
        };
      }

      return {
        name:
          "Timeline",

        status:
          "FAIL",

        actual,

        required:
          req.structured.requiredDays,

        reason:
          "The bidder-provided timeline exceeds the permitted requirement.",
      };
    }

    function evaluateCloud(
      req,
      evidence
    ) {
      const required =
        safeArray(
          req.structured.requiredCloudPlatforms
        );

      if (
        !required.length
      ) {
        return null;
      }

      const actual =
        detectCloudPlatforms(
          evidence
        );

      const matched =
        required.filter(
          (
            platform
          ) =>
            actual.includes(
              platform
            )
        );

      if (
        matched.length ===
        required.length
      ) {
        return {
          name:
            "Cloud Platform",

          status:
            "PASS",

          matched,

          required,

          reason:
            "All required cloud platforms are supported by the bidder evidence.",
        };
      }

      if (
        matched.length
      ) {
        return {
          name:
            "Cloud Platform",

          status:
            "PARTIAL",

          matched,

          missing:
            required.filter(
              (
                platform
              ) =>
                !matched.includes(
                  platform
                )
            ),

          required,

          reason:
            "Only some of the required cloud platforms are supported by the bidder evidence.",
        };
      }

      return {
        name:
          "Cloud Platform",

        status:
          "UNKNOWN",

        matched: [],

        required,

        reason:
          "The bidder evidence does not establish support for the required cloud platform.",
      };
    }

    function evaluateSecurity(
      req,
      evidence
    ) {
      const required =
        safeArray(
          req.structured.requiredSecurityControls
        );

      const requirementText =
        normalizeForCompare(
          [
            req.title,
            req.requirement,
            req.description
          ]
            .filter(Boolean)
            .join(" ")
        );

      const evidenceText =
        normalizeForCompare(evidence);

      if (
        !required.length &&
        !/\b(?:aes|tls|ssl|encryption|security\s+control|encryption\s+at\s+rest|in\s+transit)\b/i.test(
          requirementText
        )
      ) {
        return null;
      }

      /*
       * Build requirement-specific security checks.
       * Generic "security" overlap is never enough for a versioned
       * encryption requirement.
       */
      const checks = [];

      if (
        /\baes\s*[- ]?\s*256\b/i.test(
          requirementText
        )
      ) {
        checks.push({
          key: "AES-256",
          pass: /\baes\s*[- ]?\s*256\b/i.test(
            evidenceText
          ),
          reason:
            "AES-256 is explicitly stated in the bidder evidence."
        });
      }

      if (
        /\btls\s*1\.3\b/i.test(
          requirementText
        )
      ) {
        checks.push({
          key: "TLS 1.3",
          pass: /\btls\s*1\.3\b/i.test(
            evidenceText
          ),
          reason:
            "TLS 1.3 is explicitly stated in the bidder evidence."
        });
      }

      if (
        /\bencryption\s+(?:at\s+rest|for\s+data\s+at\s+rest)|data\s+(?:at\s+rest|storage)\b.*\bencrypt/i.test(
          requirementText
        ) ||
        /\baes\s*[- ]?\s*256\b.*\bat\s+rest\b/i.test(
          requirementText
        )
      ) {
        checks.push({
          key: "encryption-at-rest",
          pass:
            /\b(?:encrypt(?:ion|ed)?|aes\s*[- ]?\s*256)\b/i.test(
              evidenceText
            ) &&
            /\b(?:at\s+rest|data\s+at\s+rest|data\s+storage|storage)\b/i.test(
              evidenceText
            ),
          reason:
            "The bidder evidence links encryption to stored/resting data."
        });
      }

      if (
        /\btls\s*1\.3\b.*\b(?:in\s+transit|transit|network)\b/i.test(
          requirementText
        ) ||
        /\bencryption\b.*\bin\s+transit\b/i.test(
          requirementText
        )
      ) {
        checks.push({
          key: "tls-in-transit",
          pass:
            /\btls\s*1\.3\b/i.test(
              evidenceText
            ) &&
            /\b(?:in\s+transit|transit|network|transport)\b/i.test(
              evidenceText
            ),
          reason:
            "The bidder evidence links TLS to network/in-transit transport."
        });
      }

      /*
       * For every explicitly requested structured security control,
       * require an actual corresponding signal.
       */
      for (
        const control of required
      ) {
        const key =
          safeString(control).toLowerCase();

        if (
          key === "encryption" &&
          !checks.some(
            (x) =>
              x.key === "encryption-at-rest" ||
              x.key === "AES-256"
          )
        ) {
          checks.push({
            key: "encryption",
            pass:
              /\b(?:encrypt(?:ion|ed)?|aes)\b/i.test(
                evidenceText
              ),
            reason:
              "Encryption is explicitly stated in the bidder evidence."
          });
        }

        if (
          key === "tls" &&
          !checks.some(
            (x) =>
              x.key === "TLS 1.3" ||
              x.key === "tls-in-transit"
          )
        ) {
          checks.push({
            key: "TLS",
            pass:
              /\btls\b/i.test(
                evidenceText
              ),
            reason:
              "TLS is explicitly stated in the bidder evidence."
          });
        }

        if (
          key === "ssl" &&
          !checks.some(
            (x) => x.key === "TLS 1.3"
          )
        ) {
          checks.push({
            key: "SSL/TLS",
            pass:
              /\b(?:ssl|tls)\b/i.test(
                evidenceText
              ),
            reason:
              "SSL/TLS transport security is explicitly stated in the bidder evidence."
          });
        }
      }

      const negative =
        hasExplicitNegative(
          evidenceText
        );

      if (
        negative &&
        /\b(?:security|encrypt|aes|tls|ssl|data|support|cloud)\b/i.test(
          evidenceText
        )
      ) {
        return {
          name: "Security Controls",
          status: "FAIL",
          required,
          matched: [],
          reason:
            "The bidder evidence explicitly indicates that a required security capability is unavailable or not supported."
        };
      }

      if (!checks.length) {
        const matched =
          required.filter(
            (control) =>
              attributeEvidenceMatch(
                control,
                evidenceText
              )
          );

        return {
          name: "Security Controls",
          status:
            matched.length === required.length
              ? "PASS"
              : matched.length
                ? "PARTIAL"
                : "UNKNOWN",
          matched,
          missing:
            required.filter(
              (control) =>
                !matched.includes(control)
            ),
          required,
          reason:
            matched.length === required.length
              ? "All required security controls are supported by the bidder evidence."
              : "The bidder evidence does not establish all required security controls."
        };
      }

      const failed =
        checks.filter(
          (check) => !check.pass
        );

      if (!failed.length) {
        return {
          name: "Security Controls",
          status: "PASS",
          required:
            unique([
              ...required,
              ...checks.map(
                (check) => check.key
              )
            ]),
          matched:
            checks.map(
              (check) => check.key
            ),
          missing: [],
          reason:
            "All explicitly stated security/encryption conditions are supported by the bidder evidence."
        };
      }

      const passed =
        checks.filter(
          (check) => check.pass
        );

      return {
        name: "Security Controls",
        status:
          passed.length > 0
            ? "PARTIAL"
            : "UNKNOWN",
        required:
          unique([
            ...required,
            ...checks.map(
              (check) => check.key
            )
          ]),
        matched:
          passed.map(
            (check) => check.key
          ),
        missing:
          failed.map(
            (check) => check.key
          ),
        reason:
          "Only part of the required security conditions are supported by the bidder evidence."
      };
    }

    function evaluateCertification(
      req,
      evidence
    ) {
      const required =
        safeArray(
          req.structured.requiredCertifications
        );

      if (
        !required.length
      ) {
        return null;
      }

      const actual =
        extractCertification(
          evidence
        );

      const matched =
        required.filter(
          (
            cert
          ) =>
            actual.some(
              (
                found
              ) =>
                normalizeForCompare(
                  found
                ) ===
                normalizeForCompare(
                  cert
                )
            )
        );

      if (
        matched.length ===
        required.length
      ) {
        return {
          name:
            "Certification",

          status:
            "PASS",

          matched,

          required,

          reason:
            "All required certifications are explicitly present in the bidder evidence.",
        };
      }

      if (
        matched.length
      ) {
        return {
          name:
            "Certification",

          status:
            "PARTIAL",

          matched,

          missing:
            required.filter(
              (
                cert
              ) =>
                !matched.includes(
                  cert
                )
            ),

          required,

          reason:
            "Only some of the required certifications are supported by the bidder evidence.",
        };
      }

      return {
        name:
          "Certification",

        status:
          "UNKNOWN",

        matched: [],

        required,

        reason:
          "The bidder evidence does not establish the required certification.",
      };
    }

    function evaluate24x7(
      req,
      evidence
    ) {
      if (
        !req.structured.requires24x7
      ) {
        return null;
      }

      const normalized =
        normalizeForCompare(
          evidence
        );

      if (
        has24x7Support(
          evidence
        )
      ) {
        /*
         * If the same bidder statement explicitly says the
         * actual service is lower than 24/7, the negative
         * statement wins.
         */
        if (
          /\b(?:16\s*\/\s*7|12\s*\/\s*7|8\s*\/\s*5|less\s+than\s+24\s*\/\s*7|not\s+24\s*\/\s*7|not\s+available\s+24\s*\/\s*7)\b/i.test(
            normalized
          ) &&
          /\b(?:support|service|availability|desk|sla)\b/i.test(
            normalized
          )
        ) {
          return {
            name:
              "24/7 Support",

            status:
              "FAIL",

            reason:
              "The bidder evidence states a support/availability level below the required 24/7 coverage."
          };
        }

        return {
          name:
            "24/7 Support",

          status:
            "PASS",

          reason:
            "The bidder evidence explicitly supports 24/7 support."
        };
      }

      if (
        /\b(?:16\s*\/\s*7|12\s*\/\s*7|8\s*\/\s*5|less\s+than\s+24\s*\/\s*7)\b/i.test(
          normalized
        ) &&
        /\b(?:support|service|availability|desk|sla)\b/i.test(
          normalized
        )
      ) {
        return {
          name:
            "24/7 Support",

          status:
            "FAIL",

          reason:
            "The bidder evidence explicitly states support coverage below the required 24/7 level."
        };
      }

      return {
        name:
          "24/7 Support",

        status:
          "UNKNOWN",

        reason:
          "The bidder evidence does not explicitly establish 24/7 support."
      };
    }

    function evaluateSupport(
      req,
      evidence
    ) {
      const attributes =
        safeArray(
          req.structured.attributes
        );

      if (
        !attributes.includes(
          "support"
        ) &&
        !attributes.includes(
          "support247"
        ) &&
        !attributes.includes(
          "sla"
        )
      ) {
        return null;
      }

      if (
        isConditionalEvidence(
          evidence
        )
      ) {
        return {
          name:
            "Support",

          status:
            "REVIEW",

          reason:
            "The bidder mentions support conditionally or as a future commitment."
        };
      }

      if (
        hasExplicitNegative(
          evidence
        )
      ) {
        return {
          name:
            "Support",

          status:
            "FAIL",

          reason:
            "The bidder evidence explicitly indicates that the required support is unavailable or not provided."
        };
      }

      /*
       * For a 24/7 requirement, generic support evidence is
       * deliberately NOT a PASS. evaluate24x7() is the
       * authoritative condition.
       */
      if (
        req.structured.requires24x7
      ) {
        if (
          has24x7Support(
            evidence
          )
        ) {
          return {
            name:
              "Support",

            status:
              "PASS",

            reason:
              "The bidder evidence contains support information and explicitly states 24/7 coverage."
          };
        }

        if (
          /\b(?:16\s*\/\s*7|12\s*\/\s*7|8\s*\/\s*5|less\s+than\s+24\s*\/\s*7)\b/i.test(
            normalizeForCompare(
              evidence
            )
          )
        ) {
          return {
            name:
              "Support",

            status:
              "FAIL",

            reason:
              "The bidder support coverage is below the required 24/7 level."
          };
        }

        return {
          name:
            "Support",

          status:
            "UNKNOWN",

          reason:
            "The bidder evidence mentions support but does not establish the required 24/7 coverage."
        };
      }

      if (
        hasBidderAssertion(
          evidence
        ) &&
        /\b(?:support|helpdesk|service desk|technical assistance|maintenance|sla|uptime)\b/i.test(
          evidence
        )
      ) {
        return {
          name:
            "Support",

          status:
            "PASS",

          reason:
            "The bidder evidence contains a concrete bidder-owned support assertion."
        };
      }

      return {
        name:
          "Support",

        status:
          "UNKNOWN",

        reason:
          "The bidder evidence does not conclusively establish the required support capability."
      };
    }

    function evaluateExperience(
      req,
      evidence
    ) {
      const attributes =
        safeArray(
          req.structured.attributes
        );

      if (
        !attributes.includes(
          "experience"
        )
      ) {
        return null;
      }

      /* A project-count requirement is evaluated by the dedicated project
       * evaluator below. Do not create an unrelated UNKNOWN experience
       * condition that can turn a fully proven project-count requirement into
       * MISSING/REVIEW. */
      const reqText = normalizeForCompare([
        req.title,
        req.requirement,
        req.description,
        req.requirementText
      ].filter(Boolean).join(" "));
      const hasProjectCountRule =
        /\b(?:at\s+least|minimum(?:\s+of)?|minimum)\s*\d+\s+(?:similar\s+|relevant\s+|major\s+)?(?:government\s+|public\s+sector\s+|psu\s+)?(?:projects?|contracts?|assignments?|engagements?|implementations?)\b/i.test(reqText);

      if (
        hasProjectCountRule &&
        req.structured.requiredYears === null
      ) {
        return null;
      }

      if (
        isConditionalEvidence(
          evidence
        )
      ) {
        return {
          name:
            "Relevant Experience",

          status:
            "REVIEW",

          reason:
            "The bidder describes experience as a future or conditional commitment."
        };
      }

      const years =
        extractClaimedExperienceYears(
          evidence
        );

      const domainMatch =
        experienceEvidenceMatchesDomain(
          req,
          evidence
        );

      const hasProjectFact =
        /\b(?:project|client|customer|deployment|implementation|contract|engagement|assignment|installation|delivered|delivery)\b/i.test(
          evidence
        );

      if (
        years !== null &&
        !domainMatch
      ) {
        return {
          name:
            "Relevant Experience",

          status:
            "FAIL",

          actualYears:
            years,

          required:
            req.structured.requiredYears,

          reason:
            "The bidder evidence states an experience duration, but it does not demonstrate the specialized experience domain required by the tender."
        };
      }

      if (
        years !== null &&
        req.structured.requiredYears !== null &&
        years <
          req.structured.requiredYears
      ) {
        return {
          name:
            "Relevant Experience",

          status:
            "FAIL",

          actualYears:
            years,

          required:
            req.structured.requiredYears,

          reason:
            `The bidder states only ${years} years of relevant experience, below the required ${req.structured.requiredYears} years.`
        };
      }

      if (
        years !== null &&
        (
          req.structured.requiredYears ===
            null ||
          years >=
            req.structured.requiredYears
        ) &&
        (
          hasBidderAssertion(
            evidence
          ) ||
          hasProjectFact
        )
      ) {
        return {
          name:
            "Relevant Experience",

          status:
            "PASS",

          actualYears:
            years,

          required:
            req.structured.requiredYears,

          reason:
            "The bidder evidence provides a concrete, requirement-relevant experience duration."
        };
      }

      if (
        hasProjectFact &&
        hasBidderAssertion(
          evidence
        ) &&
        domainMatch
      ) {
        return {
          name:
            "Relevant Experience",

          status:
            "PASS",

          reason:
            "The bidder evidence provides a concrete project or client experience assertion relevant to the tender."
        };
      }

      return {
        name:
          "Relevant Experience",

        status:
          "UNKNOWN",

        reason:
          "The bidder evidence does not contain sufficient documentary proof of relevant experience."
      };
    }

    function evaluateBidValidity(
      req,
      evidence
    ) {
      const normalized =
        normalizeForCompare(
          `${req.title} ${req.requirement}`
        );

      if (
        !/\b(?:bid validity|validity of bid|offer validity|offer shall remain valid)\b/.test(
          normalized
        )
      ) {
        return null;
      }

      const days =
        extractDays(
          evidence
        );

      if (
        days ===
        null
      ) {
        return {
          name:
            "Bid Validity",

          status:
            "UNKNOWN",

          reason:
            "The bidder evidence does not state a verifiable bid validity period.",
        };
      }

      if (
        req.structured.requiredDays !==
        null
      ) {
        if (
          days >=
          req.structured.requiredDays
        ) {
          return {
            name:
              "Bid Validity",

            status:
              "PASS",

            actual:
              days,

            required:
              req.structured.requiredDays,

            reason:
              "The bidder's stated bid validity meets the required period.",
          };
        }

        return {
          name:
            "Bid Validity",

          status:
            "FAIL",

          actual:
            days,

          required:
            req.structured.requiredDays,

          reason:
            "The bidder's stated bid validity is shorter than the required period.",
        };
      }

      return {
        name:
          "Bid Validity",

        status:
          "PASS",

        actual:
          days,

        reason:
          "The bidder explicitly states a bid validity period.",
      };
    }

    function evaluatePenalty(
      req,
      evidence
    ) {
      const attributes =
        safeArray(
          req.structured.attributes
        );

      const normalized =
        normalizeForCompare(
          `${req.title} ${req.requirement}`
        );

      if (
        !attributes.includes(
          "penalty"
        ) &&
        !normalized.includes(
          "penalty"
        )
      ) {
        return null;
      }

      if (
        isConditionalEvidence(
          evidence
        )
      ) {
        return {
          name:
            "Penalty Condition",

          status:
            "REVIEW",

          reason:
            "The bidder response describes the penalty commitment conditionally.",
        };
      }

      if (
        hasExplicitNegative(
          evidence
        )
      ) {
        return {
          name:
            "Penalty Condition",

          status:
            "FAIL",

          reason:
            "The bidder evidence indicates that the required penalty condition is not accepted or supported.",
        };
      }

      if (
        hasBidderAssertion(
          evidence
        )
      ) {
        return {
          name:
            "Penalty Condition",

          status:
            "PASS",

          reason:
            "The bidder evidence contains a concrete assertion related to the required penalty condition.",
        };
      }

      return {
        name:
          "Penalty Condition",

        status:
          "UNKNOWN",

        reason:
          "The bidder evidence does not conclusively establish acceptance of the penalty condition.",
      };
    }

    function evaluateEligibility(
      req,
      evidence
    ) {
      const attrs =
        req.structured
          .attributes;

      const eligibilityAttrs =
        [
          "gst",
          "pan",
          "companyRegistration",
          "eligibility",
        ];

      if (
        !attrs.some(
          (
            x
          ) =>
            eligibilityAttrs.includes(
              x
            )
        )
      ) {
        return null;
      }

      const matched =
        attrs.filter(
          (
            attr
          ) =>
            eligibilityAttrs.includes(
              attr
            ) &&
            attributeEvidenceMatch(
              attr,
              evidence
            )
        );

      if (
        matched.length
      ) {
        return {
          name:
            "Eligibility",

          status:
            "PASS",

          matched,

          reason:
            "The bidder provided evidence relevant to the eligibility requirement.",
        };
      }

      return {
        name:
          "Eligibility",

        status:
          "UNKNOWN",

        matched: [],

        reason:
          "Eligibility could not be conclusively verified from bidder evidence.",
      };
    }

    function evaluateGenericAttribute(
      req,
      evidence
    ) {
      const attributes =
        req.structured
          .attributes;

      if (
        !attributes.length
      ) {
        return null;
      }

      const matched =
        attributes.filter(
          (
            attribute
          ) =>
            attributeEvidenceMatch(
              attribute,
              evidence
            )
        );

      if (
        matched.length ===
        attributes.length
      ) {
        return {
          name:
            "Requirement Attributes",

          status:
            "PASS",

          matched,

          reason:
            "All identified requirement attributes are supported by the bidder evidence.",
        };
      }

      if (
        matched.length
      ) {
        return {
          name:
            "Requirement Attributes",

          status:
            "REVIEW",

          matched,

          missing:
            attributes.filter(
              (
                x
              ) =>
                !matched.includes(
                  x
                )
            ),

          reason:
            "Only part of the requirement attributes are supported by the bidder evidence.",
        };
      }

      return {
        name:
          "Requirement Attributes",

        status:
          "UNKNOWN",

        matched: [],

        reason:
          "The bidder evidence does not conclusively match the required attributes.",
      };
    }

    function evaluateProjectCountRequirement(req, evidence) {
      const reqText = normalizeForCompare([req.title, req.requirement, req.description, req.requirementText].filter(Boolean).join(" "));
      const requirementMatch = reqText.match(/\b(?:at\s+least|minimum(?:\s+of)?|minimum)\s*(\d+)\s+(?:similar\s+|relevant\s+|major\s+)?(?:government\s+|public\s+sector\s+|psu\s+)?(?:projects?|contracts?|assignments?|engagements?|implementations?)\b/i);
      if (!requirementMatch && !/\bsuccessful(?:ly)?\s+execution\s+of\b/i.test(reqText)) return null;
      const required = requirementMatch ? Number(requirementMatch[1]) : null;
      const text = cleanEvidenceText(evidence);
      const actualMatches = [...text.matchAll(/\b(\d+)\s+(?:major\s+|similar\s+|relevant\s+)?(?:government\s+|public\s+sector\s+|psu\s+)?(?:projects?|contracts?|assignments?|engagements?|implementations?)\b/gi)];
      let actual = actualMatches.length ? Math.max(...actualMatches.map((m) => Number(m[1]))) : null;
      if (actual === null) {
        const completedMatch = text.match(/\b(?:completed|executed|delivered|implemented)\s+(\d+)\s+(?:major\s+|similar\s+|relevant\s+)?(?:government\s+|public\s+sector\s+|psu\s+)?(?:projects?|contracts?|assignments?|engagements?|implementations?)\b/i);
        if (completedMatch) actual = Number(completedMatch[1]);
      }
      if (actual === null) return { name: "Project Count", status: "UNKNOWN", reason: "The bidder evidence does not state a verifiable number of qualifying projects." };
      if (required !== null && actual >= required) return { name: "Project Count", status: "PASS", actual, required, reason: `The bidder evidence demonstrates ${actual} qualifying projects against the required minimum of ${required}.` };
      if (required !== null) return { name: "Project Count", status: "FAIL", actual, required, reason: `The bidder evidence demonstrates only ${actual} qualifying projects against the required minimum of ${required}.` };
      return { name: "Project Count", status: "PASS", actual, reason: "The bidder evidence provides a concrete qualifying project count." };
    }

    function evaluateInfrastructureRequirement(req, evidence) {
      const reqText = normalizeForCompare([req.title, req.requirement, req.description, req.requirementText].filter(Boolean).join(" "));
      const text = cleanEvidenceText(evidence);
      const needsTier3 = /\btier\s*[- ]?3\b/i.test(reqText);
      const needsFailover = /\b(?:dual\s*region|two\s+region|secondary\s+(?:site|region)|failover|disaster\s+recovery|geo[- ]?redundan|redundan(?:cy|t))\b/i.test(reqText);
      if (!needsTier3 && !needsFailover) return null;
      const tierPass = !needsTier3 || /\btier\s*[- ]?3\b/i.test(text);
      const failoverPass = !needsFailover || /\b(?:dual\s*region|two\s+region|secondary\s+(?:site|region)|failover|disaster\s+recovery|geo[- ]?redundan|redundan(?:cy|t))\b/i.test(text);
      if (hasExplicitNegative(text) && (needsTier3 || needsFailover)) return { name: "Infrastructure Redundancy", status: "FAIL", reason: "The bidder evidence contains an explicit negative statement relevant to the required infrastructure capability." };
      if (tierPass && failoverPass) return { name: "Infrastructure Redundancy", status: "PASS", reason: "The bidder evidence directly supports the required Tier-3 and/or redundant failover infrastructure conditions." };
      return { name: "Infrastructure Redundancy", status: "PARTIAL", matched: [tierPass ? "Tier-3" : null, failoverPass ? "redundancy/failover" : null].filter(Boolean), missing: [!tierPass ? "Tier-3" : null, !failoverPass ? "redundancy/failover" : null].filter(Boolean), reason: "The bidder evidence supports only part of the required infrastructure conditions." };
    }

    function evaluateWarrantyRequirement(req, evidence) {
      const reqText = normalizeForCompare([req.title, req.requirement, req.description, req.requirementText].filter(Boolean).join(" "));
      if (!/\b(?:warranty|amc|annual\s+maintenance|oem\s+warranty)\b/i.test(reqText)) return null;
      const text = cleanEvidenceText(evidence);
      if (!/\b(?:warranty|amc|annual\s+maintenance)\b/i.test(text)) return { name: "Warranty / AMC", status: "UNKNOWN", reason: "The bidder evidence does not establish the required warranty or AMC." };
      if (hasExplicitNegative(text) && /\b(?:warranty|amc|not\s+included|not\s+provided|without)\b/i.test(text)) return { name: "Warranty / AMC", status: "FAIL", reason: "The bidder evidence explicitly indicates that the required warranty/AMC is not provided." };
      const reqYears = extractYears(reqText);
      const actualYears = extractYears(text);
      const oemRequired = /\boem\b/i.test(reqText);
      const oemPresent = /\boem\b/i.test(text);
      if (oemRequired && !oemPresent) return { name: "Warranty / AMC", status: "UNKNOWN", reason: "Warranty evidence is present, but the tender specifically requires OEM warranty evidence." };
      if (reqYears !== null && actualYears !== null && actualYears < reqYears) return { name: "Warranty / AMC", status: "FAIL", actualYears, requiredYears: reqYears, reason: `The bidder provides ${actualYears} years of warranty against the required ${reqYears} years.` };
      if (actualYears !== null || /\bcomprehensive\b/i.test(text)) return { name: "Warranty / AMC", status: "PASS", actualYears, requiredYears: reqYears, reason: "The bidder evidence directly supports the required warranty/AMC commitment." };
      return { name: "Warranty / AMC", status: "PASS", reason: "The bidder evidence directly states the required warranty/AMC commitment." };
    }

    function evaluateCompanyIncorporation(req, evidence) {
      const reqText = normalizeForCompare([req.title, req.requirement, req.description, req.requirementText].filter(Boolean).join(" "));
      if (!/\b(?:company\s+incorporation|incorporated|companies\s+act|registered\s+under)\b/i.test(reqText)) return null;
      const text = cleanEvidenceText(evidence);
      if (hasExplicitNegative(text) && /\b(?:not\s+registered|not\s+incorporated|unregistered|invalid\s+registration)\b/i.test(text)) return { name: "Company Incorporation", status: "FAIL", reason: "The bidder evidence indicates that the company is not validly incorporated or registered." };
      if (/\b(?:incorporated|registered|certificate\s+of\s+incorporation|companies\s+act)\b/i.test(text)) return { name: "Company Incorporation", status: "PASS", reason: "The bidder evidence directly states valid company incorporation/registration." };
      return { name: "Company Incorporation", status: "UNKNOWN", reason: "The bidder evidence does not establish company incorporation/registration." };
    }

    function evaluateLocalServiceCenter(req, evidence) {
      const reqText = normalizeForCompare([req.title, req.requirement, req.description, req.requirementText].filter(Boolean).join(" "));
      if (!/\b(?:local\s+service\s+center|service\s+center\s+within|local\s+support\s+center)\b/i.test(reqText)) return null;
      const text = cleanEvidenceText(evidence);
      if (hasExplicitNegative(text) && /\b(?:service\s+center|local\s+center|no\s+local|not\s+available)\b/i.test(text)) return { name: "Local Service Center", status: "FAIL", reason: "The bidder evidence explicitly indicates that the required local service center is not available." };
      if (/\b(?:local\s+service\s+center|service\s+center|branch|office)\b/i.test(text) && hasBidderAssertion(text)) return { name: "Local Service Center", status: "PASS", reason: "The bidder evidence directly states availability of a relevant service center." };
      return { name: "Local Service Center", status: "UNKNOWN", reason: "The bidder evidence does not establish the required local service center." };
    }

    function evaluateConditions(
      req,
      evidence
    ) {
      const evaluators = [
        evaluateYears,
        evaluateAmountRequirement,
        evaluateStorage,
        evaluatePercentage,
        evaluateDays,
        evaluateCloud,
        evaluateSecurity,
        evaluateCertification,
        evaluate24x7,
        evaluateSupport,
        evaluateExperience,
        evaluateBidValidity,
        evaluatePenalty,
        evaluateEligibility,
        evaluateProjectCountRequirement,
        evaluateInfrastructureRequirement,
        evaluateWarrantyRequirement,
        evaluateCompanyIncorporation,
        evaluateLocalServiceCenter,
      ];

      const results = [];

      for (
        const evaluator of
          evaluators
      ) {
        try {
          const result =
            evaluator(
              req,
              evidence
            );

          if (
            result &&
            result.status
          ) {
            results.push(
              result
            );
          }
        } catch (_) {}
      }

      if (
        !results.some(
          (
            item
          ) =>
            item.status ===
              "PASS" ||
            item.status ===
              "FAIL"
        )
      ) {
        const generic =
          evaluateGenericAttribute(
            req,
            evidence
          );

        if (
          generic
        ) {
          results.push(
            generic
          );
        }
      }

      return results;
    }

    /* ============================================================
       REQUIREMENT COVERAGE
       ============================================================ */

    function calculateRequirementCoverage(
      req,
      evidence
    ) {
      const covered = [];
      const missing = [];

      const structured =
        req.structured;

      for (
        const attribute of
          safeArray(
            structured.attributes
          )
      ) {
        if (
          attributeEvidenceMatch(
            attribute,
            evidence
          )
        ) {
          covered.push(
            attribute
          );
        } else {
          missing.push(
            attribute
          );
        }
      }

      const actualCloud =
        detectCloudPlatforms(
          evidence
        );

      for (
        const platform of
          safeArray(
            structured.requiredCloudPlatforms
          )
      ) {
        if (
          actualCloud.includes(
            platform
          )
        ) {
          covered.push(
            `cloud:${platform}`
          );
        } else {
          missing.push(
            `cloud:${platform}`
          );
        }
      }

      const actualSecurity =
        detectSecurityControls(
          evidence
        );

      for (
        const control of
          safeArray(
            structured.requiredSecurityControls
          )
      ) {
        if (
          actualSecurity.includes(
            control
          )
        ) {
          covered.push(
            `security:${control}`
          );
        } else {
          missing.push(
            `security:${control}`
          );
        }
      }

      const actualCerts =
        extractCertification(
          evidence
        );

      for (
        const cert of
          safeArray(
            structured.requiredCertifications
          )
      ) {
        if (
          actualCerts.includes(
            cert
          )
        ) {
          covered.push(
            `certification:${cert}`
          );
        } else {
          missing.push(
            `certification:${cert}`
          );
        }
      }

      if (
        structured.requiredYears !==
        null
      ) {
        const actual =
          isExperienceRequirement(req)
            ? extractClaimedExperienceYears(
                evidence
              )
            : extractYears(
                evidence
              );

        if (
          actual !== null &&
          actual >=
            structured.requiredYears &&
          (
            !isExperienceRequirement(req) ||
            experienceEvidenceMatchesDomain(
              req,
              evidence
            )
          )
        ) {
          covered.push(
            "years"
          );
        } else {
          missing.push(
            "years"
          );
        }
      }

      if (
        structured.requiredMonths !==
        null
      ) {
        const actual =
          extractMonths(
            evidence
          );

        if (
          actual !== null
        ) {
          covered.push(
            "months"
          );
        } else {
          missing.push(
            "months"
          );
        }
      }

      if (
        structured.requiredDays !==
        null
      ) {
        const actual =
          extractDays(
            evidence
          );

        if (
          actual !== null &&
          actual <=
            structured.requiredDays
        ) {
          covered.push(
            "days"
          );
        } else {
          missing.push(
            "days"
          );
        }
      }

      if (
        structured.requiredPercentage !==
        null
      ) {
        const actual =
          extractPercentage(
            evidence
          );

        if (
          actual !== null &&
          actual >=
            structured.requiredPercentage
        ) {
          covered.push(
            "percentage"
          );
        } else {
          missing.push(
            "percentage"
          );
        }
      }

      if (
        structured.requiredAmount !==
        null
      ) {
        const actualRaw =
          extractAmount(
            evidence
          );
        const actual =
          actualRaw === null
            ? null
            : convertAmount(actualRaw);

        if (
          actual !== null &&
          actual >=
            structured.requiredAmount
        ) {
          covered.push(
            "amount"
          );
        } else {
          missing.push(
            "amount"
          );
        }
      }

      if (
        structured.requiredStorage
      ) {
        const actual =
          extractStorage(
            evidence
          );

        if (
          actual &&
          actual.gb >=
            structured.requiredStorage.gb
        ) {
          covered.push(
            "storage"
          );
        } else {
          missing.push(
            "storage"
          );
        }
      }

      if (
        structured.requires24x7
      ) {
        if (
          has24x7Support(
            evidence
          )
        ) {
          covered.push(
            "24x7"
          );
        } else {
          missing.push(
            "24x7"
          );
        }
      }

      const total =
        covered.length +
        missing.length;

      return {
        covered,

        missing,

        coverage:
          total
            ? covered.length /
              total
            : null,
      };
    }

    /* ============================================================
       EVIDENCE QUALITY
       ============================================================ */

    function calculateEvidenceQuality(
      req,
      candidates
    ) {
      if (
        !safeArray(
          candidates
        ).length
      ) {
        return 0;
      }

      const best =
        candidates[0];

      let score =
        20;

      const specificity =
        requirementSpecificity(
          req,
          best.text
        );

      score +=
        Math.min(
          30,
          specificity.matchedAttributes.length *
          10
        );

      score +=
        Math.min(
          20,
          specificity.matchedCloud.length *
          10
        );

      score +=
        Math.min(
          20,
          specificity.matchedSecurity.length *
          10
        );

      score +=
        Math.min(
          20,
          specificity.matchedCertifications.length *
          10
        );

      score +=
        Math.round(
          specificity.overlap *
          20
        );

      if (
        specificity.bidderAssertion
      ) {
        score +=
          10;
      }

      if (
        isConditionalEvidence(
          best.text
        )
      ) {
        score -=
          15;
      }

      if (
        hasExplicitNegative(
          best.text
        )
      ) {
        score -=
          5;
      }

      return clamp(
        score
      );
    }

    function evidenceCoverage(
      req,
      candidates
    ) {
      if (
        !safeArray(
          candidates
        ).length
      ) {
        return 0;
      }

      const evidence =
        candidates
          .map(
            (
              item
            ) =>
              cleanEvidenceText(
                item.text
              )
          )
          .filter(Boolean)
          .join(" ");

      const structuredCoverage =
        calculateRequirementCoverage(
          req,
          evidence
        );

      if (
        structuredCoverage.coverage !==
        null
      ) {
        return clamp(
          structuredCoverage.coverage *
          100
        );
      }

      const relevant =
        candidates.filter(
          (
            item
          ) =>
            Number(
              item.relevance ||
              0
            ) >= 50
        );

      return clamp(
        (
          relevant.length /
          candidates.length
        ) *
        100
      );
    }

    function calculateDeterministicConfidence(
      status,
      req,
      candidates,
      conditionResults
    ) {
      if (
        status ===
        "MISSING"
      ) {
        return 18;
      }

      const quality =
        calculateEvidenceQuality(
          req,
          candidates
        );

      const coverage =
        evidenceCoverage(
          req,
          candidates
        );

      const passed =
        safeArray(
          conditionResults
        ).filter(
          (
            item
          ) =>
            item.status ===
            "PASS"
        ).length;

      const failed =
        safeArray(
          conditionResults
        ).filter(
          (
            item
          ) =>
            item.status ===
            "FAIL"
        ).length;

      const unknown =
        safeArray(
          conditionResults
        ).filter(
          (
            item
          ) =>
            item.status ===
              "UNKNOWN" ||
            item.status ===
              "REVIEW"
        ).length;

      let confidence =
        quality * 0.45 +
        coverage * 0.35;

      confidence +=
        passed * 5;

      confidence -=
        failed * 8;

      confidence -=
        unknown * 4;

      if (
        status ===
        "COMPLIANT"
      ) {
        confidence +=
          8;
      }

      if (
        status ===
        "REVIEW"
      ) {
        confidence -=
          5;
      }

      if (
        status ===
        "NON_COMPLIANT"
      ) {
        confidence +=
          4;
      }

      return clamp(
        confidence,
        0,
        100
      );
    }

    function directRequirementProof(req, evidence) {
      const text = cleanEvidenceText(evidence);
      const normalized = normalizeForCompare(text);
      if (!text || !normalized) return false;
      if (hasExplicitNegative(text)) return false;

      const structured = req.structured || {};
      const reqText = normalizeForCompare([
        req.title, req.requirement, req.description, req.requirementText
      ].filter(Boolean).join(" "));

      if (/\biso\s*27001\b/i.test(reqText)) {
        return /\biso\s*27001\b/i.test(text);
      }

      const needsAES = /\baes\s*[- ]?\s*256\b/i.test(reqText);
      const needsTLS13 = /\btls\s*1\.3\b/i.test(reqText);
      if (needsAES && needsTLS13) {
        return /\baes\s*[- ]?\s*256\b/i.test(text) &&
          /\btls\s*1\.3\b/i.test(text) &&
          /\b(?:at\s+rest|data\s+storage|data\s+stored|storage)\b/i.test(text) &&
          /\b(?:in\s+transit|transit|network|transport)\b/i.test(text);
      }

      if (structured.requires24x7) return has24x7Support(text);

      const requiredCloud = safeArray(structured.requiredCloudPlatforms);
      if (requiredCloud.length) {
        const actual = detectCloudPlatforms(text);
        return requiredCloud.every((x) => actual.includes(x));
      }

      if (structured.requiredYears !== null && isExperienceRequirement(req)) {
        const years = extractClaimedExperienceYears(text);
        return years !== null && years >= structured.requiredYears &&
          experienceEvidenceMatchesDomain(req, text);
      }

      if (structured.requiredAmount !== null) {
        const actualRaw = extractAmount(text);
        const actual = actualRaw === null ? null : convertAmount(actualRaw);
        if (actual !== null && actual >= structured.requiredAmount) return true;
      }

      return false;
    }


    /* ============================================================
       EVIDENCE DECISION ENGINE
       ============================================================ */

    function hasRelevantNegativeEvidence(
      req,
      candidates
    ) {
      const requirementText =
        [
          req?.title,
          req?.requirement,
          req?.description,
          req?.requirementText
        ]
          .filter(Boolean)
          .join(" ");

      return safeArray(
        candidates
      ).some(
        (candidate) => {
          const evidence =
            cleanEvidenceText(
              candidate?.text
            );

          if (!evidence || !hasExplicitNegative(evidence)) {
            return false;
          }

          const specificity =
            requirementSpecificity(
              req,
              evidence
            );

          const overlap =
            Number(
              specificity?.overlap || 0
            );

          const concrete =
            Boolean(
              specificity?.matchedAttributes?.length ||
              specificity?.matchedCloud?.length ||
              specificity?.matchedSecurity?.length ||
              specificity?.matchedCertifications?.length ||
              specificity?.numericEvidence
            );

          return (
            concrete ||
            overlap >= 0.22 ||
            /\b(?:does\s+not|do\s+not|cannot|can't|not\s+provided|not\s+supported|unsupported|non[-\s]?compliant|doesn't|don't)\b/i.test(
              evidence
            ) &&
            keywordOverlap(
              requirementText,
              evidence
            ) >= 0.18
          );
        }
      );
    }

    function evaluateEvidence(
      requirement,
      candidates
    ) {
      const req =
        normalizeRequirementObject(
          requirement
        );

      const validCandidates =
        safeArray(
          candidates
        )
          .map(
            cleanBidderEvidenceCandidate
          )
          .filter(Boolean)
          .filter(
            (candidate) =>
              bidderEvidenceCandidateAllowed(
                req,
                candidate
              )
          )
          .filter(
            (candidate) =>
              semanticCandidateAllowed(
                req,
                candidate
              )
          );

      if (
        !validCandidates.length
      ) {
        return {
          status:
            "MISSING",

          confidence:
            18,

          evidence:
            [],

          conditionResults:
            [],

          coveredComponents:
            [],

          missingComponents:
            ["bidder evidence"],

          reason:
            "No trustworthy bidder-document evidence was found for this requirement."
        };
      }

      /*
       * IMPORTANT:
       * Only the candidates selected for THIS requirement
       * are used. We never re-scan the whole bidder corpus
       * here, preventing cross-requirement contamination.
       */
      const evidencePool =
        validCandidates
          .slice(
            0,
            8
          )
          .map(
            (candidate) =>
              cleanEvidenceText(
                candidate.text
              )
          )
          .filter(Boolean);

      const combinedEvidence =
        evidencePool.join(
          " "
        );

      /* Direct, requirement-specific proof is authoritative for the
       * common measurable procurement controls. This avoids generic
       * evaluator heuristics incorrectly turning complete proof into
       * NON_COMPLIANT. */
      if (directRequirementProof(req, combinedEvidence)) {
        return {
          status: "COMPLIANT",
          confidence: 94,
          evidence: validCandidates,
          conditionResults: [{
            name: "Direct requirement proof",
            status: "PASS",
            reason: "The bidder evidence directly states the required control/value."
          }],
          coveredComponents: calculateRequirementCoverage(req, combinedEvidence).covered,
          missingComponents: [],
          reason: "The bidder document contains direct, requirement-specific proof."
        };
      }

      const conditionResults =
        evaluateConditions(
          req,
          combinedEvidence
        );

      const coverage =
        calculateRequirementCoverage(
          req,
          combinedEvidence
        );

      const explicitFailure =
        conditionResults.some(
          (item) =>
            item &&
            item.status ===
              "FAIL"
        );

      const partialCondition =
        conditionResults.some(
          (item) =>
            item &&
            item.status ===
              "PARTIAL"
        );

      const explicitPass =
        conditionResults.length > 0 &&
        conditionResults.every(
          (item) =>
            item &&
            item.status ===
              "PASS"
        );

      const hasNegative =
        hasRelevantNegativeEvidence(
          req,
          validCandidates
        );

      const conditional =
        validCandidates.some(
          (candidate) =>
            isConditionalEvidence(
              candidate.text
            )
        );

      const strongBidderAssertion =
        validCandidates.some(
          (candidate) =>
            hasBidderAssertion(
              candidate.text
            )
        );

      const hasUnknown =
        conditionResults.some(
          (item) =>
            item &&
            (
              item.status ===
                "UNKNOWN" ||
              item.status ===
                "REVIEW"
            )
        );

      const structured =
        requirementHasStrongSignal(
          req.requirement
        );

      /*
       * Specialized experience mismatch is a hard failure:
       * the bidder supplied an experience duration, but not
       * in the domain explicitly required by the tender.
       */
      const experienceDomainFailure =
        isExperienceRequirement(
          req
        ) &&
        safeArray(
          req.structured.attributes
        ).includes(
          "experience"
        ) &&
        validCandidates.some(
          (candidate) => {
            const text =
              cleanEvidenceText(
                candidate.text
              );

            return (
              extractClaimedExperienceYears(
                text
              ) !== null &&
              !experienceEvidenceMatchesDomain(
                req,
                text
              )
            );
          }
        );

      /*
       * 1. Explicit contradiction/failure wins.
       */
      if (
        explicitFailure ||
        hasNegative ||
        experienceDomainFailure
      ) {
        return {
          status:
            "NON_COMPLIANT",

          confidence:
            calculateDeterministicConfidence(
              "NON_COMPLIANT",
              req,
              validCandidates,
              conditionResults
            ),

          evidence:
            validCandidates,

          conditionResults,

          coveredComponents:
            coverage.covered,

          missingComponents:
            coverage.missing,

          reason:
            experienceDomainFailure
              ? "The bidder supplied evidence for a different experience domain than the one required by the tender."
              : "The bidder evidence explicitly fails or contradicts a required condition."
        };
      }

      /*
       * 2. Conditional/future promises never prove compliance.
       */
      if (
        conditional
      ) {
        return {
          status:
            "REVIEW",

          confidence:
            calculateDeterministicConfidence(
              "REVIEW",
              req,
              validCandidates,
              conditionResults
            ),

          evidence:
            validCandidates,

          conditionResults,

          coveredComponents:
            coverage.covered,

          missingComponents:
            coverage.missing,

          reason:
            "The bidder evidence is conditional or future-oriented and therefore requires manual verification."
        };
      }

      /*
       * 3. A partial structured result is never COMPLIANT.
       */
      if (
        partialCondition
      ) {
        const mandatory =
          Boolean(
            req.mandatory
          );

        const measurable =
          Boolean(
            req.structured.requiredYears !== null ||
            req.structured.requiredMonths !== null ||
            req.structured.requiredDays !== null ||
            req.structured.requiredPercentage !== null ||
            req.structured.requiredAmount !== null ||
            req.structured.requiredStorage ||
            req.structured.requiredCloudPlatforms.length ||
            req.structured.requiredSecurityControls.length ||
            req.structured.requiredCertifications.length ||
            req.structured.requires24x7
          );

        const partialStatus =
          mandatory &&
          measurable
            ? "NON_COMPLIANT"
            : "REVIEW";

        return {
          status:
            partialStatus,

          confidence:
            calculateDeterministicConfidence(
              partialStatus,
              req,
              validCandidates,
              conditionResults
            ),

          evidence:
            validCandidates,

          conditionResults,

          coveredComponents:
            coverage.covered,

          missingComponents:
            coverage.missing,

          reason:
            partialStatus ===
            "NON_COMPLIANT"
              ? "The bidder evidence covers only part of a mandatory requirement."
              : "The bidder evidence is only partially sufficient and requires manual verification."
        };
      }

      /*
       * 4. Structured requirements:
       * every mandatory condition must be proven.
       *
       * If the requirement has evidence but a condition is
       * unresolved, use MISSING for mandatory requirements
       * where there is no contradictory proof. This is more
       * useful than calling an unsupported claim COMPLIANT.
       */
      if (
        structured
      ) {
        if (
          hasUnknown
        ) {
          const status =
            req.mandatory
              ? "MISSING"
              : "REVIEW";

          return {
            status,

            confidence:
              calculateDeterministicConfidence(
                status,
                req,
                validCandidates,
                conditionResults
              ),

            evidence:
              status ===
              "MISSING"
                ? []
                : validCandidates,

            conditionResults,

            coveredComponents:
              coverage.covered,

            missingComponents:
              coverage.missing,

            reason:
              req.mandatory
                ? "Bidder evidence was found, but one or more mandatory requirement conditions are not proven."
                : "Bidder evidence was found, but one or more requirement conditions remain unresolved."
          };
        }

        if (
          coverage.coverage !==
            null &&
          coverage.coverage <
            1
        ) {
          const status =
            req.mandatory
              ? "NON_COMPLIANT"
              : "REVIEW";

          return {
            status,

            confidence:
              calculateDeterministicConfidence(
                status,
                req,
                validCandidates,
                conditionResults
              ),

            evidence:
              validCandidates,

            conditionResults,

            coveredComponents:
              coverage.covered,

            missingComponents:
              coverage.missing,

            reason:
              status ===
              "NON_COMPLIANT"
                ? "The bidder evidence does not satisfy all mandatory components of the requirement."
                : "Only part of the requirement is supported by bidder evidence."
          };
        }

        if (
          conditionResults.length >
            0 &&
          explicitPass
        ) {
          return {
            status:
              "COMPLIANT",

            confidence:
              calculateDeterministicConfidence(
                "COMPLIANT",
                req,
                validCandidates,
                conditionResults
              ),

            evidence:
              validCandidates,

            conditionResults,

            coveredComponents:
              coverage.covered,

            missingComponents:
              coverage.missing,

            reason:
              "All mandatory requirement conditions are supported by trustworthy bidder evidence."
          };
        }
      }

      /*
       * 5. Unstructured requirements still require direct,
       * bidder-owned, semantically relevant evidence.
       */
      const overlap =
        keywordOverlap(
          [
            req.requirement,
            req.description,
            req.title
          ]
            .filter(Boolean)
            .join(" "),
          combinedEvidence
        );

      if (
        !strongBidderAssertion
      ) {
        return {
          status:
            "REVIEW",

          confidence:
            calculateDeterministicConfidence(
              "REVIEW",
              req,
              validCandidates,
              conditionResults
            ),

          evidence:
            validCandidates,

          conditionResults,

          coveredComponents:
            coverage.covered,

          missingComponents:
            coverage.missing,

          reason:
            "Relevant bidder text was found, but it does not contain a sufficiently clear bidder-owned assertion to establish compliance."
        };
      }

      if (
        overlap <
        0.30
      ) {
        return {
          status:
            "REVIEW",

          confidence:
            calculateDeterministicConfidence(
              "REVIEW",
              req,
              validCandidates,
              conditionResults
            ),

          evidence:
            validCandidates,

          conditionResults,

          coveredComponents:
            coverage.covered,

          missingComponents:
            coverage.missing,

          reason:
            "Bidder evidence was found, but it is not sufficiently specific to establish direct compliance with the requirement."
        };
      }

      if (
        hasUnknown
      ) {
        return {
          status:
            "REVIEW",

          confidence:
            calculateDeterministicConfidence(
              "REVIEW",
              req,
              validCandidates,
              conditionResults
            ),

          evidence:
            validCandidates,

          conditionResults,

          coveredComponents:
            coverage.covered,

          missingComponents:
            coverage.missing,

          reason:
            "Bidder evidence was found, but one or more requirement conditions remain unresolved."
        };
      }

      return {
        status:
          "COMPLIANT",

        confidence:
          calculateDeterministicConfidence(
            "COMPLIANT",
            req,
            validCandidates,
            conditionResults
          ),

        evidence:
          validCandidates,

        conditionResults,

        coveredComponents:
          coverage.covered,

        missingComponents:
          coverage.missing,

        reason:
          "All required conditions are supported by trustworthy bidder evidence."
      };
    }

    /* ============================================================
       AUTHORITATIVE RAW-BIDDER PROOF FALLBACK
       ============================================================
       This layer runs directly against the extracted bidder-document
       text. It exists to prevent candidate ranking / heuristic scoring
       from downgrading a requirement when the bidder document itself
       contains clear requirement-specific proof.

       Rules:
       - bidder text only
       - no tender text is used as evidence
       - explicit negative evidence wins
       - direct, requirement-specific proof may upgrade only to COMPLIANT
       - certification validity is not auto-approved
       ============================================================ */

    function authoritativeBidderProof(
      requirement,
      bidderDocuments
    ) {
      const req = normalizeRequirementObject(requirement);
      const docs = safeArray(bidderDocuments)
        .filter((doc) => doc && typeof doc === "object")
        .map((doc, index) => {
          const text = cleanEvidenceText(firstNonEmpty(
            doc.text,
            doc.extractedText,
            doc.content,
            doc.rawText,
            doc.extracted?.text,
            doc.extraction?.text,
            doc.parsedText,
            doc.parsed?.text,
            doc.documentText,
            doc.fullText,
            ""
          ));
          const filename = firstNonEmpty(
            doc.filename,
            doc.fileName,
            doc.name,
            doc.originalname,
            doc.originalName,
            doc.sourceDocument,
            `Bidder Document ${index + 1}`
          );
          return { doc, text, filename };
        })
        .filter((x) => x.text);

      const reqText = [
        req.title,
        req.requirement,
        req.description,
        req.requirementText
      ].filter(Boolean).join(" ");

      const normalizedReq = normalizeForCompare(reqText);

      const splitSentences = (text) => {
        return cleanEvidenceText(text)
          .split(/(?<=[.!?])\s+|\n+/)
          .map((x) => normalizeWhitespace(x))
          .filter((x) => x.length >= 12)
          .filter((x) => !/^source\s*:/i.test(x))
          .filter((x) => !/^ref\s*:/i.test(x))
          .filter((x) => !isForbiddenBidderEvidence(x));
      };

      const negativeRegex = /\b(?:does\s+not|do\s+not|doesn't|don't|cannot|can't|unable|not\s+provided|not\s+available|not\s+supported|unsupported|not\s+implemented|non[-\s]?compliant|non[-\s]?complied|fails?|failed|refused|without|lack(?:s|ing)?|no\s+such|not\s+hold|do\s+not\s+hold|does\s+not\s+hold|expired|revoked|invalid)\b/i;

      const makeEvidence = (sentences, filename, score = 100) => {
        const clean = unique(safeArray(sentences).map(cleanEvidenceText).filter(Boolean));
        return clean.slice(0, 5).map((text) => ({
          text: text.slice(0, 1600),
          sourceType: "bidder",
          sourceDocument: filename,
          filename,
          fileName: filename,
          score
        }));
      };

      const result = (status, confidence, evidence, reason, covered = [], missing = []) => ({
        status,
        confidence,
        evidence,
        conditionResults: [
          {
            name: "Strict bidder evidence verification",
            status: status === "COMPLIANT" ? "PASS" : status === "NON_COMPLIANT" ? "FAIL" : "UNKNOWN",
            reason
          }
        ],
        coveredComponents: covered,
        missingComponents: missing,
        reason
      });

      if (!docs.length) {
        return result(
          "MISSING",
          10,
          [],
          "No readable bidder document was available for verification.",
          [],
          ["bidder evidence"]
        );
      }

      const findExplicitNegative = (sentences, matcher) => {
        return sentences.find((sentence) => matcher(sentence) && negativeRegex.test(sentence)) || null;
      };

      const findPositive = (sentences, matcher) => {
        return sentences.find((sentence) => matcher(sentence) && !negativeRegex.test(sentence)) || null;
      };

      // ------------------------------------------------------------
      // 1) ALL named certifications are evaluated together.
      // ------------------------------------------------------------
      // A requirement such as "ISO 27001 & SOC-2 Type II" is an AND condition.
      // The old ISO-only shortcut could incorrectly mark the requirement compliant
      // after seeing ISO 27001 while SOC-2 was absent. Handle the complete
      // certification set before any single-certification shortcut.
      const requiredCertifications = unique(
        safeArray(req.structured?.requiredCertifications)
          .map((x) => normalizeWhitespace(x))
          .filter(Boolean)
      );

      if (requiredCertifications.length) {
        const certificationPatterns = requiredCertifications.map((cert) => {
          const normalized = normalizeForCompare(cert);
          const cmmi = normalized.match(/cmmi(?:\s*level)?\s*(\d+)/i);
          if (cmmi) {
            const level = Number(cmmi[1]);
            return {
              name: cert,
              test: (sentence) => /\bcmmi\b/i.test(sentence),
              level,
              type: "CMMI"
            };
          }
          const escaped = escapeRegex(cert).replace(/\\s+/g, "\\s*");
          return {
            name: cert,
            test: (sentence) => new RegExp(escaped, "i").test(sentence),
            level: null,
            type: "NORMAL"
          };
        });

        for (const d of docs) {
          const sentences = splitSentences(d.text);
          const positive = [];
          const negative = [];
          const missing = [];

          for (const pattern of certificationPatterns) {
            let foundPositive = null;
            let foundNegative = null;

            for (const sentence of sentences) {
              if (!pattern.test(sentence)) continue;

              if (pattern.type === "CMMI") {
                const levels = [...sentence.matchAll(/\bcmmi(?:\s*level)?\s*(\d+)\b/gi)]
                  .map((m) => Number(m[1]));
                const highest = levels.length ? Math.max(...levels) : null;
                if (highest !== null && highest < pattern.level) {
                  foundNegative = sentence;
                  break;
                }
                if (highest !== null && highest >= pattern.level && !negativeRegex.test(sentence)) {
                  foundPositive = sentence;
                  break;
                }
              } else if (negativeRegex.test(sentence)) {
                foundNegative = sentence;
                break;
              } else if (/\b(?:hold|holds|has|have|maintain|maintains|certified|certification|certificate|valid|active|current|complied|complies|attached|enclosed)\b/i.test(sentence)) {
                foundPositive = sentence;
                break;
              }
            }

            if (foundNegative) negative.push({ name: pattern.name, sentence: foundNegative });
            else if (foundPositive) positive.push({ name: pattern.name, sentence: foundPositive });
            else missing.push(pattern.name);
          }

          if (negative.length) {
            return result(
              "NON_COMPLIANT",
              98,
              makeEvidence(negative.map((x) => x.sentence), d.filename),
              `The bidder evidence explicitly fails one or more required certifications: ${negative.map((x) => x.name).join(", ")}.`,
              positive.map((x) => x.name),
              [...missing, ...negative.map((x) => x.name)]
            );
          }

          if (!missing.length && positive.length === requiredCertifications.length) {
            return result(
              "COMPLIANT",
              98,
              makeEvidence(positive.map((x) => x.sentence), d.filename),
              "All required certifications are directly evidenced in the bidder document.",
              positive.map((x) => x.name),
              []
            );
          }

          if (positive.length) {
            return result(
              "REVIEW",
              88,
              makeEvidence(positive.map((x) => x.sentence), d.filename),
              `Only part of the required certification set is evidenced. Missing: ${missing.join(", ")}.`,
              positive.map((x) => x.name),
              missing
            );
          }
        }
      }

      // ------------------------------------------------------------
      // 1) Versioned / named certifications
      // ------------------------------------------------------------
      const isoMatches = [...normalizedReq.matchAll(/iso\s*([0-9]{4,5})/gi)].map((m) => `ISO ${m[1]}`);
      if (isoMatches.length) {
        const targetPatterns = isoMatches.map((name) => new RegExp(name.replace(/\s+/g, "\\s*"), "i"));
        for (const d of docs) {
          const sentences = splitSentences(d.text);
          const negative = sentences.find((s) =>
            targetPatterns.some((p) => p.test(s)) && negativeRegex.test(s)
          );
          if (negative) {
            return result(
              "NON_COMPLIANT",
              98,
              makeEvidence([negative], d.filename, 100),
              "The bidder document explicitly states that the required certification is invalid, expired, revoked, or not held.",
              [],
              isoMatches
            );
          }
          const positive = sentences.filter((s) =>
            targetPatterns.some((p) => p.test(s)) &&
            /\b(?:hold|holds|has|have|maintain|maintains|certified|certification|certificate|valid|active|current|complied|complies)\b/i.test(s) &&
            !negativeRegex.test(s)
          );
          if (positive.length) {
            return result(
              "COMPLIANT",
              98,
              makeEvidence(positive.slice(0, 2), d.filename),
              "The bidder document directly states possession or validity of the required certification.",
              isoMatches,
              []
            );
          }
        }
      }

      // ------------------------------------------------------------
      // 2) Encryption: every mandatory control is required.
      // ------------------------------------------------------------
      const needsAES = /\baes\s*[- ]?256\b/i.test(reqText);
      const needsTLS13 = /\btls\s*1\.3\b/i.test(reqText);
      if (needsAES || needsTLS13) {
        for (const d of docs) {
          const sentences = splitSentences(d.text);
          const aes = sentences.filter((s) =>
            /\baes\s*[- ]?256\b/i.test(s) &&
            /\b(?:at\s+rest|rest|storage|stored|database|disk|data)\b/i.test(s) &&
            !negativeRegex.test(s)
          );
          const tls = sentences.filter((s) =>
            /\btls\s*1\.3\b/i.test(s) &&
            /\b(?:in\s+transit|transit|transport|network|connection|https|communication)\b/i.test(s) &&
            !negativeRegex.test(s)
          );

          const missing = [];
          if (needsAES && !aes.length) missing.push("AES-256 at rest");
          if (needsTLS13 && !tls.length) missing.push("TLS 1.3 in transit");

          const negative = sentences.find((s) =>
            (needsAES && /\baes\s*[- ]?256\b/i.test(s) || needsTLS13 && /\btls\s*1\.3\b/i.test(s)) &&
            negativeRegex.test(s)
          );
          if (negative) {
            return result(
              "NON_COMPLIANT",
              98,
              makeEvidence([negative], d.filename),
              "The bidder document explicitly states that a required encryption or transport control is not satisfied.",
              [],
              missing
            );
          }

          if (!missing.length) {
            return result(
              "COMPLIANT",
              98,
              makeEvidence([...aes.slice(0, 2), ...tls.slice(0, 2)], d.filename),
              "All mandatory encryption components are directly evidenced in the bidder document.",
              ["AES-256 at rest", "TLS 1.3 in transit"].filter((x) => (x.startsWith("AES") ? needsAES : needsTLS13)),
              []
            );
          }

          if (aes.length || tls.length) {
            return result(
              "REVIEW",
              88,
              makeEvidence([...aes.slice(0, 2), ...tls.slice(0, 2)], d.filename),
              "The bidder document proves only part of the mandatory security control; the remaining component could not be verified.",
              [aes.length ? "AES-256 at rest" : null, tls.length ? "TLS 1.3 in transit" : null].filter(Boolean),
              missing
            );
          }
        }
      }

      // ------------------------------------------------------------
      // 3) Multi-cloud / named platform requirements.
      // ------------------------------------------------------------
      const requiredCloud = [];
      const addCloud = (name) => {
        if (!requiredCloud.includes(name)) requiredCloud.push(name);
      };
      if (/\baws\b|amazon\s+web\s+services/i.test(reqText)) addCloud("AWS");
      if (/\bazure\b|microsoft\s+azure/i.test(reqText)) addCloud("Azure");
      if (/\bgcp\b|google\s+cloud(?:\s+platform)?\b/i.test(reqText)) addCloud("GCP");
      for (const p of safeArray(req.structured?.requiredCloudPlatforms)) {
        const q = safeString(p).toLowerCase();
        if (/aws|amazon/.test(q)) addCloud("AWS");
        if (/azure/.test(q)) addCloud("Azure");
        if (/gcp|google/.test(q)) addCloud("GCP");
      }

      if (requiredCloud.length >= 2) {
        const patterns = {
          AWS: /\baws\b|amazon\s+web\s+services/i,
          Azure: /\bazure\b|microsoft\s+azure/i,
          GCP: /\bgcp\b|google\s+cloud(?:\s+platform)?\b/i
        };

        for (const d of docs) {
          const sentences = splitSentences(d.text);
          const evidenceByCloud = {};
          const missing = [];
          const partial = [];
          for (const cloud of requiredCloud) {
            const matches = sentences.filter((s) => patterns[cloud].test(s) && !negativeRegex.test(s));
            if (matches.length) evidenceByCloud[cloud] = matches;
            else missing.push(`${cloud} support`);
          }

          const negative = sentences.find((s) =>
            requiredCloud.some((cloud) => patterns[cloud].test(s)) && negativeRegex.test(s)
          );
          if (negative) {
            return result(
              "NON_COMPLIANT",
              98,
              makeEvidence([negative], d.filename),
              "The bidder document explicitly states that a required cloud platform is unsupported, unavailable, planned, or otherwise not currently satisfied.",
              [],
              missing
            );
          }

          if (!missing.length) {
            const all = requiredCloud.flatMap((cloud) => evidenceByCloud[cloud] || []).slice(0, 6);
            return result(
              "COMPLIANT",
              98,
              makeEvidence(all, d.filename),
              "The bidder document directly evidences every required cloud platform.",
              requiredCloud.map((x) => `${x} support`),
              []
            );
          }

          if (Object.keys(evidenceByCloud).length) {
            const partialEvidence = requiredCloud.flatMap((cloud) => evidenceByCloud[cloud] || []).slice(0, 5);
            return result(
              "REVIEW",
              88,
              makeEvidence(partialEvidence, d.filename),
              "Only some of the required cloud platforms are directly evidenced; the remaining platforms are unverified.",
              requiredCloud.filter((x) => evidenceByCloud[x]).map((x) => `${x} support`),
              missing
            );
          }
        }
      }

      // ------------------------------------------------------------
      // 4) 24x7 support / SLA.
      // ------------------------------------------------------------
      const needs247 = Boolean(req.structured?.requires24x7) || /\b24\s*(?:x|×|\/)?\s*7\b|24\s*\/\s*7|24[-\s]?hour/i.test(reqText);
      if (needs247) {
        let requiredMinutes = null;
        const reqMatches = [
          ...reqText.matchAll(/\b(\d+)\s*(minutes?|mins?|hours?|hrs?)\s*(?:initial\s+)?(?:incident\s+)?response\b/gi),
          ...reqText.matchAll(/\b(?:within|under|max(?:imum)?|initial(?:\s+incident)?\s+response(?:\s+time)?(?:\s+of)?)\s*(?:a|an)?\s*(\d+)\s*(minutes?|mins?|hours?|hrs?)\b/gi)
        ];
        if (reqMatches.length) {
          const m = reqMatches[0];
          requiredMinutes = /hours?|hrs?/i.test(m[2]) ? Number(m[1]) * 60 : Number(m[1]);
        }

        for (const d of docs) {
          const sentences = splitSentences(d.text);
          const support = sentences.filter((s) =>
            /\b24\s*(?:x|×|\/)?\s*7\b|24\s*\/\s*7|24[-\s]?hour/i.test(s) &&
            /\b(?:support|helpdesk|help\s*desk|technical|incident|response|sla|service)\b/i.test(s)
          );
          const negative = support.find((s) => negativeRegex.test(s));
          if (negative) {
            return result("NON_COMPLIANT", 98, makeEvidence([negative], d.filename), "The bidder explicitly states that the required 24/7 support service is not provided.", [], ["24/7 support"]);
          }
          for (const sentence of support) {
            const actualMatch = sentence.match(/\b(?:initial\s+)?(?:incident\s+)?response\w*\D{0,50}(\d+)\s*(minutes?|mins?|hours?|hrs?)\b/i) || sentence.match(/\b(\d+)\s*(minutes?|mins?|hours?|hrs?)\s*(?:initial\s+)?(?:incident\s+)?response\b/i);
            const actualMinutes = actualMatch ? (/(?:hours?|hrs?)/i.test(actualMatch[2]) ? Number(actualMatch[1]) * 60 : Number(actualMatch[1])) : null;
            if (actualMinutes !== null && requiredMinutes !== null) {
              if (actualMinutes > requiredMinutes) {
                return result("NON_COMPLIANT", 98, makeEvidence([sentence], d.filename), `The bidder's stated response time of ${actualMinutes} minutes exceeds the required ${requiredMinutes} minutes.`, [], ["24/7 support SLA"]);
              }
              return result("COMPLIANT", 98, makeEvidence([sentence], d.filename), "The bidder directly evidences 24/7 support and meets the required response-time threshold.", ["24/7 support", "response-time SLA"], []);
            }
            if (actualMinutes === null && requiredMinutes === null) {
              return result("COMPLIANT", 96, makeEvidence([sentence], d.filename), "The bidder directly states that 24/7 technical support is provided.", ["24/7 support"], []);
            }
          }
        }
      }

      // ------------------------------------------------------------
      // 5) Experience: operational age is NOT domain experience.
      // ------------------------------------------------------------
      if (isExperienceRequirement(req)) {
        const requiredYears = req.structured?.requiredYears;
        const signals = experienceRequirementSignals(req);
        const domainRegex = signals.length
          ? new RegExp(signals.map((s) => {
              if (s === "enterprise") return "enterprise|commercial|corporate";
              if (s === "cloud") return "cloud|aws|azure|gcp|google\\s+cloud|oci|oracle\\s+cloud";
              if (s === "government") return "government|public\\s+sector|psu|state\\s+owned";
              if (s === "technology") return "software|application|it|technology|digital|system|infrastructure";
              return s;
            }).join("|"), "i")
          : /\bexperience|experienced|projects?|contracts?|commercial|clients?|customers?\b/i;

        for (const d of docs) {
          const sentences = splitSentences(d.text);
          const negative = sentences.find((s) =>
            /\b(?:experience|experienced|commercial|cloud|enterprise|project|contract)\b/i.test(s) &&
            negativeRegex.test(s)
          );
          if (negative && requiredYears !== null && /\b(?:years?|yrs?)\b/i.test(negative)) {
            return result("NON_COMPLIANT", 98, makeEvidence([negative], d.filename), "The bidder explicitly indicates that the required experience is not satisfied.", [], ["relevant experience"]);
          }

          const experienceSentences = sentences.filter((s) =>
            /\b\d+\s*\+?\s*(?:years?|yrs?)\b/i.test(s) &&
            /\b(?:experience|experienced|commercial|projects?|contracts?|delivered|implemented|cloud|enterprise|clients?|customers?)\b/i.test(s) &&
            domainRegex.test(s) &&
            !negativeRegex.test(s)
          );

          const valid = experienceSentences.find((s) => {
            if (requiredYears === null) return true;
            const years = extractClaimedExperienceYears(s);
            return years !== null && years >= requiredYears;
          });

          if (valid) {
            const years = extractClaimedExperienceYears(valid);
            return result(
              "COMPLIANT",
              98,
              makeEvidence([valid], d.filename),
              `The bidder directly states ${years}+ years of relevant experience matching the tender's required domain.`,
              ["relevant experience"],
              []
            );
          }

          const insufficient = experienceSentences.find((s) => {
            if (requiredYears === null) return false;
            const years = extractClaimedExperienceYears(s);
            return years !== null && years < requiredYears;
          });
          if (insufficient) {
            const years = extractClaimedExperienceYears(insufficient);
            return result("NON_COMPLIANT", 98, makeEvidence([insufficient], d.filename), `The bidder states only ${years} years of relevant experience against the required ${requiredYears} years.`, [], ["required years of relevant experience"]);
          }
        }

        // No domain-specific experience evidence is NOT a failure by itself.
        return result("MISSING", 92, [], "No bidder statement directly proving the required domain-specific experience was found.", [], ["domain-specific experience"]);
      }

      // ------------------------------------------------------------
      // 6) Generic structured numeric requirements.
      // ------------------------------------------------------------
      const structured = req.structured || {};
      const genericAttributes = safeArray(structured.attributes);
      const requiredYears = structured.requiredYears;
      const requiredAmount = structured.requiredAmount;
      const requiredDays = structured.requiredDays;
      const requiredPercentage = structured.requiredPercentage;

      for (const d of docs) {
        const sentences = splitSentences(d.text);

        // Explicit negative evidence is authoritative only when the same sentence
        // also names a requirement-specific concept.
        const relevantNegative = sentences.find((s) => {
          if (!negativeRegex.test(s)) return false;
          const spec = requirementSpecificity(req, s);
          return Boolean(
            spec.matchedAttributes.length ||
            spec.matchedCloud.length ||
            spec.matchedSecurity.length ||
            spec.matchedCertifications.length ||
            spec.numericEvidence ||
            keywordOverlap(reqText, s) >= 0.35
          );
        });
        if (relevantNegative) {
          return result("NON_COMPLIANT", 96, makeEvidence([relevantNegative], d.filename), "The bidder document contains explicit negative evidence for this requirement.", [], ["required condition"]);
        }

        const relevant = sentences.filter((s) => {
          if (isAnalysisArtifact(s) || /no bidder evidence found/i.test(s)) return false;
          const spec = requirementSpecificity(req, s);
          const overlap = Number(spec.overlap || 0);
          return Boolean(
            spec.matchedAttributes.length ||
            spec.matchedCloud.length ||
            spec.matchedSecurity.length ||
            spec.matchedCertifications.length ||
            spec.numericEvidence ||
            overlap >= 0.34
          );
        });

        if (!relevant.length) continue;

        // Amount / turnover / financial threshold.
        if (requiredAmount !== null) {
          for (const sentence of relevant) {
            const raw = extractAmount(sentence);
            const actual = raw === null ? null : convertAmount(raw);
            if (actual !== null) {
              if (actual >= requiredAmount) {
                return result("COMPLIANT", 97, makeEvidence([sentence], d.filename), "The bidder directly states a financial value meeting the required threshold.", ["financial threshold"], []);
              }
              return result("NON_COMPLIANT", 97, makeEvidence([sentence], d.filename), "The bidder's stated financial value is below the required threshold.", [], ["financial threshold"]);
            }
          }
        }

        // Days / timeline.
        if (requiredDays !== null) {
          for (const sentence of relevant) {
            const actual = extractDays(sentence);
            if (actual !== null) {
              if (actual <= requiredDays) return result("COMPLIANT", 97, makeEvidence([sentence], d.filename), "The bidder's stated timeline meets the required limit.", ["timeline"], []);
              return result("NON_COMPLIANT", 97, makeEvidence([sentence], d.filename), "The bidder's stated timeline exceeds the required limit.", [], ["timeline"]);
            }
          }
        }

        // Percentage thresholds.
        if (requiredPercentage !== null) {
          for (const sentence of relevant) {
            const actual = extractPercentage(sentence);
            if (actual !== null) {
              if (actual >= requiredPercentage) return result("COMPLIANT", 97, makeEvidence([sentence], d.filename), "The bidder's stated percentage meets the required threshold.", ["percentage threshold"], []);
              return result("NON_COMPLIANT", 97, makeEvidence([sentence], d.filename), "The bidder's stated percentage is below the required threshold.", [], ["percentage threshold"]);
            }
          }
        }

        // Years for non-experience requirements (e.g. company age / warranty age).
        if (requiredYears !== null && !isExperienceRequirement(req)) {
          for (const sentence of relevant) {
            const actual = extractYears(sentence);
            if (actual !== null) {
              if (actual >= requiredYears) return result("COMPLIANT", 96, makeEvidence([sentence], d.filename), "The bidder's stated number of years meets the requirement.", ["years"], []);
              return result("NON_COMPLIANT", 96, makeEvidence([sentence], d.filename), "The bidder's stated number of years is below the requirement.", [], ["years"]);
            }
          }
        }

        // Attribute / security / certification controls.
        const covered = [];
        for (const a of genericAttributes) {
          if (attributeEvidenceMatch(a, relevant.join(" "))) covered.push(a);
        }
        const cloud = safeArray(structured.requiredCloudPlatforms).filter((p) => detectCloudPlatforms(relevant.join(" ")).includes(p));
        const security = safeArray(structured.requiredSecurityControls).filter((p) => detectSecurityControls(relevant.join(" ")).includes(p));
        const certs = safeArray(structured.requiredCertifications).filter((p) => extractCertification(relevant.join(" ")).some((x) => normalizeForCompare(x) === normalizeForCompare(p)));

        const requiredComponents = [
          ...genericAttributes.map((x) => `attribute:${x}`),
          ...safeArray(structured.requiredCloudPlatforms).map((x) => `cloud:${x}`),
          ...safeArray(structured.requiredSecurityControls).map((x) => `security:${x}`),
          ...safeArray(structured.requiredCertifications).map((x) => `certification:${x}`)
        ];
        const coveredComponents = [
          ...covered.map((x) => `attribute:${x}`),
          ...cloud.map((x) => `cloud:${x}`),
          ...security.map((x) => `security:${x}`),
          ...certs.map((x) => `certification:${x}`)
        ];

        if (requiredComponents.length) {
          const missing = requiredComponents.filter((x) => !coveredComponents.includes(x));
          const evidence = makeEvidence(relevant.slice(0, 5), d.filename);
          if (!missing.length) {
            return result("COMPLIANT", 96, evidence, "All requirement-specific components are directly evidenced by the bidder.", coveredComponents, []);
          }
          if (coveredComponents.length) {
            return result("REVIEW", 88, evidence, "The bidder document proves only part of the requirement; remaining mandatory components are unverified.", coveredComponents, missing);
          }
        }

        // Last-resort generic requirement proof. This is deliberately conservative.
        const best = relevant
          .map((sentence) => ({ sentence, score: keywordOverlap(reqText, sentence) }))
          .sort((a, b) => b.score - a.score)[0];
        if (best && Number(best.score) >= 0.68 && hasBidderAssertion(best.sentence)) {
          return result("COMPLIANT", 90, makeEvidence([best.sentence], d.filename), "The bidder directly states a requirement-specific compliance assertion.", ["direct bidder assertion"], []);
        }
      }

      return result(
        "MISSING",
        92,
        [],
        "No trustworthy bidder-document statement directly proving this requirement was found.",
        [],
        ["bidder evidence"]
      );
    }

    function extractAuthoritativeEvidenceSnippet(req, text) {
      const clean = cleanEvidenceText(text);
      if (!clean) return "";

      const sentences = clean
        .split(/(?<=[.!?])\s+|\n+/)
        .map((x) => x.trim())
        .filter(Boolean);

      const reqTerms = unique(
        normalizeForCompare([
          req.title,
          req.requirement,
          req.description,
          req.requirementText
        ].filter(Boolean).join(" "))
          .split(/\s+/)
          .filter((word) => word.length >= 4)
          .slice(0, 35)
      );

      const ranked = sentences.map((sentence, index) => {
        const normalized = normalizeForCompare(sentence);
        let score = 0;
        for (const term of reqTerms) {
          if (term && normalized.includes(term)) score += 1;
        }

        if (/\baes\s*[- ]?256\b/i.test(req.requirement || reqTextForSnippet(req)) && /\baes\s*[- ]?256\b/i.test(sentence)) score += 20;
        if (/\btls\s*1\.3\b/i.test(req.requirement || reqTextForSnippet(req)) && /\btls\s*1\.3\b/i.test(sentence)) score += 20;
        if (req.structured?.requires24x7 && /24\s*[x×/]\s*7|24\s*\/\s*7|24-hour/i.test(sentence)) score += 20;

        return { sentence, score, index };
      });

      ranked.sort((a, b) => b.score - a.score || a.index - b.index);
      return ranked.slice(0, 2).map((x) => x.sentence).join(" ").slice(0, 1600);
    }

    function reqTextForSnippet(req) {
      return [req.title, req.requirement, req.description, req.requirementText].filter(Boolean).join(" ");
    }

    /* ============================================================
       REQUIREMENT RESULT BUILDER
       ============================================================ */

    function buildRequirementResult(
      requirement,
      bidderDocuments,
      precomputedSegments = null
    ) {
      const req =
        normalizeRequirementObject(
          requirement
        );

      const authoritative =
        authoritativeBidderProof(
          req,
          bidderDocuments
        );

      const candidates =
        findEvidenceCandidates(
          req,
          bidderDocuments,
          precomputedSegments
        );

      let evaluation = authoritative;

      // Strict authoritative verification is the primary decision engine.
      // The legacy evaluator is used only if the strict engine itself fails.
      if (!evaluation) {
        evaluation = evaluateEvidence(
          req,
          candidates
        );
      }

      const selectedEvidence =
        evaluation.status ===
          "MISSING"
          ? []
          : safeArray(
              evaluation.evidence
            )
              .filter(
                (
                  candidate
                ) =>
                  isBidderSourceType(
                    candidate?.sourceType
                  )
              )
              .map(
                (
                  candidate
                ) => ({
                  text:
                    cleanEvidenceText(
                      candidate.text
                    ),

                  sourceType:
                    "bidder",

                  sourceDocument:
                    firstNonEmpty(
                      candidate.sourceDocument,
                      candidate.filename,
                      candidate.fileName
                    ),

                  sourceDocumentId:
                    firstNonEmpty(
                      candidate.sourceDocumentId,
                      candidate.id
                    ),

                  filename:
                    firstNonEmpty(
                      candidate.filename,
                      candidate.fileName,
                      candidate.sourceDocument
                    ),

                  fileName:
                    firstNonEmpty(
                      candidate.fileName,
                      candidate.filename,
                      candidate.sourceDocument
                    ),

                  score:
                    Number(
                      candidate.score ||
                      0
                    ),

                  matchedAttributes:
                    safeArray(
                      candidate.matchedAttributes
                    ),

                  matchedCloud:
                    safeArray(
                      candidate.matchedCloud
                    ),

                  matchedSecurity:
                    safeArray(
                      candidate.matchedSecurity
                    ),

                  matchedCertifications:
                    safeArray(
                      candidate.matchedCertifications
                    ),
                })
              );

      const confidence =
        Number(
          evaluation.confidence ||
          0
        );

      const status =
        evaluation.status;

      const compliant =
        status ===
        "COMPLIANT";

      return {
        id:
          req.id,

        requirementId:
          req.requirementId,

        title:
          req.title,

        requirementTitle:
          req.requirementTitle,

        requirement:
          req.requirement,

        description:
          req.description,

        requirementText:
          req.requirementText,

        category:
          req.category,

        mandatory:
          req.mandatory,

        threshold:
          req.threshold,

        condition:
          req.condition,

        evidenceNeeded:
          req.evidenceNeeded,

        sourceText:
          req.sourceText,

        structuredRequirement:
          req.structured,

        status,

        result:
          status,

        decision:
          status,

        complianceStatus:
          status,

        verificationStatus:
          status,

        matchStatus:
          status,

        compliant,

        confidence,

        aiConfidence:
          confidence,

        evidenceConfidence:
          confidence,

        reason:
          evaluation.reason,

        finding:
          evaluation.reason,

        comparison:
          evaluation.reason,

        conditionResults:
          evaluation.conditionResults,

        coveredComponents:
          evaluation.coveredComponents,

        missingComponents:
          evaluation.missingComponents,

        evidenceCandidates:
          selectedEvidence,
      };
    }

    /* ============================================================
       ANALYSIS SUMMARY
       ============================================================ */

    function calculateResultSummary(
      items
    ) {
      const requirements =
        safeArray(
          items
        );

      const total =
        requirements.length;

      const compliant =
        requirements.filter(
          (
            item
          ) =>
            item.status ===
            "COMPLIANT"
        ).length;

      const nonCompliant =
        requirements.filter(
          (
            item
          ) =>
            item.status ===
            "NON_COMPLIANT"
        ).length;

      const missing =
        requirements.filter(
          (
            item
          ) =>
            item.status ===
            "MISSING"
        ).length;

      const review =
        requirements.filter(
          (
            item
          ) =>
            item.status ===
            "REVIEW"
        ).length;

      const compliancePercentage =
        total
          ? Math.round(
              (
                compliant /
                total
              ) *
              100
            )
          : 0;

      const riskScore =
        total
          ? Math.round(
              (
                (
                  nonCompliant *
                  1
                ) +
                (
                  missing *
                  0.85
                ) +
                (
                  review *
                  0.45
                )
              ) /
              total *
              100
            )
          : 0;

      let overallDecision =
        "REVIEW";

      if (
        total === 0
      ) {
        overallDecision =
          "NO_REQUIREMENTS";
      } else if (
        nonCompliant > 0
      ) {
        overallDecision =
          "NON_COMPLIANT";
      } else if (
        missing > 0 ||
        review > 0
      ) {
        overallDecision =
          "REVIEW";
      } else {
        overallDecision =
          "COMPLIANT";
      }

      let riskLevel =
        "LOW";

      if (
        riskScore >=
        70
      ) {
        riskLevel =
          "HIGH";
      } else if (
        riskScore >=
        35
      ) {
        riskLevel =
          "MEDIUM";
      }

      return {
        total,

        compliant,

        nonCompliant,

        missing,

        review,

        compliancePercentage,

        riskScore,

        overallDecision,

        riskLevel,
      };
    }

    /* ============================================================
       MISSING DOCUMENTS
       ============================================================ */

    function buildMissingDocuments(
      requirementsAnalysis
    ) {
      return safeArray(
        requirementsAnalysis
      )
        .filter(
          (
            item
          ) =>
            item.status ===
              "MISSING" ||
            item.status ===
              "REVIEW"
        )
        .map(
          (
            item
          ) => ({
            requirementId:
              item.requirementId,

            title:
              item.title,

            requirement:
              item.requirement,

            status:
              item.status,

            reason:
              item.reason,

            missingComponents:
              safeArray(
                item.missingComponents
              ),
          })
        );
    }

    /* ============================================================
       CRITICAL FINDINGS
       ============================================================ */

    function buildCriticalFindings(
      requirementsAnalysis
    ) {
      return safeArray(
        requirementsAnalysis
      )
        .filter(
          (
            item
          ) =>
            item.status ===
            "NON_COMPLIANT"
        )
        .map(
          (
            item
          ) => ({
            requirementId:
              item.requirementId,

            title:
              item.title,

            category:
              item.category,

            severity:
              item.mandatory
                ? "CRITICAL"
                : "HIGH",

            status:
              item.status,

            reason:
              item.reason,

            evidence:
              safeArray(
                item.evidenceCandidates
              ),
          })
        );
    }

    /* ============================================================
       RECOMMENDATIONS
       ============================================================ */

    function buildRecommendations(
      requirementsAnalysis
    ) {
      const recommendations =
        [];

      safeArray(
        requirementsAnalysis
      ).forEach(
        (
          item
        ) => {
          if (
            item.status ===
            "MISSING"
          ) {
            recommendations.push({
              requirementId:
                item.requirementId,

              title:
                item.title,

              priority:
                item.mandatory
                  ? "HIGH"
                  : "MEDIUM",

              recommendation:
                `Provide documentary bidder evidence for "${item.title}" before bid submission.`,
            });

            return;
          }

          if (
            item.status ===
            "NON_COMPLIANT"
          ) {
            recommendations.push({
              requirementId:
                item.requirementId,

              title:
                item.title,

              priority:
                "CRITICAL",

              recommendation:
                `Resolve the non-compliance for "${item.title}" or determine whether the bid should be withdrawn.`,
            });

            return;
          }

          if (
            item.status ===
            "REVIEW"
          ) {
            recommendations.push({
              requirementId:
                item.requirementId,

              title:
                item.title,

              priority:
                "MEDIUM",

              recommendation:
                `Manually verify the bidder evidence for "${item.title}" and provide stronger documentary proof if required.`,
            });
          }
        }
      );

      if (
        !recommendations.length
      ) {
        recommendations.push({
          requirementId:
            null,

          title:
            "Overall Bid",

          priority:
            "LOW",

          recommendation:
            "All evaluated requirements have sufficient bidder evidence. Maintain the supporting documents for audit readiness.",
        });
      }

      return recommendations;
    }
    /* ============================================================
       LOCAL DETERMINISTIC ANALYSIS
       ============================================================ */

    function analyzeLocally(
      tender,
      bidder
    ) {
      const tenderRequirements =
        dedupeRequirements(
          safeArray(
            tender?.requirements
          )
        );

      /*
       * ==========================================================
       * NORMALIZE BIDDER DOCUMENTS
       * ==========================================================
       *
       * Every document stored inside bidder.documents is treated
       * as bidder-owned evidence unless it is explicitly marked
       * as tender / requirement / procurement / system material.
       *
       * This prevents valid bidder documents from disappearing
       * simply because sourceType was not set by the upload layer.
       */

      const bidderDocuments =
        safeArray(
          bidder?.documents
        )
          .filter(
            (
              document
            ) =>
              document &&
              typeof document === "object"
          )
          .filter(
            (
              document
            ) => {
              const sourceType =
                safeString(
                  document.sourceType
                )
                  .trim()
                  .toLowerCase();

              if (
                sourceType === "tender" ||
                sourceType === "requirement" ||
                sourceType === "procurement" ||
                sourceType === "system"
              ) {
                return false;
              }

              return true;
            }
          )
          .map(
            (
              document,
              index
            ) => {
              /*
               * Different upload/extraction paths may use different
               * property names. Resolve all common forms here so the
               * evidence engine always receives a usable text field.
               */

              const extractedText =
                firstNonEmpty(
                  document.text,
                  document.extractedText,
                  document.content,
                  document.rawText,
                  document.extracted?.text,
                  document.extraction?.text,
                  document.parsedText,
                  document.parsed?.text,
                  document.documentText,
                  document.fullText,
                  ""
                );

              const filename =
                firstNonEmpty(
                  document.filename,
                  document.fileName,
                  document.name,
                  document.originalname,
                  document.originalName,
                  document.sourceDocument,
                  `Bidder Document ${index + 1}`
                );

              const documentId =
                firstNonEmpty(
                  document.id,
                  document.documentId,
                  document.sourceDocumentId,
                  `bidder_document_${index + 1}`
                );

              return {
                ...document,

                /*
                 * IMPORTANT:
                 * Always expose the resolved document text as `text`.
                 * The downstream evidence pipeline can therefore work
                 * regardless of which upload field originally contained
                 * the extracted PDF/DOCX text.
                 */
                text:
                  String(
                    extractedText || ""
                  ),

                extractedText:
                  String(
                    extractedText || ""
                  ),

                rawText:
                  String(
                    firstNonEmpty(
                      document.rawText,
                      extractedText,
                      ""
                    )
                  ),

                sourceType:
                  "bidder",

                id:
                  documentId,

                filename,

                fileName:
                  firstNonEmpty(
                    document.fileName,
                    filename
                  ),

                sourceDocument:
                  firstNonEmpty(
                    document.sourceDocument,
                    filename
                  ),

                sourceDocumentId:
                  documentId,
              };
            }
          );

      /*
       * ==========================================================
       * LOCAL REQUIREMENT ANALYSIS
       * ==========================================================
       */

      // Extract bidder evidence ONCE per analysis. The previous implementation
      // rebuilt/split every bidder document once per requirement, multiplying
      // work by the number of requirements.
      const bidderEvidenceSegments =
        extractBidderEvidenceSegments(
          bidderDocuments
        );

      const requirementsAnalysis =
        tenderRequirements.map(
          (requirement) =>
            buildRequirementResult(
              requirement,
              bidderDocuments,
              bidderEvidenceSegments
            )
        );

      // HARD INVARIANT: NON_COMPLIANT requires actual contradictory bidder evidence.
      // A zero-evidence result is MISSING, never NON_COMPLIANT.
      const groundedRequirementsAnalysis = requirementsAnalysis.map((item) => {
        const evidence = safeArray(item?.evidenceCandidates).filter(Boolean);
        if (item?.status === "NON_COMPLIANT" && evidence.length === 0) {
          return {
            ...item,
            status: "MISSING", result: "MISSING", decision: "MISSING",
            complianceStatus: "MISSING", verificationStatus: "MISSING", matchStatus: "MISSING",
            compliant: false, evidenceCandidates: [],
            confidence: Math.min(Number(item.confidence || 0), 20),
            aiConfidence: Math.min(Number(item.aiConfidence || item.confidence || 0), 20),
            evidenceConfidence: 0,
            reason: "No bidder-document evidence was found; the requirement is missing rather than non-compliant.",
            finding: "No bidder-document evidence was found; the requirement is missing rather than non-compliant.",
            comparison: "No bidder-document evidence was found."
          };
        }
        return item;
      });

      /*
       * ==========================================================
       * RESULT SUMMARY
       * ==========================================================
       */

      const summary =
        calculateResultSummary(
          groundedRequirementsAnalysis
        );

      const missingDocuments =
        buildMissingDocuments(
          groundedRequirementsAnalysis
        );

      const criticalFindings =
        buildCriticalFindings(
          groundedRequirementsAnalysis
        );

      const recommendations =
        buildRecommendations(
          groundedRequirementsAnalysis
        );

      /*
       * ==========================================================
       * CONFIDENCE
       * ==========================================================
       */

      const confidenceValues =
        groundedRequirementsAnalysis
          .map(
            (
              item
            ) =>
              Number(
                item.confidence ||
                0
              )
          )
          .filter(
            Number.isFinite
          );

      const avgConfidence =
        confidenceValues.length
          ? Math.round(
              confidenceValues.reduce(
                (
                  total,
                  value
                ) =>
                  total +
                  value,
                0
              ) /
              confidenceValues.length
            )
          : 0;

      /*
       * ==========================================================
       * FINAL LOCAL RESULT
       * ==========================================================
       */

      return {
        bidderSummary: {
          documentCount:
            bidderDocuments.length,

          documents:
            bidderDocuments.map(
              (
                document
              ) => ({
                id:
                  document.id,

                filename:
                  firstNonEmpty(
                    document.filename,
                    document.fileName,
                    document.name
                  ),

                sourceType:
                  "bidder",

                textLength:
                  String(
                    document.text ||
                    ""
                  ).length,
              })
            ),
        },

        summary,

        requirementsAnalysis: groundedRequirementsAnalysis,

        missingDocuments,

        criticalFindings,

        recommendations,

        aiConfidence:
          avgConfidence,

        confidence:
          avgConfidence,

        verificationMethod:
          "deterministic-evidence-grounded",
      };
    }


    /* ============================================================
       AI TENDER REQUIREMENT EXTRACTION
       ============================================================ */


    async function runAIRequirementExtraction(
      tenderText,
      filename,
      force = false
    ) {
      if (!force && process.env.BIDIFI_FAST_MODE === "true") return null;
      if (!openai) return null;

      const sourceText = safeString(tenderText).trim();
      if (sourceText.length < 20) return null;

      const prompt = `
    You are BIDIFI's high-precision tender requirement extraction engine.

    Extract ONLY procurement requirements explicitly present in the supplied tender.
    Do not analyze bidder documents.

    CRITICAL:
    - Every explicit REQ-xx / CLAUSE-xx / REQUIREMENT-xx row is a source requirement and MUST be preserved.
    - If the PDF contains a table row such as "REQ-01 Company Experience Minimum 7 years...", keep that entire criterion.
    - Do not merge two independently verifiable rows.
    - Do not drop a row because it lacks the words MUST/SHALL.
    - Do not invent thresholds, certifications, quantities, dates or conditions.
    - Do not turn headings, metadata, page numbers, contents entries or ordinary prose into requirements.
    - Preserve the exact meaning and numeric values.
    - If a single row contains multiple AND conditions that must be verified together, keep them together.
    - Separate independently verifiable procurement conditions.

    Return ONLY JSON:
    {
      "tenderSummary": "",
      "tenderTitle": "",
      "issuingAuthority": "",
      "requirements": [
        {
          "id": "REQ-01",
          "title": "",
          "requirement": "",
          "description": "",
          "mandatory": true,
          "category": "Eligibility|Technical|Commercial|Experience|Security|Support|Financial|Delivery|Other",
          "evidenceNeeded": ""
        }
      ]
    }

    Before returning, count every explicit REQ/CLAUSE row in the source and ensure none was omitted.

    SOURCE TENDER TEXT:
    ${sourceText}
    `;

      try {
        const response = await withTimeout(
          openai.responses.create({
            model: OPENAI_MODEL,
            input: prompt
          }),
          Number(process.env.BIDIFI_TENDER_AI_TIMEOUT_MS || 5000),
          "Tender AI extraction"
        );

        const parsed = safeJsonParse(response?.output_text || "");
        if (!parsed || !Array.isArray(parsed.requirements)) return null;

        const explicit = dedupeRequirements(
          extractExplicitTenderRows(sourceText)
        );
        const local = dedupeRequirements(
          extractRequirementsLocally(sourceText)
        );

        const ai = dedupeRequirements(
          sanitizeTenderRequirements(parsed.requirements)
        );

        /*
         * Source-first merge:
         * 1. Explicit REQ/CLAUSE rows are authoritative.
         * 2. AI/local requirements are only additions when they represent a
         *    genuinely separate source-grounded criterion.
         */
        const base = explicit.length >= 2 ? explicit : local;
        const combined = [...base];

        for (const candidate of ai) {
          const key = requirementSemanticKey(candidate);
          const duplicate = combined.some(
            (existing) =>
              requirementSemanticKey(existing) === key ||
              keywordOverlap(
                normalizeForCompare(existing.requirement),
                normalizeForCompare(candidate.requirement)
              ) >= 0.86
          );
          if (!duplicate) combined.push(candidate);
        }

        const grounded = groundTenderRequirements(combined, sourceText);

        return {
          ...parsed,
          requirements: dedupeRequirements(grounded).map((item, index) => ({
            ...item,
            id: `REQ-${String(index + 1).padStart(2, "0")}`
          }))
        };
      } catch (error) {
        console.warn(
          "[BIDIFI] AI requirement extraction failed:",
          error?.message || error
        );
        return null;
      }
    }

    function groundTenderRequirements(rawRequirements, tenderText) {
      const source = normalizeForCompare(tenderText);
      if (!source) return [];

      const sourceTokens = new Set(
        source
          .split(/\s+/)
          .map((token) => token.replace(/[^a-z0-9₹.%+-]/g, ""))
          .filter((token) => token.length >= 3)
      );

      const stop = new Set([
        "the", "and", "for", "with", "that", "this", "from", "shall",
        "must", "required", "requirement", "bidder", "vendor", "supplier",
        "company", "document", "provide", "submit", "should", "minimum",
        "mandatory", "eligible", "eligibility", "technical", "commercial",
        "financial", "criteria", "criterion", "certificate", "certification"
      ]);

      const numberTokens = (text) =>
        (normalizeWhitespace(text).match(/(?:\d+(?:\.\d+)?|₹\s*[\d,.]+|rs\.?\s*[\d,.]+|inr\s*[\d,.]+)/gi) || [])
          .map((x) => x.toLowerCase().replace(/\s+/g, ""));

      const candidates = safeArray(rawRequirements);
      return candidates.filter((req) => {
        const text = normalizeForCompare([req.title, req.requirement, req.description].filter(Boolean).join(" "));
        if (text.length < 15) return false;

        // Every numeric threshold in an AI-extracted requirement must exist in the
        // actual tender text. This blocks invented years, amounts, percentages,
        // SLA values and certification levels.
        const nums = numberTokens(text);
        const sourceNums = new Set(numberTokens(tenderText));
        if (nums.some((n) => !sourceNums.has(n))) return false;

        const meaningful = text
          .split(/\s+/)
          .map((token) => token.replace(/[^a-z0-9]/g, ""))
          .filter((token) => token.length >= 4 && !stop.has(token));
        if (!meaningful.length) return false;

        const matched = meaningful.filter((token) => sourceTokens.has(token)).length;
        const overlap = matched / meaningful.length;

        // AI wording may be concise rather than verbatim, so require strong
        // lexical grounding but do not require exact sentence identity.
        return overlap >= 0.52 || matched >= 8;
      });
    }

    function sanitizeTenderRequirements(rawRequirements) {
      const input = safeArray(rawRequirements);
      const cleaned = [];

      const genericHeading = /^(?:eligibility(?:\s+criteria)?|technical(?:\s+(?:requirements?|specifications?))?|commercial(?:\s+(?:requirements?|conditions?))?|experience(?:\s+(?:requirements?|criteria))?|support(?:\s+(?:requirements?|sla))?|security(?:\s+(?:requirements?|controls?))?|qualification(?:\s+(?:criteria|requirements?))?|compliance(?:\s+(?:criteria|requirements?))?|scope\s+of\s+(?:work|services?)|terms\s+(?:and|&)\s+conditions?)$/i;
      const metadataOnly = /^(?:tender|bid|rfp|nit|eoi)\s*(?:no\.?|number|reference|ref\.?|id)?\s*[:#-]?\s*[A-Z0-9\/-]+$/i;

      for (const raw of input) {
        if (!raw || typeof raw !== "object") continue;

        const requirement = normalizeWhitespace(firstNonEmpty(
          raw.requirement,
          raw.description,
          raw.requirementText,
          raw.text
        ));
        if (requirement.length < 15 || requirement.length > 1800) continue;
        if (genericHeading.test(requirement)) continue;
        if (metadataOnly.test(requirement)) continue;
        if (isTenderDocumentArtifact(requirement)) continue;
        if ((requirement.match(/\bREQ[-_\s]?\d{1,3}\b/gi) || []).length >= 2) continue;
        if (/\b(?:total\s+clauses?|key\s+requirements?|weightage|issuing\s+authority)\b/i.test(requirement) && requirement.length > 220) continue;

        const title = normalizeWhitespace(firstNonEmpty(
          raw.title,
          inferRequirementTitle(requirement)
        ));
        if (!title || genericHeading.test(title)) continue;

        const candidateKey = requirementSemanticKey({ ...raw, requirement, title });
        const duplicate = cleaned.some((item) => {
          const a = normalizeForCompare(item.requirement);
          const b = normalizeForCompare(requirement);
          return requirementSemanticKey(item) === candidateKey || a === b || keywordOverlap(a, b) >= 0.94;
        });
        if (duplicate) continue;

        const explicitMandatory = raw.mandatory;
        const mandatory = typeof explicitMandatory === "boolean"
          ? explicitMandatory
          : detectMandatory(requirement);

        cleaned.push({
          id: safeString(raw.id || raw.requirementId).trim() || `REQ-${String(cleaned.length + 1).padStart(2, "0")}`,
          title,
          requirement,
          description: normalizeWhitespace(firstNonEmpty(raw.description, requirement)),
          mandatory,
          category: normalizeWhitespace(raw.category || "Other"),
          evidenceNeeded: normalizeWhitespace(firstNonEmpty(raw.evidenceNeeded, "Direct bidder-document evidence matching this requirement.")),
        });
      }

      return cleaned.map((item, index) => ({
        ...item,
        id: `REQ-${String(index + 1).padStart(2, "0")}`,
      }));
    }

    /* ============================================================
       AI SECONDARY VERIFICATION
       ============================================================ */


    async function runAIComplianceVerification(
      localResult,
      bidderDocuments = []
    ) {
      /*
       * BIDIFI PRECISION AI v3
       *
       * The previous verifier sent the COMPLETE bidder corpus together with every
       * requirement in one prompt. That is precisely how a turnover sentence was
       * being reused for CMMI, OEM, SLA, warranty, etc.
       *
       * This verifier therefore sends the model ONLY requirement-specific bidder
       * evidence candidates. Tender text and bidder text stay separated, and the
       * model never receives the complete bidder corpus as a searchable pool.
       *
       * AI remains advisory. The final deterministic adjudicator below is the
       * authority for status and evidence.
       */
      if (!openai) return null;

      const items = safeArray(localResult?.requirementsAnalysis);
      const documents = safeArray(bidderDocuments).filter(Boolean);
      if (!items.length || !documents.length) return null;

      const isolatedPayload = items.map((item, index) => {
        const req = normalizeRequirementObject(item);
        const candidates = findEvidenceCandidates(req, documents)
          .slice(0, 8)
          .map((candidate, candidateIndex) => ({
            candidateId: `E${index + 1}-${candidateIndex + 1}`,
            sourceDocument: firstNonEmpty(
              candidate.sourceDocument,
              candidate.filename,
              candidate.fileName,
              "Bidder document"
            ),
            exactText: cleanEvidenceText(candidate.text).slice(0, 1800)
          }))
          .filter((candidate) => candidate.exactText);

        return {
          requirementId: req.requirementId || req.id || `REQ-${String(index + 1).padStart(2, "0")}`,
          title: req.title || req.requirementTitle || "",
          requirement: req.requirement || req.description || req.requirementText || "",
          candidates
        };
      });

      const prompt = `
    You are BIDIFI's requirement-specific procurement verification AI.

    IMPORTANT: each requirement below has its OWN isolated evidence pool.
    You MUST NEVER move evidence from one requirement block to another.
    You MUST NOT use any fact that is outside the candidate list for that requirement.

    STATUS RULES:
    - COMPLIANT: every mandatory condition is directly proved by the exact bidder evidence.
    - NON_COMPLIANT: the exact bidder evidence explicitly proves failure/contradiction.
    - MISSING: no candidate proves the requirement.
    - REVIEW: relevant candidate evidence exists but is partial, ambiguous, conditional, or insufficient.

    STRICT EVIDENCE RULES:
    1. Evidence must be copied exactly from a candidate's exactText.
    2. Never create or paraphrase evidence.
    3. Never use candidate sourceDocument as evidence.
    4. Never use filenames, IDs, scores, metadata, requirement titles, or explanations as evidence.
    5. A turnover statement can NEVER prove CMMI, OEM, SLA, warranty, support, certification, etc. unless the requirement itself is about turnover.
    6. For AND requirements, ALL mandatory components must be evidenced.
    7. If no candidate proves the requirement, return MISSING with empty evidence.
    8. Do not infer compliance from generic words such as "Complied", "Certified", "Available" or "Yes" unless the same exact candidate contains requirement-specific facts.

    Return ONLY JSON:
    {
      "requirementsAnalysis": [
        {
          "requirementId": "REQ-01",
          "status": "COMPLIANT|NON_COMPLIANT|MISSING|REVIEW",
          "candidateId": "E1-1",
          "evidence": "exactText copied character-for-character or empty string",
          "sourceDocument": "candidate sourceDocument or empty string",
          "reason": "short factual reason",
          "confidence": 0
        }
      ]
    }

    ISOLATED REQUIREMENTS:
    ${JSON.stringify(isolatedPayload)}
    `;

      try {
        const response = await withTimeout(
          openai.responses.create({
            model: OPENAI_MODEL,
            input: prompt
          }),
          Number(process.env.BIDIFI_AI_TIMEOUT_MS || 6500),
          "AI isolated requirement verification"
        );

        const parsed = safeJsonParse(response?.output_text || "");
        if (!parsed || !Array.isArray(parsed.requirementsAnalysis)) return null;

        return parsed;
      } catch (error) {
        console.warn(
          "[BIDIFI] Isolated Precision AI verification skipped:",
          error?.message || error
        );
        return null;
      }
    }

    function bidderDocumentTextPool(bidderDocuments) {
      return safeArray(bidderDocuments)
        .filter((doc) => doc && typeof doc === "object")
        .map((doc, index) => ({
          sourceDocument: firstNonEmpty(
            doc.sourceDocument,
            doc.filename,
            doc.fileName,
            doc.name,
            `Bidder Document ${index + 1}`
          ),
          text: cleanEvidenceText(firstNonEmpty(
            doc.text,
            doc.extractedText,
            doc.content,
            doc.rawText,
            doc.parsedText,
            doc.documentText,
            ""
          ))
        }))
        .filter((doc) => doc.text);
    }

    function exactBidderEvidenceFromAI(aiEvidence, aiSourceDocument, bidderDocuments) {
      const cited = normalizeWhitespace(aiEvidence);
      if (!cited || cited.length < 12) return null;
      if (isBidderSummaryArtifact(cited)) return null;
      if (/no bidder evidence found/i.test(cited)) return null;

      const pool = bidderDocumentTextPool(bidderDocuments);

      for (const doc of pool) {
        if (
          aiSourceDocument &&
          normalizeForCompare(aiSourceDocument) &&
          !normalizeForCompare(doc.sourceDocument).includes(normalizeForCompare(aiSourceDocument)) &&
          !normalizeForCompare(aiSourceDocument).includes(normalizeForCompare(doc.sourceDocument))
        ) {
          continue;
        }

        const sentences = splitSentences(doc.text);
        const normalizedCited = normalizeForCompare(cited);

        for (const sentence of sentences) {
          const clean = sanitizeBidderEvidenceText(sentence, doc.sourceDocument);
          const normalizedSentence = normalizeForCompare(clean);
          if (!normalizedSentence) continue;

          if (
            normalizedSentence === normalizedCited ||
            normalizedSentence.includes(normalizedCited) ||
            normalizedCited.includes(normalizedSentence)
          ) {
            if (isBidderSummaryArtifact(clean)) continue;
            return {
              text: clean,
              sourceType: "bidder",
              sourceDocument: doc.sourceDocument,
              filename: doc.sourceDocument,
              fileName: doc.sourceDocument,
              score: 100
            };
          }
        }

        // Some PDF table extraction creates one long line. Accept an exact
        // contiguous substring from that original bidder document.
        const normalizedFull = normalizeForCompare(doc.text);
        if (normalizedFull.includes(normalizedCited)) {
          const index = normalizedFull.indexOf(normalizedCited);
          if (index >= 0) {
            const original = doc.text;
            const candidate = original.length <= 1800
              ? original
              : cited;
            const clean = sanitizeBidderEvidenceText(candidate, doc.sourceDocument);
            if (clean && !isBidderSummaryArtifact(clean)) {
              return {
                text: clean,
                sourceType: "bidder",
                sourceDocument: doc.sourceDocument,
                filename: doc.sourceDocument,
                fileName: doc.sourceDocument,
                score: 100
              };
            }
          }
        }
      }

      return null;
    }

    function strictAIClaimAllowed(requirement, status, evidence) {
      const req = normalizeRequirementObject(requirement);
      const text = cleanEvidenceText(evidence);
      if (!text) return false;
      if (isBidderSummaryArtifact(text)) return false;
      if (/no bidder evidence found/i.test(text)) return false;
      if (isAnalysisArtifact(text)) return false;
      if (/\b(?:tender\s+requirement|bid\s+requirement|requirement\s+title|matched\s+evidence)\b/i.test(text)) return false;

      const negative = /\b(?:does\s+not|do\s+not|doesn't|don't|cannot|can't|unable|not\s+provided|not\s+available|not\s+supported|unsupported|not\s+implemented|non[-\s]?compliant|non[-\s]?complied|fails?|failed|without|lack(?:s|ing)?|no\s+such|not\s+hold|expired|revoked|invalid|rejected)\b/i.test(text);
      const reqText = reqTextForSnippet(req);

      if (status === "NON_COMPLIANT" && !negative) return false;
      if (status === "COMPLIANT" && negative) return false;

      // Exact certification requirements.
      const certifications = safeArray(req.structured?.requiredCertifications);
      if (certifications.length) {
        for (const cert of certifications) {
          const n = normalizeForCompare(cert);
          if (n && !normalizeForCompare(text).includes(n.replace(/\s+/g, " "))) {
            // Allow known compact spellings such as CMMI / CMM I.
            if (!(
              /cmmi/i.test(cert) && /\bcmm\s*i\b|\bcmmi\b/i.test(text)
            )) return false;
          }
        }
      }

      // Encryption/security controls must be present in the SAME evidence.
      if (/\baes\s*[- ]?256\b/i.test(reqText) && !/\baes\s*[- ]?256\b/i.test(text)) return false;
      if (/\btls\s*1\.3\b/i.test(reqText) && !/\btls\s*1\.3\b/i.test(text)) return false;

      // 24/7 requirement.
      if (
        (req.structured?.requires24x7 || /\b24\s*(?:x|×|\/)\s*7\b|24[-\s]?hour/i.test(reqText)) &&
        !/\b24\s*(?:x|×|\/)\s*7\b|24[-\s]?hour/i.test(text)
      ) return false;

      // Experience requires a relevant domain signal and an experience claim.
      if (isExperienceRequirement(req)) {
        if (!/\b\d+\s*\+?\s*(?:years?|yrs?)\b/i.test(text) && status === "COMPLIANT") return false;
        if (!/\b(?:experience|experienced|projects?|contracts?|delivered|implemented|deployment|deployed|clients?|customers?|commercial)\b/i.test(text)) return false;
        if (
          experienceRequirementSignals(req).length &&
          !experienceEvidenceMatchesDomain(req, text)
        ) return false;
      }

      const structured = req.structured || {};
      const requiredClouds = safeArray(structured.requiredCloudPlatforms);
      if (requiredClouds.length) {
        const detected = detectCloudPlatforms(text);
        if (status === "COMPLIANT" && requiredClouds.some((cloud) => !detected.includes(cloud))) return false;
      }

      if (structured.requiredAmount !== null && structured.requiredAmount !== undefined) {
        const actual = extractAmount(text);
        if (actual === null) return false;
        const value = convertAmount(actual);
        if (value === null) return false;
        if (status === "COMPLIANT" && value < structured.requiredAmount) return false;
        if (status === "NON_COMPLIANT" && value >= structured.requiredAmount && !negative) return false;
      }

      if (structured.requiredPercentage !== null && structured.requiredPercentage !== undefined) {
        const actual = extractPercentage(text);
        if (actual === null) return false;
        if (status === "COMPLIANT" && actual < structured.requiredPercentage) return false;
      }

      if (structured.requiredDays !== null && structured.requiredDays !== undefined) {
        const actual = extractDays(text);
        if (actual === null) return false;
        if (status === "COMPLIANT" && actual > structured.requiredDays) return false;
      }

      if (status === "COMPLIANT" && !hasBidderAssertion(text)) return false;

      // Generic claims still need meaningful lexical connection to the requirement.
      const specificity = requirementSpecificity(req, text);
      const overlap = Number(specificity.overlap || 0);
      const directSignal =
        specificity.matchedAttributes.length ||
        specificity.matchedCloud.length ||
        specificity.matchedSecurity.length ||
        specificity.matchedCertifications.length ||
        specificity.numericEvidence;

      return Boolean(
        directSignal ||
        overlap >= 0.22 ||
        (status === "NON_COMPLIANT" && overlap >= 0.18)
      );
    }

    function applyPrecisionAI(localResult, aiResult, bidderDocuments) {
      if (!localResult || !aiResult || !Array.isArray(aiResult.requirementsAnalysis)) {
        return localResult;
      }

      const aiItems = aiResult.requirementsAnalysis;
      const localItems = safeArray(localResult.requirementsAnalysis);

      const byId = new Map();
      aiItems.forEach((item, index) => {
        if (!item || typeof item !== "object") return;
        const id = String(
          item.requirementId || item.id ||
          `REQ-${String(index + 1).padStart(2, "0")}`
        ).toUpperCase();
        byId.set(id, { item, index });
      });

      /*
       * PRECISION DECISION CONTRACT
       * ----------------------------
       * The AI is the adjudicator. The deterministic layer is only a SOURCE
       * AUTHENTICATION layer. We do not fall back to the old broad matcher when
       * AI says MISSING/REVIEW, because that was the source of cross-requirement
       * evidence contamination.
       *
       * Rules:
       * - MISSING from AI => MISSING, with zero evidence.
       * - REVIEW from AI => REVIEW; attach evidence only when the exact quote is
       *   genuinely present in bidder text.
       * - COMPLIANT/NON_COMPLIANT => allowed only with an exact bidder quote and
       *   strict requirement-specific validation.
       */
      const updated = localItems.map((localItem, index) => {
        const key = String(
          localItem.requirementId || localItem.id ||
          `REQ-${String(index + 1).padStart(2, "0")}`
        ).toUpperCase();

        const match = byId.get(key) || { item: aiItems[index], index };
        const aiItem = match?.item;

        if (!aiItem) {
          return {
            ...localItem,
            status: "MISSING",
            result: "MISSING",
            decision: "MISSING",
            complianceStatus: "MISSING",
            verificationStatus: "MISSING",
            matchStatus: "MISSING",
            compliant: false,
            confidence: 15,
            aiConfidence: 15,
            evidenceConfidence: 0,
            evidenceCandidates: [],
            evidence: "",
            reason: "AI did not return a decision for this requirement.",
            finding: "AI did not return a decision for this requirement.",
            comparison: "No verified bidder evidence was returned."
          };
        }

        const status = String(aiItem.status || "").toUpperCase().trim();
        if (!new Set(["COMPLIANT", "NON_COMPLIANT", "MISSING", "REVIEW"]).has(status)) {
          return localItem;
        }

        const aiConfidence = clamp(Number(aiItem.confidence || 0), 0, 99);
        const exact = exactBidderEvidenceFromAI(
          aiItem.evidence,
          aiItem.sourceDocument,
          bidderDocuments
        );

        // Missing is authoritative: absolutely no evidence is attached.
        if (status === "MISSING") {
          return {
            ...localItem,
            status: "MISSING",
            result: "MISSING",
            decision: "MISSING",
            complianceStatus: "MISSING",
            verificationStatus: "MISSING",
            matchStatus: "MISSING",
            compliant: false,
            confidence: Math.min(aiConfidence || 20, 35),
            aiConfidence: Math.min(aiConfidence || 20, 35),
            evidenceConfidence: 0,
            evidenceCandidates: [],
            evidence: "",
            reason: safeString(aiItem.reason).trim() ||
              "No trustworthy bidder-document evidence was found for this requirement.",
            finding: safeString(aiItem.reason).trim() ||
              "No trustworthy bidder-document evidence was found for this requirement.",
            comparison: safeString(aiItem.reason).trim() ||
              "No trustworthy bidder-document evidence was found for this requirement.",
            aiVerified: true
          };
        }

        // AI cannot prove a positive/negative decision without a quote that exists
        // verbatim in the original bidder document.
        if ((status === "COMPLIANT" || status === "NON_COMPLIANT") && !exact) {
          return {
            ...localItem,
            status: "MISSING",
            result: "MISSING",
            decision: "MISSING",
            complianceStatus: "MISSING",
            verificationStatus: "MISSING",
            matchStatus: "MISSING",
            compliant: false,
            confidence: 20,
            aiConfidence: 20,
            evidenceConfidence: 0,
            evidenceCandidates: [],
            evidence: "",
            reason: "The AI decision could not be grounded in an exact bidder-document quote.",
            finding: "The AI decision could not be grounded in an exact bidder-document quote.",
            comparison: "No exact bidder evidence was found for the AI claim.",
            aiVerified: false
          };
        }

        if (exact && !strictAIClaimAllowed(localItem, status, exact.text)) {
          // A cited sentence exists, but it does not prove the requirement. Never
          // allow the local broad matcher to replace it with unrelated evidence.
          return {
            ...localItem,
            status: "REVIEW",
            result: "REVIEW",
            decision: "REVIEW",
            complianceStatus: "REVIEW",
            verificationStatus: "REVIEW",
            matchStatus: "REVIEW",
            compliant: false,
            confidence: Math.min(aiConfidence || 45, 65),
            aiConfidence: Math.min(aiConfidence || 45, 65),
            evidenceConfidence: exact ? 65 : 0,
            evidenceCandidates: exact ? [exact] : [],
            evidence: exact?.text || "",
            reason: "Relevant bidder evidence was found, but it does not satisfy all requirement-specific conditions with sufficient certainty.",
            finding: "Relevant bidder evidence was found, but it does not satisfy all requirement-specific conditions with sufficient certainty.",
            comparison: "AI evidence was source-grounded but did not pass the strict requirement-specific validation.",
            aiVerified: false
          };
        }

        const evidenceCandidates = exact ? [exact] : [];
        return {
          ...localItem,
          status,
          result: status,
          decision: status,
          complianceStatus: status,
          verificationStatus: status,
          matchStatus: status,
          compliant: status === "COMPLIANT",
          confidence: aiConfidence,
          aiConfidence,
          evidenceConfidence: exact ? aiConfidence : 0,
          reason: safeString(aiItem.reason).trim() || localItem.reason,
          finding: safeString(aiItem.reason).trim() || localItem.finding,
          comparison: safeString(aiItem.reason).trim() || localItem.comparison,
          evidenceCandidates,
          evidence: exact?.text || "",
          aiVerified: true
        };
      });

      return {
        ...localResult,
        requirementsAnalysis: updated
      };
    }
    function evidenceIsExactCandidate(
      item,
      evidence
    ) {
      const normalized =
        normalizeForCompare(
          evidence
        );

      if (!normalized) {
        return false;
      }

      return safeArray(
        item.evidenceCandidates
      ).some(
        (candidate) =>
          normalizeForCompare(
            candidate.text
          ) === normalized
      );
    }

    function validateAIItem(
      localItem,
      aiItem
    ) {
      if (!localItem || !aiItem || typeof aiItem !== "object") {
        return localItem;
      }

      const localStatus = String(
        localItem.status || ""
      ).toUpperCase().trim();

      const aiStatus = String(
        aiItem.status || ""
      ).toUpperCase().trim();

      const allowed = new Set([
        "COMPLIANT",
        "NON_COMPLIANT",
        "MISSING",
        "REVIEW"
      ]);

      if (!allowed.has(aiStatus)) {
        return localItem;
      }

      const aiConfidence = Number(aiItem.confidence || 0);
      const aiEvidence = safeString(aiItem.evidence).trim();

      /*
       * AI can participate only when its cited evidence is genuinely present
       * in a bidder-document candidate already extracted by BIDIFI. This is the
       * key safety boundary: AI is never allowed to invent a new evidence source.
       */
      const evidenceMatch = safeArray(localItem.evidenceCandidates).some((candidate) => {
        if (!candidate || !isBidderSourceType(candidate.sourceType)) return false;
        const candidateText = normalizeForCompare(
          sanitizeBidderEvidenceText(
            candidate.text,
            firstNonEmpty(candidate.sourceDocument, candidate.filename, candidate.fileName)
          )
        );
        const cited = normalizeForCompare(aiEvidence);
        if (!candidateText || !cited || cited.length < 18) return false;
        return (
          candidateText === cited ||
          candidateText.includes(cited) ||
          cited.includes(candidateText)
        );
      });

      /* Never let AI overturn an explicit deterministic failure. */
      if (localStatus === "NON_COMPLIANT") {
        if (aiStatus !== "NON_COMPLIANT") return localItem;
        return {
          ...localItem,
          reason: aiItem.reason || localItem.reason,
          finding: aiItem.reason || localItem.finding,
          comparison: aiItem.reason || localItem.comparison,
        };
      }

      /*
       * Deterministic COMPLIANT is retained unless AI identifies a clear failure
       * backed by the same real bidder evidence. This prevents a semantic false
       * positive while preserving source grounding.
       */
      if (localStatus === "COMPLIANT") {
        if (
          aiStatus === "NON_COMPLIANT" &&
          evidenceMatch &&
          aiConfidence >= 80
        ) {
          return {
            ...localItem,
            status: "NON_COMPLIANT",
            result: "NON_COMPLIANT",
            decision: "NON_COMPLIANT",
            complianceStatus: "NON_COMPLIANT",
            verificationStatus: "NON_COMPLIANT",
            matchStatus: "NON_COMPLIANT",
            compliant: false,
            confidence: Math.max(localItem.confidence || 0, aiConfidence),
            reason: aiItem.reason || "AI identified a bidder-evidence-backed contradiction.",
            finding: aiItem.reason || "AI identified a bidder-evidence-backed contradiction.",
            comparison: aiItem.reason || "AI identified a bidder-evidence-backed contradiction.",
          };
        }
        return localItem;
      }

      /*
       * The important recovery path: if deterministic matching was too strict
       * and AI sees a direct proof that is already present in the extracted
       * bidder evidence, upgrade MISSING/REVIEW to COMPLIANT.
       */
      if (
        (localStatus === "MISSING" || localStatus === "REVIEW") &&
        aiStatus === "COMPLIANT" &&
        evidenceMatch &&
        aiConfidence >= 80
      ) {
        return {
          ...localItem,
          status: "COMPLIANT",
          result: "COMPLIANT",
          decision: "COMPLIANT",
          complianceStatus: "COMPLIANT",
          verificationStatus: "COMPLIANT",
          matchStatus: "COMPLIANT",
          compliant: true,
          confidence: Math.max(localItem.confidence || 0, aiConfidence),
          aiConfidence,
          evidenceConfidence: Math.max(localItem.evidenceConfidence || 0, aiConfidence),
          reason: aiItem.reason || "The bidder evidence directly supports the requirement.",
          finding: aiItem.reason || "The bidder evidence directly supports the requirement.",
          comparison: aiItem.reason || "The bidder evidence directly supports the requirement.",
        };
      }

      /* AI cannot manufacture evidence or override uncertainty without proof. */
      return localItem;
    }
    /* ============================================================
       FINAL EVIDENCE GROUNDING SAFETY PASS
       ============================================================ */

    function enforceEvidenceGrounding(item) {
      if (!item || typeof item !== "object") {
        return item;
      }

      const currentStatus = String(
        item.status ||
          item.result ||
          item.complianceStatus ||
          item.verificationStatus ||
          item.matchStatus ||
          ""
      )
        .toUpperCase()
        .trim();

      const evidenceCandidates = safeArray(
        item.evidenceCandidates
      ).filter(
        (candidate) =>
          candidate &&
          typeof candidate === "object" &&
          isBidderSourceType(
            candidate.sourceType
          )
      );

      /*
       * ONLY genuine bidder-document evidence
       * can support COMPLIANT.
       */
      const validEvidence =
        evidenceCandidates.filter(
          (candidate) => {
            const text = cleanEvidenceText(
              candidate.text
            );

            if (!text) {
              return false;
            }

            const cleanedEvidence = sanitizeBidderEvidenceText(
              text,
              firstNonEmpty(candidate.sourceDocument, candidate.filename, candidate.fileName)
            );
            if (!cleanedEvidence) return false;

            const normalized =
              normalizeForCompare(cleanedEvidence);

            if (!normalized) {
              return false;
            }

            // REQ/Clause labels are metadata, not a reason to discard the
            // underlying bidder evidence. They were already stripped during
            // candidate sanitisation.
            const cleanedForEvidence = sanitizeBidderEvidenceText(
              text,
              firstNonEmpty(candidate.sourceDocument, candidate.filename, candidate.fileName)
            );
            if (!cleanedForEvidence) return false;

            /*
             * Reject generated fallback text.
             */
            if (/no bidder evidence found/i.test(text)) return false;
            if (isBidderSummaryArtifact(text)) return false;

            /*
             * Reject obvious tender-side language.
             */
            if (
              /tender requirement|bid requirement|eligibility requirement|requirement title/i.test(
                text
              )
            ) {
              return false;
            }

            /*
             * Filename / document-name contamination
             * must never become evidence.
             */
            const filename =
              firstNonEmpty(
                candidate.filename,
                candidate.fileName,
                candidate.sourceDocument
              );

            if (
              filename &&
              normalizeForCompare(
                filename
              ) === normalized
            ) {
              return false;
            }

            return true;
          }
        );

      /*
       * Hard negative status can NEVER be upgraded.
       */
      if (
        currentStatus ===
          "NON_COMPLIANT" ||
        currentStatus ===
          "MISSING"
      ) {
        return {
          ...item,

          evidenceCandidates:
            validEvidence,

          compliant: false,

          result:
            currentStatus,

          decision:
            currentStatus,

          complianceStatus:
            currentStatus,

          verificationStatus:
            currentStatus,

          matchStatus:
            currentStatus,
        };
      }

      /*
       * COMPLIANT without genuine bidder evidence
       * is NEVER allowed.
       */
      if (
        currentStatus ===
          "COMPLIANT" &&
        validEvidence.length === 0
      ) {
        return {
          ...item,

          status: "MISSING",

          result: "MISSING",

          decision: "MISSING",

          complianceStatus:
            "MISSING",

          verificationStatus:
            "MISSING",

          matchStatus: "MISSING",

          compliant: false,

          confidence: Math.min(
            Number(
              item.confidence || 0
            ),
            25
          ),

          aiConfidence: Math.min(
            Number(
              item.aiConfidence ||
                item.confidence ||
                0
            ),
            25
          ),

          evidenceConfidence:
            Math.min(
              Number(
                item.evidenceConfidence ||
                  item.confidence ||
                  0
              ),
              25
            ),

          reason:
            "No valid bidder-document evidence was found for this requirement.",

          finding:
            "No valid bidder-document evidence was found for this requirement.",

          comparison:
            "No valid bidder-document evidence was found for this requirement.",

          evidenceCandidates: [],
        };
      }

      /*
       * REVIEW without evidence remains REVIEW.
       */
      if (
        currentStatus === "REVIEW" &&
        validEvidence.length === 0
      ) {
        return {
          ...item,

          status: "REVIEW",

          result: "REVIEW",

          decision: "REVIEW",

          complianceStatus: "REVIEW",

          verificationStatus:
            "REVIEW",

          matchStatus: "REVIEW",

          compliant: false,

          evidenceCandidates: [],
        };
      }

      /*
       * Keep ONLY clean bidder-document evidence.
       */
      return {
        ...item,

        evidenceCandidates:
          validEvidence,

        compliant:
          currentStatus ===
          "COMPLIANT",

        result:
          currentStatus,

        decision:
          currentStatus,

        complianceStatus:
          currentStatus,

        verificationStatus:
          currentStatus,

        matchStatus:
          currentStatus,
      };
    }

    /* ============================================================
       FINAL AUTHORITATIVE RE-ADJUDICATION
       ============================================================
       This is intentionally AFTER any AI pass. The final status for a
       requirement is re-derived from the bidder documents themselves.
       AI/candidate scoring is never allowed to downgrade direct proof.
    */
    function finalRequirementKey(item, index = 0) {
      try {
        return requirementSemanticKey(normalizeRequirementObject(item)) || `INDEX|${index}`;
      } catch (_) {
        return `INDEX|${index}`;
      }
    }

    function dedupeFinalRequirements(items) {
      const seen = new Set();
      const output = [];
      safeArray(items).forEach((item, index) => {
        const key = finalRequirementKey(item, index);
        if (seen.has(key)) return;
        seen.add(key);
        output.push(item);
      });
      return output.map((item, index) => ({
        ...item,
        requirementId: `REQ-${String(index + 1).padStart(2, "0")}`,
        id: `REQ-${String(index + 1).padStart(2, "0")}`
      }));
    }

    function finalAuthoritativeReAdjudication(result, bidderDocuments) {
      /*
       * FINAL AUTHORITY / ZERO-CONTAMINATION PASS
       *
       * Never trust an AI status as final. Re-run every requirement from the
       * original tender requirement + bidder documents only. This is deliberately
       * expensive in CPU but cheap in correctness and prevents a single bidder
       * sentence from leaking into every requirement.
       */
      const originalItems = safeArray(result?.requirementsAnalysis);
      const docs = safeArray(bidderDocuments);

      const items = originalItems.map((item, index) => {
        const requirement = normalizeRequirementObject({
          ...item,
          id: item.id || item.requirementId || `REQ-${String(index + 1).padStart(2, "0")}`,
          requirementId: item.requirementId || item.id || `REQ-${String(index + 1).padStart(2, "0")}`
        });

        let proof;
        try {
          // Fresh deterministic evaluation. Do not pass AI evidence into this call.
          proof = buildRequirementResult(requirement, docs);
        } catch (error) {
          console.warn("[BIDIFI] Final deterministic requirement check failed:", error?.message || error);
          proof = {
            ...item,
            status: "REVIEW",
            confidence: 40,
            evidenceCandidates: [],
            evidence: "",
            reason: "The requirement could not be deterministically adjudicated; manual review is required."
          };
        }

        const status = ["COMPLIANT", "NON_COMPLIANT", "MISSING", "REVIEW"].includes(
          String(proof?.status || "").toUpperCase()
        ) ? String(proof.status).toUpperCase() : "REVIEW";

        // Evidence is ALWAYS rebuilt from deterministic bidder-only proof.
        const evidenceCandidates = safeArray(proof?.evidenceCandidates)
          .map((candidate) => cleanBidderEvidenceCandidate(candidate))
          .filter(Boolean)
          .filter((candidate) => !isForbiddenBidderEvidence(candidate.text));

        // Missing means zero evidence, unconditionally.
        const finalEvidence = status === "MISSING" ? [] : evidenceCandidates;
        const finalStatus = status;

        const deterministicConfidence = Number(proof?.confidence || 0);
        const confidence = status === "MISSING"
          ? Math.min(deterministicConfidence || 92, 92)
          : Math.max(0, Math.min(99, deterministicConfidence || 40));

        const reason = firstNonEmpty(
          proof?.reason,
          status === "MISSING"
            ? "No trustworthy bidder-document evidence was found for this requirement."
            : "Requirement evaluated from bidder-document evidence."
        );

        return {
          ...item,
          ...proof,
          id: requirement.id,
          requirementId: requirement.requirementId,
          title: requirement.title,
          requirementTitle: requirement.requirementTitle,
          requirement: requirement.requirement,
          description: requirement.description,
          requirementText: requirement.requirementText,
          category: requirement.category,
          mandatory: requirement.mandatory,
          status: finalStatus,
          result: finalStatus,
          decision: finalStatus,
          complianceStatus: finalStatus,
          verificationStatus: finalStatus,
          matchStatus: finalStatus,
          compliant: finalStatus === "COMPLIANT",
          confidence,
          aiConfidence: Number(item?.aiConfidence || confidence),
          evidenceConfidence: confidence,
          reason,
          finding: reason,
          comparison: reason,
          conditionResults: safeArray(proof?.conditionResults),
          coveredComponents: safeArray(proof?.coveredComponents),
          missingComponents: safeArray(proof?.missingComponents),
          evidenceCandidates: finalEvidence,
          evidence: finalEvidence[0]?.text || "",
          aiVerified: false,
          verificationAuthority: "BIDIFI deterministic requirement-specific adjudicator"
        };
      });

      const deduped = dedupeFinalRequirements(items);
      const summary = calculateResultSummary(deduped);

      return {
        ...result,
        requirementsAnalysis: deduped,
        summary,
        ...summary,
        missingDocuments: buildMissingDocuments(deduped),
        criticalFindings: buildCriticalFindings(deduped),
        recommendations: buildRecommendations(deduped)
      };
    }

    async function analyzeCompliance(
      tender,
      bidder
    ) {
      const local = analyzeLocally(tender, bidder);

      /*
       * Full precision AI runs for EVERY requirement. Unlike the old secondary
       * verifier, it receives the actual bidder documents rather than already
       * contaminated candidate summaries.
       */
      const ai = openai
        ? await runAIComplianceVerification(
            local,
            safeArray(bidder?.documents)
          )
        : null;

      let combined = local;

      if (ai) {
        combined = applyPrecisionAI(
          combined,
          ai,
          safeArray(bidder?.documents)
        );
      }

      /*
       * Final deterministic adjudication remains a safety net. It can replace an
       * ungrounded AI claim, but it cannot invent bidder evidence.
       */
      const reAdjudicated = finalAuthoritativeReAdjudication(
        combined,
        safeArray(bidder?.documents)
      );

      combined.requirementsAnalysis =
        safeArray(reAdjudicated.requirementsAnalysis).map((item) => {
          const evidence = safeArray(item?.evidenceCandidates).filter(
            (e) => e && safeString(e.text).trim() && !isForbiddenBidderEvidence(e.text)
          );

          const status = String(item?.status || "").toUpperCase().trim();

          if (
            (status === "COMPLIANT" || status === "NON_COMPLIANT") &&
            evidence.length === 0
          ) {
            return {
              ...item,
              status: "MISSING",
              result: "MISSING",
              decision: "MISSING",
              complianceStatus: "MISSING",
              verificationStatus: "MISSING",
              matchStatus: "MISSING",
              compliant: false,
              evidenceCandidates: [],
              evidence: "",
              confidence: Math.min(Number(item?.confidence || 0), 25),
              reason:
                "No exact bidder-document evidence was found for this requirement."
            };
          }

          return {
            ...item,
            evidenceCandidates: evidence,
            evidence: evidence[0]?.text || "",
            compliant: status === "COMPLIANT",
            result: status,
            decision: status,
            complianceStatus: status,
            verificationStatus: status,
            matchStatus: status
          };
        });

      combined.summary = calculateResultSummary(
        combined.requirementsAnalysis
      );

      combined.missingDocuments = buildMissingDocuments(
        combined.requirementsAnalysis
      );

      combined.criticalFindings = buildCriticalFindings(
        combined.requirementsAnalysis
      );

      combined.recommendations = buildRecommendations(
        combined.requirementsAnalysis
      );

      const items = combined.requirementsAnalysis;
      const avgConfidence = items.length
        ? items.reduce(
            (sum, item) => sum + Number(item.confidence || 0),
            0
          ) / items.length
        : 0;

      return {
        ...combined,
        ...combined.summary,
        requirementsAnalysis: items,
        missingDocuments: combined.missingDocuments,
        criticalFindings: combined.criticalFindings,
        recommendations: combined.recommendations,
        aiConfidence: Number(avgConfidence.toFixed(2)),
        confidence: Number(avgConfidence.toFixed(2)),
        verificationMethod: ai
          ? "BIDIFI Precision AI + exact bidder-evidence grounding + deterministic safety adjudication"
          : combined.verificationMethod
      };
    }

    /* ============================================================
       PDF REPORT
       ============================================================ */

    function buildReportData(
      analysis,
      tender,
      requirements
    ) {
      const result =
        analysis?.result ||
        analysis ||
        {};

      return {
        tenderName:
          tender?.name ||
          result.tenderName ||
          "Tender verification",

        generatedAt:
          nowIso(),

        compliancePercentage:
          result.compliancePercentage ||
          0,

        riskScore:
          result.riskScore ||
          0,

        riskLevel:
          result.riskLevel ||
          "LOW",

        overallDecision:
          result.overallDecision ||
          "REVIEW",

        requirements:
          safeArray(
            result.requirementsAnalysis ||
              requirements
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
    }

    function generatePDFReport(
      data,
      outputPath
    ) {
      if (!PDFDocument) {
        throw new Error(
          "pdfkit is not installed. Run npm install pdfkit."
        );
      }

      return new Promise(
        (
          resolve,
          reject
        ) => {
          const doc =
            new PDFDocument({
              margin: 42,
              size: "A4",
            });

          const stream =
            fs.createWriteStream(
              outputPath
            );

          stream.on(
            "finish",
            resolve
          );

          stream.on(
            "error",
            reject
          );

          doc.pipe(
            stream
          );

          doc
            .fontSize(20)
            .text(
              "BIDIFI",
              {
                continued:
                  true,
              }
            );

          doc
            .fontSize(10)
            .text(
              "  AI BID COMPLIANCE REPORT"
            );

          doc.moveDown();

          doc
            .fontSize(11)
            .text(
              `Tender: ${data.tenderName}`
            );

          doc.text(
            `Generated: ${data.generatedAt}`
          );

          doc.moveDown();

          doc
            .fontSize(14)
            .text(
              `Overall Decision: ${data.overallDecision}`
            );

          doc
            .fontSize(12)
            .text(
              `Compliance: ${Number(
                data.compliancePercentage
              ).toFixed(
                1
              )}%`
            );

          doc.text(
            `Risk: ${Number(
              data.riskScore
            ).toFixed(
              1
            )}% (${data.riskLevel})`
          );

          doc.moveDown();

          doc
            .fontSize(14)
            .text(
              "Requirement Analysis"
            );

          doc.moveDown(
            0.5
          );

          for (
            const item of
              data.requirements
          ) {
            doc
              .fontSize(10)
              .text(
                `${
                  item.requirementId ||
                  item.id ||
                  "REQ"
                } — ${
                  item.title ||
                  item.requirementTitle ||
                  "Requirement"
                }`
              );

            doc
              .fontSize(9)
              .text(
                `Status: ${
                  item.status ||
                  "REVIEW"
                }`
              );

            doc.text(
              `Requirement: ${
                item.requirement ||
                ""
              }`
            );

            doc.text(
              `Evidence: ${
                item.evidence ||
                "No supporting evidence found."
              }`
            );

            doc.text(
              `Reason: ${
                item.reason ||
                ""
              }`
            );

            doc.moveDown(
              0.7
            );
          }

          if (
            data.criticalFindings
              .length
          ) {
            doc
              .fontSize(14)
              .text(
                "Critical Findings"
              );

            doc.moveDown(
              0.5
            );

            for (
              const item of
                data.criticalFindings
            ) {
              doc
                .fontSize(9)
                .text(
                  `• ${
                    item.finding ||
                    item.description ||
                    item
                  }`
                );
            }

            doc.moveDown();
          }

          if (
            data.missingDocuments
              .length
          ) {
            doc
              .fontSize(14)
              .text(
                "Missing Evidence"
              );

            doc.moveDown(
              0.5
            );

            for (
              const item of
                data.missingDocuments
            ) {
              doc
                .fontSize(9)
                .text(
                  `• ${
                    item.document ||
                    item.name ||
                    item
                  }: ${
                    item.reason ||
                    ""
                  }`
                );
            }

            doc.moveDown();
          }

          if (
            data.recommendations
              .length
          ) {
            doc
              .fontSize(14)
              .text(
                "Recommendations"
              );

            doc.moveDown(
              0.5
            );

            for (
              const item of
                data.recommendations
            ) {
              doc
                .fontSize(9)
                .text(
                  `• ${
                    typeof item ===
                    "string"
                      ? item
                      : item.text ||
                        item.action ||
                        item.description ||
                        "Review recommendation."
                  }`
                );
            }
          }

          doc.end();
        }
      );
    }

    /* ============================================================
       AUTHENTICATION ROUTES
       ============================================================ */

    ensureUsersFile();

    app.post("/api/auth/register", (req, res) => {
      try {
        const body = req.body || {};
        const name = safeString(body.name).trim();
        const email = safeString(body.email).trim().toLowerCase();
        const password = safeString(body.password);
        const companyName = safeString(body.companyName).trim();
        const phone = safeString(body.phone).trim();

        if (!name || !email || !password) return res.status(400).json({ success: false, message: "Name, email and password are required." });
        if (password.length < 6) return res.status(400).json({ success: false, message: "Password must contain at least 6 characters." });

        const users = readUsers();
        if (users.some((user) => user.email === email)) return res.status(409).json({ success: false, message: "An account with this email already exists. Please log in." });

        const credentials = hashPassword(password);
        const user = {
          id: createId("user"),
          name,
          email,
          companyName,
          phone,
          role: "Administrator",
          passwordSalt: credentials.salt,
          passwordHash: credentials.hash,
          createdAt: nowIso(),
        };

        users.push(user);
        writeUsers(users);

        const token = createSession(user.id);
        return res.status(201).json({ success: true, token, user: publicUser(user) });
      } catch (error) {
        return res.status(500).json({ success: false, message: error?.message || "Account creation failed." });
      }
    });

    app.post("/api/auth/login", (req, res) => {
      try {
        const email = safeString(req.body?.email).trim().toLowerCase();
        const password = safeString(req.body?.password);
        const user = readUsers().find((item) => item.email === email);

        if (!user || !verifyPassword(password, user)) return res.status(401).json({ success: false, message: "Invalid email or password." });

        const token = createSession(user.id);
        return res.json({ success: true, token, user: publicUser(user) });
      } catch (error) {
        return res.status(500).json({ success: false, message: error?.message || "Login failed." });
      }
    });

    app.get("/api/auth/me", (req, res) => {
      const user = getAuthenticatedUser(req);
      if (!user) return res.status(401).json({ success: false, message: "Not authenticated." });
      return res.json({ success: true, user: publicUser(user) });
    });

    app.post("/api/auth/logout", (req, res) => {
      const header = String(req.headers.authorization || "");
      const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
      if (token) SESSION_STORE.delete(token);
      return res.json({ success: true });
    });

    /* ============================================================
       ROUTES
       ============================================================ */

    app.get(
      "/",
      (
        req,
        res
      ) => {
        res.json({
          success:
            true,

          project:
            "BIDIFI",

          message:
            "AI Bid Compliance Backend is running.",

          port:
            PORT,
        });
      }
    );

    app.get(
      "/api/status",
      (
        req,
        res
      ) => {
        res.json({
          success:
            true,

          backend:
            "online",

          engineVersion:
            "BIDIFI-AUTHORITATIVE-2026-09-15-R15-FAST-UPLOAD-UNIVERSAL-EXTRACTION-EVIDENCE",

          service:
            "BIDIFI AI Bid Compliance Engine",

          version:
            "8.1.0",

          aiConfigured:
            Boolean(
              apiKey &&
                openai
            ),

          aiEnabled:
            Boolean(
              apiKey &&
                openai
            ),

          aiEngine:
            apiKey && openai
              ? "CONNECTED"
              : "DETERMINISTIC_ONLY",

          storage:
            "memory",

          verification:
            "evidence-grounded-deterministic",

          evidencePolicy:
            "bidder-document-only",

          tenders:
            tenderStore.size,

          bidders:
            bidderStore.size,

          analyses:
            analysisStore.size,

          reports:
            reportStore.size,

          timestamp:
            nowIso(),
        });
      }
    );

    app.get(
      "/api/workspace",
      (
        req,
        res
      ) => {
        const tenders =
          [
            ...tenderStore.values(),
          ].map(
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
                safeArray(
                  tender.requirements
                ).length,

              requirements:
                safeArray(
                  tender.requirements
                ),

              uploadedAt:
                tender.uploadedAt,
            })
          );

        const bidders =
          [
            ...bidderStore.values(),
          ].map(
            (bidder) => ({
              id:
                bidder.id,

              name:
                bidder.name,

              tenderId:
                bidder.tenderId,

              documentCount:
                safeArray(
                  bidder.documents
                ).length,

              createdAt:
                bidder.createdAt,
            })
          );

        const analyses =
          [
            ...analysisStore.values(),
          ].map(
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

        const latestAnalysis =
          analyses.length
            ? analyses[
                analyses.length -
                  1
              ]
            : null;

        res.json({
          success:
            true,

          tenders,

          bidders,

          analyses,

          latestAnalysis,
        });
      }
    );

    /* ============================================================
       TENDER UPLOAD
       ============================================================ */


    async function handleTenderUpload(files, res, uploadedBy = {}) {
      if (!files.length) {
        return res.status(400).json({
          success: false,
          message: "No tender files uploaded.",
          tenders: [],
          files: [],
          uploadedCount: 0
        });
      }

      /*
       * SPEED PATH:
       * Upload never waits for an LLM. PDF text extraction + source-first
       * deterministic parsing are the immediate response. The existing explicit
       * extraction endpoint can be invoked later when an AI refinement is wanted.
       */
      const results = await Promise.all(
        safeArray(files).map(async (file) => {
          try {
            const content = await extractFileContent(file);
            const sourceText = safeString(content.text).trim();

            if (sourceText.length < 20) {
              return {
                ok: false,
                filename: file.originalname,
                error: "Tender document contains too little readable text. If this is a scanned PDF, OCR is required."
              };
            }

            const explicit = dedupeRequirements(
              extractExplicitTenderRows(sourceText)
            );

            const local = dedupeRequirements(
              extractRequirementsLocally(sourceText)
            );

            // Explicit REQ/CLAUSE rows are the highest-confidence source. If
            // present, do not allow an AI model to reduce their count.
            const requirements = explicit.length
              ? explicit.map((item, index) => ({
                  ...item,
                  id: `REQ-${String(index + 1).padStart(2, "0")}`
                }))
              : local.map((item, index) => ({
                  ...item,
                  id: `REQ-${String(index + 1).padStart(2, "0")}`
                }));

            const id = createId("tender");
            const tender = {
              id,
              filename: file.originalname,
              name: file.originalname,
              text: sourceText,
              pages: content.pages,
              type: content.type,
              requirements,
              extractionStatus: requirements.length ? "READY" : "TEXT_READY",
              extractionMethod: explicit.length
                ? "source-first explicit requirement extraction"
                : "deterministic requirement extraction",
              tenderSummary: "",
              tenderTitle: "",
              issuingAuthority: "",
              uploadedBy: {
                userId: safeString(uploadedBy?.userId).trim() || null,
                name: safeString(uploadedBy?.name).trim(),
                email: safeString(uploadedBy?.email).trim(),
                companyName: safeString(uploadedBy?.companyName).trim(),
                phone: safeString(uploadedBy?.phone).trim(),
                gstin: safeString(uploadedBy?.gstin).trim(),
                registrationNumber: safeString(uploadedBy?.registrationNumber).trim()
              },
              uploadedAt: nowIso()
            };

            tenderStore.set(id, tender);

            return {
              ok: true,
              tender
            };
          } catch (error) {
            console.error(
              `[BIDIFI] Tender processing failed for ${file.originalname}:`,
              error
            );
            return {
              ok: false,
              filename: file.originalname,
              error: error?.message || "Tender processing failed."
            };
          } finally {
            deleteFile(file.path);
          }
        })
      );

      const successful = results
        .filter((item) => item.ok && item.tender)
        .map((item) => item.tender);

      const failed = results
        .filter((item) => !item.ok);

      const returnedTenders = successful.map((tender) => ({
        ...tender,
        // Never expose the full tender text in the upload response. The detail
        // endpoint remains the source for the stored document text.
        text: undefined,
        requirementCount: safeArray(tender.requirements).length
      }));

      const firstTender = returnedTenders[0] || null;

      return res.json({
        success: successful.length > 0,
        uploadedCount: successful.length,
        failedCount: failed.length,
        tenders: returnedTenders,
        files: returnedTenders,
        // Compatibility aliases used by older/newer App.jsx versions.
        tender: firstTender,
        selectedTender: firstTender,
        uploadedTenders: returnedTenders,
        tenderId: firstTender?.id || null,
        selectedTenderId: firstTender?.id || null,
        requirements: firstTender?.requirements || [],
        requirementCount: firstTender?.requirementCount || 0,
        message: successful.length
          ? "Tender uploaded and source requirements extracted."
          : "No tender files could be processed."
      });
    }

    /* ============================================================
       UPLOAD FILE NORMALIZER
       ============================================================ */

    // Multer's upload.any() normally stores uploaded files in req.files.
    // Some older/alternate middleware flows can expose req.files as an object
    // or a single file as req.file. Normalize all supported shapes here so every
    // tender-upload route can safely use the same helper.
    function getUploadedFiles(req) {
      const collected = [];

      if (Array.isArray(req?.files)) {
        collected.push(...req.files);
      } else if (req?.files && typeof req.files === "object") {
        for (const value of Object.values(req.files)) {
          if (Array.isArray(value)) {
            collected.push(...value);
          } else if (value) {
            collected.push(value);
          }
        }
      }

      if (req?.file) {
        collected.push(req.file);
      }

      const seen = new Set();

      return collected.filter((file) => {
        if (!file) return false;

        const filePath = file.path || file.tempFilePath || file.destination;
        if (!filePath && !file.buffer) return false;

        const uniqueKey = filePath || `${file.originalname || "file"}:${file.size || 0}`;
        if (seen.has(uniqueKey)) return false;
        seen.add(uniqueKey);

        const ext = path.extname(file.originalname || "").toLowerCase();
        return [".pdf", ".doc", ".docx", ".txt"].includes(ext);
      });
    }

    /* ============================================================
       TENDER UPLOAD - PRIMARY FRONTEND ROUTE
       ============================================================ */

    // The current BIDIFI frontend uploads tender files to POST /api/upload-tenders.
    // Keep this route explicit and compatible with both single and multi-file
    // uploads. It intentionally uses the same fast deterministic upload pipeline
    // as the /api/tenders/upload compatibility route, so uploading a tender does
    // not wait for the AI verifier.
    app.post(
      "/api/upload-tenders",
      upload.any(),
      async (req, res) => {
        try {
          const tenderFiles = getUploadedFiles(req);

          if (!tenderFiles.length) {
            return res.status(400).json({
              success: false,
              message: "No tender files uploaded.",
              tenders: [],
              files: [],
            });
          }

          const uploadedBy = safeJsonParse(req.body?.uploadedBy) || {};

          return await handleTenderUpload(tenderFiles, res, uploadedBy);
        } catch (error) {
          console.error("[BIDIFI] /api/upload-tenders failed:", error);
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message: error?.message || "Tender upload failed.",
              tenders: [],
              files: [],
            });
          }
        }
      }
    );

    /* ============================================================
       TENDER COLLECTION / COMPATIBILITY UPLOAD
       ============================================================ */

    // Some older frontend builds used /api/tenders for the upload operation.
    // Keep a dedicated upload alias so the server accepts those clients without
    // changing the existing GET /api/tenders response contract.
    app.post(
      "/api/tenders/upload",
      upload.any(),
      async (req, res) => {
        try {
          const tenderFiles = getUploadedFiles(req);

          if (!tenderFiles.length) {
            return res.status(400).json({
              success: false,
              message: "No tender files uploaded.",
              tenders: [],
              files: [],
            });
          }

          const uploadedBy = safeJsonParse(req.body?.uploadedBy) || {};
          await handleTenderUpload(tenderFiles, {
            status: (code) => ({
              json: (body) => res.status(code).json(body),
            }),
            json: (body) => {
              const tenders = Array.isArray(body?.tenders)
                ? body.tenders
                : [];
              const firstTender = tenders[0] || null;
              return res.json({
                ...body,
                tender: firstTender,
                selectedTender: firstTender,
                tenderId: firstTender?.id || null,
                selectedTenderId: firstTender?.id || null,
                uploadedTenders: tenders,
              });
            },
          }, uploadedBy);
        } catch (error) {
          console.error("[BIDIFI] /api/tenders/upload failed:", error);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: error?.message || "Tender upload failed.",
            });
          }
        }
      }
    );

    /* ============================================================
       TENDER DETAILS
       ============================================================ */

    app.get(
      "/api/tenders",
      (req, res) => {
        const tenders = [...tenderStore.values()]
          .map((tender) => ({
            id: tender.id,
            name: tender.name,
            filename: tender.filename,
            pages: tender.pages,
            textLength: safeString(tender.text).length,
            requirementCount: safeArray(tender.requirements).length,
            requirements: safeArray(tender.requirements),
            extractionStatus: tender.extractionStatus || "UNKNOWN",
            extractionMethod: tender.extractionMethod || "unknown",
            tenderTitle: tender.tenderTitle || "",
            tenderSummary: tender.tenderSummary || "",
            issuingAuthority: tender.issuingAuthority || "",
            uploadedBy: tender.uploadedBy || null,
            uploadedAt: tender.uploadedAt,
          }));

        return res.json({
          success: true,
          count: tenders.length,
          tenders,
          files: tenders,
        });
      }
    );

    app.get(
      "/api/tenders/:id",
      (
        req,
        res
      ) => {
        const tender =
          tenderStore.get(
            req.params.id
          );

        if (!tender) {
          return res
            .status(
              404
            )
            .json({
              success:
                false,

              message:
                "Tender not found.",
            });
        }

        const safeTender =
          {
            ...tender,
          };

        delete safeTender.text;

        res.json({
          success:
            true,

          tender:
            safeTender,

          selectedTender:
            safeTender,

          tenderId:
            safeTender.id,
        });
      }
    );

    /* ============================================================
       REQUIREMENT EXTRACTION
       ============================================================ */

    app.post(
      "/api/extract-requirements",
      async (
        req,
        res
      ) => {
        try {
          const body = req.body || {};

          const tenderId =
            body.tenderId ||
            body.selectedTenderId ||
            body.tender?.id ||
            body.selectedTender?.id ||
            body.id ||
            null;

          const tenderName =
            body.tenderName ||
            body.filename ||
            body.name ||
            body.tender?.filename ||
            body.tender?.name ||
            body.selectedTender?.filename ||
            body.selectedTender?.name ||
            "";

          const text =
            body.text ||
            body.tender?.text ||
            body.selectedTender?.text ||
            "";

          let tender =
            tenderId
              ? tenderStore.get(
                  tenderId
                )
              : null;

          if (
            !tender &&
            tenderName
          ) {
            tender =
              [
                ...tenderStore.values(),
              ].find(
                (item) =>
                  item.name ===
                    tenderName ||
                  item.filename ===
                    tenderName
              ) ||
              null;
          }

          const tenderText =
            tender?.text ||
            text ||
            "";

          if (
            tenderText.length <
            20
          ) {
            return res
              .status(
                400
              )
              .json({
                success:
                  false,

                message:
                  "Tender text not found or too short.",
              });
          }

          // Accuracy pass: local extraction and AI extraction run concurrently.
          // The API waits only for this explicit extraction request, never for the
          // initial upload request. This gives fast upload + high-quality extraction.
          const localRequirements = extractRequirementsLocally(tenderText);
          const aiResult = await runAIRequirementExtraction(
            tenderText,
            tender?.filename || tenderName || "Tender Document",
            true
          );
          const aiRequirements = sanitizeTenderRequirements(aiResult?.requirements || []);
          const previousRequirements = safeArray(tender?.requirements);

          // Do NOT concatenate AI + local lists. That was the source of duplicate
          // and malformed requirements such as REQ-03/REQ-04 copies. AI is the
          // primary extractor when it returns grounded requirements; deterministic
          // extraction is a fallback only.
          const requirements = dedupeRequirements(
            aiRequirements.length
              ? aiRequirements
              : (localRequirements.length ? localRequirements : previousRequirements)
          );

          const result = {
            tenderId:
              tender?.id ||
              null,

            tenderSummary:
              aiResult
                ?.tenderSummary ||
              "",

            tenderTitle:
              aiResult
                ?.tenderTitle ||
              tender?.name ||
              tenderName ||
              "",

            issuingAuthority:
              aiResult
                ?.issuingAuthority ||
              "",

            requirements,

            extractionMethod:
              aiRequirements.length
                ? "AI-primary + strict validation"
                : "deterministic fallback",
          };

          if (tender) {
            tender.requirements =
              requirements;

            tender.aiExtraction =
              result;

            tenderStore.set(
              tender.id,
              tender
            );
          }

          res.json({
            success:
              true,

            ...result,

            selectedTender: tender
              ? {
                  id: tender.id,
                  name: tender.name,
                  filename: tender.filename,
                  pages: tender.pages,
                  requirementCount: requirements.length,
                  requirements,
                  extractionStatus: tender.extractionStatus || "READY",
                }
              : null,
          });
        } catch (error) {
          console.error(
            "Requirement extraction error:",
            error
          );

          res
            .status(
              500
            )
            .json({
              success:
                false,

              message:
                error.message ||
                "Requirement extraction failed.",
            });
        }
      }
    );

    /* ============================================================
       LOCAL REQUIREMENT EXTRACTION
       ============================================================ */

    function extractExplicitTenderRows(tenderText) {
      const source = safeString(tenderText).replace(/\r/g, "").trim();
      if (!source) return [];

      const rows = [];
      const push = (id, raw) => {
        let text = normalizeWhitespace(raw)
          .replace(/^[-:*|]+/, "")
          .replace(/\s*\|\s*/g, " ")
          .trim();
        if (!text) return;

        // Remove obvious document-level/table metadata from the beginning.
        text = text
          .replace(/^(?:tender\s+requirements?\s+document|mandatory\s+technical\s+(?:&|and)\s+functional\s+specifications|key\s+requirements?)\s*[:\-]?\s*/i, "")
          .trim();

        if (text.length < 18 || text.length > 2200) return;
        if (isTenderDocumentArtifact(text)) return;

        rows.push({
          id: id || `REQ-${String(rows.length + 1).padStart(2, "0")}`,
          title: inferRequirementTitle(text),
          requirement: text,
          description: text,
          mandatory: detectMandatory(text),
        });
      };

      // PDF table extraction frequently produces rows such as:
      // REQ-01Company ExperienceMinimum 7 years...REQ-02Annual Turnover...
      // Split on the requirement identifier itself before any whitespace cleanup.
      const reqMatches = [...source.matchAll(/(?:^|\n|(?<=\s))(REQ[-_\s]?\d{1,3})(?=\s|[A-Za-z]|[:.)\-])/gi)];
      if (reqMatches.length >= 2) {
        for (let i = 0; i < reqMatches.length; i += 1) {
          const match = reqMatches[i];
          const id = match[1].replace(/[_\s]+/g, "-").toUpperCase();
          const contentStart = match.index + match[0].length;
          const contentEnd = i + 1 < reqMatches.length ? reqMatches[i + 1].index : source.length;
          push(id, source.slice(contentStart, contentEnd));
        }
      } else if (reqMatches.length === 1) {
        const match = reqMatches[0];
        push(
          match[1].replace(/[_\s]+/g, "-").toUpperCase(),
          source.slice(match.index + match[0].length)
        );
      }

      // Also handle compact Clause-01 / Requirement-01 table exports.
      if (!rows.length) {
        const clauseMatches = [...source.matchAll(/(?:^|\n|(?<=\s))((?:CLAUSE|REQUIREMENT)[-_\s]?\d{1,3})(?=\s|[A-Za-z]|[:.)\-])/gi)];
        if (clauseMatches.length >= 2) {
          for (let i = 0; i < clauseMatches.length; i += 1) {
            const match = clauseMatches[i];
            const id = match[1].replace(/[_\s]+/g, "-").toUpperCase();
            const contentStart = match.index + match[0].length;
            const contentEnd = i + 1 < clauseMatches.length ? clauseMatches[i + 1].index : source.length;
            push(id, source.slice(contentStart, contentEnd));
          }
        }
      }

      return rows;
    }

    function isTenderDocumentArtifact(text) {
      const value = normalizeWhitespace(text);
      if (!value) return true;
      const reqCount = (value.match(/\bREQ[-_\s]?\d{1,3}\b/gi) || []).length;
      return (
        /\b(?:tender\s+requirements?\s+document|issuing\s+authority|total\s+clauses?|key\s+requirements?|weightage|mandatory\s+technical\s+(?:&|and)\s+functional\s+specifications)\b/i.test(value) &&
        reqCount >= 2
      );
    }

    function extractRequirementsLocally(tenderText) {
      const source = safeString(tenderText).replace(/\r/g, "").trim();
      const requirements = [];
      if (!source) return requirements;

      const headingOnly = /^(?:section|chapter|part|annex(?:ure)?|schedule|contents?|table\s+of\s+contents?|eligibility(?:\s+criteria)?|technical(?:\s+(?:requirements?|specifications?))?|commercial(?:\s+(?:requirements?|conditions?))?|experience(?:\s+(?:requirements?|criteria))?|support(?:\s+(?:requirements?|sla))?|security(?:\s+(?:requirements?|controls?))?|qualification(?:\s+(?:criteria|requirements?))?|compliance(?:\s+(?:criteria|requirements?))?|scope\s+of\s+(?:work|services?)|terms\s+(?:and|&)\s+conditions?)\s*[:.\-]?$/i;
      const obligation = /\b(?:must|shall|required|mandatory|minimum|at\s+least|not\s+less\s+than|bidder\s+(?:must|shall)|vendor\s+(?:must|shall)|supplier\s+(?:must|shall)|contractor\s+(?:must|shall)|is\s+required\s+to)\b/i;
      const criterion = /\b(?:eligib(?:le|ility)|criterion|criteria|requirement|compliance|qualification|specification|experience|support|sla|certif(?:icate|ication)|turnover|revenue|gst|pan|msme|udyam|epfo|esic|oem|cloud|aws|azure|gcp|security|encryption|tls|aes|warranty|delivery|deployment|uptime|availability|license|registration|blacklist|debar|local\s+content|make\s+in\s+india|project|contract|years?|crore|lakh|days?|hours?|percent|%)\b/i;
      const threshold = /(?:\b\d+(?:\.\d+)?\s*(?:years?|yrs?|months?|crore|cr|lakh|lakhs?|%|percent|days?|hours?|hrs?|minutes?|mins?)\b|(?:₹|rs\.?|inr)\s*[\d,.]+|>=|<=)/i;

      const cleanCandidate = (raw) => normalizeWhitespace(raw)
        .replace(/^[-*•▪◦‣]+\s*/, "")
        .replace(/^\(?\d{1,3}\)?[.)\-:]\s*/, "")
        .replace(/^\b(?:REQ[-_\s]?\d{1,3}|CLAUSE[-_\s]?\d{1,3}|REQUIREMENT[-_\s]?\d{1,3})\b\s*/i, "")
        .replace(/^\|+|\|+$/g, "")
        .replace(/\s*\|\s*/g, " ")
        .trim();

      const add = (raw, mandatory = null) => {
        const text = cleanCandidate(raw);
        if (text.length < 20 || text.length > 1800) return;
        if (headingOnly.test(text) || isTenderDocumentArtifact(text)) return;
        if (!criterion.test(text) && !obligation.test(text)) return;
        if (!obligation.test(text) && !threshold.test(text)) return;

        const normalized = normalizeForCompare(text);
        const duplicate = requirements.some((r) => {
          const existing = normalizeForCompare(r.requirement);
          return existing === normalized || keywordOverlap(existing, normalized) >= 0.90;
        });
        if (duplicate) return;

        requirements.push({
          id: `REQ-${String(requirements.length + 1).padStart(2, "0")}`,
          title: inferRequirementTitle(text),
          requirement: text,
          description: text,
          mandatory: mandatory === null ? detectMandatory(text) : Boolean(mandatory),
        });
      };

      // 1) Explicit REQ/CLAUSE rows. This handles PDFs whose table rows have
      // collapsed into one physical text line.
      const explicitRows = extractExplicitTenderRows(source);
      for (const row of explicitRows) add(row.requirement, row.mandatory);

      // 2) Build an expanded line stream. pdf-parse often collapses visual rows;
      // split inline numbered rows and bullets before testing them.
      const rawLines = source.split(/\n+/).map((x) => normalizeWhitespace(x)).filter(Boolean);
      const lines = [];
      for (const rawLine of rawLines) {
        const parts = rawLine
          .split(/(?=(?:^|\s)\(?\d{1,3}\)?[.)\-:]\s+)/)
          .flatMap((part) => part.split(/(?=(?:^|\s)[-•▪◦‣]\s+)/))
          .map(normalizeWhitespace)
          .filter(Boolean);
        lines.push(...parts);
      }

      for (const line of lines) {
        if (line.length < 20 || line.length > 1800) continue;
        const numbered = line.match(/^\(?\d{1,3}\)?[.)\-:]\s*(.{20,1800})$/);
        const bullet = line.match(/^[-*•▪◦‣]\s+(.{20,1800})$/);
        if (numbered) add(numbered[1]);
        else if (bullet) add(bullet[1]);
        else if (obligation.test(line) && (criterion.test(line) || threshold.test(line))) add(line, true);
      }

      // 3) Inline REQ markers can be lost when a PDF table is copied as:
      // "REQ-01Title... REQ-02Title...". Re-run with tolerant boundaries.
      const reqMatches = [...source.matchAll(/\b(REQ[-_\s]?\d{1,3}|CLAUSE[-_\s]?\d{1,3}|REQUIREMENT[-_\s]?\d{1,3})\b/gi)];
      for (let i = 0; i < reqMatches.length; i++) {
        const m = reqMatches[i];
        const next = reqMatches[i + 1];
        const chunk = source.slice(m.index + m[0].length, next ? next.index : source.length);
        add(chunk);
      }

      // 4) Sentence-level fallback. It is intentionally conservative: a sentence
      // must contain procurement obligation language or a concrete threshold.
      const sentences = splitSentences(source);
      for (const sentence of sentences) {
        if (sentence.length >= 25 && sentence.length <= 1800 &&
            (obligation.test(sentence) || threshold.test(sentence)) &&
            criterion.test(sentence)) {
          add(sentence, detectMandatory(sentence));
        }
      }

      // 5) Last-resort compact table lines. Only use lines containing a concrete
      // criterion + threshold so headings and ordinary prose do not leak in.
      if (requirements.length < 2) {
        for (const line of lines) {
          if (line.length >= 25 && line.length <= 1400 && criterion.test(line) && threshold.test(line)) {
            add(line, detectMandatory(line));
          }
        }
      }

      return dedupeRequirements(requirements).map((item, index) => ({
        ...item,
        id: `REQ-${String(index + 1).padStart(2, "0")}`,
        requirementId: `REQ-${String(index + 1).padStart(2, "0")}`,
      }));
    }

    /* ============================================================
       BIDDER DOCUMENT UPLOAD
       ============================================================ */

    async function handleBidderDocumentsUpload(files, bidderName, tenderId) {
      const bidderId = createId("bidder");
      const documents = [];
      const errors = [];

      // PDF/DOCX extraction is CPU/I/O work. Extract uploaded bidder files in
      // parallel instead of waiting for document #1 before starting #2.
      const results = await Promise.all(
        safeArray(files).map(async (file) => {
          try {
            const content = await extractFileContent(file);
            return {
              ok: true,
              document: {
                id: createId("doc"),
                filename: file.originalname,
                type: content.type,
                pages: content.pages,
                text: content.text,
                sourceType: "bidder",
                uploadedAt: nowIso(),
              }
            };
          } catch (error) {
            return {
              ok: false,
              error: {
                filename: file.originalname,
                error: error.message,
              }
            };
          } finally {
            deleteFile(file.path);
          }
        })
      );

      results.forEach((result) => {
        if (result.ok) documents.push(result.document);
        else errors.push(result.error);
      });

      return { bidderId, bidderName, tenderId, documents, errors };
    }

    app.post(
      "/api/upload-bidder-documents",
      upload.array(
        "documents",
        100
      ),
      async (
        req,
        res
      ) => {
        const files =
          req.files ||
          [];

        if (
          !files.length
        ) {
          return res
            .status(
              400
            )
            .json({
              success:
                false,

              message:
                "No bidder documents uploaded.",
            });
        }

        const bidderId =
          createId(
            "bidder"
          );

        const bidderName =
          safeString(
            req.body?.bidderName
          ).trim() ||
          `Bidder ${
            bidderStore.size +
            1
          }`;

        const tenderId =
          safeString(
            req.body?.tenderId
          ).trim() ||
          null;

        const documents =
          [];

        const errors =
          [];

        const extraction = await handleBidderDocumentsUpload(
          files,
          bidderName,
          tenderId
        );

        const extractedDocuments = extraction.documents;
        const extractionErrors = extraction.errors;
        documents.push(...extractedDocuments);
        errors.push(...extractionErrors);

        if (
          !documents.length
        ) {
          return res
            .status(
              400
            )
            .json({
              success:
                false,

              message:
                "No bidder document could be read.",

              errors,
            });
        }

        bidderStore.set(
          bidderId,
          {
            id:
              bidderId,

            name:
              bidderName,

            tenderId,

            documents,

            createdAt:
              nowIso(),
          }
        );

        res.json({
          success:
            true,

          bidderId,

          bidderName,

          tenderId,

          bidder: {
            id: bidderId,
            name: bidderName,
            companyName: safeString(req.body?.companyName).trim(),
            contactName: safeString(req.body?.contactName).trim(),
            email: safeString(req.body?.email).trim(),
            phone: safeString(req.body?.phone).trim(),
            registrationNumber: safeString(req.body?.registrationNumber).trim()
          },

          documentCount:
            documents.length,

          documents:
            documents.map(
              (
                document
              ) => ({
                id:
                  document.id,

                filename:
                  document.filename,

                type:
                  document.type,

                pages:
                  document.pages,

                textLength:
                  document.text.length,
              })
            ),

          errors,
        });
      }
    );

    /* ============================================================
       BIDDER DETAILS
       ============================================================ */

    app.get(
      "/api/bidders/:id",
      (
        req,
        res
      ) => {
        const bidder =
          bidderStore.get(
            req.params.id
          );

        if (!bidder) {
          return res
            .status(
              404
            )
            .json({
              success:
                false,

              message:
                "Bidder not found.",
            });
        }

        res.json({
          success:
            true,

          bidder: {
            ...bidder,

            documents:
              bidder.documents.map(
                (
                  document
                ) => ({
                  ...document,

                  text:
                    undefined,
                })
              ),
          },
        });
      }
    );

    /* ============================================================
       COMPLIANCE ANALYSIS
       ============================================================ */

    app.post(
      "/api/analyze-compliance",
      async (
        req,
        res
      ) => {
        try {
          const {
            tenderId,
            bidderId,
          } =
            req.body ||
            {};

          if (
            !tenderId
          ) {
            return res
              .status(
                400
              )
              .json({
                success:
                  false,

                message:
                  "tenderId is required.",
              });
          }

          if (
            !bidderId
          ) {
            return res
              .status(
                400
              )
              .json({
                success:
                  false,

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
            return res
              .status(
                404
              )
              .json({
                success:
                  false,

                message:
                  "Tender not found.",
              });
          }

          if (!bidder) {
            return res
              .status(
                404
              )
              .json({
                success:
                  false,

                message:
                  "Bidder documents not found.",
              });
          }

          if (
            !safeArray(
              tender.requirements
            ).length
          ) {
            return res
              .status(
                400
              )
              .json({
                success:
                  false,

                message:
                  "Tender requirements have not been extracted yet.",
              });
          }

          if (
            !safeArray(
              bidder.documents
            ).length
          ) {
            return res
              .status(
                400
              )
              .json({
                success:
                  false,

                message:
                  "No bidder documents available for analysis.",
              });
          }

          console.log(
      ">>> STARTING analyzeCompliance",
      {
        tenderId,
        bidderId,
      }
    );

    let result;

    try {
      result =
        await analyzeCompliance(
          tender,
          bidder
        );

      console.log(
        ">>> analyzeCompliance SUCCESS"
      );
    } catch (error) {
      console.error(
        ">>> analyzeCompliance DIRECT ERROR"
      );

      console.error(
        "MESSAGE:",
        error?.message
      );

      console.error(
        "NAME:",
        error?.name
      );

      console.error(
        "STACK:",
        error?.stack
      );

      throw error;
    }

          const analysisId =
            createId(
              "analysis"
            );

          const analysis = {
            id:
              analysisId,

            tenderId,

            bidderId,

            tenderName:
              tender.name,

            bidderName:
              bidder.name,

            createdAt:
              nowIso(),

            result,
          };

          analysisStore.set(
            analysisId,
            analysis
          );

          res.json({
            success:
              true,

            analysisId,

            engineVersion:
              "BIDIFI-AUTHORITATIVE-2026-09-15-R15-FAST-UPLOAD-UNIVERSAL-EXTRACTION-EVIDENCE",

            ...result,
          });
            } catch (error) {
          console.error(
            "================ COMPLIANCE ERROR ================"
          );

          console.error(
            "ERROR MESSAGE:",
            error?.message
          );

          console.error(
            "ERROR NAME:",
            error?.name
          );

          console.error(
            "ERROR STACK:",
            error?.stack
          );

          console.error(
            "==================================================="
          );

          res
            .status(
              500
            )
            .json({
              success:
                false,

              message:
                error?.message ||
                "Compliance analysis failed.",
            });
        }
      }
    );

    /* ============================================================
       ANALYSIS DETAILS
       ============================================================ */

    app.get(
      "/api/analysis/:id",
      (
        req,
        res
      ) => {
        const analysis =
          analysisStore.get(
            req.params.id
          );

        if (!analysis) {
          return res
            .status(
              404
            )
            .json({
              success:
                false,

              message:
                "Analysis not found.",
            });
        }

        res.json({
          success:
            true,

          analysis,
        });
      }
    );
    /* ============================================================
       RECOMMENDATION FEEDBACK - PERMANENT STORAGE
       ============================================================ */

    const RECOMMENDATION_FEEDBACK_FILE =
      path.join(
        DATA_DIR,
        "recommendation_feedback.json"
      );


    function ensureRecommendationFeedbackStorage() {
      try {
        if (
          !fs.existsSync(
            RECOMMENDATION_FEEDBACK_FILE
          )
        ) {
          fs.writeFileSync(
            RECOMMENDATION_FEEDBACK_FILE,
            "[]",
            "utf8"
          );
        }
      } catch (error) {
        console.error(
          "[BIDIFI FEEDBACK] Storage initialization failed:",
          error?.message ||
            error
        );
      }
    }


    function readRecommendationFeedback() {
      ensureRecommendationFeedbackStorage();

      try {
        const raw =
          fs.readFileSync(
            RECOMMENDATION_FEEDBACK_FILE,
            "utf8"
          );

        if (
          !raw ||
          !raw.trim()
        ) {
          return [];
        }

        const parsed =
          JSON.parse(
            raw
          );

        return Array.isArray(
          parsed
        )
          ? parsed
          : [];
      } catch (error) {
        console.error(
          "[BIDIFI FEEDBACK] Read failed:",
          error?.message ||
            error
        );

        return [];
      }
    }


    function writeRecommendationFeedback(
      feedback
    ) {
      ensureRecommendationFeedbackStorage();

      fs.writeFileSync(
        RECOMMENDATION_FEEDBACK_FILE,
        JSON.stringify(
          Array.isArray(
            feedback
          )
            ? feedback
            : [],
          null,
          2
        ),
        "utf8"
      );
    }


    function createRecommendationFeedbackRecord(
      payload
    ) {
      return {
        id:
          createId(
            "feedback"
          ),

        analysisId:
          safeString(
            payload?.analysisId
          ).trim() ||
          null,

        tenderId:
          safeString(
            payload?.tenderId
          ).trim() ||
          null,

        bidderId:
          safeString(
            payload?.bidderId
          ).trim() ||
          null,

        recommendationIndex:
          Number.isFinite(
            Number(
              payload?.recommendationIndex
            )
          )
            ? Number(
                payload.recommendationIndex
              )
            : null,

        requirementId:
          safeString(
            payload?.requirementId
          ).trim() ||
          null,

        title:
          safeString(
            payload?.title
          ).trim() ||
          "Recommendation",

        originalRecommendation:
          safeString(
            payload?.originalRecommendation
          ).trim(),

        submittedText:
          safeString(
            payload?.submittedText
          ).trim(),

        submittedAt:
          nowIso(),
      };
    }


    function saveRecommendationFeedbackRecord(
      payload
    ) {
      const feedback =
        readRecommendationFeedback();

      const record =
        createRecommendationFeedbackRecord(
          payload
        );

      feedback.push(
        record
      );

      writeRecommendationFeedback(
        feedback
      );

      return record;
    }


    function saveRecommendationFeedbackBatch(
      payload
    ) {
      const recommendations =
        safeArray(
          payload?.recommendations
        );

      const saved =
        [];

      for (
        let index = 0;
        index <
        recommendations.length;
        index += 1
      ) {
        const recommendation =
          recommendations[
            index
          ];

        const submittedText =
          safeString(
            recommendation?.submittedText
          ).trim();

        if (
          !submittedText
        ) {
          continue;
        }

        const record =
          saveRecommendationFeedbackRecord(
            {
              analysisId:
                payload?.analysisId,

              tenderId:
                payload?.tenderId,

              bidderId:
                payload?.bidderId,

              recommendationIndex:
                Number.isFinite(
                  Number(
                    recommendation?.index
                  )
                )
                  ? Number(
                      recommendation.index
                    )
                  : index,

              requirementId:
                recommendation?.requirementId,

              title:
                recommendation?.title,

              originalRecommendation:
                recommendation?.originalRecommendation,

              submittedText,
            }
          );

        saved.push(
          record
        );
      }

      return saved;
    }


    /* ============================================================
       SAVE RECOMMENDATION FEEDBACK
       ============================================================ */

    app.post(
      "/api/recommendation-feedback",
      (
        req,
        res
      ) => {
        try {
          const body =
            req.body ||
            {};

          const recommendations =
            safeArray(
              body.recommendations
            );

          if (
            !recommendations.length
          ) {
            return res
              .status(
                400
              )
              .json({
                success:
                  false,

                message:
                  "No recommendation feedback was submitted.",
              });
          }

          const saved =
            saveRecommendationFeedbackBatch(
              body
            );

          if (
            !saved.length
          ) {
            return res
              .status(
                400
              )
              .json({
                success:
                  false,

                message:
                  "No non-empty recommendation feedback was submitted.",
              });
          }

          console.log(
            `[BIDIFI FEEDBACK] ${saved.length} recommendation(s) saved.`
          );

          return res.json({
            success:
              true,

            message:
              "Recommendation feedback saved successfully.",

            savedCount:
              saved.length,

            feedback:
              saved,
          });
        } catch (error) {
          console.error(
            "[BIDIFI FEEDBACK] Save error:",
            error
          );

          return res
            .status(
              500
            )
            .json({
              success:
                false,

              message:
                error?.message ||
                "Failed to save recommendation feedback.",
            });
        }
      }
    );


    /* ============================================================
       GET ALL RECOMMENDATION FEEDBACK
       ============================================================ */

    app.get(
      "/api/recommendation-feedback",
      (
        req,
        res
      ) => {
        try {
          let feedback =
            readRecommendationFeedback();

          const analysisId =
            safeString(
              req.query?.analysisId
            ).trim();

          if (
            analysisId
          ) {
            feedback =
              feedback.filter(
                (
                  item
                ) =>
                  safeString(
                    item?.analysisId
                  ) ===
                  analysisId
              );
          }

          return res.json({
            success:
              true,

            count:
              feedback.length,

            feedback,
          });
        } catch (error) {
          console.error(
            "[BIDIFI FEEDBACK] Retrieval error:",
            error
          );

          return res
            .status(
              500
            )
            .json({
              success:
                false,

              message:
                error?.message ||
                "Failed to retrieve recommendation feedback.",
            });
        }
      }
    );


    /* ============================================================
       GET FEEDBACK FOR ONE ANALYSIS
       ============================================================ */

    app.get(
      "/api/recommendation-feedback/:analysisId",
      (
        req,
        res
      ) => {
        try {
          const analysisId =
            safeString(
              req.params?.analysisId
            ).trim();

          if (
            !analysisId
          ) {
            return res
              .status(
                400
              )
              .json({
                success:
                  false,

                message:
                  "analysisId is required.",
              });
          }

          const allFeedback =
            readRecommendationFeedback();

          const feedback =
            allFeedback.filter(
              (
                item
              ) =>
                safeString(
                  item?.analysisId
                ) ===
                analysisId
            );

          return res.json({
            success:
              true,

            analysisId,

            count:
              feedback.length,

            feedback,
          });
        } catch (error) {
          console.error(
            "[BIDIFI FEEDBACK] Analysis feedback retrieval error:",
            error
          );

          return res
            .status(
              500
            )
            .json({
              success:
                false,

              message:
                error?.message ||
                "Failed to retrieve analysis feedback.",
            });
        }
      }
    );


    /* ============================================================
       FEEDBACK STORAGE STATUS
       ============================================================ */

    app.get(
      "/api/recommendation-feedback/status",
      (
        req,
        res
      ) => {
        try {
          const feedback =
            readRecommendationFeedback();

          return res.json({
            success:
              true,

            storage:
              "file",

            file:
              "src/backend/data/recommendation_feedback.json",

            count:
              feedback.length,

            persistent:
              true,
          });
        } catch (error) {
          return res
            .status(
              500
            )
            .json({
              success:
                false,

              message:
                error?.message ||
                "Feedback storage status unavailable.",
            });
        }
      }
    );


    /* ============================================================
       INITIALIZE FEEDBACK FILE
       ============================================================ */

    ensureRecommendationFeedbackStorage();


    /* ============================================================
       REPORT CREATION
       ============================================================ */
    /* ============================================================
       REPORT CREATION
       ============================================================ */

    app.post(
      "/api/reports",
      async (
        req,
        res
      ) => {
        try {
          const {
            analysis,
            tender,
            requirements,
          } =
            req.body ||
            {};

          const data =
            buildReportData(
              analysis,
              tender,
              requirements
            );

          const id =
            createId(
              "report"
            );

          const outputPath =
            path.join(
              REPORT_DIR,
              `${id}.pdf`
            );

          await generatePDFReport(
            data,
            outputPath
          );

          reportStore.set(
            id,
            {
              id,

              path:
                outputPath,

              createdAt:
                nowIso(),

              data,
            }
          );

          res.download(
            outputPath,
            `BIDIFI-Compliance-Report-${id}.pdf`
          );
        } catch (error) {
          console.error(
            "Report generation error:",
            error
          );

          res
            .status(
              500
            )
            .json({
              success:
                false,

              message:
                error.message ||
                "Report generation failed.",
            });
        }
      }
    );

    /* ============================================================
       REPORT BY ANALYSIS ID
       ============================================================ */

    app.get(
      "/api/reports/:id",
      async (
        req,
        res
      ) => {
        try {
          const analysis =
            analysisStore.get(
              req.params.id
            );

          if (!analysis) {
            return res
              .status(
                404
              )
              .json({
                success:
                  false,

                message:
                  "Analysis/report not found.",
              });
          }

          const tender =
            tenderStore.get(
              analysis.tenderId
            );

          const data =
            buildReportData(
              analysis,
              tender,
              tender?.requirements
            );

          const reportId =
            createId(
              "report"
            );

          const outputPath =
            path.join(
              REPORT_DIR,
              `${reportId}.pdf`
            );

          await generatePDFReport(
            data,
            outputPath
          );

          reportStore.set(
            reportId,
            {
              id:
                reportId,

              path:
                outputPath,

              createdAt:
                nowIso(),

              data,

              analysisId:
                analysis.id,
            }
          );

          res.download(
            outputPath,
            `BIDIFI-Compliance-Report-${reportId}.pdf`
          );
        } catch (error) {
          res
            .status(
              500
            )
            .json({
              success:
                false,

              message:
                error.message ||
                "Report generation failed.",
            });
        }
      }
    );

    /* ============================================================
       GET REQUIREMENTS - METHOD PROTECTION
       ============================================================ */

    app.get(
      "/api/extract-requirements",
      (
        req,
        res
      ) => {
        res
          .status(
            405
          )
          .json({
            success:
              false,

            message:
              "This endpoint requires POST.",
          });
      }
    );

    /* ============================================================
       GLOBAL ERROR HANDLER
       ============================================================ */

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

        if (
          res.headersSent
        ) {
          return next(
            error
          );
        }

        res
          .status(
            500
          )
          .json({
            success:
              false,

            message:
              error?.message ||
              "Server error.",
          });
      }
    );

    /* ============================================================
       MULTER / UPLOAD ERROR NORMALIZER
       ============================================================ */
    app.use((error, req, res, next) => {
      if (!error) return next();

      if (error.name === "MulterError") {
        console.error("[BIDIFI UPLOAD ERROR]", error);

        if (res.headersSent) return next(error);

        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`,
          code: error.code || "MULTER_ERROR",
        });
      }

      if (error.message && error.message.startsWith("Unsupported file type")) {
        console.error("[BIDIFI FILE TYPE ERROR]", error.message);

        if (res.headersSent) return next(error);

        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return next(error);
    });

    /* ============================================================
       404
       ============================================================ */

    app.use(
      (
        req,
        res
      ) => {
        res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              `Route not found: ${req.method} ${req.originalUrl}`,
          });
      }
    );

    /* ============================================================
       START SERVER
       ============================================================ */

    /* ============================================================
       RECOMMENDATION FEEDBACK TEST
       ============================================================ */

    app.post(
      "/api/recommendation-feedback-test",
      (req, res) => {
        console.log(
          "[BIDIFI TEST] Recommendation feedback route reached."
        );

        return res.json({
          success: true,
          message:
            "Recommendation feedback route is working.",
        });
      }
    );

    process.on("uncaughtException", (error) => {
      console.error("[BIDIFI FATAL] uncaughtException:", error);
    });

    process.on("unhandledRejection", (reason) => {
      console.error("[BIDIFI FATAL] unhandledRejection:", reason);
    });

    console.log(
      `[DEBUG SERVER] About to start app.listen on 0.0.0.0:${PORT}`
    );

    if (require.main === module) {
      const server = app.listen(
        PORT,
        "0.0.0.0",
        () => {
          console.log(
            "[DEBUG SERVER] LISTEN CALLBACK FIRED"
          );

          console.log(
            "============================================================"
          );

          console.log(
            "BIDIFI AI BID COMPLIANCE ENGINE"
          );

          console.log(
            `Backend running on http://localhost:${PORT}`
          );

          console.log(
            `AI: ${
              apiKey && openai
                ? `enabled (${OPENAI_MODEL})`
                : "not configured — deterministic engine active"
            }`
          );

          console.log(
            "Evidence mode: STRICT BIDDER-DOCUMENT ONLY"
          );

          console.log(
            "Requirement matching: REQUIREMENT-SPECIFIC"
          );

          console.log(
            "Partial evidence: REVIEW / NON_COMPLIANT"
          );

          console.log(
            "Tender echo protection: ENABLED"
          );

          console.log(
            "============================================================"
          );
        }
      );
    }

    module.exports = app;
