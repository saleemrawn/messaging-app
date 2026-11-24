import axios from "axios";

const DEFAULT_API_URL = "http://localhost:3000/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? DEFAULT_API_URL,
  withCredentials: true,
});

export { api as axios };
