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

      // Check if product exists and belongs to user
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

      // Validate status if provided
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

      // Get all conditional questions
      const conditionalResult = await pool.query(
        "SELECT * FROM questions WHERE is_conditional = true"
      );

      // Filter conditional questions based on answers
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

        // Case-insensitive comparison of answer with trigger
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
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { responses } = req.body;

      // Validation
      if (!Array.isArray(responses)) {
        res.status(400).json({
          error: "Invalid input",
          message: "Responses must be an array",
        });
        return;
      }

      // Verify product ownership
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

      // Begin transaction
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Delete existing responses for this product
        await client.query(
          "DELETE FROM product_responses WHERE product_id = $1",
          [id]
        );

        // Insert new responses
        for (const response of responses) {
          if (
            !response.question_id ||
            response.answer === undefined ||
            response.answer === null
          ) {
            continue; // Skip invalid responses
          }

          await client.query(
            "INSERT INTO product_responses (product_id, question_id, answer) VALUES ($1, $2, $3)",
            [id, response.question_id, String(response.answer)]
          );
        }

        // Update product status to completed
        await client.query(
          "UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          ["completed", id]
        );

        await client.query("COMMIT");

        res.json({
          message: "Responses saved successfully",
          count: responses.length,
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error("Error saving responses:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to save responses",
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

      // Verify product ownership
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

      // Get responses with question details
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
