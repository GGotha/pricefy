import axios from "axios";

const api = axios.create({
  baseURL: "https://brapi.dev/api/",
  params: {
    token: process.env.BRAPI_TOKEN,
  },
});

export default api;
