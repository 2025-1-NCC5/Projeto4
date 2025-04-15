import React, { useState } from "react";
import "./LoginPage.css";
import logo from "./images/logo-triap.svg"; // substitua pelo caminho real
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const email = e.target.email.value;
      const password = e.target.password.value;
      const res = await fetch("http://localhost:3000/api/login", {  // Usando URL absoluta
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ UserEmail: email, UserPassword: password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao fazer login.");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Erro ao conectar ao servidor.");
    }
  };

  return (
    <div className="login-container">
      {/* Botão de voltar */}
      <button
        className="back-home-btn"
        onClick={() => navigate("/")}
        aria-label="Voltar para a página inicial"
      >
        <span>&#8592;</span>
      </button>
      <div className="login-box">
        <div className="login-logo">
          <img src={logo} alt="TRIAP" />
        </div>
        <p className="login-subtitle">Inteligência que te move.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label>
          <input type="email" id="email" name="email" placeholder="seu@email.com" />
          <label htmlFor="password">Senha</label>
          <input type="password" id="password" name="password" placeholder="••••••••" />
          <button className="login-button" type="submit">Entrar</button>
        </form>
        {error && <div className="login-error">{error}</div>}
        <div className="forgot-password">
          <a href="#">Esqueci minha senha</a>
        </div>
        <div className="register-link" style={{ marginTop: "18px", textAlign: "center" }}>
          <span>Não tem uma conta? </span>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "#7aa000",
              fontSize: "13px",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0
            }}
            onClick={() => navigate("/register")}
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}
