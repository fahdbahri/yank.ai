const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");

module.exports = (env) => ({
  entry: {
    content: path.resolve(__dirname, "src", "content", "content.js"),
    popup: path.resolve(__dirname, "src", "popup", "popup.js"),
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
    publicPath: "/",
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
    ],
  },
  resolve: {
    extensions: [".js"],
    fallback: {
      fs: false, // Ignore `fs` since it's not needed in the browser
      path: require.resolve("path-browserify"), // Use `path-browserify` as a polyfill
    },
  },
  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "popup", "popup.html"),
      filename: "popup.html",
      chunks: ["popup"],
      cache: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "src/manifest.json",
          to: path.join(__dirname, "dist"),
          force: true,
          transform: function (content, path) {
            return Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString()),
              })
            );
          },
        },
        {
          from: "src/icon/main.png",
          to: path.join(__dirname, "dist", "icon"),
          force: true,
        },
      ],
    }),
    new Dotenv(), // Load environment variables from .env file
  ].filter(Boolean),
});