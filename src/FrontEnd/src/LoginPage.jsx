import React, { useState } from "react";
import "./LoginPage.css";
import logo from "./images/logo-triap.svg"; // Confirme se este caminho está correto
import { useNavigate } from "react-router-dom";
// Removido 'fetchWithAuth' - a rota de login nao precisa de token, usamos fetch padrao

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Adicionado estado de loading

  const handleSubmit = async (e) => {
    e.preventDefault(); // Impede o recarregamento padrao da pagina
    setError(""); // Limpa erros anteriores
    if (isLoading) return; // Impede cliques duplos
    setIsLoading(true); // Ativa o estado de loading

    try {
      const email = e.target.email.value;
      const password = e.target.password.value;

      // Verifica se os campos nao estao vazios (validacao basica no frontend)
      if (!email || !password) {
          setError("Por favor, preencha o email e a senha.");
          setIsLoading(false);
          return;
      }

      console.log("DEBUG: Tentando login para:", email); // Log de inicio

      // --- Chamada Direta ao Backend Node.js ---
      // Assume que o proxy do Vite esta configurado para /api -> http://localhost:3000
      // Se nao houver proxy, use a URL absoluta: 'http://localhost:3000/api/login'
      const res = await fetch("/api/login", { // Rota da API de login
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Nao precisa de 'Authorization' aqui, pois e o login
        },
        body: JSON.stringify({ UserEmail: email, UserPassword: password }) // Envia email e senha
      });

      // --- Processamento da Resposta ---
      const data = await res.json(); // Tenta ler o JSON da resposta
      console.log("DEBUG: Resposta do backend /api/login:", { status: res.status, ok: res.ok, data: data }); // Log detalhado

      if (!res.ok) {
        // Se a resposta NAO for OK (status 4xx ou 5xx)
        // Usa a mensagem de erro do backend (data.error) ou uma padrao
        setError(data.error || `Erro ${res.status}: Falha no login.`);
      } else {
        // Se a resposta FOR OK (status 2xx)
        console.log("DEBUG: Login OK, resposta do backend:", data);

        if (data.token) {
          // Se o token foi recebido na resposta
          sessionStorage.setItem("token", data.token); // Armazena no sessionStorage
          console.log("DEBUG: Token armazenado no sessionStorage:", sessionStorage.getItem("token"));
          console.log("DEBUG: Navegando para /dashboard...");
          navigate("/dashboard"); // <<< Tenta redirecionar
          console.log("DEBUG: Chamada navigate('/dashboard') concluida."); // Este log pode nao aparecer se a navegacao for imediata
        } else {
          // Caso o backend retorne sucesso (200 OK) mas sem o token
          console.error("ERRO FRONTEND: Login OK, mas token nao encontrado na resposta:", data);
          setError("Erro inesperado: Token nao recebido apos login.");
        }
      }
    } catch (err) {
      // Captura erros de rede (fetch falhou) ou erros ao processar .json()
      console.error("ERRO GERAL no handleSubmit Login:", err);
      setError("Erro ao conectar ao servidor ou processar a resposta.");
    } finally {
      // Garante que o loading seja desativado, mesmo se ocorrer erro
      setIsLoading(false);
    }
  };

  // --- Renderizacao do Componente ---
  return (
    <div className="login-container">
      {/* Botao Voltar */}
      <button
        className="back-home-btn"
        onClick={() => navigate("/")} // Navega para a pagina inicial
        aria-label="Voltar para a página inicial"
        disabled={isLoading} // Desabilita durante o loading
      >
        <span>←</span> {/* Seta para esquerda */}
      </button>

      <div className="login-box">
        <div className="login-logo">
          <img src={logo} alt="TRIAP" />
        </div>
        <p className="login-subtitle">Inteligência que te move.</p>

        {/* Formulario de Login */}
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="seu@email.com"
            required // Validacao HTML5 basica
            disabled={isLoading} // Desabilita durante o loading
          />
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            required // Validacao HTML5 basica
            disabled={isLoading} // Desabilita durante o loading
          />
          <button className="login-button" type="submit" disabled={isLoading}>
            {/* Muda o texto do botao durante o loading */}
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Exibicao de Erro */}
        {error && <div className="login-error">{error}</div>}

        {/* Link Esqueci Senha */}
        <div className="forgot-password">
          <a href="#">Esqueci minha senha</a>
        </div>

        {/* Link para Registro */}
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
            disabled={isLoading} // Desabilita durante o loading
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}