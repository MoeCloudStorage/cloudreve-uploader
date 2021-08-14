// 检查器
const checkers = [
    function checkExt(file, options) {
        const allowedType = options.filters.allowedType;
        if (allowedType.length !== 0) {
            const ext = file?.name.split(".").pop();
            if (ext === null || !ext)
                throw new Error("您当前的用户组不可上传此文件");
            if (!allowedType.includes(ext))
                throw new Error("您当前的用户组不可上传此文件");
        }
    },
    function checkSize(file, options) {
        if (options.maxFileSize !== "0.00mb") {
            const maxFileSize = parseFloat(options.maxFileSize.replace("mb", ""));
            // 转 mb
            const fileSize = file?.size / (1024 * 1024);
            if (fileSize > maxFileSize)
                throw new Error(`文件过大，您当前用户组最多可上传 ${maxFileSize} mb的文件`);
        }
    },
];
/* 将每个 Checker 执行
   失败返回 Error
 */
export function check(file, options) {
    checkers.forEach((c) => c(file, options));
}
//# sourceMappingURL=checker.js.map