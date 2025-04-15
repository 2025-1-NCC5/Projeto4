export async function fetchWithAuth(url, options = {}) {
  const token = sessionStorage.getItem("token");
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };
  const response = await fetch(url, { ...options, headers });
  return response;
}
