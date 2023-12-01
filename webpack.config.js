"use strict";

const path = require("path");

/**@returns {import('webpack').Configuration}*/
module.exports = () => {
  /**@type {any} */
  const externals = [
    { vscode: "commonjs vscode" }, // the vscode-module is created on-the-fly and must be excluded.
    "typescript",
  ];

  return {
    context: __dirname,
    target: "node",
    entry: {
      extension: "./src/extension.ts",
    },
    output: {
      path: path.resolve(__dirname, "out"),
      filename: "extension.js",
      libraryTarget: "commonjs2",
      devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: "source-map",
    externals,
    resolve: {
      extensions: [".mjs", ".js", ".svelte", ".ts"],
      mainFields: ["svelte", "browser", "module", "main"],
      alias: {
        svelte: path.resolve("node_modules", "svelte"),
        "@jest/transform": false,
        "./InlineSnapshots": false,
        "babel-preset-current-node-syntax": false,
      },
    },
    module: {
      rules: [
        {
          test: /\.(html|svelte)$/,
          exclude: /node_modules/,
          use: {
            loader: "svelte-loader",
            options: {
              emitCss: true,
            },
          },
        },
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
          },
        },
        {
          test: /\.svg$/,
          use: [{ loader: "raw-loader" }],
        },
      ],
    },
  };
};
