// src/FrontEnd/src/App.jsx
import React from 'react';
// Importa os componentes necessarios do react-router-dom v6
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate, // Para redirecionamento
    Outlet    // Para renderizar rotas aninhadas (protegidas)
} from 'react-router-dom';

// Importa os componentes das suas paginas
import LandingPage from './LandingPage'; // Pagina inicial publica
import LoginPage from './LoginPage';     // Pagina de login publica
import RegisterPage from './RegisterPage'; // Pagina de registro publica
import DashboardPage from './DashboardPage'; // Pagina que queremos proteger
import Viagens from './Viagens'; // Página das viagens do usuário

// --- Componente Wrapper para Rotas Protegidas ---
// Este componente verifica a autenticacao antes de renderizar suas rotas filhas
function ProtectedRoute() {
  // Verifica se o token existe no sessionStorage (ou localStorage se voce usou la)
  const token = sessionStorage.getItem("token");
  const isAuthenticated = !!token; // Converte para booleano (true se token existe, false se nao)

  console.log("ProtectedRoute: Token existe?", isAuthenticated); // Log para debug

  if (!isAuthenticated) {
    // Se o usuario NAO esta autenticado (sem token):
    // Redireciona para a pagina de login.
    // 'replace' e importante para que o usuario nao possa usar o botao "voltar"
    // do navegador para acessar a pagina protegida novamente apos ser redirecionado.
    console.log("ProtectedRoute: Redirecionando para /login"); // Log para debug
    return <Navigate to="/login" replace />;
  }

  // Se o usuario ESTA autenticado (tem token):
  // Renderiza o componente da rota filha que esta aninhada dentro dele.
  // O <Outlet /> e um placeholder que o react-router-dom substitui
  // pelo elemento da rota filha correspondente (no nosso caso, <DashboardPage />).
  return <Outlet />;
}
// ---------------------------------------------

// --- Componente Principal da Aplicacao ---
function App() {
  return (
    // Envolve toda a aplicacao com o BrowserRouter para habilitar o roteamento
    <Router>
      {/* O componente Routes define onde as rotas serao renderizadas */}
      <Routes>
        {/* Rotas Publicas: Acessiveis por qualquer um */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/viagens" element={<Viagens />} />

        {/* --- Definicao das Rotas Protegidas --- */}
        {/* Usamos uma Route que renderiza o componente ProtectedRoute.
            Qualquer Route aninhada DENTRO desta so sera renderizada
            se ProtectedRoute permitir (ou seja, se o usuario estiver autenticado). */}
        <Route element={<ProtectedRoute />}>
          {/* A rota /dashboard agora esta protegida.
              Se o usuario estiver logado, <Outlet /> em ProtectedRoute
              renderizara <DashboardPage />.
              Se nao estiver logado, ProtectedRoute redirecionara para /login. */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Adicione outras rotas que precisam de login aqui dentro. Ex:
          <Route path="/meu-perfil" element={<PaginaDePerfil />} />
          <Route path="/configuracoes" element={<PaginaConfig />} />
          */}
        </Route>
        {/* --- Fim das Rotas Protegidas --- */}


        {/* Opcional: Rota "Catch-all" para URLs nao encontradas */}
        {/* Redireciona qualquer outra URL para a pagina inicial */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;