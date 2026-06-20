const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────
//  vehicle.model.js
//  Defines the structure of a Vehicle in our database.
//
//  How it works in real toll systems like E-ZPass USA:
//  1. Vehicle owner registers their vehicle
//  2. System assigns a unique RFID tag number
//  3. When vehicle enters toll lane, RFID reader
//     scans the tag in milliseconds
//  4. System finds vehicle → finds owner → deducts toll
//
//  Every vehicle belongs to ONE user (owner)
//  One user can have MULTIPLE vehicles
// ─────────────────────────────────────────────────────

const vehicleSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────────
    //  OWNER REFERENCE
    //  Links vehicle to the user who owns it
    //  ref: "User" means it points to User collection
    // ─────────────────────────────────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vehicle must belong to a user"],
    },

    // ─────────────────────────────────────────────────
    //  VEHICLE IDENTITY
    // ─────────────────────────────────────────────────
    licensePlate: {
      type: String,
      required: [true, "License plate is required"],
      unique: true,
      uppercase: true,   // always stored as uppercase
      trim: true,
      match: [
        /^[A-Z0-9\s\-]{2,15}$/,
        "Please provide a valid license plate number",
      ],
    },

    // RFID tag — unique identifier scanned at toll booth
    // Like a passport number for the vehicle
    rfidTag: {
      type: String,
      unique: true,
      sparse: true,      // allows multiple null values
      trim: true,
    },

    // ─────────────────────────────────────────────────
    //  VEHICLE DETAILS
    // ─────────────────────────────────────────────────
    make: {
      type: String,
      required: [true, "Vehicle make is required"],
      trim: true,
      maxlength: [50, "Make cannot exceed 50 characters"],
      // Example: Toyota, Honda, Ford
    },

    model: {
      type: String,
      required: [true, "Vehicle model is required"],
      trim: true,
      maxlength: [50, "Model cannot exceed 50 characters"],
      // Example: Camry, Civic, F-150
    },

    year: {
      type: Number,
      required: [true, "Vehicle year is required"],
      min: [1900, "Year must be after 1900"],
      max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
    },

    color: {
      type: String,
      required: [true, "Vehicle color is required"],
      trim: true,
      maxlength: [30, "Color cannot exceed 30 characters"],
    },

    // ─────────────────────────────────────────────────
    //  VEHICLE CATEGORY
    //  Different vehicle types pay different toll rates
//  This is exactly how US highway toll systems work
    //
    //  motorcycle  → lowest toll
    //  car         → standard toll
    //  suv         → standard toll
    //  van         → medium toll
    //  truck       → highest toll
    //  bus         → highest toll
    // ─────────────────────────────────────────────────
    vehicleType: {
      type: String,
      required: [true, "Vehicle type is required"],
      enum: {
        values: ["motorcycle", "car", "suv", "van", "truck", "bus"],
        message: "Vehicle type must be motorcycle, car, suv, van, truck, or bus",
      },
      default: "car",
    },

    // ─────────────────────────────────────────────────
    //  STATUS
    // ─────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,     // active when registered
    },

    isBlacklisted: {
      type: Boolean,
      default: false,    // not blacklisted by default
    },

    blacklistReason: {
      type: String,
      default: null,     // reason filled when blacklisted
    },

    // ─────────────────────────────────────────────────
    //  REGISTRATION DETAILS
    // ─────────────────────────────────────────────────
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    registrationExpiry: {
      type: Date,
      required: [true, "Registration expiry date is required"],
    },

    // ─────────────────────────────────────────────────
    //  INSURANCE DETAILS
    //  US toll systems require valid insurance
    // ─────────────────────────────────────────────────
    insuranceNumber: {
      type: String,
      trim: true,
      default: null,
    },

    insuranceExpiry: {
      type: Date,
      default: null,
    },

    // ─────────────────────────────────────────────────
    //  STATISTICS
    //  Tracked automatically with every toll transaction
    // ─────────────────────────────────────────────────
    totalTrips: {
      type: Number,
      default: 0,        // increments with every toll pass
    },

    totalTollPaid: {
      type: Number,
      default: 0,        // total money paid in tolls
    },

    lastTollDate: {
      type: Date,
      default: null,     // date of last toll transaction
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────────────
//  VIRTUAL FIELD
//  isRegistrationExpired — checks if registration
//  has expired. Calculated on the fly, not stored in DB
//
//  Usage: vehicle.isRegistrationExpired → true or false
// ─────────────────────────────────────────────────────
vehicleSchema.virtual("isRegistrationExpired").get(function () {
  return this.registrationExpiry < new Date();
});

// ─────────────────────────────────────────────────────
//  VIRTUAL FIELD
//  isInsuranceExpired — checks if insurance has expired
// ─────────────────────────────────────────────────────
vehicleSchema.virtual("isInsuranceExpired").get(function () {
  if (!this.insuranceExpiry) return false;
  return this.insuranceExpiry < new Date();
});

// ─────────────────────────────────────────────────────
//  INDEXES
//  Makes searching faster in large databases
//  We search vehicles by owner, plate, and RFID most
// ─────────────────────────────────────────────────────
vehicleSchema.index({ owner: 1 });
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ rfidTag: 1 });
vehicleSchema.index({ isActive: 1 });
vehicleSchema.index({ isBlacklisted: 1 });
vehicleSchema.index({ vehicleType: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;