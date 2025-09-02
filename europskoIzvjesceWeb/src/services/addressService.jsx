// addressService.jsx
export async function fetchAddressesDGU(query) {
  if (!query || query.trim().length < 2) return [];
  const response = await fetch(`/api/addresses?q=${encodeURIComponent(query)}`);
  if (!response.ok) return [];
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
