export function formatDate(date) {
  return new Date(date)
    .toLocaleString()
    .replace(',', '')
    .replace(/\//g, '.');
}
