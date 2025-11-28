const mongoose = require("mongoose");

const exampleSchema = new mongoose.Schema({
    input: { type: mongoose.Schema.Types.Mixed, required: true },
    output: { type: mongoose.Schema.Types.Mixed, required: true },
    explanation: { type: String },
}, { _id: false });

const testCaseSchema = new mongoose.Schema({
    input: { type: mongoose.Schema.Types.Mixed, required: true },
    output: { type: mongoose.Schema.Types.Mixed, required: true },
    hidden: { type: Boolean, default: false },
}, { _id: false });


const QuestionSchema = new mongoose.Schema({
    title: {
        type: String, 
        required: [true, "Title is required"],
        minLength: [3, "Title must be at least 3 characters"],
        maxLength: [100, "Title too long"],
        trim: true,
        unique: true,
    },
    description: {
        type: String, 
        required: [true, "Description is required"],
        minLength: [20, "Description must be at least 10 characters"],
        maxLength: [500, "Description too long"], 
    },
    examples: {
        type: [exampleSchema],
        default: [],
        validate: {
            validator: (value) => value.length > 0, 
            message: "At least one example is required",
        },
    },
    constraints: {
        type: String, 
        default: "",
    },
    topic: {
        type: String, 
        enum: ["array", "string", "graph", 'greedy', "dp", "tree", "recursion", "math", "other"],
        required: true, 
        lowercase: true, 
        trim: true,
    },
    difficulty: {
        type: String, 
        enum: ["easy", 'medium', 'hard'],
        required: true, 
        lowercase: true,
    },

    starterCode: {
        type: String, 
        default: "",
    },
    testCases: {
        type: [testCaseSchema],
        default: [],
    },

    source: {
        type: String, 
        enum: ["manual", "ai"],
        default: "manual",
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    stats: {
        submissions: {type: Number, default: 0},
        accepted: {type: Number, default: 0},
    },
    nextAvailableAt: {
        type: Date,
        default: Date.now(),
    },
    cooldownMouths: {
        type: Number, 
        default: 6,
    }
}, {timestamps: true});

QuestionSchema.virtual('accuracy').get(function () {
    if(this.stats.submissions === 0) return 0;
    return ((this.stats.accepted / this.stats.submissions) * 100).toFixed(2);
});

module.exports = mongoose.model("Question", QuestionSchema);
