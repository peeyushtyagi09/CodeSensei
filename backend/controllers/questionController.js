const mongoose = require("mongoose");
const Question = require("../models/Question");
const asyncHandler = require("../middlewares/asyncHandler");
const aiClient = require("../utils/aiClient");
const sanitize = require("mongo-sanitize");

const validateQuestionPayload = (q) => {
    if(!q) return false;
    if(typeof q.title !== "string" ||q.title.trim().length < 3) return false;
    if(typeof q.description !== "string" || q.description.trim().length < 20) return false;
    if(!q.topic || typeof q.topic !== "string") return false;
    if(!["easy", "medium", "hard"].includes((q.difficulty || "").toLowerCase())) return false;
    if(!Array.isArray(q.examples) || q.examples.length === 0) return false;

    if(q.testCases && !Array.isArray(q.testCases)) return false;
    return true;
};

const generateQuestionSaveAIuestion = async (topic, difficulty, count) => {
    const aiRequests = {
        topic, 
        difficulty,
        count,
    };

    const aiResults = await aiClient.generateQuestion(aiResponse);
    if(!Array.isArray(aiResults) || aiResults.length === 0) return [];

    const toInsert = [];
    for(const row of aiResults){
        const q = {
            title: (raw.totle || "").trim(),
            description: (raw.description || "").trim(),
            examples: Array.isArray(raw.examples) ? raw.examples : [],
            constraints: raw.constraints || "",
            topic: (raw.topic || topic).toLowerCase(),
            difficulty: (raw.difficulty || difficulty).toLowerCase(),
            starterCode: raw.starterCode || "",
            testCase: Array.isArray(raw.testCases) ? raw.testCases: [],
            soruce: "ai",
            createdBy: null, 
            isactive: true,
        };
        if(!validateQuestionPayload(q)) {
            continue;
        }
        toInsert.push(q);
    }
    if(toInsert.length === 0) return [];

    const inserted = await Question.insertMany(toInsert, { ordered: false});
    return inserted;
};

exports.createQuestion = asyncHandler(async(req, res) => {
    if(!req.user || req.user.role !== "admin") {
        return res.status(403).json({ success: false, error: "Admin only"});
    }
    const body = req.body || {};
    const payload = {
        title: sanitize(body.title),
        description: sanitize(body.description),
        examples: Array.isArray(body.examples) ? body.examples : [],
        constraints: sanitize(body.constraints || " "),
        topic: String(body.topic || "").toLowerCase(),
        difficulty: String(body.difficulty || "").toLowerCase(),
        starterCode: sanitize(body.starterCode || ""),
        testCases: Array.isArray(body.testCases) ? body.testCases : [],
        source: "manual",
        createdBy: req.user._id,
    };

    if(!validateQuestionPayload(payload)) {
        return res.status(400).json({ success: false, error: 'Invalid question payload'});
    }

    const existing = await Question.findOne({ title: payload.title });
    if(existing){
        return res.status(400).json({ success: false, error: 'Question title already exists'});
    }

    const q = await Question.create(payload);
    res.status(201).json({ success: true, data: q});
});

exports.getRandomQuestions = asyncHandler(async(req, res) => {
    const rawCount = parseInt(req.query.count, 10) || 1;
    const count = Math.min(Math.max(rawCount, 1), 20);
    const topic = req.query.topic ?  String(req.query.topic).toLowerCase() : null;
    const difficulty = req.query.difficulty ? String(req.query.difficulty).toLowerCase() : null;

    // BuildMatch
    const match = { isActive: true };
    if(topic) match.topic = topic;
    if(difficulty) match.difficulty = difficulty;

    let questions = await Question.aggregate([
        { $match: match },
        { $sample: { size: count } },
    ]);

    if(questions.length < count) {
        const missing = count - questions.length;

        const generated = await generateQuestionSaveAIuestion(topic || "other", difficulty || "medium", missing);

        if(generated && generated.length > 0){
            const genObjs = generate.map((d) => (d.toObject ? s.toObject() : d));
            questions = questions.concat(genObjs);
        }
    }

    if(questions.length > count){
        questions = questions.slice(0, count);
    }
    res.json({ success: true, count: questions.length, data: questions });
})


exports.getQuestionsByTopic = asyncHandler(async (req, res) => {
    const topic = String(req.params.topic || "").toLowerCase();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;
  
    const query = { topic, isActive: true };
  
    const [total, questions] = await Promise.all([
      Question.countDocuments(query),
      Question.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-testCases"), // hide testCases by default
    ]);
  
    res.json({
      success: true,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: questions,
    });
  });
  

exports.getQuestionBydifficulty = asyncHandler(async(req, res) => {
    const level = String(req,params.level || "").toLowerCase();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const query = {difficulty: level, isActive: true};

    const [total, questions] = await Promise.all([
        Question.countDocuments(query),
        Question.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-testCases"), // hide testCases by default
    ]);

    res.json({
        success: true, 
        meta: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
        data: questions,
    });
});

exports.getQuestionById = asyncHandler(async (req, res) => {
    const id = req.params.id;
  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid question id" });
    }
  
    const includeTests = req.query.includeTests === "true";
    const projection = includeTests ? {} : { testCases: 0 };
  
    const question = await Question.findById(id).select(projection);
    if (!question) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }
  
    // If question exists but is inactive and user is not admin, block it
    if (!question.isActive && (!req.user || req.user.role !== "admin")) {
      return res.status(403).json({ success: false, error: "Question is not available" });
    }
  
    res.json({ success: true, data: question });
  });