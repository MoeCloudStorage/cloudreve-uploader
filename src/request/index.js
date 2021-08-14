import axios from "axios";
export const { CancelToken } = axios;
export function request(url, options) {
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
            if (xhr.readyState !== 4)
                return;
            try {
                resolve({ ...JSON.parse(responseText), xhr });
            }
            catch (e) {
                reject(e);
            }
        };
        xhr.send(options.body);
    });
}
export function requestAPI(url, config) {
    return axios.request({ ...config, url });
}
//# sourceMappingURL=index.js.map