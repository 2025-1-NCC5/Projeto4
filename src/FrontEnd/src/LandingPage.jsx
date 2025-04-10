import React from "react";
import "./LandingPage.css";

// Lottie
import Lottie from "lottie-react";
import heroAnimation from "./lotties/hero-illustration.json";
import phoneAnimation from "./lotties/phone-mock.json";

// Importando imagens (SVG)
import LogoTriap from "./images/logo-triap.svg";
import MotoristaIcon from "./images/motorista-icon.svg";
import PassageiroIcon from "./images/passageiro-icon.svg";
import EmpresaIcon from "./images/empresa-icon.svg";
import UserIcon from "./images/user-icon.svg";

import Wave1 from "./images/wave-illustration1.svg";
import Wave2 from "./images/wave-illustration2.svg";
import Wave3 from "./images/wave-illustration3.svg";

import Grafico1 from "./images/grafico1.svg";
import Grafico2 from "./images/grafico2.svg";
import Grafico3 from "./images/grafico3.svg";
import Graficos from "./images/graficos.svg";

// Removi a imagem "vantagens.svg" conforme solicitado

function LandingPage() {
  return (
    <div className="landing-container">
      {/* CABEÇALHO */}
      <header className="landing-header">
        <nav className="navbar">
          <div className="navbar-left">
            <img src={LogoTriap} alt="Logo Triap" />
            <span className="brand-name">TRIAP</span>
          </div>
          <ul className="navbar-menu">
            <li><a href="#home">Home</a></li>
            <li><a href="#viagens">Viagens</a></li>
            <li><a href="#analise">Análise</a></li>
            <li><a href="#conta">Conta</a></li>
          </ul>
          <div className="navbar-slogan">Inteligência que te move.</div>
          <div className="user-icon-area">
            <img src={UserIcon} alt="Ícone de usuário" />
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section" id="home">
        <div className="hero-left">
          <h1>Viajar nunca foi tão inteligente.</h1>
          <p>Descubra a rota ideal, com estimativas de preço otimizadas por IA.</p>
          <p>Para motoristas, passageiros e empresas que querem economizar com eficiência.</p>
          <div className="hero-buttons">
            <button>Simular</button>
            <button>Saiba</button>
          </div>
        </div>
        <div className="hero-right">
          <Lottie
            animationData={heroAnimation}
            loop
            style={{ width: 300, maxWidth: "100%" }}
          />
        </div>
        <img className="wave-decor wave1" src={Wave1} alt="Onda Decorativa 1" />
      </section>

      {/* INFO SECTION */}
      <section className="info-section info-graphs">
        <div className="info-text">
          <h2>Você informa o trajeto. A Triap informa a melhor decisão.</h2>
          <p>
            Insira origem, destino e horário. A Triap analisa tudo com IA e te mostra a
            melhor estimativa de preço.
          </p>
          <p>
            Evite tarifas dinâmicas, planeje melhor seus gastos, viaje com mais confiança.
          </p>
        </div>
        <div className="info-image">
          <div className="lottie-phone">
            <Lottie
              animationData={phoneAnimation}
              loop
              style={{ width: "100%" }}
            />
            <div className="bar bar1">
              <span className="bar-value">107.38</span>
            </div>
            <div className="bar bar2">
              <span className="bar-value">328.07</span>
            </div>
            <img className="grafico graf1" src={Grafico1} alt="Gráfico 1" />
            <img className="grafico graf2" src={Grafico2} alt="Gráfico 2" />
            <img className="grafico graf3" src={Grafico3} alt="Gráfico 3" />
          </div>
          <img className="big-chart" src={Graficos} alt="Gráfico completo" />
        </div>
        <img className="wave-decor wave2" src={Wave2} alt="Onda Decorativa 2" />
      </section>

      {/* POR QUE ESCOLHER TRIAP? */}
      <section className="why-triap-section" id="viagens">
        <h2>Por que escolher Triap?</h2>
        <div className="features-cards">
          <div className="card">
            <h3>Economia e inteligência</h3>
            <p>Até 90% de precisão nas estimativas de preço.</p>
          </div>
          <div className="card">
            <h3>Melhor horário</h3>
            <p>Economize até 80% escolhendo o melhor horário.</p>
          </div>
          <div className="card">
            <h3>Comparação</h3>
            <p>Compare valores de diferentes apps de transporte.</p>
          </div>
          <div className="card">
            <h3>Tecnologia</h3>
            <p>Integração com as maiores plataformas.</p>
          </div>
          <div className="card">
            <h3>Versatilidade</h3>
            <p>Ideal para motoristas, passageiros e empresas.</p>
          </div>
          <div className="card">
            <h3>Simples e gratuito</h3>
            <p>100% gratuito para todos os usuários.</p>
          </div>
        </div>
      </section>

      {/* PARA QUEM É IDEAL? */}
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
        <img className="wave-decor wave3" src={Wave3} alt="Onda Decorativa 3" />
      </section>

      {/* RESULTADOS */}
      <section className="results-section">
        <h2>Resultados que fazem a diferença:</h2>
        <div className="results-circles">
          <div className="circle">
            <h3>90%</h3>
            <p>Até 90% de previsão nas estimativas de preço.</p>
          </div>
          <div className="circle">
            <h3>80%</h3>
            <p>Economize até 80% escolhendo o melhor horário.</p>
          </div>
          <div className="circle">
            <h3>85%</h3>
            <p>Reduza até 85% dos gastos com transporte.</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section" id="conta">
        <button className="cta-button">Simular minha corrida</button>
      </section>

      {/* RODAPÉ */}
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
