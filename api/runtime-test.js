module.exports = function handler(req, res) {
  res.status(200).json({
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
    type: typeof require
  });
};
