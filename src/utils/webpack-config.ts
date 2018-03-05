import * as  ExtractTextPlugin from "extract-text-webpack-plugin"
import * as fs from "fs-extra"
import * as HtmlWebpackPlugin from "html-webpack-plugin"
import * as path from "path"
import * as webpack from "webpack"
import * as yargs from "yargs"
import { getConfig } from "./project-config"

const projectRootPath = yargs.argv.env.projectRootPath
const entryPath = yargs.argv.env.entryPath
const env = yargs.argv.env.env
const htmlTemplatePath = yargs.argv.env.htmlTemplatePath
const htmlTemplateArgs = yargs.argv.env.htmlTemplateArgs
const devServerPort = yargs.argv.env.devServerPort

const projectConfig = getConfig(projectRootPath, env)

// Override variable
const argsPublicPath = yargs.argv.env.publicPath
const argsDistDir = yargs.argv.env.distDir
const argsDistFileName = yargs.argv.env.distFileName || "main"

const distDir = argsDistDir || path.join(projectRootPath, projectConfig.distDir)
const distFileName = argsDistFileName || projectConfig.distFileName

let publicPath: string = argsPublicPath || projectConfig.publicPath || "/"
if (!publicPath.endsWith("/")) {
  publicPath += "/"
}

const config: webpack.Configuration = {
  entry: entryPath,

  output: {
    path: distDir,
    filename: distFileName + ".js",
    publicPath,
    chunkFilename: "[chunkhash].chunk.js",
  },

  module: {
    rules: [
      {
        test: /\.(tsx|ts)?$/, use: [{
          loader: "babel-loader",
          options: {
            presets: [
              ["env", {
                modules: false,
                targets: {
                  uglify: false
                }
              }],
              ["stage-2"]
            ],
            plugins: [
              ["transform-runtime"],
              ["dynamic-import-webpack"],
              ["import", {
                libraryName: "antd"
              }]
            ]
          }
        }, "ts-loader"]
      },
      {
        test: /\.css$/,
        use: env === "local" ?
          ["style-loader", "css-loader"] :
          ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: [{
              loader: "css-loader",
              options: { minimize: true }
            }]
          })
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.less$/,
        use: ["style-loader", "css-loader", "less-loader"],
      }
    ]
  },

  resolve: {
    modules: [
      // From project node_modules
      path.join(projectRootPath, "node_modules"),
      // Self node_modules
      path.join(__dirname, "../../node_modules")
    ],
    extensions: [".js", ".jsx", ".tsx", ".ts", ".scss", ".less", ".css"]
  },

  resolveLoader: {
    modules: [
      // From project node_modules
      path.join(projectRootPath, "node_modules"),
      // Self node_modules
      path.join(__dirname, "../../node_modules")
    ]
  },

  plugins: [],

  // Only for Devserver
  devServer: {
    historyApiFallback: {
      rewrites: [
        {
          from: "/",
          to: path.join(publicPath, "index.html")
        }
      ]
    },
    https: true,
    open: true,
    overlay: {
      warnings: true,
      errors: true
    },
    port: devServerPort,
    stats: {
      version: false,
      modules: false
    },
    clientLogLevel: "warning"
  }
}

if (env === "local") {
  if (htmlTemplatePath) {
    config.plugins.push(
      new HtmlWebpackPlugin({
        title: "Pre Dev",
        filename: "index.html",
        template: htmlTemplatePath,
        htmlTemplateArgs
      })
    )
  }
}

if (env === "prod") {
  config.plugins.push(new ExtractTextPlugin(distFileName + ".css"))
}

export default config
