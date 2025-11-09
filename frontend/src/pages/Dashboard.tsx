import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Product {
  id: number;
  product_name: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: number, productName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (error: any) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>My Products</h1>
          <p className="dashboard-subtitle">
            {products.length} {products.length === 1 ? "product" : "products"}{" "}
            total
          </p>
        </div>
        <Link to="/products/new" className="btn-primary">
          + Add New Product
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {products.length === 0 ? (
        <div className="empty-state">
          {/* <div className="empty-icon">📦</div> */}
          <h2>No products yet</h2>
          <p>Start building transparency by adding your first product</p>
          <Link to="/products/new" className="btn-primary">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-header">
                <h3>{product.product_name}</h3>
                <span className={`status-badge status-${product.status}`}>
                  {product.status}
                </span>
              </div>

              <div className="product-body">
                <p className="product-category">
                  <span className="label">Category:</span>
                  <span className="value">
                    {product.category || "Uncategorized"}
                  </span>
                </p>

                <p className="product-date">
                  <span className="label">Created:</span>
                  <span className="value">
                    {formatDate(product.created_at)}
                  </span>
                </p>

                {product.updated_at !== product.created_at && (
                  <p className="product-date">
                    <span className="label">Updated:</span>
                    <span className="value">
                      {formatDate(product.updated_at)}
                    </span>
                  </p>
                )}
              </div>

              <div className="product-actions">
                <Link
                  to={`/products/${product.id}/edit`}
                  className="btn-secondary btn-small"
                >
                  Edit
                </Link>

                {product.status === "completed" && (
                  <Link
                    to={`/reports/${product.id}`}
                    className="btn-success btn-small"
                  >
                    View Report
                  </Link>
                )}

                <button
                  onClick={() =>
                    deleteProduct(product.id, product.product_name)
                  }
                  className="btn-danger btn-small"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
