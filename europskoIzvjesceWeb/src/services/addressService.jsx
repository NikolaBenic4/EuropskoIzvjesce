export async function fetchAddressesDGU(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const response = await fetch(`/api/address?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      // Bitno! Ovo će ti pokazati server poruku u devtools konzoli
      const errorMsg = await response.text();
      console.error("Greška prilikom fetchanja adresa:", response.status, errorMsg);
      return [];
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Neispravan 'content-type' za /api/addresses:", contentType);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    // Greška na networku, CORS, odbijanje konekcije itd.
    console.error("Greška u fetchAddressesDGU:", err);
    return [];
  }
}
