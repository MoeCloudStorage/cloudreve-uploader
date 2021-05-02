export interface RequestOptions {
  onProgress: (
    this: XMLHttpRequestUpload,
    ev: ProgressEvent<XMLHttpRequestEventTarget>
  ) => any;
  method: "GET" | "POST";
  headers?: [string, string][] | null;
  body: BodyInit | File | null;
}

export function request<T = any>(
  url: string,
  options: RequestOptions
): Promise<T> {
  return new Promise((resolve, reject) => {
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
        resolve(JSON.parse(responseText));
      } catch (e) {
        reject(e);
      }
    };

    xhr.send(options.body);
  });
}
