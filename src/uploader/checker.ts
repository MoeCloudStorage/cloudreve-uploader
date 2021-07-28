import { Options } from "./index";

interface Checker {
  (file: File | null, options: Options): void;
}

const checkers: Array<Checker> = [
  function checkExt(file: File | null, options: Options) {
    const allowedType = options.filters.allowedType;
    if (allowedType.length !== 0) {
      const ext = file?.name.split(".").pop();
      if (ext === null || !ext) throw new Error("您当前的用户组不可上传此文件");
      if (!allowedType.includes(ext))
        throw new Error("您当前的用户组不可上传此文件");
    }
  },

  function checkSize(file: File | null, options: Options) {
    if (options.maxFileSize !== "0.00mb") {
      const maxFileSize = parseFloat(options.maxFileSize.replace("mb", ""));

      const fileSize = file?.size!! / (1024 * 1024);

      if (fileSize > maxFileSize)
        throw new Error(
          `文件过大，您当前用户组最多可上传 ${maxFileSize} mb的文件`
        );
    }
  },
];

export function check(file: File | null, options: Options) {
  checkers.forEach((c) => c(file, options));
}
