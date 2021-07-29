import axios, { AxiosRequestConfig } from "axios";

export const { CancelToken } = axios;
export { CancelToken as CancelTokenType, CancelTokenSource } from "axios";

export interface RequestOptions {
  onProgress: (
    this: XMLHttpRequestUpload,
    ev: ProgressEvent<XMLHttpRequestEventTarget>
  ) => any;
  method: "GET" | "POST" | "PUT";
  headers?: [string, string][] | null;
  body: BodyInit | File | null;
}

export type ResponseWithXHR<R> = R extends Record<string, any>
  ? {
      xhr: XMLHttpRequest;
    } & R
  : {
      xhr: XMLHttpRequest;
      [key: string]: any;
    };

export function request<T, R = ResponseWithXHR<T>>(
  url: string,
  options: RequestOptions
): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(options.method, url, true);

    options.headers?.forEach((header) => {
      const [key, value] = header;
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.addEventListener("progress", options.onProgress);

    xhr.onreadystatechange = () => {
      const responseText = xhr.responseText;
      if (xhr.readyState !== 4) return;
      try {
        resolve({ ...JSON.parse(responseText), xhr });
      } catch (e) {
        reject(e);
      }
    };

    xhr.send(options.body);
  });
}

export function requestAPI<T = any>(url: string, config?: AxiosRequestConfig) {
  return axios.request<T>({ ...config, url });
}
