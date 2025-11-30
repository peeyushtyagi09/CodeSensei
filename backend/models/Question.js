const mongoose = require("mongoose");

// ---------------------- Example Schema ----------------------
const exampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String, default: "" }
}, { _id: false });


// ---------------------- Testcase Schema ----------------------
const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  hidden: { type: Boolean, default: false },
}, { _id: false });


// ---------------------- Main Question Schema ----------------------
const QuestionSchema = new mongoose.Schema({
  
  // BASIC FIELDS
  title: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 120,
    trim: true,
    unique: true
  },

  description: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000
  },

  examples: {
    type: [exampleSchema],
    default: []   // No strict validation to avoid breaking on AI output
  },

  constraints: {
    type: String,
    default: ""
  },

  topic: {
    type: String,
    trim: true,
    lowercase: true,
    default: "other"
    // DO NOT restrict enum — AI generates many categories
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true,
    lowercase: true
  },

  starterCode: {
    type: String,
    default: ""
  },

  // TEST CASES
  testCases: {
    type: [testCaseSchema],
    default: []
  },

  testCaseCount: {
    type: Number,
    default: 0
  },

  // SOURCE META
  source: {
    type: String,
    enum: ["manual", "ai"],
    default: "manual"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // PERFORMANCE STATS
  stats: {
    submissions: { type: Number, default: 0 },
    accepted: { type: Number, default: 0 },

    nextAvailableAt: {
      type: Date,
      default: Date.now
    },

    cooldownMonths: {
      type: Number,
      default: 6
    }
  },

  // AI AUTO TESTCASE GENERATION FIELDS
  referenceSolution: {
    type: String,
    default: ""
  },

  bruteForceSolution: {
    type: String,
    default: ""
  },

  generatorScript: {
    type: String,
    default: ""
  },

  generatorLanguage: {
    type: String,
    default: "python"
  },

  generatorVersion: {
    type: String,
    default: "*"
  },

  solutionLanguage: {
    type: String,
    default: "python"
  },

  solutionVersion: {
    type: String,
    default: "*"
  }

}, { timestamps: true });


// ---------------------- Virtual Properties ----------------------
QuestionSchema.virtual("accuracy").get(function () {
  if (this.stats.submissions === 0) return 0;
  return ((this.stats.accepted / this.stats.submissions) * 100).toFixed(2);
});


// ---------------------- Pre-save Sync ----------------------
QuestionSchema.pre("save", function (next) {
  this.testCaseCount = this.testCases.length; // Always synced
  next();
});


module.exports = mongoose.model("Question", QuestionSchema);
