// src/components/MapComponent.jsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Importar L para ícones de marcador personalizados

// Correção para o problema do ícone padrão do marcador do Leaflet com Webpack/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Componente para ajustar o bounds do mapa
const FitBoundsToPolyline = ({ polylineCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (polylineCoords && polylineCoords.length > 0) {
      map.fitBounds(polylineCoords);
    }
  }, [polylineCoords, map]);
  return null;
};

const MapComponent = ({ routeCoordinates, originCoords, destinationCoords }) => {
  if (!routeCoordinates || routeCoordinates.length === 0) {
    return <div className="map-placeholder-message">Calculando rota no mapa...</div>;
  }

  // As coordenadas da Polyline do Leaflet são [latitude, longitude]
  // A `routeCoordinates` já deve estar nesse formato se decodificada corretamente.
  const polylinePositions = routeCoordinates;

  // Posições dos marcadores [latitude, longitude]
  const originMarker = originCoords ? [originCoords.lat, originCoords.lon] : null;
  const destinationMarker = destinationCoords ? [destinationCoords.lat, destinationCoords.lon] : null;

  return (
    <MapContainer 
      center={polylinePositions[0] || [0,0]} // Centraliza na primeira coordenada da rota ou um default
      zoom={13} 
      scrollWheelZoom={false} 
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{b}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline pathOptions={{ color: 'blue' }} positions={polylinePositions} />
      
      {originMarker && (
        <Marker position={originMarker}>
          <Popup>Origem</Popup>
        </Marker>
      )}
      {destinationMarker && (
        <Marker position={destinationMarker}>
          <Popup>Destino</Popup>
        </Marker>
      )}
      {/* Ajusta o zoom e centro do mapa para mostrar toda a polilinha */}
      <FitBoundsToPolyline polylineCoords={polylinePositions} />
    </MapContainer>
  );
};

export default MapComponent;