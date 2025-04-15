import React, { useState } from "react";
import "./RegisterPage.css";
import logo from "./images/logo-triap.svg";
import { useNavigate } from "react-router-dom";

// Opções para os selects
const appOptions = [
  { label: "99", value: 1 },
  { label: "Uber", value: 2 }
];

const userTypeOptions = [
  { label: "Passageiro", value: 1 },
  { label: "Motorista", value: 2 },
  { label: "Empresa", value: 3 }
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    UserName: "",
    UserEmail: "",
    UserCellphone: "",
    UserPassword: "",
    UserFavoriteApp: "",
    UserIs: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Para os selects, garantir que o valor é inteiro ou vazio
    if (name === "UserFavoriteApp" || name === "UserIs") {
      setForm({ ...form, [name]: value ? parseInt(value, 10) : "" });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("http://localhost:3000/api/register", {  // Usando URL absoluta
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (data.errors && data.errors[0]?.msg) || "Erro ao registrar.");
      } else {
        setSuccess("Registro realizado com sucesso!");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch {
      setError("Erro ao conectar ao servidor.");
    }
  };

  return (
    <div className="register-container">
      {/* Botão de voltar */}
      <button
        className="back-home-btn"
        onClick={() => navigate("/")}
        aria-label="Voltar para a página inicial"
      >
        <span>&#8592;</span>
      </button>
      <div className="register-box">
        <div className="register-logo">
          <img src={logo} alt="TRIAP" />
        </div>
        <p className="register-subtitle">Inteligência que te move.</p>
        <form className="register-form" onSubmit={handleSubmit}>
          <label htmlFor="UserName">Nome</label>
          <input name="UserName" id="UserName" value={form.UserName} onChange={handleChange} required />

          <label htmlFor="UserEmail">E-mail</label>
          <input type="email" name="UserEmail" id="UserEmail" value={form.UserEmail} onChange={handleChange} required />

          <label htmlFor="UserCellphone">Celular</label>
          <input name="UserCellphone" id="UserCellphone" value={form.UserCellphone} onChange={handleChange} required />

          <label htmlFor="UserPassword">Senha</label>
          <input type="password" name="UserPassword" id="UserPassword" value={form.UserPassword} onChange={handleChange} required />

          <label htmlFor="UserFavoriteApp">App favorito</label>
          <select
            name="UserFavoriteApp"
            id="UserFavoriteApp"
            value={form.UserFavoriteApp}
            onChange={handleChange}
            required
          >
            <option value="">Selecione...</option>
            {appOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <label htmlFor="UserIs">Tipo de usuário</label>
          <select
            name="UserIs"
            id="UserIs"
            value={form.UserIs}
            onChange={handleChange}
            required
          >
            <option value="">Selecione...</option>
            {userTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button className="register-button" type="submit">Registrar</button>
        </form>
        {error && <div className="register-error">{error}</div>}
        {success && <div className="register-success">{success}</div>}
        <div className="already-account">
          <span>Já tem uma conta? </span>
          <button type="button" onClick={() => navigate("/login")}>Entrar</button>
        </div>
      </div>
    </div>
  );
}
