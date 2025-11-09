import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProductForm.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Question {
  id: number | string;
  question_text?: string;
  question?: string;
  question_type: string;
  type?: string;
  category: string;
  is_conditional?: boolean;
  parent_question_id?: number | null;
  trigger_answer?: string | null;
}

interface Response {
  question_id: number | string;
  answer: string;
}

const ProductForm: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    checkAIService();
  }, []);

  const checkAIService = async () => {
    try {
      const response = await axios.get(`${API_URL}/ai/health`);
      setAiEnabled(response.data.ai_service === "connected");
    } catch (error) {
      setAiEnabled(false);
    }
  };

  const handleNext = async () => {
    if (step === 1 && productName) {
      // Generate AI questions when moving to step 2
      if (aiEnabled) {
        await fetchAIQuestions();
      } else {
        await fetchBasicQuestions();
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const fetchAIQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/ai/generate-questions`, {
        product_name: productName,
        category: category,
        previous_answers: responses,
      });

      const aiQuestions = response.data.questions.map(
        (q: any, index: number) => ({
          id: q.id || `ai_${index}`,
          question_text: q.question || q.question_text,
          question_type: q.type || q.question_type || "text",
          category: q.category || "general",
          is_conditional: false,
        })
      );

      setQuestions(aiQuestions);

      if (response.data.ai_generated) {
        console.log("✨ Using AI-generated questions");
      }
    } catch (error) {
      console.error("Error fetching AI questions:", error);
      fetchBasicQuestions();
    } finally {
      setLoading(false);
    }
  };

  const fetchBasicQuestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/questions/all`);
      setQuestions(response.data.filter((q: Question) => !q.is_conditional));
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  const handleResponseChange = (
    questionId: number | string,
    answer: string
  ) => {
    const existingIndex = responses.findIndex(
      (r) => r.question_id === questionId
    );

    if (existingIndex >= 0) {
      const newResponses = [...responses];
      newResponses[existingIndex] = { question_id: questionId, answer };
      setResponses(newResponses);
    } else {
      setResponses([...responses, { question_id: questionId, answer }]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Create product
      const productResponse = await axios.post(`${API_URL}/products`, {
        product_name: productName,
        category,
      });

      const productId = productResponse.data.id;

      // Save responses
      await axios.post(`${API_URL}/products/${productId}/responses`, {
        responses,
      });

      // Generate report with AI scoring if available
      if (aiEnabled) {
        await generateAIReport(productId);
      } else {
        await axios.post(`${API_URL}/reports/${productId}/generate`);
      }

      navigate(`/reports/${productId}`);
    } catch (error) {
      console.error("Error submitting product:", error);
      alert("Failed to submit product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateAIReport = async (productId: number) => {
    try {
      // Get AI score
      const scoreResponse = await axios.post(`${API_URL}/ai/calculate-score`, {
        product_name: productName,
        category: category,
        responses: responses.map((r) => ({
          question_id: r.question_id,
          answer: r.answer,
          question:
            questions.find((q) => q.id === r.question_id)?.question_text ||
            questions.find((q) => q.id === r.question_id)?.question,
        })),
      });

      // Generate report with AI data
      await axios.post(`${API_URL}/reports/${productId}/generate`, {
        ai_score: scoreResponse.data,
      });
    } catch (error) {
      console.error("AI report generation failed, using basic report", error);
      await axios.post(`${API_URL}/reports/${productId}/generate`);
    }
  };

  const getQuestionText = (q: Question) => {
    return q.question_text || q.question || "Question";
  };

  const getQuestionType = (q: Question) => {
    return q.question_type || q.type || "text";
  };

  return (
    <div className="product-form">
      <div className="form-progress">
        <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
          <span>1</span> Basic Info
        </div>
        <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
          <span>2</span> {aiEnabled ? "🤖 AI Questions" : "Details"}
        </div>
        <div className={`progress-step ${step >= 3 ? "active" : ""}`}>
          <span>3</span> Review
        </div>
      </div>

      <div className="form-content">
        {step === 1 && (
          <div className="form-step">
            <h2>Product Information</h2>

            {aiEnabled && (
              <div className="ai-badge">✨ AI-Powered Questions Enabled</div>
            )}

            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select category</option>
                <option value="Food">Food</option>
                <option value="Beverage">Beverage</option>
                <option value="Cosmetics">Cosmetics</option>
                <option value="Supplements">Supplements</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!productName || loading}
            >
              {loading ? "Loading Questions..." : "Next"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h2>
              {aiEnabled ? "🤖 AI-Generated Questions" : "Product Details"}
            </h2>

            {questions.map((question) => (
              <div key={question.id} className="form-group">
                <label>{getQuestionText(question)}</label>

                {getQuestionType(question) === "text" && (
                  <textarea
                    onChange={(e) =>
                      handleResponseChange(question.id, e.target.value)
                    }
                    placeholder="Your answer (be detailed for better transparency score)"
                    rows={3}
                  />
                )}

                {getQuestionType(question) === "boolean" && (
                  <select
                    onChange={(e) =>
                      handleResponseChange(question.id, e.target.value)
                    }
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                )}

                {getQuestionType(question) === "number" && (
                  <input
                    type="text"
                    onChange={(e) =>
                      handleResponseChange(question.id, e.target.value)
                    }
                    placeholder="Enter value"
                  />
                )}
              </div>
            ))}

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn-primary" onClick={handleNext}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h2>Review & Submit</h2>

            <div className="review-section">
              <h3>Product Information</h3>
              <p>
                <strong>Name:</strong> {productName}
              </p>
              <p>
                <strong>Category:</strong> {category || "Not specified"}
              </p>
            </div>

            <div className="review-section">
              <h3>Responses Summary</h3>
              <p>{responses.length} questions answered</p>
              {aiEnabled && (
                <p className="ai-note">
                  ✨ AI will analyze your responses for transparency scoring
                </p>
              )}
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? "Generating Report..."
                  : aiEnabled
                  ? "🤖 Submit & Generate AI Report"
                  : "Submit & Generate Report"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductForm;
