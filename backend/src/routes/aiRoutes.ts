import express, { Request, Response } from "express";
import axios from "axios";

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

router.post("/generate-questions", async (req: Request, res: Response) => {
  try {
    const { product_name, category, previous_answers } = req.body;

    const response = await axios.post(`${AI_SERVICE_URL}/generate-questions`, {
      product_name,
      category,
      previous_answers: previous_answers || [],
    });

    res.json(response.data);
  } catch (error: any) {
    console.error("AI service error:", error.message);
    res.json({
      questions: getBasicQuestions(req.body.category),
      ai_generated: false,
      error: "AI service unavailable, using basic questions",
    });
  }
});

router.post("/calculate-score", async (req: Request, res: Response) => {
  try {
    const { product_name, category, responses } = req.body;

    const response = await axios.post(`${AI_SERVICE_URL}/transparency-score`, {
      product_name,
      category,
      responses,
    });

    res.json(response.data);
  } catch (error: any) {
    console.error("AI service error:", error.message);
    const score = calculateBasicScore(req.body.responses);
    res.json({
      transparency_score: score,
      health_score: score,
      ethics_score: score,
      recommendations: ["Complete all questions for better score"],
      ai_analysis: "AI service unavailable",
      error: "Using basic scoring",
    });
  }
});

router.get("/health", async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/`);
    res.json({
      status: "ok",
      ai_service: "connected",
      ai_data: response.data,
    });
  } catch (error: any) {
    res.json({
      status: "warning",
      ai_service: "disconnected",
      message: "AI service not available. App will work with basic features.",
    });
  }
});

function getBasicQuestions(category: string) {
  const baseQuestions = [
    {
      id: "ingredients",
      question: "What are the main ingredients?",
      type: "text",
      category: "composition",
    },
    {
      id: "allergens",
      question: "Does this contain allergens?",
      type: "text",
      category: "health",
    },
    {
      id: "origin",
      question: "Where is this manufactured?",
      type: "text",
      category: "origin",
    },
    {
      id: "certifications",
      question: "Any certifications?",
      type: "text",
      category: "ethics",
    },
  ];

  const categoryQuestions: any = {
    Food: [
      {
        id: "nutrition",
        question: "Nutritional information?",
        type: "text",
        category: "health",
      },
      {
        id: "preservatives",
        question: "Any preservatives?",
        type: "text",
        category: "health",
      },
    ],
    Beverage: [
      {
        id: "sugar",
        question: "Sugar content?",
        type: "text",
        category: "health",
      },
    ],
    Cosmetics: [
      {
        id: "testing",
        question: "Cruelty-free?",
        type: "text",
        category: "ethics",
      },
    ],
    Supplements: [
      {
        id: "clinical",
        question: "Clinical testing done?",
        type: "text",
        category: "health",
      },
    ],
  };

  return [...baseQuestions, ...(categoryQuestions[category] || [])];
}

function calculateBasicScore(responses: any[]) {
  if (!responses || responses.length === 0) return 0;

  const answered = responses.filter(
    (r: any) => r.answer && r.answer.trim()
  ).length;
  return Math.round((answered / responses.length) * 100);
}

export default router;
