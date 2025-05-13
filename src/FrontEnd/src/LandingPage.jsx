import React from "react";
import "./LandingPage.css";
import { useNavigate } from "react-router-dom";

import Lottie from "lottie-react";
import heroAnimation  from "./lotties/hero-illustration.json";
import phoneAnimation from "./lotties/phone-mock.json";

/* SVGs e imagens */
import LogoTriap        from "./images/logo-triap.svg";
import MotoristaIcon    from "./images/motorista-icon.svg";
import PassageiroIcon   from "./images/passageiro-icon.svg";
import EmpresaIcon      from "./images/empresa-icon.svg";
import UserIcon         from "./images/user-icon.svg";

import Wave1            from "./images/wave-illustration1.svg";
import Wave2            from "./images/wave-illustration2.svg";
import Wave3            from "./images/wave-illustration3.svg";

import Graficos         from "./images/graficos.svg";
import VantagensSVG     from "./images/vantagens.svg";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">

      {/* ========== HEADER ========== */}
      <header className="landing-header">
        <nav className="navbar">
          <div className="navbar-left">
            <img className="user-icon"  src={UserIcon} alt="Usuário" />
            <img className="brand-logo" src={LogoTriap} alt="TRIAP"   />
          </div>

          <ul className="navbar-menu">
            <li><a href="#home">Home</a></li>
            <li><a href="#viagens">Viagens</a></li>
            <li><a href="#analise">Análise</a></li>
            <li><a href="#conta">Conta</a></li>
          </ul>

          <div className="navbar-slogan">Inteligência que te move.</div>
        </nav>
      </header>

      {/* ========== HERO ========== */}
      <section className="hero-section" id="home">
        <div className="hero-left">
          <h1>Viajar nunca foi tão inteligente.</h1>
          <p>Descubra a rota ideal, com estimativas de preço otimizadas por IA.</p>
          <p>Para motoristas, passageiros e empresas que querem economizar com eficiência.</p>

          <div className="hero-buttons">
            <button onClick={() => navigate("/login")}>Simular</button>
            <button onClick={() => navigate("/login")}>Saiba</button>
          </div>
        </div>

        <div className="hero-right">
          <Lottie animationData={heroAnimation} loop style={{ width: 400, maxWidth:"100%" }} />
        </div>

        <img className="hero-wave" src={Wave3} alt="Ondas decorativas" />
      </section>

      {/* ========== INFO (celular + barras) ========== */}
      <section className="info-section info-graphs" id="analise">
        <div className="info-text">
          <h2>Você informa o trajeto. A Triap informa a melhor decisão.</h2>
          <p>Insira origem, destino e horário. A Triap analisa tudo com IA e te mostra a melhor estimativa de preço.</p>
          <p>Evite tarifas dinâmicas, planeje melhor seus gastos, viaje com mais confiança.</p>
        </div>

        <div className="info-image">
          <div className="lottie-phone">
            <Lottie animationData={phoneAnimation} loop style={{ width:"100%" }} />
          </div>
          <img className="big-chart" src={Graficos} alt="Gráfico de barras" />
        </div>

        <img className="wave-decor wave2" src={Wave2} alt="Onda decorativa" />
      </section>

      {/* ========== POR QUE ESCOLHER TRIAP? (agora sem wave) ========== */}
      <section className="why-triap-section" id="viagens">
        <h2>Por que escolher Triap?</h2>

        <img
          className="vantagens-img"
          src={VantagensSVG}
          alt="Vantagens da Triap"
        />
      </section>

      {/* ========== PARA QUEM É IDEAL? ========== */}
      <section className="ideal-section" id="auxilio">
        <h2>Para quem é ideal?</h2>

        <div className="ideal-cards">
          <div className="ideal-card">
            <img src={MotoristaIcon} alt="Motoristas" />
            <h4>Motoristas</h4>
            <p>Aumente sua renda analisando o melhor momento para rodar.</p>
          </div>
          <div className="ideal-card">
            <img src={PassageiroIcon} alt="Passageiros" />
            <h4>Passageiros</h4>
            <p>Economize ainda mais suas viagens com a Triap.</p>
          </div>
          <div className="ideal-card">
            <img src={EmpresaIcon} alt="Empresas" />
            <h4>Empresas</h4>
            <p>Otimização nos custos internos de transporte corporativo.</p>
          </div>
        </div>

        <img className="wave-decor wave1" src={Wave1} alt="Onda decorativa" />
      </section>

      {/* ========== RESULTADOS (donuts) ========== */}
      <section className="results-section">
        <h2>Resultados que fazem a diferença:</h2>

        <div className="results-circles">
          <div className="result-item">
            <div className="circle"><h3>90%</h3></div>
            <p className="explain">Até 90% de previsão nas estimativas de preço.</p>
          </div>

          <div className="result-item">
            <div className="circle"><h3>80%</h3></div>
            <p className="explain">Economize até 80% escolhendo o melhor horário.</p>
          </div>

          <div className="result-item">
            <div className="circle"><h3>85%</h3></div>
            <p className="explain">Reduza até 85% dos gastos com transporte.</p>
          </div>
        </div>
      </section>

      {/* ========== CTA FINAL ========== */}
      <section className="cta-section" id="conta">
        <button className="cta-button" onClick={() => navigate("/login")}>
          Simular minha corrida
        </button>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="landing-footer">
        <p>São Paulo - SP</p>
        <p>Endereço Completo</p>
        <p>Termos de Privacidade | Contato</p>
        <p>© Triap 2025</p>
      </footer>
    </div>
  );
}

export default LandingPage;
