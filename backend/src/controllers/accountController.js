const Account = require("../models/account.model");
const ApiResponse = require("../utils/apiResponse");

const MAX_TOP_UP_AMOUNT   = 50000;
const MIN_TOP_UP_AMOUNT   = 100;
const MAX_BALANCE_ALLOWED = 100000;

// @desc    Create a new account/wallet
// @route   POST /api/v1/accounts/create
// @access  Protected (user)
const createAccount = async (req, res, next) => {
  try {
    const { initialDeposit, minimumBalance } = req.body;

    if (!initialDeposit) {
      return ApiResponse.error(res, "Please provide an initial deposit amount", 400);
    }

    const depositAmount = parseFloat(initialDeposit);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return ApiResponse.error(res, "Please provide a valid initial deposit amount", 400);
    }

    if (depositAmount < MIN_TOP_UP_AMOUNT) {
      return ApiResponse.error(res, `Minimum initial deposit is ${MIN_TOP_UP_AMOUNT} BDT`, 400);
    }

    if (depositAmount > MAX_TOP_UP_AMOUNT) {
      return ApiResponse.error(res, `Maximum initial deposit is ${MAX_TOP_UP_AMOUNT} BDT`, 400);
    }

    const existingAccount = await Account.findOne({ owner: req.user._id });

    if (existingAccount) {
      return ApiResponse.error(res, "You already have an account. You can only have one wallet.", 400);
    }

    let minBalance = 200;

    if (minimumBalance !== undefined) {
      minBalance = parseFloat(minimumBalance);
      if (isNaN(minBalance) || minBalance < 0) {
        return ApiResponse.error(res, "Please provide a valid minimum balance amount", 400);
      }
    }

    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const accountNumber = `TMS-${randomDigits}`;

    const account = await Account.create({
      owner:            req.user._id,
      balance:          depositAmount,
      minimumBalance:   minBalance,
      accountNumber,
      totalTopUps:      1,
      totalTopUpAmount: depositAmount,
      lastTopUpDate:    new Date(),
    });

    await account.populate("owner", "name email phone");

    return ApiResponse.success(
      res,
      "Account created successfully",
      {
        accountNumber:  account.accountNumber,
        balance:        account.balance,
        minimumBalance: account.minimumBalance,
        isLowBalance:   account.isLowBalance,
        owner: {
          name:  account.owner.name,
          email: account.owner.email,
          phone: account.owner.phone,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's account
// @route   GET /api/v1/accounts/my-account
// @access  Protected (user)
const getMyAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      owner: req.user._id,
    }).populate("owner", "name email phone");

    if (!account) {
      return ApiResponse.error(res, "You do not have an account yet. Please create one first.", 404);
    }

    return ApiResponse.success(res, "Account fetched successfully", account);
  } catch (error) {
    next(error);
  }
};

// @desc    Top up wallet balance
// @route   POST /api/v1/accounts/top-up
// @access  Protected (user)
const topUpBalance = async (req, res, next) => {
  try {
    const { amount, paymentMethod, paymentReference } = req.body;

    if (!amount) {
      return ApiResponse.error(res, "Please provide an amount", 400);
    }

    const topUpAmount = parseFloat(amount);

    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      return ApiResponse.error(res, "Please provide a valid amount", 400);
    }

    if (topUpAmount < MIN_TOP_UP_AMOUNT) {
      return ApiResponse.error(res, `Minimum top-up amount is ${MIN_TOP_UP_AMOUNT} BDT`, 400);
    }

    if (topUpAmount > MAX_TOP_UP_AMOUNT) {
      return ApiResponse.error(res, `Maximum top-up amount is ${MAX_TOP_UP_AMOUNT} BDT per transaction`, 400);
    }

    const account = await Account.findOne({ owner: req.user._id });

    if (!account) {
      return ApiResponse.error(res, "Account not found. Please create an account first.", 404);
    }

    if (account.isFrozen) {
      return ApiResponse.error(res, "Your account is frozen. Please contact support.", 403);
    }

    if (account.balance + topUpAmount > MAX_BALANCE_ALLOWED) {
      return ApiResponse.error(res, `Top-up failed. Your balance cannot exceed ${MAX_BALANCE_ALLOWED} BDT.`, 400);
    }

    const previousBalance     = account.balance;
    account.balance           += topUpAmount;
    account.totalTopUps       += 1;
    account.totalTopUpAmount  += topUpAmount;
    account.lastTopUpDate     = new Date();
    await account.save();

    return ApiResponse.success(res, "Balance topped up successfully", {
      previousBalance,
      topUpAmount,
      newBalance:       account.balance,
      accountNumber:    account.accountNumber,
      paymentMethod:    paymentMethod    || "manual",
      paymentReference: paymentReference || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction history summary
// @route   GET /api/v1/accounts/my-account/transactions
// @access  Protected (user)
const getTransactionHistory = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      owner: req.user._id,
    }).populate("owner", "name email phone");

    if (!account) {
      return ApiResponse.error(res, "Account not found", 404);
    }

    return ApiResponse.success(res, "Transaction summary fetched successfully", {
      accountNumber:       account.accountNumber,
      currentBalance:      account.balance,
      totalTopUps:         account.totalTopUps,
      totalTopUpAmount:    account.totalTopUpAmount,
      totalTollDeductions: account.totalTollDeductions,
      totalTollAmount:     account.totalTollAmount,
      lastTopUpDate:       account.lastTopUpDate,
      lastDeductionDate:   account.lastDeductionDate,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update minimum balance threshold
// @route   PUT /api/v1/accounts/minimum-balance
// @access  Protected (user)
const updateMinimumBalance = async (req, res, next) => {
  try {
    const { minimumBalance } = req.body;

    if (minimumBalance === undefined || minimumBalance === null) {
      return ApiResponse.error(res, "Please provide a minimum balance amount", 400);
    }

    const minBalance = parseFloat(minimumBalance);

    if (isNaN(minBalance) || minBalance < 0) {
      return ApiResponse.error(res, "Please provide a valid minimum balance amount", 400);
    }

    const account = await Account.findOneAndUpdate(
      { owner: req.user._id },
      { minimumBalance: minBalance },
      { new: true, runValidators: true }
    );

    if (!account) {
      return ApiResponse.error(res, "Account not found", 404);
    }

    return ApiResponse.success(res, "Minimum balance updated successfully", {
      minimumBalance: account.minimumBalance,
      currentBalance: account.balance,
      isLowBalance:   account.isLowBalance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle auto recharge
// @route   PUT /api/v1/accounts/auto-recharge
// @access  Protected (user)
const toggleAutoRecharge = async (req, res, next) => {
  try {
    const { isEnabled, rechargeAmount, triggerAmount } = req.body;

    if (isEnabled === undefined) {
      return ApiResponse.error(res, "Please provide isEnabled field (true or false)", 400);
    }

    const updates = { "autoRecharge.isEnabled": isEnabled };

    if (rechargeAmount !== undefined) {
      if (rechargeAmount < 100) {
        return ApiResponse.error(res, "Recharge amount must be at least 100 BDT", 400);
      }
      updates["autoRecharge.rechargeAmount"] = rechargeAmount;
    }

    if (triggerAmount !== undefined) {
      updates["autoRecharge.triggerAmount"] = triggerAmount;
    }

    const account = await Account.findOneAndUpdate(
      { owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!account) {
      return ApiResponse.error(res, "Account not found", 404);
    }

    return ApiResponse.success(
      res,
      `Auto recharge ${isEnabled ? "enabled" : "disabled"} successfully`,
      { autoRecharge: account.autoRecharge }
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all accounts
// @route   GET /api/v1/accounts
// @access  Protected (admin, operator)
const getAllAccounts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.isActive) filter.isActive = req.query.isActive === "true";
    if (req.query.isFrozen) filter.isFrozen = req.query.isFrozen === "true";

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [accounts, total] = await Promise.all([
      Account.find(filter)
        .populate("owner", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Account.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      res,
      "Accounts fetched successfully",
      accounts,
      accounts.length,
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single account by id
// @route   GET /api/v1/accounts/:id
// @access  Protected (admin, operator)
const getAccountById = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id).populate(
      "owner", "name email phone role"
    );

    if (!account) {
      return ApiResponse.error(res, "Account not found", 404);
    }

    return ApiResponse.success(res, "Account fetched successfully", account);
  } catch (error) {
    next(error);
  }
};

// @desc    Freeze an account
// @route   PUT /api/v1/accounts/:id/freeze
// @access  Protected (admin only)
const freezeAccount = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return ApiResponse.error(res, "Please provide a reason for freezing this account", 400);
    }

    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { isFrozen: true, frozenReason: reason },
      { new: true }
    ).populate("owner", "name email phone");

    if (!account) {
      return ApiResponse.error(res, "Account not found", 404);
    }

    return ApiResponse.success(res, "Account frozen successfully", account);
  } catch (error) {
    next(error);
  }
};

// @desc    Unfreeze an account
// @route   PUT /api/v1/accounts/:id/unfreeze
// @access  Protected (admin only)
const unfreezeAccount = async (req, res, next) => {
  try {
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { isFrozen: false, frozenReason: null },
      { new: true }
    ).populate("owner", "name email phone");

    if (!account) {
      return ApiResponse.error(res, "Account not found", 404);
    }

    return ApiResponse.success(res, "Account unfrozen successfully", account);
  } catch (error) {
    next(error);
  }
};

// @desc    Manually adjust balance
// @route   PUT /api/v1/accounts/:id/adjust-balance
// @access  Protected (admin only)
const adjustBalance = async (req, res, next) => {
  try {
    const { amount, type, reason } = req.body;

    if (!amount || !type || !reason) {
      return ApiResponse.error(res, "Please provide amount, type (add or deduct) and reason", 400);
    }

    if (!["add", "deduct"].includes(type)) {
      return ApiResponse.error(res, "Type must be either add or deduct", 400);
    }

    const adjustAmount = parseFloat(amount);

    if (isNaN(adjustAmount) || adjustAmount <= 0) {
      return ApiResponse.error(res, "Please provide a valid amount", 400);
    }

    const account = await Account.findById(req.params.id);

    if (!account) {
      return ApiResponse.error(res, "Account not found", 404);
    }

    const previousBalance = account.balance;

    if (type === "add") {
      account.balance += adjustAmount;
    } else {
      if (adjustAmount > account.balance) {
        return ApiResponse.error(res, "Cannot deduct more than available balance", 400);
      }
      account.balance -= adjustAmount;
    }

    await account.save();

    return ApiResponse.success(res, "Balance adjusted successfully", {
      previousBalance,
      adjustmentType:   type,
      adjustmentAmount: adjustAmount,
      newBalance:       account.balance,
      reason,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAccount,
  getMyAccount,
  topUpBalance,
  getTransactionHistory,
  updateMinimumBalance,
  toggleAutoRecharge,
  getAllAccounts,
  getAccountById,
  freezeAccount,
  unfreezeAccount,
  adjustBalance,
};