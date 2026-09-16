export default function handler(req, res) {
  res.status(200).json({
    success: true,
    backend: "vercel-function-online",
    test: "BIDIFI"
  });
}
