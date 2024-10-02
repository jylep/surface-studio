import { Configuration } from "webpack";
import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";

const config: Configuration = {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, "..", "dist"),
    filename: "surface-studio-bundle.js"
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  module: {
    rules: [
      // TS & JS files
      { test: /\.(ts|tsx)$/, "exclude": /node_modules/, loader: 'ts-loader' },
      // CSS / SASS files
      { test: /\.(sa|sc|c)ss$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  plugins: [new HtmlWebpackPlugin({
    template: './public/index.html',
    filename: './index.html'
  })]
}

export default config