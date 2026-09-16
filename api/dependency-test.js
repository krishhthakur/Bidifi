module.exports = function handler(req, res) {
  const results = {};

  const modules = [
    "express",
    "cors",
    "multer",
    "pdf-parse",
    "mammoth",
    "openai",
    "pdfkit",
    "dotenv"
  ];

  for (const name of modules) {
    try {
      require(name);
      results[name] = "OK";
    } catch (error) {
      results[name] = {
        error: error?.message || String(error),
        name: error?.name || "UnknownError"
      };
    }
  }

  res.status(200).json({
    success: true,
    node: process.version,
    modules: results
  });
};
