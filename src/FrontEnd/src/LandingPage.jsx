import React from "react";
import "./LandingPage.css";

// Animações Lottie
import Lottie from "lottie-react";
import heroAnimation from "./lotties/hero-illustration.json";
import phoneAnimation from "./lotties/phone-mock.json";

function LandingPage() {
  return (
    <div className="landing-container">

      {/* CABEÇALHO */}
      <header className="landing-header">
        <nav className="navbar">
          {/* ESQUERDA: logo + nome da marca */}
          <div className="navbar-left">
            <img src="/images/triap-logo.png" alt="Logo Triap" />
            <span className="brand-name">TRIAP</span>
          </div>

          {/* MEIO: Menu */}
          <ul className="navbar-menu">
            <li><a href="#home">Home</a></li>
            <li><a href="#viagens">Viagens</a></li>
            <li><a href="#analise">Análise</a></li>
            <li><a href="#conta">Conta</a></li>
          </ul>

          {/* DIREITA: Slogan */}
          <div className="navbar-slogan">
            Inteligência que te move.
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section" id="home">
        <div className="hero-text">
          <h1>Viajar nunca foi tão inteligente.</h1>
          <p>Descomplique suas viagens etc...</p>
          <div className="hero-buttons">
            <button>Simular</button>
            <button>Saiba Mais</button>
          </div>
        </div>

        <div className="hero-image">
          {/* Animação Lottie na Hero */}
          <Lottie
            animationData={heroAnimation}
            loop
            style={{ width: 300, maxWidth: "100%" }}
          />
        </div>
      </section>

      {/* INFO SECTION - com Lottie do celular e barras */}
      <section className="info-section info-graphs">
        <div className="info-text">
          <h2>Você informa o trajeto. A Triap informa a melhor decisão.</h2>
          <p>
            Insira origem, destino e horário. A Triap analisa tudo com IA e te mostra
            a melhor estimativa de preço.
          </p>
          <p>
            Evite tarifas dinâmicas, planeje melhor seus gastos, viaje com mais confiança.
          </p>
        </div>

        <div className="info-image">
          {/* Renderizando animação Lottie do celular */}
          <div className="lottie-phone">
            <Lottie
              animationData={phoneAnimation}
              loop
              style={{ width: 300, maxWidth: "100%" }}
            />
            
            {/* Barras sobrepostas com valores */}
            <div className="bar bar1">
              <span className="bar-value">107.38</span>
            </div>
            <div className="bar bar2">
              <span className="bar-value">328.07</span>
            </div>
          </div>
        </div>
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
            <img src="/images/motorista-icon.png" alt="Motoristas" />
            <h4>Motoristas</h4>
            <p>Aumente sua renda analisando o melhor momento para rodar.</p>
          </div>
          <div className="ideal-card">
            <img src="/images/passageiro-icon.png" alt="Passageiros" />
            <h4>Passageiros</h4>
            <p>Economize ainda mais suas viagens com a Triap.</p>
          </div>
          <div className="ideal-card">
            <img src="/images/empresa-icon.png" alt="Empresas" />
            <h4>Empresas</h4>
            <p>Otimização nos custos internos de transporte corporativo.</p>
          </div>
        </div>
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
