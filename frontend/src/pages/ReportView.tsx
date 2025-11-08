import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./ReportView.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Report {
  id: number;
  product_id: number;
  transparency_score: number;
  report_data: any;
  generated_at: string;
  product_name: string;
  category: string;
}

const ReportView: React.FC = () => {
  const { productId } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, [productId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/reports/${productId}`);
      setReport(response.data);
    } catch (error: any) {
      console.error("Error fetching report:", error);
      setError("Failed to load report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    window.print();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#10b981"; // Green
    if (score >= 60) return "#3b82f6"; // Blue
    if (score >= 40) return "#f59e0b"; // Orange
    return "#ef4444"; // Red
  };

  const getScoreDescription = (score: number): string => {
    if (score >= 80) return "Excellent transparency";
    if (score >= 60) return "Good transparency";
    if (score >= 40) return "Moderate transparency";
    return "Needs improvement";
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="error-state">
        <div className="error-icon">⚠️</div>
        <h2>Report not found</h2>
        <p>{error || "The requested report could not be found."}</p>
        <Link to="/" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const reportData =
    typeof report.report_data === "string"
      ? JSON.parse(report.report_data)
      : report.report_data;

  const { product, categories, insights } = reportData;

  return (
    <div className="report-view">
      <div className="report-header no-print">
        <Link to="/" className="btn-secondary">
          ← Back to Dashboard
        </Link>
        <button onClick={downloadPDF} className="btn-primary">
          📄 Download PDF
        </button>
      </div>

      <div className="report-content">
        <div className="report-title">
          <h1>Product Transparency Report</h1>
          <p className="report-date">
            Generated:{" "}
            {new Date(report.generated_at).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Product Information */}
        <div className="report-section">
          <h2>Product Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Product Name:</span>
              <span className="value">{report.product_name}</span>
            </div>
            <div className="info-item">
              <span className="label">Category:</span>
              <span className="value">
                {report.category || "Not specified"}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Report ID:</span>
              <span className="value">#{report.id}</span>
            </div>
          </div>
        </div>

        {/* Transparency Score */}
        <div className="report-section score-section">
          <h2>Transparency Score</h2>
          <div className="score-display">
            <div
              className="score-circle"
              style={{
                background: `conic-gradient(${getScoreColor(
                  report.transparency_score
                )} ${report.transparency_score}%, #e5e7eb 0)`,
              }}
            >
              <div className="score-inner">
                <span className="score-value">{report.transparency_score}</span>
                <span className="score-label">/ 100</span>
              </div>
            </div>
            <div className="score-info">
              <p className="score-description">
                {getScoreDescription(report.transparency_score)}
              </p>
              {insights?.completeness !== undefined && (
                <p className="score-detail">
                  Completeness: {insights.completeness}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {insights?.categoryBreakdown &&
          Object.keys(insights.categoryBreakdown).length > 0 && (
            <div className="report-section">
              <h2>Category Breakdown</h2>
              <div className="category-scores">
                {Object.entries(insights.categoryBreakdown).map(
                  ([category, score]: [string, any]) => (
                    <div key={category} className="category-score-item">
                      <div className="category-score-header">
                        <span className="category-name">{category}</span>
                        <span className="category-score">{score}%</span>
                      </div>
                      <div className="category-progress">
                        <div
                          className="category-progress-bar"
                          style={{
                            width: `${score}%`,
                            backgroundColor: getScoreColor(score),
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {/* Detailed Responses */}
        <div className="report-section">
          <h2>Detailed Information</h2>
          {Object.entries(categories || {}).map(
            ([categoryName, items]: [string, any]) => (
              <div key={categoryName} className="category-section">
                <h3 className="category-title">{categoryName}</h3>
                <div className="responses-list">
                  {items.map((item: any, index: number) => (
                    <div key={index} className="response-item">
                      <p className="question">{item.question}</p>
                      <p className="answer">
                        {item.answer || (
                          <span className="no-answer">Not answered</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Recommendations */}
        {insights?.recommendations && insights.recommendations.length > 0 && (
          <div className="report-section recommendations-section">
            <h2>Recommendations</h2>
            <div className="recommendations-list">
              {insights.recommendations.map(
                (recommendation: string, index: number) => (
                  <div key={index} className="recommendation-item">
                    <span className="recommendation-icon">💡</span>
                    <p>{recommendation}</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Report Footer */}
        <div className="report-footer">
          <div className="footer-content">
            <p>
              This report was generated by{" "}
              <strong>Product Transparency Platform</strong>
            </p>
            <p className="footer-tagline">
              Committed to Health, Wisdom, and Virtue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
