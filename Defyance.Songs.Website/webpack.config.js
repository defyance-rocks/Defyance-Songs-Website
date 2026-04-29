const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  entry: './src/renderer/index.tsx',
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "path": false,
      "fs": false,
      "os": false
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: '[name].[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `npm.${packageName.replace('@', '')}`;
          },
        },
      },
    },
    runtimeChunk: 'single',
  },
  performance: {
    maxAssetSize: 500000,
    maxEntrypointSize: 500000,
    hints: 'warning',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(process.env.REACT_APP_SUPABASE_URL),
      'process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY),
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
    }),
  ],
  devServer: {
    port: 3002,
    static: {
      directory: path.join(__dirname, 'dist/renderer'),
    },
    historyApiFallback: true,
  },
};