import React, { useState } from "react";
import "./DashboardPage.css";
import AddressAutocompleteOSM from "./components/AddressAutocompleteOSM";
import { fetchWithAuth } from "./api"; // Certifique-se que o caminho está correto

export default function DashboardPage() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false); // <<< 1. Adiciona estado de loading

  const handleSimulate = async () => {
    if (!origin || !destination) {
      setPrice("Preencha ambos os campos");
      return;
    }
    if (isLoading) return; // <<< 2. Impede clique se já estiver carregando

    setIsLoading(true); // <<< 3. Define loading como true
    setPrice("Simulando…");
    try {
      const now = new Date();
      const payload = {
        origin,
        destination,
        datetime: now.toISOString(),
      };
      // Ajuste a URL se necessario (ex: http://localhost:3000/api/simulate) se o proxy nao funcionar
      const res = await fetchWithAuth("/api/simulate", { // Usa o proxy do Vite (se configurado)
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json(); // Tenta ler o JSON mesmo se nao for ok

      if (!res.ok) {
          // Usa a mensagem do backend se disponivel, senao uma padrao
          throw new Error(data?.message || `Erro ${res.status}`);
      }

      // Verifica se 'price' existe e e um numero antes de formatar
      if (data && typeof data.price === 'number' && isFinite(data.price)) {
           setPrice(`R$ ${data.price.toFixed(2)}`);
      } else {
           console.error("Resposta invalida do backend:", data);
           throw new Error("Resposta de preco invalida recebida.");
      }

    } catch (err) {
      console.error("Erro em handleSimulate:", err);
      // Mostra a mensagem de erro vinda do backend ou a mensagem padrao do catch
      setPrice(`Erro: ${err.message || "Erro desconhecido na simulacao"}`);
    } finally {
      setIsLoading(false); // <<< 4. Define loading como false (no finally para garantir)
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Simulador de Preco</h2>

      <AddressAutocompleteOSM
        label="Endereco de Origem"
        placeholder="Rua Exemplo, 123"
        onSelect={(place) => setOrigin(place)}
      />

      <AddressAutocompleteOSM
        label="Endereco de Destino"
        placeholder="Avenida Exemplo, 456"
        onSelect={(place) => setDestination(place)}
      />

      {/* 5. Desabilita o botao e muda o texto durante o loading */}
      <button
        className="simulate-btn"
        onClick={handleSimulate}
        disabled={isLoading}
      >
        {isLoading ? "Simulando..." : "Simular"}
      </button>

      <div className="result-box">
        {/* Mostra o preco OU o estado de loading/erro */}
        {isLoading ? (
             <span>Calculando...</span>
        ) : price ? (
             <span>
               Preco Estimado: <strong>{price.startsWith('Erro:') ? <span style={{color: 'red'}}>{price}</span> : price}</strong>
             </span>
        ) : (
          <span>Aguardando simulacao…</span>
        )}
      </div>
    </div>
  );
}