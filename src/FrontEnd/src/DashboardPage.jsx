import React, { useState } from "react";
import "./DashboardPage.css";
import AddressAutocompleteOSM from "./components/AddressAutocompleteOSM";

// Função para chamar a API Node.js
const getPrecoPrevisto = async () => {
  const res = await fetch("http://localhost:3000/api/preco");
  const data = await res.json();
  return data.preco_previsto;
};

export default function DashboardPage() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [price, setPrice] = useState("");

  const handleSimulate = async () => {
    if (!origin || !destination) {
      setPrice("Preencha ambos os campos");
      return;
    }

    try {
      const preco = await getPrecoPrevisto();
      setPrice(`R$ ${preco.toFixed(2)}`);
    } catch (error) {
      console.error("Erro ao buscar o preço:", error);
      setPrice("Erro ao buscar o preço");
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Simulador de Preço</h2>

      <AddressAutocompleteOSM
        label="Endereço de Origem"
        placeholder="Rua Exemplo, 123"
        onSelect={place => setOrigin(place)}
      />

      <AddressAutocompleteOSM
        label="Endereço de Destino"
        placeholder="Avenida Exemplo, 456"
        onSelect={place => setDestination(place)}
      />

      <button className="simulate-btn" onClick={handleSimulate}>
        Simular
      </button>

      <div className="result-box">
        {price ? (
          <span>
            Preço Estimado: <strong>{price}</strong>
          </span>
        ) : (
          <span>Aguardando simulação…</span>
        )}
      </div>
    </div>
  );
}