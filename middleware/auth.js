import { createRemoteJWKSet, jwtVerify } from "jose";
import { users } from "../db.js";
let JWKS;
const getJWKS = () => JWKS ??= createRemoteJWKSet(new URL(`${process.env.AUTH_URL}/api/auth/jwks`));
export async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({
    message: "Unauthorized: token missing"
  });
  try {
    const {
      payload
    } = await jwtVerify(token, getJWKS(), {
      issuer: process.env.AUTH_URL
    });
    const dbUser = await users().findOne({
      email: payload.email
    });
    if (!dbUser) return res.status(401).json({
      message: "Unauthorized: user not found"
    });
    req.user = {
      id: String(dbUser._id),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      plan: dbUser.plan || "free"
    };
    next();
  } catch (err) {
    console.error("JWT error:", err.code || err.message);
    res.status(401).json({
      message: "Unauthorized: invalid or expired token"
    });
  }
}
const requireRole = role => (req, res, next) => {
  if (req.user?.role === role) return next();
  res.status(403).json({
    message: `Forbidden: ${role}s only`
  });
};
export const verifyStudent = requireRole("student");
export const verifyTutor = requireRole("tutor");
export const verifyAdmin = requireRole("admin");
