module.exports = function handler(req, res) {
  try {
    const app = require("../src/backend/server.js");

    return app(req, res);
  } catch (error) {
    console.error("[BIDIFI SERVER LOAD ERROR]");
    console.error(error);
    console.error(error?.stack);

    return res.status(500).json({
      success: false,
      diagnostic: "SERVER_LOAD_FAILED",
      error: error?.message || String(error),
      name: error?.name || "UnknownError",
      stack: error?.stack || null
    });
  }
};
