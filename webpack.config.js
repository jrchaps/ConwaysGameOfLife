const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const dev = 0;

module.exports = {
	mode: dev ? 'development' : 'production',
	entry: {
		main: './src/main.ts',
	},
	output: {
		path: path.resolve(__dirname, './build'),
		filename: '[contenthash].js',
		publicPath: '',
	},
	devServer: {
		contentBase: './build',
		hot: true,
	},
	module: {
		rules: [
			{
				test: /\.(png|svg|jpg|jpeg|gif|ttf)$/i,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]',
				},
			},
			{
				test: /\.html$/i,
				use: ['html-loader'],
			},
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, 'css-loader', { loader: 'postcss-loader', options: { postcssOptions: { plugins: [['postcss-preset-env']] } } }],
			},
			{
				test: /\.ts?$/,
				use: ['ts-loader'],
				exclude: /node_modules/,
			},
		],
	},
	plugins: [
		new CleanWebpackPlugin(),
		new MiniCssExtractPlugin(),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: './src/main.html',
			chunks: ['main'],
		}),
	],
	optimization: {
		minimizer: ['...', new CssMinimizerPlugin()],
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
};
