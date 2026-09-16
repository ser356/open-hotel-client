const env = require('dotenv').config()
const path = require('path')
const webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const resourcesBase = process.env.RESOURCES_BASE || env.parsed?.RESOURCES_BASE
if (!resourcesBase) throw new Error('RESOURCES_BASE is required')

/** @type import('webpack').Configuration */
const config = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.json'],
    alias: {
      vue$: 'vue/dist/vue.runtime.esm.js',
    },
  },
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/habbo/',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(tsx?)$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
      },
      {
        test: /\.vue$/,
        exclude: /node_modules/,
        loader: 'vue-loader',
      },
      {
        test: /\.styl(us)?$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'stylus-loader'
        ]
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.(jgpe?g|png|gif|mp3|wav|ogg)$/,
        type: 'asset/resource'
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.RESOURCES_BASE': JSON.stringify(resourcesBase),
    }),
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      title: 'Open Hotel',
      favicon: './public/favicon.ico',
      template: './public/index.html',
    }),
  ],
  devtool: process.env.NODE_ENV === 'production' ? false : '#source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    host: '127.0.0.1',
  }
}

module.exports = config
