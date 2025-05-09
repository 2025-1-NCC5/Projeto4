import React, { useState } from "react";
import "./DashboardPage.css";
import AddressAutocompleteOSM from "./components/AddressAutocompleteOSM";
import { fetchWithAuth } from "./api";

export default function DashboardPage() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [price, setPrice] = useState("");
  const [distanciaKm, setDistanciaKm] = useState("");
  const [duracaoStr, setDuracaoStr] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = async () => {
    if (!origin || !destination) {
      setPrice("Preencha ambos os campos");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    setPrice("Simulando…");
    setDistanciaKm("");
    setDuracaoStr("");
    try {
      const now = new Date();
      const payload = {
        origin,
        destination,
        datetime: now.toISOString(),
      };

      const res = await fetchWithAuth("/api/simulate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || `Erro ${res.status}`);
      }

      if (data && typeof data.price === "number" && isFinite(data.price)) {
        setPrice(`R$ ${data.price.toFixed(2)}`);
      } else {
        throw new Error("Resposta de preço inválida recebida.");
      }

      if (data.distancia_km != null) {
        setDistanciaKm(`${data.distancia_km.toFixed(1)} km`);
      }

      if (data.duracao_str) {
        setDuracaoStr(data.duracao_str);
      }
    } catch (err) {
      console.error("Erro em handleSimulate:", err);
      setPrice(`Erro: ${err.message || "Erro desconhecido na simulação"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-background">
      <div className="dashboard-container">
        <h2>Planeje sua Rota com Inteligência</h2>

        <div className="inputs-grid">
          <div className="form-group">
            <label>Informe sua localização</label>
            <AddressAutocompleteOSM
              placeholder="Digite o ponto de partida"
              onSelect={(place) => setOrigin(place)}
            />
            <small>De onde você está saindo? Informe a origem e começamos!</small>
          </div>

          <div className="form-group">
            <label>Informe seu destino</label>
            <AddressAutocompleteOSM
              placeholder="Digite o destino"
              onSelect={(place) => setDestination(place)}
            />
            <small>Para onde vamos? Insira o destino final.</small>
          </div>

          <div className="form-group full-width">
            <label>Defina o horário da partida</label>
            <input
              type="datetime-local"
              onChange={() => {}} // implementar depois
            />
            <small>Escolha o melhor horário para sair.</small>
          </div>
        </div>

        <button
          className="simulate-btn"
          onClick={handleSimulate}
          disabled={isLoading}
        >
          {isLoading ? "Simulando..." : "Simular minha corrida"}
        </button>

        <div className="result-box">
          {isLoading ? (
            <span>Calculando...</span>
          ) : price ? (
            <div>
              <div>
                Preço Estimado:{" "}
                <strong>
                  {price.startsWith("Erro:") ? (
                    <span style={{ color: "red" }}>{price}</span>
                  ) : (
                    price
                  )}
                </strong>
              </div>
              {distanciaKm && (
                <div>
                  Distância: <strong>{distanciaKm}</strong>
                </div>
              )}
              {duracaoStr && (
                <div>
                  Tempo estimado: <strong>{duracaoStr}</strong>
                </div>
              )}
            </div>
          ) : (
            <span>Aguardando simulação…</span>
          )}
        </div>

        <div className="map-placeholder">
          <img src="map-placeholder.png" alt="Mapa com rota estimada" />
        </div>
      </div>
    </div>
  );
}
