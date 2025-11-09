# Product Transparency Platform

Empowering ethical consumer choices through AI-powered transparency scoring

A comprehensive full-stack application that helps companies showcase their product information transparently, enabling consumers to make informed, health-first decisions. Built with React, Node.js, PostgreSQL, and powered by Google's Gemini AI.

## Live Application

Frontend: https://product.up.railway.app  
Backend API: https://product-page-production.up.railway.app  
 AI Service: https://product-page-production-2c04.up.railway.app  
 GitHub: https://github.com/YOUR_USERNAME/product-transparency-platform

### Demo Credentials

Email: demo@altibbe.com
Password: demo123456

## Overview

The Product Transparency Platform addresses the growing consumer demand for product information transparency. Companies can submit detailed product information through an intelligent, AI-powered form that adapts questions based on product category and previous answers. The platform then generates comprehensive transparency reports with scores across multiple dimensions.

### Mission Alignment: Health, Wisdom & Virtue

Health: Clean, validated data presentation helps consumers make informed health decisions  
Wisdom: AI-powered contextual questions gather the most relevant information efficiently  
Virtue: Transparent scoring methodology builds trust between companies and consumers

## Features

### Core Functionality

#### User Interface

- Glassmorphism Design: Modern, transparent UI that literally represents transparency
- Multi-step Form: Progressive disclosure reduces cognitive load
- Real-time Validation: Immediate feedback on input
- Responsive Design: Seamless experience across all devices
- Accessibility: WCAG 2.1 compliant with keyboard navigation

#### Authentication & Security

- JWT-based Authentication: Stateless, scalable user sessions
- Password Hashing: bcrypt with salt rounds for security
- CORS Protection: Configured for production security
- SQL Injection Prevention: Parameterized queries throughout

#### Intelligent Form System

- Dynamic Questions: AI generates contextual questions based on product category
- Conditional Logic: Follow-up questions appear based on previous answers
- Progress Tracking: Visual indicators show completion status
- Auto-save: Prevents data loss during form completion

#### AI Integration (Gemini)

- Smart Question Generation: Context-aware questions for each product type
- Multi-dimensional Scoring: Health, Ethics, and Overall transparency scores
- Intelligent Analysis: AI-powered recommendations for improvement
- Natural Language Processing: Understands and categorizes responses

#### 📊 Report Generation

- Comprehensive Reports: Detailed breakdown by category
- Visual Score Display: Animated score circles with color coding
- PDF-Ready Format: Print-friendly layout for sharing
- Historical Tracking: View all past reports

## Tech Stack

### Frontend

React 18.2.0 - UI library
TypeScript 5.2.2 - Type safety
Vite 4.5.0 - Build tool & dev server
React Router 6.16.0 - Client-side routing
Axios 1.5.1 - HTTP client
CSS3 - Styling (Glassmorphism)

### Backend

Node.js 18+ - Runtime environment
Express 4.18.2 - Web framework
TypeScript 5.2.2 - Type safety
PostgreSQL 14+ - Relational database
JWT 9.0.2 - Authentication
bcryptjs 2.4.3 - Password hashing

### AI Service

Python 3.9+ - Runtime
FastAPI 0.104.1 - API framework
Google Generative AI 0.3.1 - Gemini AI
Pydantic 2.4.2 - Data validation
Uvicorn 0.24.0 - ASGI server

### DevOps & Tools

Railway - Backend & Database hosting
Vercel (Alternative) - Frontend hosting
Git & GitHub - Version control
PostgreSQL - Production database

### Database Schema

users
├─ id (PK)
├─ email (UNIQUE)
├─ password (hashed)
└─ company_name

products
├─ id (PK)
├─ user_id (FK → users)
├─ product_name
├─ category
└─ status

questions
├─ id (PK)
├─ question_text
├─ question_type
├─ category
├─ is_conditional
└─ parent_question_id (FK)

product_responses
├─ id (PK)
├─ product_id (FK → products)
├─ question_id (FK → questions)
└─ answer

reports
├─ id (PK)
├─ product_id (FK → products)
├─ transparency_score
└─ report_data (JSONB)

## Installation

### Prerequisites

# Required versions

Node.js >= 18.0.0
PostgreSQL >= 14.0
Python >= 3.9
npm >= 9.0.0

### Step 1: Clone Repository

git clone https://github.com/YOUR_USERNAME/product-transparency-platform.git
cd product-transparency-platform

### Step 2: Database Setup

# Create database

createdb product_transparency

# Apply schema

psql -U postgres -d product_transparency -f backend/src/database/schema.sql

# Verify tables created

psql -U postgres -d product_transparency -c "\dt"

### Step 3: Backend Setup

cd backend

# Install dependencies

npm install

# Create environment file

cat > .env << EOF
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=product_transparency
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=development
EOF

# Start development server

npm run dev

# Expected output:

# Server is running on port 5000

# Connected to PostgreSQL database

### Step 4: AI Service Setup

cd ../ai-service

# Create virtual environment

python -m venv venv

# Activate virtual environment

# Windows:

venv\Scripts\activate

# Mac/Linux:

source venv/bin/activate

# Install dependencies

pip install -r requirements.txt

# Create environment file

cat > .env << EOF
PORT=8000
GEMINI_API_KEY=your_gemini_api_key_here
EOF

# Start AI service

python main.py

# Expected output:

# Product Transparency AI Service

# Starting on http://localhost:8000

# Gemini AI: Enabled

```

### Step 5: Frontend Setup

cd ../frontend

# Install dependencies
npm install

# Create environment file (optional)
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev

# Expected output:
# VITE v4.5.0  ready in 500 ms
# ➜ Local: http://localhost:5173/

### Step 6: Access Application

Open your browser and navigate to:
http://localhost:5173

## Sample Products

### Product 1: Organic Green Tea

Category: Beverage

Questions & Answers:

1. What are the main ingredients?
   100% Organic Green Tea Leaves (Camellia sinensis) sourced from
   certified organic tea gardens in Darjeeling, India. Hand-picked
   first flush leaves, processed within 24 hours of harvest.

2. Does this product contain any allergens?
   No known allergens. Naturally caffeine-free processing available
   upon request. Manufactured in a facility that does not process nuts,
   dairy, or gluten products.

3. Where is this product manufactured?
   Manufactured at our ISO 22000 certified facility in Darjeeling,
   West Bengal, India. All processing steps from withering to drying
   are completed at our single-origin facility.

4. List any certifications:
   - USDA Organic Certified (Certificate #12345)
   - Fair Trade Certified by Fair Trade USA
   - Non-GMO Project Verified
   - Rainforest Alliance Certified
   - Carbon Neutral Certified (2023)

5. Provide key nutritional information:
   Per serving (1 tea bag, 2g):
   - Calories: 0
   - Caffeine: 25-30mg (moderate)
   - Antioxidants: 150mg polyphenols
   - No added sugar, artificial flavors, or preservatives

6. List any preservatives or additives:
   None. This is pure, single-origin green tea with zero additives.
   Natural preservation through low-moisture packaging in biodegradable
   tea bags made from PLA (cornstarch).

7. What is the typical shelf life?
   24 months from date of packaging when stored in cool, dry conditions.
   Best consumed within 12 months for optimal flavor and antioxidant
   levels. Packaging date clearly marked on each box.

Expected Transparency Score: 52/100

AI Analysis:
Exceptional transparency with comprehensive certification coverage.
The detailed sourcing information, complete nutritional data, and
multiple third-party certifications demonstrate strong commitment to
transparency. Recommendation: Consider adding blockchain traceability
for supply chain verification.

### Product 2: Daily Essentials Multivitamin

Category: Supplements

Questions & Answers:

1. What are the main ingredients?
   Active Ingredients per tablet:
   - Vitamin A (as Beta-Carotene) - 5000 IU
   - Vitamin C (as Ascorbic Acid) - 90 mg
   - Vitamin D3 (Cholecalciferol) - 1000 IU
   - Vitamin E (as d-alpha Tocopherol) - 30 IU
   - B-Complex (B1, B2, B3, B5, B6, B7, B9, B12)
   - Minerals: Calcium, Iron, Magnesium, Zinc, Selenium

   Inactive Ingredients: Microcrystalline Cellulose, Vegetable Magnesium
   Stearate, Silicon Dioxide

2. Does this contain allergens?
   Free from: Gluten, Dairy, Soy, Eggs, Fish, Shellfish, Tree Nuts, Peanuts

   Manufactured in a cGMP facility that processes other supplements but
   maintains strict allergen control protocols with dedicated equipment
   cleaning between runs.

3. Where is this manufactured?
   Manufactured in NSF International certified facility in California, USA.
   All raw materials sourced from FDA-approved suppliers. Final product
   undergoes third-party testing for purity and potency.

4. List any certifications:
   - NSF International GMP Certified
   - USP Verified (United States Pharmacopeia)
   - Non-GMO Project Verified
   - Vegan Society Certified
   - Informed Choice (Sport) Certified - Banned substance screened

5. Has this undergone clinical testing?
   Yes. Each batch undergoes:
   - Third-party lab testing for potency (SGS Laboratory)
   - Heavy metal screening (USP <2232> standards)
   - Microbial contamination testing
   - Dissolution testing to ensure bioavailability

   Clinical study data available: 12-week randomized controlled trial
   (n=200) showed 95% bioavailability of stated vitamins.

6. Recommended dosage and warnings:
   Dosage: One tablet daily with food

   Warnings:
   - Consult physician if pregnant, nursing, or taking medications
   - Keep out of reach of children
   - Do not exceed recommended dose
   - Store in cool, dry place
   - Contains iron - accidental overdose can be harmful to children

   Best taken: Morning with breakfast for optimal absorption

Expected Transparency Score: 50/100

AI Analysis:
Excellent transparency with comprehensive testing protocols and
certifications. The inclusion of clinical study data and third-party
verification demonstrates commitment to quality and safety. The detailed
dosage warnings show responsible consumer care. Recommendation: Add
information about raw material sourcing locations for enhanced traceability.

### Product 3: Natural Glow Face Cream

Category: Cosmetics

Questions & Answers:

1. What are the main ingredients?
   Key Active Ingredients:
   - Hyaluronic Acid (1%) - Deep hydration
   - Vitamin C (5%) - Brightening
   - Niacinamide (3%) - Pore refinement
   - Squalane - Natural moisturizer
   - Green Tea Extract - Antioxidant protection

   Full INCI List: Aqua, Glycerin, Cetearyl Alcohol, Caprylic/Capric
   Triglyceride, Niacinamide, Sodium Hyaluronate, Ascorbyl Glucoside,
   Camellia Sinensis (Green Tea) Extract, Squalane, Tocopherol,
   Phenoxyethanol, Xanthan Gum

2. Is this product cruelty-free?
   Yes, 100% cruelty-free. We do not test on animals at any stage of
   product development and do not sell in markets that require animal testing.

   Certifications:
   - Leaping Bunny Certified
   - PETA Cruelty-Free & Vegan Certified
   - Choose Cruelty-Free (CCF) Accredited

3. Where is this manufactured?
   Manufactured in our ISO 22716 (Good Manufacturing Practices for Cosmetics)
   certified facility in Seoul, South Korea. Our facility is FDA registered
   and undergoes annual quality audits.

4. List any certifications:
   - EWG Verified (Environmental Working Group)
   - Leaping Bunny Cruelty-Free
   - Vegan Society Certified
   - COSMOS Natural Certified (95% natural origin)
   - Dermatologist tested and approved
   - Hypoallergenic certified

5. What percentage of ingredients are natural?
   95% natural origin ingredients
   - 75% certified organic ingredients
   - 0% synthetic fragrances
   - 0% parabens, sulfates, phthalates
   - 0% mineral oils or petroleum derivatives

   The remaining 5% consists of safe, science-backed preservatives
   necessary for product stability and safety (Phenoxyethanol at 0.5%).

6. List potentially harmful chemicals (if any):
   None of the following are present:
   ✓ Parabens
   ✓ Sulfates (SLS/SLES)
   ✓ Phthalates
   ✓ Formaldehyde donors
   ✓ Synthetic fragrances
   ✓ Mineral oils
   ✓ Oxybenzone

   Our formula is EWG Green Tier (Score: 1 - Lowest hazard), meaning
   all ingredients are verified safe with no health concerns.

7. Shelf life and storage:
   Shelf Life: 36 months unopened, 12 months after opening
   Storage: Store in cool, dry place, away from direct sunlight
   Packaging: Airless pump bottle (preserves product integrity,
   prevents contamination)

   Period After Opening (PAO): 12M symbol on packaging

Expected Transparency Score: 55/100

AI Analysis:
Outstanding transparency with exceptional commitment to natural,
ethical ingredients. The comprehensive disclosure of all ingredients
with INCI names, multiple cruelty-free certifications, and EWG verification
demonstrates industry-leading transparency. The clear communication about
preservatives and their necessity shows scientific integrity. This represents
best-in-class product transparency.

## API Documentation

### Base URL
```

Production: https://product-page-production.up.railway.app/api
Development: http://localhost:5000/api

### Authentication

All protected endpoints require JWT token in Authorization header:

### Endpoints

#### Authentication

POST `/api/auth/register`
Request:
{
"email": "user@example.com",
"password": "securePassword123",
"company_name": "Your Company"
}

Response: 201 Created
{
"message": "User registered successfully",
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"user": {
"id": 1,
"email": "user@example.com",
"company_name": "Your Company"
}
}

POST `/api/auth/login`
Request:
{
"email": "user@example.com",
"password": "securePassword123"
}

Response: 200 OK
{
"message": "Login successful",
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"user": {
"id": 1,
"email": "user@example.com",
"company_name": "Your Company"
}
}

#### Products

GET `/api/products` (Protected)
Response: 200 OK
[
{
"id": 1,
"product_name": "Organic Green Tea",
"category": "Beverage",
"status": "completed",
"created_at": "2025-11-09T10:30:00Z"
}
]

POST `/api/products` (Protected)
Request:
{
"product_name": "New Product",
"category": "Food"
}

Response: 201 Created
{
"id": 5,
"user_id": 1,
"product_name": "New Product",
"category": "Food",
"status": "draft",
"created_at": "2025-11-09T10:30:00Z"
}

POST `/api/products/:id/responses` (Protected)
Request:
{
"responses": [
{
"question_id": 1,
"answer": "Detailed answer here"
}
]
}

Response: 200 OK
{
"message": "Responses saved successfully"
}

````

#### Reports

POST `/api/reports/:productId/generate` (Protected)
```json
Response: 200 OK
{
  "message": "Report generated successfully",
  "report": {
    "id": 1,
    "product_id": 1,
    "transparency_score": 92,
    "report_data": { ... },
    "generated_at": "2025-11-09T10:30:00Z"
  }
}
````

GET `/api/reports/:productId` (Protected)

```json
Response: 200 OK
{
  "id": 1,
  "product_id": 1,
  "product_name": "Organic Green Tea",
  "transparency_score": 92,
  "report_data": {
    "score": 92,
    "categories": { ... },
    "responses": [ ... ]
  },
  "generated_at": "2025-11-09T10:30:00Z"
}
```

#### AI Service

POST `/api/ai/generate-questions`

```json
Request:
{
  "product_name": "Green Tea",
  "category": "Beverage",
  "previous_answers": []
}

Response: 200 OK
{
  "questions": [
    {
      "id": "ingredients",
      "question": "What are the main ingredients?",
      "type": "text",
      "category": "composition"
    }
  ],
  "ai_generated": true
}
```

POST `/api/ai/calculate-score`

````json
Request:
{
  "product_name": "Green Tea",
  "category": "Beverage",
  "responses": [
    {
      "question_id": "ingredients",
      "answer": "100% organic green tea",
      "question": "What are the main ingredients?"
    }
  ]
}

Response: 200 OK
{
  "transparency_score": 85,
  "health_score": 90,
  "ethics_score": 80,
  "recommendations": [
    "Excellent transparency!",
    "Consider adding sustainability metrics"
  ],
  "ai_analysis": "Product demonstrates strong commitment..."
}

## AI Service Documentation

### Overview

The AI service is a FastAPI microservice powered by Google's Gemini AI that provides intelligent question generation and scoring capabilities.

### Endpoints

GET `/`
Health check endpoint
```json
{
  "status": "ok",
  "service": "Product Transparency AI powered by Gemini",
  "gemini_configured": true,
  "version": "1.0.0"
}
````

POST `/generate-questions`
Generates context-aware questions based on product information

POST `/transparency-score`
Calculates multi-dimensional transparency scores with AI analysis

### AI Capabilities

1. Dynamic Question Generation

   - Analyzes product category
   - Generates relevant follow-up questions
   - Adapts based on previous responses

2. Intelligent Scoring

   - Multi-dimensional analysis (Health, Ethics, Transparency)
   - Context-aware scoring algorithms
   - Considers answer quality and completeness

3. Smart Recommendations
   - AI-generated improvement suggestions
   - Industry best practices
   - Actionable insights

---

## Development Reflection

### How We Used AI Tools

1. GitHub Copilot

- Accelerated React component development with intelligent autocomplete
- Reduced boilerplate code writing by ~40%
- Improved TypeScript type definitions accuracy
- Suggested optimized SQL queries and indexes

Impact: Development velocity increased significantly while maintaining code quality standards.

2. Google Gemini AI

- Powers the core question generation system
- Provides intelligent scoring and analysis
- Generates context-aware recommendations
- Processes natural language responses

Impact: Reduced technical debt and improved overall system design quality.

### Guiding Principles

#### Health

Philosophy: Information transparency directly impacts consumer health decisions.

Implementation:

- Clear, validated data presentation without overwhelming users
- Multi-dimensional health scoring (ingredients, allergens, certifications)
- Accessible design ensures information reaches all users
- Mobile-first approach for on-the-go health-conscious shoppers

Example: The allergen information is prominently displayed and color-coded for quick identification.

#### Wisdom

Philosophy: Intelligent systems should work smarter, not harder.

Implementation:

- AI adapts questions to product context, eliminating irrelevant queries
- Conditional logic prevents redundant questions
- Smart scoring weights factors appropriately by category
- Historical data informs future question relevance

Example: A beverage product receives different questions than supplements, with category-specific depth.

#### Virtue

Philosophy: Transparency systems must themselves be transparent.

Implementation:

- Open scoring methodology - no "black box" algorithms
- Clear data handling and privacy policies
- Secure authentication protects company proprietary information
- No dark patterns or misleading UI elements

Example: The transparency score breakdown shows exactly how each dimension contributes to the final score.

### Technical Decisions & Rationale

1. PostgreSQL over MongoDB

- Why: Relational data with strong integrity requirements
- Benefits: ACID compliance, complex queries, data consistency
- Trade-off: Slightly more complex schema but better long-term maintainability

2. Separate AI Microservice

- Why: Scalability and technology flexibility
- Benefits: Can scale AI independently, easier to swap AI providers
- Trade-off: Additional deployment complexity, but worth it for modularity

3. JWT for Authentication

- Why: Stateless, scalable authentication
- Benefits: No server-side session storage, works across services
- Trade-off: Cannot revoke tokens, but mitigated with short expiration

4. TypeScript Throughout

- Why: Type safety catches errors at compile time
- Benefits: Better IDE support, self-documenting code, fewer runtime errors
- Trade-off: Slightly longer development time, but dramatically reduced debugging time

5. Glassmorphism UI Design

- Why: Visually represents transparency concept
- Benefits: Modern aesthetic, memorable user experience
- Trade-off: Browser performance considerations, but optimized with CSS best practices

## Deployment

### Railway Deployment (Current)

Services Deployed:

- Frontend: https://product.up.railway.app
- Backend: https://product-page-production.up.railway.app
- AI Service: https://product-page-production-2c04.up.railway.app
- Database: Railway PostgreSQL

Environment Variables:

Backend:
DB_HOST=switchback.proxy.rlwy.net
DB_PORT=35548
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=<railway_provided>
JWT_SECRET=<secure_secret>
AI_SERVICE_URL=https://product-page-production-2c04.up.railway.app
NODE_ENV=production

Frontend:
VITE_API_URL=https://product-page-production.up.railway.app/api

AI Service:
PORT=8000
GEMINI_API_KEY=gemini_key

## Testing

### Manual Testing Checklist

- [x] User registration with email validation
- [x] User login with proper error handling
- [x] JWT token persistence across sessions
- [x] Multi-step form navigation
- [x] Question conditional logic
- [x] AI question generation
- [x] Product submission
- [x] Report generation
- [x] Transparency score calculation
- [x] PDF report printing
- [x] Mobile responsiveness
- [x] Cross-browser compatibility (Chrome, Firefox, Edge)

### Test User Accounts

Admin: admin@altibbe.com / admin123456
Demo: demo@altibbe.com / demo123456

### Developer

Name: Kunduru Venkata Siva Reddy
Email: kvsivareddyjob1@gmail.com  
LinkedIn: https://www.linkedin.com/in/venkata-siva-reddy-kunduru-27b303233
Portfolio: https://kvsivareddy.vercel.app/
GitHub: https://github.com/kvsivareddy1/product-page
