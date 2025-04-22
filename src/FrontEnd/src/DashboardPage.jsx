import React, { useState } from "react";
import "./DashboardPage.css";
import AddressAutocompleteOSM from "./components/AddressAutocompleteOSM";
import { fetchWithAuth } from "./api";

export default function DashboardPage() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [price, setPrice] = useState("");

  const handleSimulate = async () => {
    if (!origin || !destination) {
      setPrice("Preencha ambos os campos");
      return;
    }
    setPrice("Simulando…");
    try {
      // Pega data/hora do usuário
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
      if (!res.ok) throw new Error(data.message || "Erro na simulação");
      setPrice(`R$ ${Number(data.price).toFixed(2)}`);
    } catch (err) {
      console.error(err);
      setPrice("Erro na simulação");
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Simulador de Preço</h2>

      <AddressAutocompleteOSM
        label="Endereço de Origem"
        placeholder="Rua Exemplo, 123"
        onSelect={(place) => setOrigin(place)}
      />

      <AddressAutocompleteOSM
        label="Endereço de Destino"
        placeholder="Avenida Exemplo, 456"
        onSelect={(place) => setDestination(place)}
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
