const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────
//  booth.model.js
//  Defines the structure of a Toll Booth in our system.
//
//  How it works in real US toll systems:
//  1. Highway authority creates toll plazas at key points
//  2. Each plaza has multiple lanes (booths)
//  3. Each lane has an RFID reader
//  4. Different vehicle types pay different rates
//  5. Booth status is monitored 24/7
//  6. Revenue is tracked per booth
// ─────────────────────────────────────────────────────

const boothSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────────
    //  BASIC INFO
    // ─────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Booth name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Booth name cannot exceed 100 characters"],
      // Example: "Dhaka-Chittagong Highway Plaza 1"
    },

    boothCode: {
      type: String,
      required: [true, "Booth code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      // Example: "DCH-001", "DHK-002"
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: null,
    },

    // ─────────────────────────────────────────────────
    //  LOCATION
    //  GPS coordinates for real-time tracking
    //  Same as how Google Maps locates toll plazas
    // ─────────────────────────────────────────────────
    location: {
      address: {
        type: String,
        required: [true, "Booth address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          default: null,
        },
        longitude: {
          type: Number,
          default: null,
        },
      },
    },

    // ─────────────────────────────────────────────────
    //  HIGHWAY INFO
    // ─────────────────────────────────────────────────
    highwayName: {
      type: String,
      required: [true, "Highway name is required"],
      trim: true,
      // Example: "Dhaka-Chittagong Highway"
    },

    highwayNumber: {
      type: String,
      trim: true,
      default: null,
      // Example: "N1", "N2"
    },

    // ─────────────────────────────────────────────────
    //  LANE CONFIGURATION
    //  Each booth can have multiple lanes
    //  Like a toll plaza with 4-8 lanes
    // ─────────────────────────────────────────────────
    totalLanes: {
      type: Number,
      required: [true, "Total number of lanes is required"],
      min: [1, "Must have at least 1 lane"],
      max: [20, "Cannot exceed 20 lanes"],
      default: 1,
    },

    activeLanes: {
      type: Number,
      default: 1,
      min: [0, "Active lanes cannot be negative"],
    },

    // ─────────────────────────────────────────────────
    //  TOLL RATES
    //  Each booth can have custom rates
    //  Different highways charge different amounts
    //  Rates are in BDT (Bangladesh Taka)
    // ─────────────────────────────────────────────────
    tollRates: {
      motorcycle: {
        type: Number,
        default: 50,
        min: [0, "Rate cannot be negative"],
      },
      car: {
        type: Number,
        default: 100,
        min: [0, "Rate cannot be negative"],
      },
      suv: {
        type: Number,
        default: 150,
        min: [0, "Rate cannot be negative"],
      },
      van: {
        type: Number,
        default: 200,
        min: [0, "Rate cannot be negative"],
      },
      truck: {
        type: Number,
        default: 300,
        min: [0, "Rate cannot be negative"],
      },
      bus: {
        type: Number,
        default: 300,
        min: [0, "Rate cannot be negative"],
      },
    },

    // ─────────────────────────────────────────────────
    //  STATUS
    //  operational — booth is working normally
    //  maintenance — booth is under maintenance
    //  closed      — booth is permanently closed
    // ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ["operational", "maintenance", "closed"],
        message: "Status must be operational, maintenance, or closed",
      },
      default: "operational",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ─────────────────────────────────────────────────
    //  OPERATOR ASSIGNMENT
    //  Which operator is currently managing this booth
    //  ref: "User" — only users with role "operator"
    // ─────────────────────────────────────────────────
    assignedOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─────────────────────────────────────────────────
    //  STATISTICS
    //  Tracked automatically with every transaction
    //  Used for revenue reports in chunk 12
    // ─────────────────────────────────────────────────
    totalTransactions: {
      type: Number,
      default: 0,
    },

    totalRevenue: {
      type: Number,
      default: 0,
    },

    todayTransactions: {
      type: Number,
      default: 0,
    },

    todayRevenue: {
      type: Number,
      default: 0,
    },

    lastTransactionDate: {
      type: Date,
      default: null,
    },

    // ─────────────────────────────────────────────────
    //  MAINTENANCE INFO
    //  Tracks when booth was last serviced
    // ─────────────────────────────────────────────────
    lastMaintenanceDate: {
      type: Date,
      default: null,
    },

    nextMaintenanceDate: {
      type: Date,
      default: null,
    },

    maintenanceNotes: {
      type: String,
      default: null,
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
//  isUnderMaintenance — checks booth status
//  Usage: booth.isUnderMaintenance → true or false
// ─────────────────────────────────────────────────────
boothSchema.virtual("isUnderMaintenance").get(function () {
  return this.status === "maintenance";
});

// ─────────────────────────────────────────────────────
//  VIRTUAL FIELD
//  availableLanes — how many lanes are currently open
// ─────────────────────────────────────────────────────
boothSchema.virtual("availableLanes").get(function () {
  return this.activeLanes;
});

// ─────────────────────────────────────────────────────
//  INDEXES
// ─────────────────────────────────────────────────────
boothSchema.index({ status: 1 });
boothSchema.index({ isActive: 1 });
boothSchema.index({ assignedOperator: 1 });
boothSchema.index({ "location.city": 1 });
boothSchema.index({ highwayName: 1 });

const Booth = mongoose.model("Booth", boothSchema);

module.exports = Booth;