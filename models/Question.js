const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String], // An array of strings
    required: true,
    validate: [arrayLimit, "{PATH} exceeds the limit of 4"], // ensure the limit of options
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true,
  },
  difficultyLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
});

// Validate the number of options
function arrayLimit(val) {
  return val.length <= 4;
}

// Compile model from schema
const Question = mongoose.model("Question", QuestionSchema);

module.exports = Question;
