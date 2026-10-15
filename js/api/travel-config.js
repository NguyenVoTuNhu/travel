/* Cấu hình persistence KRUD multi-tenant. Database được KIO chọn theo domain gọi. */
const TRAVEL_CONFIG = Object.freeze({
  brand: "TypicOne ERP",
  persistence: "kio",
  apiBaseUrl: "https://kio.dvqt.vn",
  tablePrefix: "typicone_",
  chunkSize: 30000,
});
