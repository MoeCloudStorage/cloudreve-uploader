var path = require("path");

module.exports = {
  // Change to your "entry-point".
  entry: "./src/index",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "cloudreve-uploader.js",
    libraryTarget: "umd",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },
};
