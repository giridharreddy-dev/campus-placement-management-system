import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET?.trim();

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export { JWT_SECRET };

/**
 * Middleware to authenticate requests using JWT tokens.
 * Supports HttpOnly session cookie (token) or Authorization header (Bearer <token>).
 */
export function authenticateToken(req, res, next) {
  let token = null;

  // 1. Check HttpOnly cookie first (primary browser mechanism)
  if (req.cookies && req.cookies.cpms_angular_token) {
    token = req.cookies.cpms_angular_token;
  }

  // 2. Check Authorization header (API / automated test mechanism)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Malformed authorization header. Expected format: Bearer <token>'
      });
    }
    const extracted = authHeader.slice(7).trim();
    if (!extracted) {
      return res.status(401).json({
        error: 'Malformed authorization header. Bearer token cannot be empty.'
      });
    }
    token = extracted;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired authentication token.'
    });
  }
}

/**
 * Role-based access control middleware factory.
 * Enforces that req.user.role is among allowedRoles.
 */
export function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
    }
    next();
  };
}
