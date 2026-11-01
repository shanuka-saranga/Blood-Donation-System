import axios from "axios";

const configuredApiUrl =
  import.meta.env.VITE_API_URL ||
  "https://blood-donation-backend-kappa.vercel.app";

// API paths already include /api, so avoid creating /api/api URLs.
export const API_BASE_URL = configuredApiUrl.replace(/\/+api\/?$/, "");

axios.defaults.baseURL = API_BASE_URL;
