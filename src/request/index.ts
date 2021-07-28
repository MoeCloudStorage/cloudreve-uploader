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
  returnXHR?: boolean;
}

export type ResponseWithXHR<R = any> = R & {
  xhr: XMLHttpRequest;
};

export type Request<T> = ResponseWithXHR<T> | XMLHttpRequest;

export function request<T = any, R = Request<T>>(
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
      if (options.returnXHR === true) {
        resolve(xhr as any);
      } else {
        try {
          resolve({ ...JSON.parse(responseText), xhr });
        } catch (e) {
          reject(e);
        }
      }
    };

    xhr.send(options.body);
  });
}

export function requestAPI<T = any>(url: string, config?: AxiosRequestConfig) {
  return axios.request<T>({ ...config, url });
}
