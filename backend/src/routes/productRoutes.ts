import express, { Request, Response, Router } from "express";
import pool from "../config/database";
import authenticateToken, { AuthRequest } from "../middleware/authMiddleware";

const router: Router = express.Router();

router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await pool.query(
        "SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC",
        [req.userId]
      );

      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch products",
      });
    }
  }
);

router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        "SELECT * FROM products WHERE id = $1 AND user_id = $2",
        [id, req.userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: "Product not found",
          message:
            "The requested product does not exist or you do not have access to it",
        });
        return;
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Error fetching product:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch product",
      });
    }
  }
);

router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { product_name, category } = req.body;

    if (!product_name) {
      return res.status(400).json({ error: "Product name is required" });
    }

    const result = await pool.query(
      "INSERT INTO products (user_id, product_name, category, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.userId, product_name, category, "draft"]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { product_name, category, status } = req.body;

      const checkResult = await pool.query(
        "SELECT id FROM products WHERE id = $1 AND user_id = $2",
        [id, req.userId]
      );

      if (checkResult.rows.length === 0) {
        res.status(404).json({
          error: "Product not found",
          message:
            "The requested product does not exist or you do not have access to it",
        });
        return;
      }

      if (status && !["draft", "completed", "archived"].includes(status)) {
        res.status(400).json({
          error: "Invalid status",
          message: "Status must be draft, completed, or archived",
        });
        return;
      }

      const result = await pool.query(
        `UPDATE products 
       SET product_name = COALESCE($1, product_name), 
           category = COALESCE($2, category), 
           status = COALESCE($3, status), 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
        [product_name, category, status, id, req.userId]
      );

      res.json({
        message: "Product updated successfully",
        product: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to update product",
      });
    }
  }
);

router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        "DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING id",
        [id, req.userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: "Product not found",
          message:
            "The requested product does not exist or you do not have access to it",
        });
        return;
      }

      res.json({
        message: "Product deleted successfully",
        productId: result.rows[0].id,
      });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to delete product",
      });
    }
  }
);

router.get(
  "/questions/all",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await pool.query(
        "SELECT * FROM questions ORDER BY order_number ASC, id ASC"
      );

      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch questions",
      });
    }
  }
);

router.get(
  "/questions/base",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await pool.query(
        "SELECT * FROM questions WHERE is_conditional = false ORDER BY order_number ASC"
      );

      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching base questions:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch questions",
      });
    }
  }
);

router.post(
  "/questions/next",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { answeredQuestions } = req.body;

      if (!Array.isArray(answeredQuestions)) {
        res.status(400).json({
          error: "Invalid input",
          message: "answeredQuestions must be an array",
        });
        return;
      }

      const conditionalResult = await pool.query(
        "SELECT * FROM questions WHERE is_conditional = true"
      );

      const nextQuestions = conditionalResult.rows.filter((question) => {
        if (!question.parent_question_id || !question.trigger_answer) {
          return false;
        }

        const parentAnswer = answeredQuestions.find(
          (a: any) => a.question_id === question.parent_question_id
        );

        if (!parentAnswer) {
          return false;
        }

        return (
          parentAnswer.answer.toLowerCase().trim() ===
          question.trigger_answer.toLowerCase().trim()
        );
      });

      res.json({
        conditionalQuestions: nextQuestions,
        count: nextQuestions.length,
      });
    } catch (error: any) {
      console.error("Error fetching conditional questions:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch conditional questions",
      });
    }
  }
);

router.post(
  "/:id/responses",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { responses } = req.body;

      console.log("Saving responses for product:", id);
      console.log("Responses received:", responses);

      const product = await pool.query(
        "SELECT * FROM products WHERE id = $1 AND user_id = $2",
        [id, req.userId]
      );

      if (product.rows.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      await pool.query("DELETE FROM product_responses WHERE product_id = $1", [
        id,
      ]);

      const allQuestions = await pool.query("SELECT * FROM questions");
      const questionMap = new Map(
        allQuestions.rows.map((q) => [q.id.toString(), q.id])
      );

      const questionTextMap = new Map(
        allQuestions.rows.map((q) => [q.question_text.toLowerCase(), q.id])
      );

      const insertPromises = responses.map(async (response: any) => {
        let questionId = response.question_id;

        if (typeof questionId === "string" && isNaN(parseInt(questionId))) {
          const matchingQuestion = allQuestions.rows.find((q) =>
            q.question_text.toLowerCase().includes(questionId.toLowerCase())
          );

          if (matchingQuestion) {
            questionId = matchingQuestion.id;
            console.log(
              `Mapped "${response.question_id}" to question ID ${questionId}`
            );
          } else {
            console.error(
              `Could not find question for ID: ${response.question_id}`
            );
            return null;
          }
        }

        const numericQuestionId = parseInt(questionId);

        if (isNaN(numericQuestionId)) {
          console.error(`Invalid question_id: ${response.question_id}`);
          return null;
        }

        return pool.query(
          "INSERT INTO product_responses (product_id, question_id, answer) VALUES ($1, $2, $3)",
          [id, numericQuestionId, response.answer]
        );
      });

      const validPromises = insertPromises.filter((p: any) => p !== null);
      await Promise.all(validPromises);

      await pool.query(
        "UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        ["completed", id]
      );

      res.json({
        message: "Responses saved successfully",
        count: validPromises.length,
      });
    } catch (error: any) {
      console.error("Save responses error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to save responses",
        details: error.message,
      });
    }
  }
);

router.get(
  "/:id/responses",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const productCheck = await pool.query(
        "SELECT id FROM products WHERE id = $1 AND user_id = $2",
        [id, req.userId]
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
        `SELECT pr.*, q.question_text, q.question_type, q.category, q.order_number
       FROM product_responses pr 
       JOIN questions q ON pr.question_id = q.id 
       WHERE pr.product_id = $1
       ORDER BY q.order_number ASC`,
        [id]
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching responses:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch responses",
      });
    }
  }
);

export default router;
