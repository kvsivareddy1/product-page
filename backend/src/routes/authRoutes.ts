import express, { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database";

const router: Router = express.Router();

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, company_name } = req.body;

    // Validation
    if (!email || !password || !company_name) {
      res.status(400).json({
        error: "All fields are required",
        details: {
          email: !email ? "Email is required" : null,
          password: !password ? "Password is required" : null,
          company_name: !company_name ? "Company name is required" : null,
        },
      });
      return;
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({
        error: "Invalid email format",
        message: "Please provide a valid email address",
      });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      res.status(400).json({
        error: "Weak password",
        message: "Password must be at least 6 characters long",
      });
      return;
    }

    // Check if user already exists
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (userCheck.rows.length > 0) {
      res.status(400).json({
        error: "Email already registered",
        message: "An account with this email already exists",
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      "INSERT INTO users (email, password, company_name) VALUES ($1, $2, $3) RETURNING id, email, company_name, created_at",
      [email.toLowerCase(), hashedPassword, company_name]
    );

    const newUser = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Return success response
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        company_name: newUser.company_name,
        created_at: newUser.created_at,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Server error",
      message: "An error occurred during registration. Please try again.",
    });
  }
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        error: "Email and password are required",
        details: {
          email: !email ? "Email is required" : null,
          password: !password ? "Password is required" : null,
        },
      });
      return;
    }

    // Find user by email
    const result = await pool.query(
      "SELECT id, email, password, company_name, created_at FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
      return;
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Return success response (without password)
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        company_name: user.company_name,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Server error",
      message: "An error occurred during login. Please try again.",
    });
  }
});

router.get("/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        error: "No token provided",
        message: "Authentication token is required",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as { userId: number };

    // Get user data
    const result = await pool.query(
      "SELECT id, email, company_name, created_at FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: "User not found",
        message: "The user associated with this token no longer exists",
      });
      return;
    }

    res.json({
      valid: true,
      user: result.rows[0],
    });
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      res.status(401).json({
        error: "Invalid token",
        message: "The provided token is invalid",
      });
      return;
    }

    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        error: "Token expired",
        message: "Your session has expired. Please login again",
      });
      return;
    }

    console.error("Token verification error:", error);
    res.status(500).json({
      error: "Server error",
      message: "An error occurred during token verification",
    });
  }
});

export default router;
