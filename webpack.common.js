const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    content: "./src/content.js",
    background: "./src/background.js",
    popup: "./src/popup.js",
    offscreen: "./src/offscreen.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    fallback: {
      crypto: false,
      fs: false,
      path: false,
      stream: false,
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./src/manifest.json" },
        { from: "./src/popup.html" },
        { from: "./src/offscreen.html" },
        { from: "./src/icon" },
        {
          from: "./node_modules/tesseract.js-core/tesseract-core.wasm",
          to: "tesseract-core.wasm",
        },
        {
          from: "./node_modules/tesseract.js-core/tesseract-core.wasm.js",
          to: "tesseract-core.wasm.js",
        },
        {
          from: "./node_modules/tesseract.js/dist/worker.min.js",
          to: "worker.min.js",
        },
      ],
    }),
  ],
};