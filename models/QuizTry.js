const mongoose = require("mongoose");

const quizTrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        providedAnswer: {
          // Name changed to make it clearer
          type: String,
          required: true,
        },
        correct: {
          type: Boolean,
          required: true,
        },
      },
    ],
    calculatedScore: {
      type: Number,
      default: 0, // Default score is 0
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const QuizTry = mongoose.model("QuizTry", quizTrySchema);

module.exports = QuizTry;
