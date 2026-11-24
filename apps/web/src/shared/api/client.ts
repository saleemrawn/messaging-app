import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { axios } from "./axios.ts";

type ApiResponse<TData> = Promise<AxiosResponse<TData>>;

const api = {
  get: <TData = unknown>(
    endpoint: string,
    config?: AxiosRequestConfig,
  ): ApiResponse<TData> => axios.get<TData>(endpoint, config),

  post: <TData = unknown, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): ApiResponse<TData> =>
    axios.post<TData, AxiosResponse<TData>, TBody>(endpoint, body, config),

  put: <TData = unknown, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): ApiResponse<TData> =>
    axios.put<TData, AxiosResponse<TData>, TBody>(endpoint, body, config),

  delete: <TData = unknown>(
    endpoint: string,
    config?: AxiosRequestConfig,
  ): ApiResponse<TData> => axios.delete<TData>(endpoint, config),
};

export { api };
