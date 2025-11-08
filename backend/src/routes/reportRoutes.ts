import express, { Request, Response, Router } from "express";
import pool from "../config/database";
import authenticateToken, { AuthRequest } from "../middleware/authMiddleware";

const router: Router = express.Router();

// Interface for report data structure
interface ReportData {
  product: any;
  responses: any[];
  categories: { [key: string]: any[] };
  score: number;
  generatedAt: string;
  insights: {
    completeness: number;
    categoryBreakdown: { [key: string]: number };
    recommendations: string[];
  };
}

function groupByCategory(responses: any[]): { [key: string]: any[] } {
  return responses.reduce((acc: any, response: any) => {
    const category = response.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      question: response.question_text,
      answer: response.answer,
      type: response.question_type,
      questionId: response.question_id,
    });
    return acc;
  }, {});
}

function calculateTransparencyScore(
  responses: any[],
  totalQuestions: number
): number {
  // Base score: Completeness (40%)
  const answeredCount = responses.filter(
    (r) => r.answer && r.answer.trim() !== ""
  ).length;
  const completenessScore = (answeredCount / totalQuestions) * 40;

  // Quality score: Answer length/detail (30%)
  let qualityScore = 0;
  responses.forEach((response) => {
    const answer = response.answer || "";
    if (answer.length > 100) qualityScore += 3;
    else if (answer.length > 50) qualityScore += 2;
    else if (answer.length > 10) qualityScore += 1;
  });
  qualityScore = Math.min(30, (qualityScore / responses.length) * 10);

  // Category coverage (30%)
  const categories = new Set(responses.map((r) => r.category));
  const categoryScore = (categories.size / 10) * 30;

  const finalScore = Math.round(
    completenessScore + qualityScore + categoryScore
  );
  return Math.min(100, Math.max(0, finalScore));
}

function generateRecommendations(
  score: number,
  categories: { [key: string]: any[] }
): string[] {
  const recommendations: string[] = [];

  if (score < 40) {
    recommendations.push(
      "Complete all required questions to improve transparency score"
    );
    recommendations.push(
      "Provide more detailed responses for better credibility"
    );
  } else if (score < 70) {
    recommendations.push(
      "Add more specific details about ingredients and sourcing"
    );
    recommendations.push("Include certification information if applicable");
  } else if (score < 90) {
    recommendations.push("Consider adding sustainability metrics");
    recommendations.push("Provide third-party verification documentation");
  } else {
    recommendations.push("Excellent transparency! Maintain regular updates");
    recommendations.push("Share your transparency report with customers");
  }

  // Category-specific recommendations
  if (
    !categories["certifications"] ||
    categories["certifications"].length === 0
  ) {
    recommendations.push("Consider obtaining relevant product certifications");
  }
  if (
    !categories["sustainability"] ||
    categories["sustainability"].length === 0
  ) {
    recommendations.push(
      "Add information about environmental sustainability practices"
    );
  }

  return recommendations;
}

router.post(
  "/:productId/generate",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      // Verify product ownership
      const productResult = await pool.query(
        "SELECT * FROM products WHERE id = $1 AND user_id = $2",
        [productId, req.userId]
      );

      if (productResult.rows.length === 0) {
        res.status(404).json({
          error: "Product not found",
          message:
            "The requested product does not exist or you do not have access to it",
        });
        return;
      }

      const product = productResult.rows[0];

      // Get all responses for the product with question details
      const responsesResult = await pool.query(
        `SELECT pr.*, q.question_text, q.question_type, q.category, q.order_number
       FROM product_responses pr 
       JOIN questions q ON pr.question_id = q.id 
       WHERE pr.product_id = $1
       ORDER BY q.order_number ASC`,
        [productId]
      );

      const responses = responsesResult.rows;

      // Get total number of questions
      const totalQuestionsResult = await pool.query(
        "SELECT COUNT(*) as count FROM questions WHERE is_conditional = false"
      );
      const totalQuestions = parseInt(totalQuestionsResult.rows[0].count);

      // Calculate transparency score
      const transparencyScore = calculateTransparencyScore(
        responses,
        totalQuestions
      );

      // Organize data by category
      const categories = groupByCategory(responses);

      // Calculate category breakdown
      const categoryBreakdown: { [key: string]: number } = {};
      Object.keys(categories).forEach((cat) => {
        const categoryResponses = categories[cat];
        const answered = categoryResponses.filter(
          (r) => r.answer && r.answer.trim() !== ""
        ).length;
        categoryBreakdown[cat] =
          categoryResponses.length > 0
            ? Math.round((answered / categoryResponses.length) * 100)
            : 0;
      });

      // Generate recommendations
      const recommendations = generateRecommendations(
        transparencyScore,
        categories
      );

      // Create report data object
      const reportData: ReportData = {
        product: {
          id: product.id,
          name: product.product_name,
          category: product.category,
          status: product.status,
        },
        responses,
        categories,
        score: transparencyScore,
        generatedAt: new Date().toISOString(),
        insights: {
          completeness: Math.round((responses.length / totalQuestions) * 100),
          categoryBreakdown,
          recommendations,
        },
      };

      // Check if report already exists
      const existingReportResult = await pool.query(
        "SELECT id FROM reports WHERE product_id = $1",
        [productId]
      );

      let report;
      if (existingReportResult.rows.length > 0) {
        // Update existing report
        report = await pool.query(
          `UPDATE reports 
         SET transparency_score = $1, 
             report_data = $2, 
             generated_at = CURRENT_TIMESTAMP 
         WHERE product_id = $3 
         RETURNING *`,
          [transparencyScore, JSON.stringify(reportData), productId]
        );
      } else {
        // Create new report
        report = await pool.query(
          "INSERT INTO reports (product_id, transparency_score, report_data) VALUES ($1, $2, $3) RETURNING *",
          [productId, transparencyScore, JSON.stringify(reportData)]
        );
      }

      res.json({
        message: "Report generated successfully",
        report: report.rows[0],
        reportData,
        insights: reportData.insights,
      });
    } catch (error: any) {
      console.error("Error generating report:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to generate report",
      });
    }
  }
);

router.get(
  "/:productId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      const result = await pool.query(
        `SELECT r.*, p.product_name, p.category, p.status
       FROM reports r 
       JOIN products p ON r.product_id = p.id 
       WHERE r.product_id = $1 AND p.user_id = $2`,
        [productId, req.userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: "Report not found",
          message:
            "No report found for this product. Please generate one first.",
        });
        return;
      }

      const report = result.rows[0];

      // Parse JSON data if it's a string
      if (typeof report.report_data === "string") {
        report.report_data = JSON.parse(report.report_data);
      }

      res.json(report);
    } catch (error: any) {
      console.error("Error fetching report:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch report",
      });
    }
  }
);

router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT r.*, p.product_name, p.category, p.status
       FROM reports r 
       JOIN products p ON r.product_id = p.id 
       WHERE p.user_id = $1 
       ORDER BY r.generated_at DESC`,
        [req.userId]
      );

      // Parse JSON data for each report
      const reports = result.rows.map((report) => {
        if (typeof report.report_data === "string") {
          report.report_data = JSON.parse(report.report_data);
        }
        return report;
      });

      res.json(reports);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch reports",
      });
    }
  }
);

router.delete(
  "/:productId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      // Verify product ownership before deleting report
      const productCheck = await pool.query(
        "SELECT id FROM products WHERE id = $1 AND user_id = $2",
        [productId, req.userId]
      );

      if (productCheck.rows.length === 0) {
        res.status(404).json({
          error: "Product not found",
          message:
            "The requested product does not exist or you do not have access to it",
        });
        return;
      }

      const result = await pool.query(
        "DELETE FROM reports WHERE product_id = $1 RETURNING id",
        [productId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: "Report not found",
          message: "No report found for this product",
        });
        return;
      }

      res.json({
        message: "Report deleted successfully",
        reportId: result.rows[0].id,
      });
    } catch (error: any) {
      console.error("Error deleting report:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to delete report",
      });
    }
  }
);

router.get(
  "/stats/summary",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT 
        COUNT(*) as total_reports,
        AVG(transparency_score) as average_score,
        MAX(transparency_score) as highest_score,
        MIN(transparency_score) as lowest_score
       FROM reports r 
       JOIN products p ON r.product_id = p.id 
       WHERE p.user_id = $1`,
        [req.userId]
      );

      const stats = result.rows[0];

      res.json({
        totalReports: parseInt(stats.total_reports),
        averageScore: parseFloat(stats.average_score).toFixed(1),
        highestScore: parseInt(stats.highest_score) || 0,
        lowestScore: parseInt(stats.lowest_score) || 0,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch statistics",
      });
    }
  }
);

export default router;
