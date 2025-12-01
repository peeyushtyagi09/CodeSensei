const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema({
    input: {
        type: String,
        required: true
    },
    expected: {
        type: String, 
        default: ""
    },
    stdout: {
        type: String, 
        default: "",
    },
    stderr: {
        type: String,
        default: "",
    },
    exitCode: {
        type: String, 
        default: null
    },
    timeMs: {
        type: Number,
        default: 0
    },
    memoryKb: {
        type: Number, 
        default: 0,
    },
    passed: {
        type: Boolean, 
        default: false
    },
    hidden: {
        type: Boolean, 
        default: false
    }
}, { _id: false });

const SubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        default: null
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Question',
        required: true,
    },
    langauge: {
        type:String,
        required: true
    },
    version:{
        type: String,
        default: '*'
    },
    code: {
        type: String, 
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending'
    },
    results: {type: [testResultSchema], default: []},
    scorePercent: {
        type: Number,
        default: 0
    },
    allPassed: {
        type:Boolean, 
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type:Date
    }
});
module.exports = mongoose.model('Submission', SubmissionSchema);