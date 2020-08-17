const HtmlWebpackPlugin = require("html-webpack-plugin");

const siteTitle = "PoE Helper";

module.exports = {
  mode: process.env.NODE_ENV || "production",
  devtool: "source-map",
  entry: "./client/entry.jsx",
  output: {
    path: `${__dirname}/dist`,
    filename: "bundle.js",
    publicPath: "/",
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  module: {
    rules: [
      { test: /\.css$/, use: "style-loader" },
      {
        test: /\.css$/,
        use: {
          loader: "css-loader",
          options: {
            modules: {
              mode: "local",
              localIdentName: "[path][name]_[local]-[hash:base64:7]",
            },
          },
        },
      },
      {
        test: /\.m?js(x?)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react", "@babel/preset-env"],
            plugins: [
              "@babel/plugin-syntax-dynamic-import",
              "@babel/plugin-proposal-class-properties",
              "@babel/transform-runtime",
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: siteTitle,
      favicon: `./client/static/favicon.ico`,
      template: "./client/static/index.html",
      inject: "true",
    }),
  ],
};
