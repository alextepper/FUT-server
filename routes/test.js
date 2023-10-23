const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const QuizTry = require("../models/QuizTry");
const User = require("../models/User");

const calculateScore = async (quizTryId) => {
  try {
    // Find the quizTry by its ID
    const quizTry = await QuizTry.findById(quizTryId);

    if (!quizTry) {
      throw new Error("QuizTry not found.");
    }

    const user = await User.findById(quizTry.userId);
    // Calculate the number of correct answers
    const correctAnswers = quizTry.answers.filter(
      (answer) => answer.correct
    ).length;

    // Calculate the score by dividing the number of correct answers by 25
    const score = (correctAnswers / 25) * 100;

    // Save the calculated score to the quizTry
    quizTry.calculatedScore = score;
    await quizTry.save();

    if (!user.matMark || user.matMark < score) {
      user.matMark = score;
      await user.save();
    }

    return score;
  } catch (error) {
    console.error("Error calculating score:", error);
    throw error;
  }
};

router.get("/", async (req, res) => {
  const subject = req.headers.subject;
  try {
    // Fetch the questions
    const questions = await Question.find({
      difficultyLevel: 1,
      subject: subject,
    }).select("-correctAnswer");

    if (questions.length > 1) {
      var shuffled = questions.sort(function () {
        return 0.5 - Math.random();
      });
      var selected = shuffled.slice(0, 5);

      const userId = req.headers["user-id"];

      // Create a new quizTry instance
      const newQuizTry = new QuizTry({
        userId: userId,
        subject: subject,
      });

      await newQuizTry.save();

      res.json({
        quizTryId: newQuizTry._id, // send back the quizTryId so the client can reference it in future requests
        questions: selected,
      });
    } else {
      res.status(500).json({ message: "There is no questions" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/check", async (req, res) => {
  try {
    const { answers, quizTryId, difficultyLevel } = req.body;

    if (!answers || answers.length === 0) {
      return res.status(400).json({ message: "No answers provided." });
    }

    // Fetch the QuizTry instance
    const quizInstance = await QuizTry.findById(quizTryId);
    if (!quizInstance) {
      return res.status(404).json({ message: "QuizTry instance not found." });
    }

    // Placeholder for answers with correctness indication
    const detailedAnswers = [];
    let correctCount = 0;

    for (let ans of answers) {
      const question = await Question.findById(ans.questionId);
      if (!question) {
        return res
          .status(404)
          .json({ message: `Question with ID ${ans.questionId} not found.` });
      }

      const wasCorrect = question.correctAnswer === ans.providedAnswer;
      if (wasCorrect) correctCount++;

      // Push the detailed answer
      detailedAnswers.push({
        questionId: ans.questionId,
        providedAnswer: ans.providedAnswer,
        correct: wasCorrect,
      });
    }

    // Update the quizTry instance with detailed answers
    quizInstance.answers.push(...detailedAnswers);
    await quizInstance.save();

    // Evaluate the score
    if (correctCount >= 4) {
      const nextLevelQuestions = await Question.find({
        difficultyLevel: difficultyLevel + 1, // Assuming difficulty level increases sequentially
      })
        .select("-correctAnswer")
        .limit(5); // Sending only 5 questions for next level

      if (nextLevelQuestions.length > 0) {
        return res.json({ nextLevelQuestions });
      } else {
        // If there are no more questions, the quiz is finished
        const score = await calculateScore(quizTryId);
        return res.json({
          message: `Your score is ${score * 100}.`,
          quizCompleted: true,
        });
      }
    } else {
      // Calculate the score in a range of 0 to 100
      const score = await calculateScore(quizTryId);
      return res.json({
        message: "You can see your results on your page.",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error.", error });
  }
});

router.post("/create", async (req, res) => {
  const { subject, difficultyLevel, questionText, options, correctAnswer } =
    req.body;

  const newQuestion = new Question({
    subject,
    difficultyLevel,
    questionText,
    options,
    correctAnswer,
  });

  try {
    const savedQuestion = await newQuestion.save();
    res.json(savedQuestion);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// READ all questions
router.get("/", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// READ a single question by ID
router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// UPDATE a question by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found." });
    }
    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE a question by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedQuestion = await Question.findByIdAndRemove(req.params.id);
    if (!deletedQuestion) {
      return res.status(404).json({ message: "Question not found." });
    }
    res.json({ message: "Question deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
