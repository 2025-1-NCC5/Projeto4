import React, { useState } from "react";
import "./DashboardPage.css";
import AddressAutocompleteOSM from "./components/AddressAutocompleteOSM";

export default function DashboardPage() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [price, setPrice] = useState("");

  const handleSimulate = () => {
    if (!origin || !destination) {
      setPrice("Preencha ambos os campos");
      return;
    }
    // Simulação de preço
    const simulated = (Math.random() * 95 + 5).toFixed(2);
    setPrice(`R$ ${simulated}`);
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