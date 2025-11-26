require('dotenv').config();
const mongoose = require("mongoose");
const Question = require("../models/Question");

const questions = [
    {
      title: "Two Sum",
      description: "Given an array of integers nums and an integer target...",
      examples: [
        {
          input: "nums = [2,7,11,15], target = 9",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 9",
        },
      ],
      constraints: "2 <= nums.length <= 10^4",
      topic: "array",
      difficulty: "easy",
      cooldownMonths: 4,
      starterCode: "",
      testCases: [
        { input: "nums=[2,7,11,15], target=9", output: "[0,1]", hidden: false },
      ],
      source: "manual",
    },
  
    {
      title: "Number of Islands",
      description: "Given a 2D grid map of '1's (land) and '0's (water)...",
      examples: [
        {
          input: `[["1","1","0"],["0","1","0"],["1","0","1"]]`,
          output: "3",
          explanation: "3 separate islands.",
        },
      ],
      constraints: "m, n <= 300",
      topic: "graph",
      difficulty: "medium",
      cooldownMonths: 8,
      starterCode: "",
      testCases: [{ input: "...", output: "3", hidden: false }],
      source: "manual",
    },
];

const start = async () => {
    try {
        console.log("Connecting ...");
        await mongoose.connect(process.env.MONGODB_URL);

        console.log('Checking existing questions ...');

        for(const q of questions){
            const exists = await Question.findOne({ title: q.title });

            if(!exists){
                await Question.create(q);
                console.log(`Inserted: ${q.title}`);
            }else{
                console.log(`Skippedd (already exist): ${q.title}`);
            }
        }

        console.log("seeding complete!");
        process.exit(0);
    }catch(err){
        console.error("seed Error:", err);
        process.exit(1);
    }
};

start();