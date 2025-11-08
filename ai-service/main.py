from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = FastAPI(title="Product Transparency AI Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found. AI features will be limited.")
else:
    genai.configure(api_key=GEMINI_API_KEY)
    print("Gemini AI configured successfully")

class QuestionRequest(BaseModel):
    product_name: str
    category: str
    previous_answers: Optional[List[Dict]] = []

class QuestionResponse(BaseModel):
    questions: List[Dict]
    ai_generated: bool = False

class ScoreRequest(BaseModel):
    product_name: str
    category: str
    responses: List[Dict]

class ScoreResponse(BaseModel):
    transparency_score: int
    health_score: int
    ethics_score: int
    recommendations: List[str]
    ai_analysis: str

@app.get("/")
def read_root():
    return {
        "status": "ok", 
        "service": "Product Transparency AI powered by Gemini",
        "gemini_configured": bool(GEMINI_API_KEY),
        "version": "1.0.0"
    }

@app.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions(request: QuestionRequest):
    """
    Generate intelligent follow-up questions using Gemini AI
    """
    try:
        base_questions = get_base_questions()
        category_questions = get_category_questions(request.category)
        
        all_questions = base_questions + category_questions
        
        # Use Gemini AI to generate smart follow-up questions
        if GEMINI_API_KEY:
            try:
                ai_questions = await generate_ai_questions(
                    request.product_name,
                    request.category,
                    request.previous_answers
                )
                all_questions.extend(ai_questions)
                return QuestionResponse(questions=all_questions, ai_generated=True)
            except Exception as e:
                print(f"Gemini AI error: {e}")
                return QuestionResponse(questions=all_questions, ai_generated=False)
        
        return QuestionResponse(questions=all_questions, ai_generated=False)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transparency-score", response_model=ScoreResponse)
async def calculate_transparency_score(request: ScoreRequest):
    """
    Calculate transparency score with AI-powered analysis using Gemini
    """
    try:
        responses = request.responses
        total_questions = len(responses)
        
        if total_questions == 0:
            return ScoreResponse(
                transparency_score=0,
                health_score=0,
                ethics_score=0,
                recommendations=["Add product information to get a transparency score"],
                ai_analysis="No data available for analysis"
            )
        
        # Calculate base scores
        answered = sum(1 for r in responses if r.get('answer') and str(r['answer']).strip())
        completeness = (answered / total_questions * 100)
        
        # Quality scoring
        quality_points = 0
        for response in responses:
            answer = str(response.get('answer', ''))
            if len(answer) > 100:
                quality_points += 3
            elif len(answer) > 50:
                quality_points += 2
            elif len(answer) > 10:
                quality_points += 1
        
        quality_score = min(100, (quality_points / (total_questions * 3) * 100))
        
        # Category-based scoring
        health_score = calculate_category_score(responses, 'health')
        ethics_score = calculate_category_score(responses, 'ethics')
        
        # Overall transparency score
        transparency_score = int((completeness * 0.5) + (quality_score * 0.3) + 
                                ((health_score + ethics_score) / 2 * 0.2))
        
        # Use Gemini AI for intelligent analysis and recommendations
        ai_analysis = "Standard analysis completed"
        recommendations = generate_basic_recommendations(transparency_score)
        
        if GEMINI_API_KEY:
            try:
                ai_result = await analyze_with_gemini(
                    request.product_name,
                    request.category,
                    responses,
                    transparency_score
                )
                ai_analysis = ai_result['analysis']
                recommendations = ai_result['recommendations']
            except Exception as e:
                print(f"Gemini analysis error: {e}")
        
        return ScoreResponse(
            transparency_score=transparency_score,
            health_score=health_score,
            ethics_score=ethics_score,
            recommendations=recommendations,
            ai_analysis=ai_analysis
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def generate_ai_questions(product_name: str, category: str, previous_answers: List[Dict]) -> List[Dict]:
    """Generate smart follow-up questions using Gemini AI"""
    if not GEMINI_API_KEY:
        return []
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        context = f"Product: {product_name}, Category: {category}"
        if previous_answers:
            context += f"\nPrevious answers: {json.dumps(previous_answers[:3])}"
        
        prompt = f"""
        You are an expert in product transparency and consumer health.
        
        {context}
        
        Generate 2-3 intelligent follow-up questions that would help assess:
        1. Health impact and safety
        2. Ethical sourcing and sustainability
        3. Transparency and traceability
        
        Return ONLY a JSON array with this exact structure (no markdown, no explanation):
        [
          {{"id": "unique_id", "question": "question text", "type": "text", "category": "health"}}
        ]
        
        Make questions specific, actionable, and relevant to {category} products.
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean response
        if text.startswith('```json'):
            text = text.replace('```json', '').replace('```', '').strip()
        elif text.startswith('```'):
            text = text.replace('```', '').strip()
        
        questions = json.loads(text)
        return questions if isinstance(questions, list) else []
    
    except Exception as e:
        print(f"AI question generation error: {e}")
        return []

async def analyze_with_gemini(product_name: str, category: str, responses: List[Dict], score: int) -> Dict:
    """Get AI-powered analysis and recommendations using Gemini"""
    if not GEMINI_API_KEY:
        return {
            'analysis': 'AI analysis unavailable',
            'recommendations': generate_basic_recommendations(score)
        }
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        # Prepare response summary
        response_summary = []
        for r in responses[:10]:  # Limit to avoid token limits
            response_summary.append({
                'question': r.get('question', 'Unknown'),
                'answer': str(r.get('answer', ''))[:200]  # Limit length
            })
        
        prompt = f"""
        You are an expert analyst in product transparency, health, and ethics.
        
        Product: {product_name}
        Category: {category}
        Current Transparency Score: {score}/100
        
        Key Responses:
        {json.dumps(response_summary, indent=2)}
        
        Provide:
        1. A 2-3 sentence analysis of the product's transparency, health implications, and ethical practices
        2. 3-5 specific, actionable recommendations for improvement
        
        Return as JSON:
        {{
          "analysis": "your analysis here",
          "recommendations": ["rec 1", "rec 2", "rec 3"]
        }}
        
        Focus on: Health impact, Ethical sourcing, Environmental sustainability, Consumer safety
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean response
        if text.startswith('```json'):
            text = text.replace('```json', '').replace('```', '').strip()
        elif text.startswith('```'):
            text = text.replace('```', '').strip()
        
        result = json.loads(text)
        return result
    
    except Exception as e:
        print(f"Gemini analysis error: {e}")
        return {
            'analysis': f'Product shows {score}% transparency. Further analysis pending.',
            'recommendations': generate_basic_recommendations(score)
        }

def get_base_questions() -> List[Dict]:
    """Base questions for all products"""
    return [
        {
            "id": "ingredients",
            "question": "What are the main ingredients or components?",
            "type": "text",
            "category": "composition"
        },
        {
            "id": "allergens",
            "question": "Does this product contain any allergens?",
            "type": "text",
            "category": "health"
        },
        {
            "id": "origin",
            "question": "Where is this product manufactured?",
            "type": "text",
            "category": "origin"
        },
        {
            "id": "certifications",
            "question": "List any certifications (Organic, Fair Trade, etc.)",
            "type": "text",
            "category": "ethics"
        }
    ]

def get_category_questions(category: str) -> List[Dict]:
    """Category-specific questions"""
    category_map = {
        "Food": [
            {"id": "nutrition", "question": "Provide key nutritional information", "type": "text", "category": "health"},
            {"id": "preservatives", "question": "List any preservatives or additives", "type": "text", "category": "health"},
            {"id": "expiry", "question": "What is the typical shelf life?", "type": "text", "category": "storage"}
        ],
        "Beverage": [
            {"id": "sugar", "question": "Sugar content per serving?", "type": "text", "category": "health"},
            {"id": "artificial", "question": "Any artificial ingredients?", "type": "text", "category": "health"}
        ],
        "Cosmetics": [
            {"id": "testing", "question": "Is this product cruelty-free?", "type": "text", "category": "ethics"},
            {"id": "chemicals", "question": "List potentially harmful chemicals (if any)", "type": "text", "category": "health"}
        ],
        "Supplements": [
            {"id": "clinical", "question": "Has this undergone clinical testing?", "type": "text", "category": "health"},
            {"id": "dosage", "question": "Recommended dosage and warnings?", "type": "text", "category": "health"}
        ]
    }
    return category_map.get(category, [])

def calculate_category_score(responses: List[Dict], category: str) -> int:
    """Calculate score for specific category"""
    category_responses = [r for r in responses if r.get('category') == category]
    if not category_responses:
        return 50  # Default middle score
    
    answered = sum(1 for r in category_responses if r.get('answer') and str(r['answer']).strip())
    return int((answered / len(category_responses)) * 100) if category_responses else 50

def generate_basic_recommendations(score: int) -> List[str]:
    """Generate basic recommendations based on score"""
    if score >= 80:
        return [
            "Excellent transparency! Share this with customers",
            "Consider publishing detailed supply chain information",
            "Add third-party verification for even more credibility"
        ]
    elif score >= 60:
        return [
            "Good transparency foundation",
            "Add more detailed ingredient sourcing information",
            "Include quality control and testing procedures",
            "Consider adding sustainability metrics"
        ]
    elif score >= 40:
        return [
            "Moderate transparency - needs improvement",
            "Provide complete ingredient lists with sources",
            "Add manufacturing process details",
            "Include all relevant certifications",
            "Answer all health and safety questions thoroughly"
        ]
    else:
        return [
            "Low transparency - immediate action needed",
            "Complete all required product information",
            "Provide detailed answers (50+ characters each)",
            "Add certifications and testing results",
            "Include sourcing and manufacturing details",
            "Address all health and safety concerns"
        ]

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("=" * 60)
    print("Product Transparency AI Service")
    print("=" * 60)
    print(f"Starting on http://localhost:{port}")
    print(f"Gemini AI: {'Enabled' if GEMINI_API_KEY else 'Disabled'}")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=port)