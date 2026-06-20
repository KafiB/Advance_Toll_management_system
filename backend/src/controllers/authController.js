const crypto = require("crypto");
const User = require("../models/user.model");
const ApiResponse = require("../utils/apiResponse");
const generateToken = require("../utils/generateToken");
const { hashPassword, comparePassword, generateResetToken } = require("../utils/passwordUtils");
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require("../services/emailService");

// ─────────────────────────────────────────────────────
//  CONSTANTS
//  Never use magic numbers directly in code
//  Give them names so code reads like English
// ─────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;        // lock after 5 failed tries
const LOCK_TIME = 30 * 60 * 1000;   // locked for 30 minutes

// ─────────────────────────────────────────────────────
//  @desc    Register a new user
//  @route   POST /api/v1/auth/register
//  @access  Public
// ─────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // ── Step 1: Validate required fields ──────────────
    if (!name || !email || !phone || !password) {
      return ApiResponse.error(res, "Please provide name, email, phone and password", 400);
    }

    // ── Step 2: Check if user already exists ──────────
    // We check both email and phone — both must be unique
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? "Email" : "Phone number";
      return ApiResponse.error(res, `${field} is already registered`, 400);
    }

    // ── Step 3: Hash password ─────────────────────────
    const hashedPassword = await hashPassword(password);

    // ── Step 4: Generate email verification token ─────
    const { resetToken: verifyToken, hashedToken: hashedVerifyToken, expiry } =
      generateResetToken();

    // ── Step 5: Create user in database ───────────────
    // Never allow role "admin" to be set from registration
    // Admin accounts are created only by existing admins
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role === "operator" ? "operator" : "user",
      emailVerificationToken: hashedVerifyToken,
      emailVerificationExpire: expiry,
    });

    // ── Step 6: Send verification email ───────────────
    // We do not block registration if email fails
    // Just log it and continue — user can request again
    try {
      await sendVerificationEmail(user.email, user.name, verifyToken);
    } catch (emailError) {
      console.error("Verification email failed:", emailError.message);
    }

    // ── Step 7: Generate JWT token ────────────────────
    const token = generateToken(user._id, user.role);

    // ── Step 8: Return response ───────────────────────
    // Never return password — even hashed version
    return ApiResponse.success(
      res,
      "Registration successful. Please verify your email.",
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Login user
//  @route   POST /api/v1/auth/login
//  @access  Public
// ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Step 1: Validate input ────────────────────────
    if (!email || !password) {
      return ApiResponse.error(res, "Please provide email and password", 400);
    }

    // ── Step 2: Find user and include password ────────
    // We use +password because select:false hides it by default
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +loginAttempts +lockUntil"
    );

    // ── Step 3: Check if user exists ──────────────────
    // We give the SAME error for wrong email and wrong password
    // This is a security best practice — never reveal
    // which one was wrong. Google does the same thing.
    if (!user) {
      return ApiResponse.error(res, "Invalid email or password", 401);
    }

    // ── Step 4: Check if account is locked ────────────
    // Google locks accounts after multiple failed attempts
    // We do the same thing here
    if (user.isLocked) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return ApiResponse.error(
        res,
        `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
        423
      );
    }

    // ── Step 5: Check if account is active ────────────
    if (!user.isActive) {
      return ApiResponse.error(
        res,
        "Your account has been deactivated. Please contact support.",
        403
      );
    }

    // ── Step 6: Compare password ──────────────────────
    const isPasswordCorrect = await comparePassword(password, user.password);

    if (!isPasswordCorrect) {
      // Increment failed login attempts
      user.loginAttempts += 1;

      // Lock account if max attempts reached
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
        await user.save();
        return ApiResponse.error(
          res,
          "Account locked due to too many failed attempts. Try again in 30 minutes.",
          423
        );
      }

      await user.save();

      const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      return ApiResponse.error(
        res,
        `Invalid email or password. ${attemptsLeft} attempt(s) remaining.`,
        401
      );
    }

    // ── Step 7: Reset login attempts on success ────────
    // Account is unlocked and attempts reset to 0
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // ── Step 8: Generate token and respond ────────────
    const token = generateToken(user._id, user.role);

// Store token in HTTP-only cookie
// HTTP-only means JavaScript cannot access it
// This protects against XSS attacks
// Same technique used by Google and Facebook
res.cookie("token", token, {
  httpOnly: true,                                    // JS cannot access
  secure: process.env.NODE_ENV === "production",     // HTTPS only in production
  sameSite: "strict",                                // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,                 // 7 days in milliseconds
});

return ApiResponse.success(res, "Login successful", {
  token,
  user: {
    id:              user._id,
    name:            user.name,
    email:           user.email,
    phone:           user.phone,
    role:            user.role,
    isEmailVerified: user.isEmailVerified,
    lastLogin:       user.lastLogin,
  },
});
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get current logged in user
//  @route   GET /api/v1/auth/me
//  @access  Protected
// ─────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is already set by protect middleware
    // We just fetch fresh data from DB
    const user = await User.findById(req.user._id);

    return ApiResponse.success(res, "User profile fetched", user);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Update user profile
//  @route   PUT /api/v1/auth/update-profile
//  @access  Protected
// ─────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    // ── Only allow safe fields to be updated ──────────
    // Never allow role, password, email to be changed here
    // Each sensitive field has its own dedicated route
    const allowedFields = ["name", "phone", "address", "avatar"];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return ApiResponse.error(res, "No valid fields provided to update", 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      {
        new: true,           // return updated document
        runValidators: true, // run schema validations on update
      }
    );

    return ApiResponse.success(res, "Profile updated successfully", user);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Change password
//  @route   PUT /api/v1/auth/change-password
//  @access  Protected
// ─────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ApiResponse.error(res, "Please provide current and new password", 400);
    }

    if (newPassword.length < 8) {
      return ApiResponse.error(res, "New password must be at least 8 characters", 400);
    }

    // Fetch user with password explicitly
    const user = await User.findById(req.user._id).select("+password");

    // Verify current password is correct
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return ApiResponse.error(res, "Current password is incorrect", 400);
    }

    // Prevent using same password again
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      return ApiResponse.error(res, "New password cannot be the same as current password", 400);
    }

    // Hash and save new password
    user.password = await hashPassword(newPassword);
    await user.save();

    // Generate new token — old token is now invalid
    const token = generateToken(user._id, user.role);

    return ApiResponse.success(res, "Password changed successfully", { token });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Forgot password — send reset email
//  @route   POST /api/v1/auth/forgot-password
//  @access  Public
// ─────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return ApiResponse.error(res, "Please provide your email address", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success even if email not found
    // This prevents email enumeration attacks
    // Attacker cannot know which emails are registered
    if (!user) {
      return ApiResponse.success(
        res,
        "If an account exists with this email, a reset link has been sent."
      );
    }

    // Generate reset token
    const { resetToken, hashedToken, expiry } = generateResetToken();

    // Save hashed token to database
    user.passwordResetToken = hashedToken;
    user.passwordResetExpire = expiry;
    await user.save();

    // Send plain token to email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailError) {
      // If email fails, clear the token from DB
      user.passwordResetToken = undefined;
      user.passwordResetExpire = undefined;
      await user.save();
      return ApiResponse.error(res, "Email could not be sent. Please try again.", 500);
    }

    return ApiResponse.success(
      res,
      "If an account exists with this email, a reset link has been sent."
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Reset password using token from email
//  @route   PUT /api/v1/auth/reset-password/:token
//  @access  Public
// ─────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return ApiResponse.error(res, "Please provide a new password", 400);
    }

    if (newPassword.length < 8) {
      return ApiResponse.error(res, "Password must be at least 8 characters", 400);
    }

    // Hash the token from URL to compare with DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching token that has not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return ApiResponse.error(res, "Reset token is invalid or has expired", 400);
    }

    // Prevent using same password again
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      return ApiResponse.error(res, "New password cannot be the same as old password", 400);
    }

    // Set new password and clear reset token fields
    user.password = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Generate fresh token — user is now logged in
    const newToken = generateToken(user._id, user.role);

    return ApiResponse.success(res, "Password reset successful", { token: newToken });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Verify email address
//  @route   GET /api/v1/auth/verify-email/:token
//  @access  Public
// ─────────────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Hash the token from URL to compare with DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching token that has not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpire");

    if (!user) {
      return ApiResponse.error(res, "Verification link is invalid or has expired", 400);
    }

    // Mark email as verified and clear token fields
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();


    try {
        await sendWelcomeEmail(user.email, user.name);
        } catch (err) {
          console.error("Welcome email failed:", err.message);
                        }       
    return ApiResponse.success(res, "Email verified successfully");
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Logout user
//  @route   POST /api/v1/auth/logout
//  @access  Protected

const logout = async (req, res, next) => {
  try {
    // Clear the token cookie
    // maxAge 0 means cookie expires immediately
    res.cookie("token", "", {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   0,
    });

    return ApiResponse.success(res, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/v1/auth/users
// @access  Protected (admin)
const getAllUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive) filter.isActive = req.query.isActive === "true";

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return ApiResponse.paginated(res, "Users fetched successfully", users, users.length, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/deactivate a user (admin only)
// @route   DELETE /api/v1/auth/users/:id
// @access  Protected (admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    if (user._id.toString() === req.user._id.toString()) {
      return ApiResponse.error(res, "You cannot delete your own account", 400);
    }

    user.isActive = false;
    await user.save();

    return ApiResponse.success(res, "User deactivated successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getAllUsers,
  deleteUser,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
};