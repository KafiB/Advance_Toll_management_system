const jwt = require("jsonwebtoken");

// ─────────────────────────────────────────────────────
//  generateToken.js
//  Creates a JWT (JSON Web Token) for a logged-in user.
//
//  What is a JWT?
//  Think of it like a STAMPED TICKET at an airport.
//  When you check in, the airport gives you a boarding
//  pass (token). Every time you go through a gate, you
//  show that pass — they don't ask for your passport
//  again. Same idea here.
//
//  When a user logs in → we give them a token
//  Every protected request → they send that token
//  We verify it → let them in or reject them
// ─────────────────────────────────────────────────────

// ───────────────────────────────────────────────────
//  generateToken()
//
//  @param {string} id   - The user's MongoDB _id
//  @param {string} role - The user's role (admin/user)
//  @returns {string}    - A signed JWT string
//
//  Example output:
//  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI..."
// ───────────────────────────────────────────────────
const generateToken = (id, role) => {
  // jwt.sign() creates the token
  // It takes 3 things:
  //   1. PAYLOAD  — data we want to store inside the token
  //   2. SECRET   — our private key to sign/lock the token
  //   3. OPTIONS  — extra settings like expiry time
  const token = jwt.sign(
    // 1. PAYLOAD
    // This data is encoded inside the token.
    // Anyone can decode it — so never put passwords here.
    // We only store id and role — just enough to
    // identify who the user is and what they can do.
    {
      id,    // MongoDB user _id
      role,  // "admin", "operator", or "user"
    },

    // 2. SECRET KEY
    // This is our private signature from .env
    // If someone tries to fake a token without this
    // secret, verification will fail and we reject them
    process.env.JWT_SECRET,

    // 3. OPTIONS
    {
      // Token expires after 7 days (from .env)
      // After expiry, user must log in again
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );

  return token;
};

module.exports = generateToken;