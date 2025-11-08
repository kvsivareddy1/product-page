-- Product Transparency Platform Database Schema
-- PostgreSQL 18

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS product_responses CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS TABLE
-- Stores company/user authentication information
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- PRODUCTS TABLE
-- Stores product information submitted by companies
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- QUESTIONS TABLE
-- Stores all questions with conditional logic support
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('text', 'multiple_choice', 'boolean', 'number', 'textarea')),
    category VARCHAR(100) NOT NULL,
    options JSONB, -- For multiple choice questions, stores array of options
    is_conditional BOOLEAN DEFAULT FALSE,
    parent_question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
    trigger_answer TEXT, -- What answer triggers this conditional question
    order_number INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    placeholder_text TEXT,
    help_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_parent ON questions(parent_question_id);
CREATE INDEX idx_questions_order ON questions(order_number);

-- PRODUCT RESPONSES TABLE
-- Stores answers to questions for each product
CREATE TABLE product_responses (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, question_id) -- Ensure one answer per question per product
);

-- Add indexes
CREATE INDEX idx_product_responses_product_id ON product_responses(product_id);
CREATE INDEX idx_product_responses_question_id ON product_responses(question_id);

-- REPORTS TABLE
-- Stores generated transparency reports
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transparency_score INTEGER CHECK (transparency_score >= 0 AND transparency_score <= 100),
    report_data JSONB NOT NULL,
    pdf_url TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id) -- One report per product
);

-- Add indexes
CREATE INDEX idx_reports_product_id ON reports(product_id);
CREATE INDEX idx_reports_generated_at ON reports(generated_at DESC);
CREATE INDEX idx_reports_score ON reports(transparency_score);

-- SEED DATA - Base Questions
-- Basic Information Questions
INSERT INTO questions (question_text, question_type, category, order_number, is_conditional, help_text) VALUES
('What is the product name?', 'text', 'basic', 1, false, 'Enter the full name of your product'),
('What category does this product belong to?', 'multiple_choice', 'basic', 2, false, 'Select the most appropriate category'),
('Provide a brief product description', 'textarea', 'basic', 3, false, 'Describe your product in 2-3 sentences');

-- Category options for question 2
UPDATE questions SET options = '["Food", "Beverage", "Cosmetics", "Supplements", "Personal Care", "Household", "Other"]'::jsonb WHERE question_text = 'What category does this product belong to?';

-- Health & Safety Questions
INSERT INTO questions (question_text, question_type, category, order_number, is_conditional, help_text) VALUES
('Does this product contain any allergens?', 'boolean', 'health', 4, false, 'Common allergens include dairy, nuts, gluten, soy, etc.'),
('Is this product organic?', 'boolean', 'health', 5, false, 'Certified organic by recognized authority'),
('Does this product contain artificial preservatives?', 'boolean', 'health', 6, false, 'Chemical preservatives added to extend shelf life'),
('What is the shelf life of this product?', 'text', 'health', 7, false, 'e.g., "12 months" or "Best before 2 years"');

-- Conditional question for allergens
INSERT INTO questions (question_text, question_type, category, order_number, is_conditional, parent_question_id, trigger_answer, help_text) VALUES
('Please list all allergens present in this product', 'textarea', 'health', 8, true, 4, 'yes', 'List each allergen on a new line or separated by commas');

-- Ingredients & Composition Questions
INSERT INTO questions (question_text, question_type, category, order_number, is_conditional, help_text) VALUES
('List the main ingredients', 'textarea', 'ingredients', 9, false, 'List in descending order by weight'),
('Are all ingredients listed on the packaging?', 'boolean', 'ingredients', 10, false, 'Full ingredient transparency'),
('Does this product contain GMO ingredients?', 'boolean', 'ingredients', 11, false, 'Genetically Modified Organisms');

-- Origin & Manufacturing Questions
INSERT INTO questions (question_text, question_type, category, order_number, is_conditional, help_text) VALUES
('What is the country of origin?', 'text', 'origin', 12, false, 'Where is the product manufactured'),
('Do you own the manufacturing facility?', 'boolean', 'origin', 13, false, 'In-house vs contract manufacturing'),
('Are your suppliers verified for ethical practices?', 'boolean', 'ethics', 14, false, 'Fair labor, environmental standards');

-- Certifications & Standards Questions
INSERT INTO questions (question_text, question_type, category, order_number, is_conditional, help_text) VALUES
('Does your product have any certifications?', 'multiple_choice', 'certifications', 15, false, 'Select all that apply');

-- Certification options
UPDATE questions SET options = '["Organic", "Fair Trade", "Non-GMO", "Vegan", "Cruelty-Free", "Kosher", "Halal", "USDA Certified", "None"]'::jsonb WHERE question_text = 'Does your product have any certifications?';

-- Sustainability Questions
INSERT INTO questions (question_text, question_type, category, order_number, is_conditional, help_text) VALUES
('Is your packaging recyclable?', 'boolean', 'sustainability', 16, false, 'Can packaging be recycled in standard facilities'),
('What percentage of packaging is made from recycled materials?', 'number', 'sustainability', 17, false, 'Enter a number between 0-100'),
('Do you have a carbon offset program?', 'boolean', 'sustainability', 18, false, 'Carbon neutrality initiatives');

-- Testing & Quality Questions
INSERT INTO questions (question_text, question_type, category, order_number, is_conditional, help_text) VALUES
('Has this product undergone third-party testing?', 'boolean', 'quality', 19, false, 'Independent laboratory testing'),
('Do you conduct regular quality audits?', 'boolean', 'quality', 20, false, 'Internal and external audits');

-- Additional Information
INSERT INTO questions (question_text, question_type, category, order_number, is_conditional, help_text) VALUES
('Any additional transparency information you want to share?', 'textarea', 'additional', 21, false, 'Optional: Share any other relevant information');

-- FUNCTIONS & TRIGGERS
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_responses_updated_at BEFORE UPDATE ON product_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SAMPLE DATA (Optional - for testing)
-- Insert a test user (password is 'password123' hashed with bcrypt)
-- Note: In production, use proper registration flow
INSERT INTO users (email, password, company_name) VALUES
('demo@example.com', '$2a$10$YourHashedPasswordHere', 'Demo Company');

-- VERIFICATION QUERIES
-- Count tables
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'questions', COUNT(*) FROM questions
UNION ALL
SELECT 'product_responses', COUNT(*) FROM product_responses
UNION ALL
SELECT 'reports', COUNT(*) FROM reports;

-- List all questions by category
SELECT category, COUNT(*) as question_count 
FROM questions 
GROUP BY category 
ORDER BY category;

COMMIT;