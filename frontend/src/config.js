export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://blood-donation-backend-kappa.vercel.app";

axios.defaults.baseURL = API_BASE_URL;
