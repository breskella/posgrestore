import axios from "axios";

const API = axios.create({
  baseURL: "https://posgrestore-0ivo.onrender.com",
  withCredentials: true,
});

export default API;