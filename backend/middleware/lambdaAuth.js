export function lambdaAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";

  // Expects:  Authorization: Bearer <LAMBDA_SECRET>
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token || token !== process.env.LAMBDA_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
