// src/api.js
export const fetchWithAuth = async (url, options = {}) => { // <--- Adicionado async e options={} como padrão
  const token = sessionStorage.getItem("token");

  // Garante que options.headers exista antes de tentar espalhar (spread)
  const existingHeaders = options.headers || {};

  const headers = {
    'Content-Type': 'application/json', // Mantém Content-Type por padrão
    ...existingHeaders, // Espalha headers existentes (se houver)
    // Adiciona Authorization somente se o token existir
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Remover header de autorização se ele for explicitamente undefined ou null
  // (geralmente não necessário se usar o spread condicional acima)
  // if (headers.Authorization === undefined || headers.Authorization === null) {
  //   delete headers.Authorization;
  // }


  try {
    const response = await fetch(url, { ...options, headers: headers }); // headers aqui deve estar correto
    // Você pode querer adicionar tratamento de erro básico aqui
    // if (!response.ok) {
    //   // Tratar erros HTTP (4xx, 5xx)
    //   const errorData = await response.json().catch(() => ({ message: response.statusText }));
    //   console.error("API Error:", response.status, errorData);
    //   // Lançar um erro ou retornar um objeto de erro padronizado
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }
    return response; // Retorna a resposta completa (quem chama decide o que fazer com ela)
  } catch (error) {
    console.error("Fetch error:", error);
    // Tratar erros de rede ou outros erros de fetch
    throw error; // Re-lança o erro para quem chamou a função poder tratar
  }
};

// Exemplo de como chamar a função (em outro arquivo .jsx/.js):
// import { fetchWithAuth } from './api'; // ou o caminho correto
//
// async function fetchData() {
//   try {
//     const response = await fetchWithAuth('http://localhost:3000/sua-rota', { method: 'GET' }); // Ou 5000 para o python
//     if (response.ok) {
//       const data = await response.json();
//       console.log(data);
//     } else {
//       console.log("Erro na resposta:", response.status);
//     }
//   } catch (error) {
//     console.log("Erro ao buscar dados:", error);
//   }
// }
//
// fetchData();