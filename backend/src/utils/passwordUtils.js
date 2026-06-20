const bcrypt = require("bcryptjs");

// ─────────────────────────────────────────────────────
//  passwordUtils.js
//  Handles all password related operations.
//
//  Why do we hash passwords?
//  We NEVER store plain passwords in the database.
//  If someone hacks our DB, they only see hashed values
//  like: "$2a$12$KIx..." — completely useless to them.
//
//  bcrypt works like this:
//  "mypassword123" → hashing → "$2a$12$KIx9Zq..."
//  You cannot reverse it back to "mypassword123"
//  The only way to check is to hash again and compare
// ─────────────────────────────────────────────────────

// ───────────────────────────────────────────────────
//  hashPassword()
//  Converts plain text password into a secure hash
//
//  @param {string} password - plain text password
//  @returns {string}        - hashed password
//
//  The number 12 is the "salt rounds"
//  Higher = more secure but slower
//  12 is the industry standard for production
// ───────────────────────────────────────────────────
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

// ───────────────────────────────────────────────────
//  comparePassword()
//  Compares plain text password with stored hash
//  Returns true if they match, false if they don't
//
//  @param {string} enteredPassword - what user typed
//  @param {string} storedPassword  - hash from database
//  @returns {boolean}
//
//  Example:
//  comparePassword("mypassword123", "$2a$12$KIx9...")
//  → true  (correct password)
//  → false (wrong password)
// ───────────────────────────────────────────────────
const comparePassword = async (enteredPassword, storedPassword) => {
  const isMatch = await bcrypt.compare(enteredPassword, storedPassword);
  return isMatch;
};

// ───────────────────────────────────────────────────
//  generateResetToken()
//  Creates a random token for forgot password flow
//  We send this token to user's email
//  They use it to reset their password
//
//  @returns {object} - { resetToken, hashedToken, expiry }
//  We store hashedToken in DB — never plain resetToken
//  We send plain resetToken to email
// ───────────────────────────────────────────────────
const generateResetToken = () => {
  const crypto = require("crypto");

  // Generate random 32 byte token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash it before storing in DB
  // Same reason as passwords — never store plain tokens
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Token expires in 10 minutes
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  return {
    resetToken,   // send this to user's email
    hashedToken,  // store this in database
    expiry,       // store this in database
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateResetToken,
};