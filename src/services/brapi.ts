import axios from "axios";

const api = axios.create({
  baseURL: "https://brapi.dev/api/",
  params: {
    token: process.env.NEXT_PUBLIC_BRAPI_TOKEN,
  },
});

export default api;
