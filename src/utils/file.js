export const MB = 1024 ** 2;
export function sliceFileChunks(file, chunkSize) {
    const chunks = [];
    const count = Math.ceil(file.size / chunkSize);
    for (let i = 0; i < count; i++) {
        chunks.push(file.slice(chunkSize * i, 
        // 最后一个 chunk
        count === i + 1 ? file.size : chunkSize * (i + 1)));
    }
    return chunks;
}
//# sourceMappingURL=file.js.map