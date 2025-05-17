import React, { useState, useEffect, useRef } from "react";
import "./DashboardPage.css"; // Certifique-se que este arquivo CSS não está causando problemas de layout no mapa
import AddressAutocompleteOSM from "./components/AddressAutocompleteOSM";
import { fetchWithAuth } from "./api"; // Presumo que esta função esteja correta
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import mapboxPolyline from '@mapbox/polyline'; // Para decodificar a geometria da rota
import uberLogo from "./images/uber.svg";
import nintyNineLogo from "./images/99.svg";

// Correção para ícones padrão do Leaflet
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

// Componente FitBoundsToPolyline: Focado APENAS em ajustar os bounds
const FitBoundsToPolyline = ({ polylineCoords }) => {
  const map = useMap(); // Hook do react-leaflet para obter a instância do mapa pai

  useEffect(() => {
    if (map && polylineCoords && polylineCoords.length > 0) {
      console.log("FitBoundsToPolyline: Ajustando bounds para:", polylineCoords);
      try {
        // Validação simples para garantir que são coordenadas válidas
        const isValidCoord = (coord) => Array.isArray(coord) && coord.length === 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number';
        const validPolyline = polylineCoords.every(isValidCoord);

        if (validPolyline) {
          if (polylineCoords.length > 1) {
            map.fitBounds(polylineCoords);
          } else if (polylineCoords.length === 1) { // Caso de apenas um ponto (improvável para rota)
            map.setView(polylineCoords[0], 15); // Zoom razoável para um ponto
          }
          // Não chamar invalidateSize aqui
        } else {
          console.warn("FitBoundsToPolyline: Coordenadas da polilinha inválidas para fitBounds.");
        }
      } catch (e) {
        console.error("Erro em FitBoundsToPolyline ao ajustar bounds:", e);
      }
    }
  }, [map, polylineCoords]); // Dependências: re-executar se 'map' ou 'polylineCoords' mudar

  return null; // Este componente não renderiza nada visualmente
};

// Componente MapDisplay: Usa whenCreated para invalidateSize
const MapDisplay = ({ routeCoordinates, origin, destination }) => {
  // Esta verificação é uma segurança, a lógica de renderização em DashboardPage deve prevenir isso
  if (!routeCoordinates || routeCoordinates.length === 0) {
    console.warn("MapDisplay renderizado sem routeCoordinates válidas. Isso não deveria acontecer.");
    return <div className="map-placeholder-message">Erro ao preparar dados da rota para o mapa.</div>;
  }

  const originMarkerPos = origin && typeof origin.lat === 'number' ? [origin.lat, origin.lon] : null;
  const destMarkerPos = destination && typeof destination.lat === 'number' ? [destination.lat, destination.lon] : null;

  // O centro inicial e zoom são apenas para a montagem inicial. FitBoundsToPolyline ajustará.
  const initialCenter = routeCoordinates[0] || [-23.5505, -46.6333]; // Primeiro ponto da rota ou SP como fallback
  const initialZoom = 13;

  const mapRef = useRef(null); // Para armazenar a instância do mapa se necessário fora de whenCreated

  return (
    <MapContainer
      // A 'key' é CRUCIAL. Ela força o React a desmontar e remontar o MapContainer
      // quando routeCoordinates muda. Isso cria uma nova instância do Leaflet,
      // evitando muitos problemas de estado stale comuns com o Leaflet em SPAs.
      key={JSON.stringify(routeCoordinates)}
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: '400px', width: '100%', borderRadius: '8px', marginTop: '20px' }}
      whenCreated={(mapInstance) => {
        mapRef.current = mapInstance; // Armazena a instância do mapa
        console.log("MapContainer (whenCreated): Instância do mapa criada. Agendando invalidateSize.");
        
        // O setTimeout é essencial aqui. A recriação do mapa (devido à 'key')
        // pode não ter suas dimensões de contêiner totalmente estabelecidas no DOM
        // imediatamente. O delay dá tempo para o layout se estabilizar.
        setTimeout(() => {
          if (mapRef.current) { // Verifica se o mapa ainda existe (componente pode ter desmontado)
            console.log("MapContainer (whenCreated timeout): Chamando invalidateSize.");
            mapRef.current.invalidateSize(); // Informa ao Leaflet para recalcular seu tamanho e carregar tiles
          }
        }, 300); // Comece com 300ms. Se ainda houver problemas, tente aumentar para 500ms.
                 // Se funcionar, pode tentar diminuir para 150-200ms para ver se ainda é estável.
      }}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Desenha a rota no mapa */}
      <Polyline pathOptions={{ color: 'blue', weight: 5 }} positions={routeCoordinates} />
      
      {/* Marcadores de origem e destino */}
      {originMarkerPos && <Marker position={originMarkerPos}><Popup>Origem: {origin.name || 'Ponto de partida'}</Popup></Marker>}
      {destMarkerPos && <Marker position={destMarkerPos}><Popup>Destino: {destination.name || 'Ponto de chegada'}</Popup></Marker>}
      
      {/* Componente filho para ajustar o zoom para mostrar toda a rota */}
      <FitBoundsToPolyline polylineCoords={routeCoordinates} />
    </MapContainer>
  );
};

// Componente principal da página
export default function DashboardPage() {
  const [origin, setOrigin] = useState(null); // { lat, lon, name }
  const [destination, setDestination] = useState(null); // { lat, lon, name }
  const [uberPrices, setUberPrices] = useState({});
  const [nintyNinePrices, setNintyNinePrices] = useState({});
  const [distanciaKm, setDistanciaKm] = useState("");
  const [duracaoStr, setDuracaoStr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [bestOverallPrice, setBestOverallPrice] = useState(null);
  const [routePolylineCoords, setRoutePolylineCoords] = useState(null); // [[lat, lng], ...]

  // Função para encontrar o melhor preço entre todas as categorias
  const findBestPrice = (uberP, nintyNineP) => {
    let minPrice = Infinity;
    let bestOption = null;
    const allPrices = { ...uberP, ...nintyNineP }; // Combina preços da Uber e 99
    for (const category in allPrices) {
      const price = allPrices[category];
      if (typeof price === 'number' && price < minPrice) {
        minPrice = price;
        bestOption = category;
      }
    }
    return bestOption ? { category: bestOption, price: minPrice } : null;
  };

  // Manipulador para o botão de simulação
  const handleSimulate = async () => {
    if (!origin || !destination) {
      setErrorMessage("Preencha os campos de origem e destino.");
      // Limpa resultados anteriores
      setUberPrices({}); setNintyNinePrices({}); setBestOverallPrice(null); setRoutePolylineCoords(null);
      setDistanciaKm(""); setDuracaoStr("");
      return;
    }
    if (isLoading) return; // Previne múltiplas simulações simultâneas

    setIsLoading(true);
    setErrorMessage("");
    setUberPrices({}); setNintyNinePrices({});
    setDistanciaKm(""); setDuracaoStr("");
    setBestOverallPrice(null);
    setRoutePolylineCoords(null); // IMPORTANTE: Limpar a rota antiga antes de buscar uma nova

    try {
      const payload = {
        origin: { lat: origin.lat, lon: origin.lon },
        destination: { lat: destination.lat, lon: destination.lon },
        // selectedDateTime // O backend não parece usar isso, mas poderia ser enviado se necessário
      };
      const res = await fetchWithAuth("/api/simulate", { // Sua função de fetch
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || `Erro ${res.status} na simulação.`);
      }

      // Processa os preços
      if (data && data.prices && typeof data.prices === 'object') {
        const uPrices = {};
        const nnPrices = {};
        for (const categoryKey in data.prices) {
          if (data.prices[categoryKey] !== null && data.prices[categoryKey] !== "Erro") {
            const cleanCategoryName = categoryKey.replace(/_/g, ' ').replace("Individual RF", "").trim();
            if (categoryKey.toLowerCase().includes("uber")) uPrices[cleanCategoryName] = data.prices[categoryKey];
            else if (categoryKey.toLowerCase().includes("99")) nnPrices[cleanCategoryName] = data.prices[categoryKey];
          }
        }
        setUberPrices(uPrices);
        setNintyNinePrices(nnPrices);
        setBestOverallPrice(findBestPrice(uPrices, nnPrices));
      } else {
        throw new Error("Resposta de preços inválida ou vazia recebida.");
      }

      // Processa distância e duração
      if (data.distancia_km != null) setDistanciaKm(`${data.distancia_km.toFixed(1)} km`);
      if (data.duracao_str) setDuracaoStr(data.duracao_str);

      // Processa a geometria da rota para o mapa
      if (data.route_geometry) {
        try {
          // A biblioteca mapboxPolyline.decode espera [lat,lng], mas o Leaflet usa [lat,lng] também.
          // O formato da polyline decodificada já é [[lat, lng], [lat, lng], ...]
          const decodedCoords = mapboxPolyline.decode(data.route_geometry); // O padrão de precisão é 5, se o seu backend usa 6, especifique mapboxPolyline.decode(data.route_geometry, 6)
          if (decodedCoords && decodedCoords.length > 0) {
            setRoutePolylineCoords(decodedCoords);
          } else {
            setRoutePolylineCoords(null);
            console.warn("Decodificação da polyline resultou em array vazio ou inválido.");
            setErrorMessage(prev => prev ? `${prev} (Não foi possível traçar a rota no mapa)` : "Não foi possível traçar a rota no mapa");
          }
        } catch (decodeError) {
          console.error("Erro ao decodificar polyline da rota:", decodeError);
          setRoutePolylineCoords(null);
          setErrorMessage(prev => prev ? `${prev} (Erro ao carregar rota no mapa)` : "Erro ao carregar rota no mapa");
        }
      } else {
        setRoutePolylineCoords(null); // Garante que rota seja null se não vier do backend
        console.warn("Geometria da rota não recebida do backend.");
        // Opcional: informar ao usuário que a rota não pode ser exibida
        // setErrorMessage(prev => prev ? `${prev} (Geometria da rota não disponível)` : "Geometria da rota não disponível para exibir no mapa");
      }
    } catch (err) {
      console.error("Erro em handleSimulate:", err);
      setErrorMessage(err.message || "Erro desconhecido ao simular.");
      // Limpa estados em caso de erro
      setUberPrices({}); setNintyNinePrices({}); setBestOverallPrice(null); setRoutePolylineCoords(null);
      setDistanciaKm(""); setDuracaoStr("");
    } finally {
      setIsLoading(false);
    }
  };

  // Componente para exibir os cards de preços
  const PriceCategoryCard = ({ title, prices, logoSrc }) => {
    if (Object.keys(prices).length === 0) return null; // Não renderiza se não houver preços
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
                {price !== null && typeof price === 'number'
                  ? `R$ ${price.toFixed(2)}`
                  : (price === "Erro" ? "Erro" : "N/A")}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // JSX da página
  return (
    <div className="dashboard-background">
      <div className="dashboard-container">
        <h2>Planeje sua Rota com Inteligência</h2>
        <div className="inputs-grid">
          <div className="form-group">
            <label htmlFor="origin-input">Informe sua localização</label>
            <AddressAutocompleteOSM
              id="origin-input"
              placeholder="Digite o ponto de partida"
              onSelect={(place) => {
                setOrigin(place);
                setErrorMessage("");
                setRoutePolylineCoords(null); // Limpa rota e mapa se origem mudar
              }}
            />
            <small>De onde você está saindo?</small>
          </div>
          <div className="form-group">
            <label htmlFor="destination-input">Informe seu destino</label>
            <AddressAutocompleteOSM
              id="destination-input"
              placeholder="Digite o destino"
              onSelect={(place) => {
                setDestination(place);
                setErrorMessage("");
                setRoutePolylineCoords(null); // Limpa rota e mapa se destino mudar
              }}
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

        {/* Exibição de mensagens de erro */}
        {errorMessage && !isLoading && (
          <div className="result-box error-box">
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Exibição do resumo da viagem (distância, tempo, melhor preço) */}
        {!isLoading && !errorMessage && (distanciaKm || duracaoStr || bestOverallPrice) && (
          <div className="result-box summary-box">
            {distanciaKm && <p>Distância: <strong>{distanciaKm}</strong></p>}
            {duracaoStr && <p>Tempo Estimado: <strong>{duracaoStr}</strong></p>}
            {bestOverallPrice && (
              <p className="best-price-highlight">
                Melhor Preço: <strong> R$ {bestOverallPrice.price.toFixed(2)}</strong> ({bestOverallPrice.category.replace(/_/g, ' ')})
              </p>
            )}
          </div>
        )}

        {/* Container do Mapa - Lógica de exibição atualizada */}
        <div className="map-display-container">
          {isLoading && <div className="map-placeholder-message">Carregando mapa...</div>}

          {/* Mostrar MapDisplay SOMENTE se a rota estiver disponível e não estiver carregando/com erro */}
          {!isLoading && !errorMessage && routePolylineCoords && routePolylineCoords.length > 0 && (
            <MapDisplay
              routeCoordinates={routePolylineCoords}
              origin={origin} // Passar origin e destination para os marcadores
              destination={destination}
            />
          )}

          {/* Placeholder quando o mapa não deve ser exibido */}
          {!isLoading && !errorMessage && (!routePolylineCoords || routePolylineCoords.length === 0) && (
            <div className="map-placeholder-message">
              {(!origin || !destination)
                ? "Selecione origem e destino para visualizar o mapa."
                : "Clique em 'Simular Preços e Rota' para ver o trajeto no mapa."
              }
            </div>
          )}
        </div>

        {/* Exibição dos cards de preços */}
        {!isLoading && !errorMessage && (Object.keys(uberPrices).length > 0 || Object.keys(nintyNinePrices).length > 0) && (
          <div className="price-cards-container">
            <PriceCategoryCard title="Uber" prices={uberPrices} logoSrc={uberLogo} />
            <PriceCategoryCard title="99" prices={nintyNinePrices} logoSrc={nintyNineLogo} />
          </div>
        )}

        {/* Mensagem inicial/placeholder se nada foi feito e não há resultados/mapa */}
        {!isLoading && !errorMessage && !distanciaKm && !bestOverallPrice && Object.keys(uberPrices).length === 0 && Object.keys(nintyNinePrices).length === 0 && (!routePolylineCoords || routePolylineCoords.length === 0) && (
            !origin || !destination // Mostra esta mensagem apenas se os inputs não foram preenchidos
        ) && (
          <div className="result-box">
            <p>Insira origem e destino para simular.</p>
          </div>
        )}
      </div>
    </div>
  );
}