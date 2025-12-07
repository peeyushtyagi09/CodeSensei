const mongoose = require("mongoose");
const { Schema } = mongoose;


const ConceptQuestionSchema = new Schema({
    id: {type: Number, required: true},
    question: { type: String, required: true},
    userAnswer: { type: String, default: '' },
    score: { type: Number, default: null},
    feedback: {type: String, default: ''}
}, { _id: false });

const ResponseSchema = new Schema({
    questionId: {type: mongoose.Types.ObjectId, ref: 'Question', required: true},
    userCode: {type: String, default: ''},
    language: {type: String, dedfault: '' },
    codeStatus: {type: String, enum: ['passed', 'failed', 'error'], default: 'failed' },
    passedTestCases: {type: Number, default: 0 },
    failedTestCases: {type: Number, default: 0},
    exectionOutput: {type: String, default: ''},
    timeTakenMs: {type: Number, default: 0},
    ConceptQuestion: { type: [ConceptQuestionSchema], default: [] },
    conceptualCompleted: {type: Boolean, default: false},
    conceptualScoreTotal:{type:Number, default: 0},
    createdAt: {type: Date, default: Date.now},
}, { _id: true });

const InterviewSessionSchema = new Schema({
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true},
    questions: [{ type: mongoose.Types.ObjectId,ref: 'Question' }],
    currentIndex: {type: Number, default: 0},
    response: {type: [ResponseSchema], default: []},
    startTime: {type: Date, dedfault: Date.now},
    endTime: { type: Date },
    status: { type: String, enum: ['ongoing', 'completed', 'aborted'], default: 'ongoing'}
}, { timestamps: true });

module.exports = mogoose.model("InterviewSession", InterviewSessionSchema);