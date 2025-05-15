import React, { useState } from "react";
import "./DashboardPage.css"; // Certifique-se que este arquivo CSS existe e está linkado
import AddressAutocompleteOSM from "./components/AddressAutocompleteOSM";
import { fetchWithAuth } from "./api";

// Importe suas logos (ajuste os caminhos se necessário)
import uberLogo from "./images/uber.svg"; // Exemplo de caminho
import nintyNineLogo from "./images/99.svg"; // Exemplo de caminho

export default function DashboardPage() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [uberPrices, setUberPrices] = useState({});
  const [nintyNinePrices, setNintyNinePrices] = useState({});
  const [distanciaKm, setDistanciaKm] = useState("");
  const [duracaoStr, setDuracaoStr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [bestOverallPrice, setBestOverallPrice] = useState(null);

  const findBestPrice = (uberP, nintyNineP) => {
    let minPrice = Infinity;
    let bestOption = null;

    const allPrices = { ...uberP, ...nintyNineP };

    for (const category in allPrices) {
      const price = allPrices[category];
      if (typeof price === 'number' && price < minPrice) {
        minPrice = price;
        bestOption = category;
      }
    }
    
    if (bestOption) {
      return { category: bestOption, price: minPrice };
    }
    return null;
  };

  const handleSimulate = async () => {
    if (!origin || !destination) {
      setErrorMessage("Preencha os campos de origem e destino.");
      setUberPrices({});
      setNintyNinePrices({});
      setBestOverallPrice(null);
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage("");
    setUberPrices({});
    setNintyNinePrices({});
    setDistanciaKm("");
    setDuracaoStr("");
    setBestOverallPrice(null);

    try {
      const payload = {
        origin: { lat: origin.lat, lon: origin.lon },
        destination: { lat: destination.lat, lon: destination.lon },
      };

      const res = await fetchWithAuth("/api/simulate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || `Erro ${res.status} na simulação.`);
      }

      if (data && data.prices && typeof data.prices === 'object') {
        const uPrices = {};
        const nnPrices = {};
        for (const categoryKey in data.prices) {
          // A chave pode ser "uberX", "99Pop", etc.
          if (data.prices[categoryKey] !== null && data.prices[categoryKey] !== "Erro") { // Considerar apenas preços válidos
            const cleanCategoryName = categoryKey.replace(/_/g, ' ').replace("Individual RF", "").trim(); // Limpa nome
            if (categoryKey.toLowerCase().includes("uber")) {
              uPrices[cleanCategoryName] = data.prices[categoryKey];
            } else if (categoryKey.toLowerCase().includes("99")) {
              nnPrices[cleanCategoryName] = data.prices[categoryKey];
            }
          }
        }
        setUberPrices(uPrices);
        setNintyNinePrices(nnPrices);
        setBestOverallPrice(findBestPrice(uPrices, nnPrices)); // Calcula o melhor preço geral
      } else {
        throw new Error("Resposta de preços inválida ou vazia recebida.");
      }

      if (data.distancia_km != null) setDistanciaKm(`${data.distancia_km.toFixed(1)} km`);
      if (data.duracao_str) setDuracaoStr(data.duracao_str);

    } catch (err) {
      console.error("Erro em handleSimulate:", err);
      setErrorMessage(err.message || "Erro desconhecido ao simular.");
      setUberPrices({});
      setNintyNinePrices({});
      setBestOverallPrice(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Componente para exibir uma categoria de preço individual
  const PriceCategoryCard = ({ title, prices, logoSrc }) => {
    if (Object.keys(prices).length === 0) {
      return null; 
    }
    return (
      <div className="price-result-card">
        <div className="price-card-header">
          <img src={logoSrc} alt={`${title} logo`} className="app-logo" />
          <h3>{title}</h3>
        </div>
        <div className="price-list">
          {Object.entries(prices).map(([category, price]) => (
            <div key={category} className="price-item">
              <span className="price-item-category">{category.replace(/_/g, ' ')}:</span>
              <span className="price-item-value">
                {price !== null && typeof price === 'number' ? `R$ ${price.toFixed(2)}` : (price === "Erro" ? "Erro na estimativa" : "Indisponível")}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-background">
      <div className="dashboard-container">
        <h2>Planeje sua Rota com Inteligência</h2>

        <div className="inputs-grid">
          {/* ... seus inputs de AddressAutocompleteOSM e datetime-local ... */}
           <div className="form-group">
            <label htmlFor="origin-input">Informe sua localização</label>
            <AddressAutocompleteOSM
              id="origin-input"
              placeholder="Digite o ponto de partida"
              onSelect={(place) => { setOrigin(place); setErrorMessage(""); }}
            />
            <small>De onde você está saindo?</small>
          </div>

          <div className="form-group">
            <label htmlFor="destination-input">Informe seu destino</label>
            <AddressAutocompleteOSM
              id="destination-input"
              placeholder="Digite o destino"
              onSelect={(place) => { setDestination(place); setErrorMessage(""); }}
            />
            <small>Para onde vamos?</small>
          </div>

          <div className="form-group full-width">
            <label htmlFor="datetime-input">Horário da partida (informativo)</label>
            <input
              id="datetime-input"
              type="datetime-local"
              value={selectedDateTime}
              onChange={(e) => setSelectedDateTime(e.target.value)}
            />
            <small>O cálculo do preço usará a hora atual do servidor.</small>
          </div>
        </div>

        <button
          className="simulate-btn"
          onClick={handleSimulate}
          disabled={isLoading || !origin || !destination}
        >
          {isLoading ? "Simulando..." : "Simular Preços"}
        </button>

        {/* Caixa de Erro */}
        {errorMessage && !isLoading && (
          <div className="result-box error-box">
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Caixa de Resumo da Rota e Melhor Preço */}
        {!isLoading && !errorMessage && (distanciaKm || duracaoStr || bestOverallPrice) && (
          <div className="result-box summary-box">
            {distanciaKm && <p>Distância: <strong>{distanciaKm}</strong></p>}
            {duracaoStr && <p>Tempo Estimado: <strong>{duracaoStr}</strong></p>}
            {bestOverallPrice && (
              <p className="best-price-highlight">
                Melhor Preço Encontrado: 
                <strong> R$ {bestOverallPrice.price.toFixed(2)}</strong> ({bestOverallPrice.category.replace(/_/g, ' ')})
              </p>
            )}
          </div>
        )}
        
        {/* Container para as Caixas de Preços dos Apps */}
        {!isLoading && !errorMessage && (Object.keys(uberPrices).length > 0 || Object.keys(nintyNinePrices).length > 0) && (
          <div className="price-cards-container">
            <PriceCategoryCard title="" prices={uberPrices} logoSrc={uberLogo} />
            <PriceCategoryCard title="" prices={nintyNinePrices} logoSrc={nintyNineLogo} />
          </div>
        )}

        {/* Mensagem se nenhuma simulação foi feita ou nenhum preço retornado */}
        {!isLoading && !errorMessage && !distanciaKm && !bestOverallPrice && Object.keys(uberPrices).length === 0 && Object.keys(nintyNinePrices).length === 0 && (
          <div className="result-box">
            <p>Insira origem e destino para simular os preços.</p>
          </div>
        )}
      </div>
    </div>
  );
}