module.exports = function handler(req, res) {
  res.status(200).json({
    success: true,
    backend: "api-index-online",
    test: "BIDIFI"
  });
};