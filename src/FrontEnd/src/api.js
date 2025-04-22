const BASE_URL = "http://localhost:3000/api";

export async function getPrecoPrevisto() {
  const res = await fetch(`${BASE_URL}/preco`);
  const data = await res.json();
  return data;
}

