import type { FetcherOptions } from "../types/FetcherOptions";
import { URLS } from "../config/urls";

export const fetcher = (path: string, options: FetcherOptions = {}) => {
  const { body, headers = {}, ...rest } = options;

  const isFormData = body instanceof FormData;
  const finalBody =
    body && typeof body === "object" && !isFormData
      ? JSON.stringify(body)
      : body;

  return fetch(`${URLS.BACKEND_API}${path}`, {
    credentials: 'include',
    headers: isFormData
      ? headers
      : {
        "Content-Type": "application/json",
        ...headers,
      },
    body: finalBody,
    ...rest,
  }).then(async (res) => {
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return Promise.reject({ status: res.status, ...error });
    }
    return res.json();
  });
};