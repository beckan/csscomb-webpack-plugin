/**
 * csscomb-webpack-plugin
 * ---
 * A Webpack plugin to let CSSComb process CSS source files.
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import globby from 'globby';
import CSSComb from 'csscomb';

class CSSCombWebpackPlugin {
	/**
	 * Constructor, get options
	 * @param  {[Object]} options [User options]
	 */
	constructor (options = {}) {
		this.pluginName = 'CSSCombWebpackPlugin';
		this.options = options;
	}

	/**
	 * Init webpack plugin hooks
	 * @param  {[Object]} compiler [Webpack compiler]
	 */
	apply (compiler) {
		// If Webpack 4, then use new plugin hooks
		if (compiler.hooks) {
			compiler.hooks.run.tapAsync(this.pluginName, (compiler, callback) => {
				this.run(compiler, callback);
			});

			compiler.hooks.watchRun.tapAsync(this.pluginName, (compiler, callback) => {
				this.run(compiler, callback);
			});
		}
		// Otherwise use the old way of init plugin
		else {
			compiler.plugin('run', (compiler, callback) => {
				this.run(compiler, callback);
			})

			compiler.plugin('watch-run', (compiler, callback) => {
				this.run(compiler, callback);
			})
		}
	}

	/**
	 * Process files
	 * @param  {[Object]} compiler [Webpack compiler]
	 * @param  {Function} callback [Webpack callback function]
	 */
	run (compiler, callback) {
		const context = this.options.context || compiler.context;

		// Merge options
		this.options = Object.assign({
			configFile: './.csscomb',
			displayErrors: true,
			files: '**/*.s?(c|a)ss'
		}, this.options);

		let logs = [];
		let touched = false;

		// Start message
		logs.push(chalk.bgBlackBright.black('   CSSComb is processing files:   \n'));

		// Get CSSComb config path
		const configPath = path.resolve(this.options.configFile);
		let config = null;

		// If a custom config exists, then get it
		if (fs.existsSync(configPath)) {
			logs.push(`Using custom config file "${configPath}"...\n`);
			config = JSON.parse(fs.readFileSync(path.resolve(this.options.configFile), 'utf8'));
		}
		// Otherwise get csscomb stadard config
		else {
			logs.push('Using default config file...\n');
			config = CSSComb.getConfig('csscomb');
		}

		// New instans of CSSComb
		const csscomb = new CSSComb();

		// Get all files to process
		globby(this.options.files).then(paths => {

			// Configure CSSComb
			csscomb.configure(config);

			let promises = [];

			// Walk trough files
			paths.forEach((path) => {
				let thisPromies = new Promise((resolve, reject) => {

					// Read file
					fs.readFile(path, (err, data) => {

						// Get file content
						let css = data.toString();

						// Let CSSComb process the content
						csscomb.processString(css).then((processedData) => {
							// If the file is already processed. Then resolve without write to the file
							if (css === processedData) {
								resolve();
								return;
							}

							// Write changes to the file, then log success message and resolve
							fs.writeFile(path, processedData, () => {
								logs.push(`${chalk.greenBright('[success]')} ${path}`);
								touched = true;
								resolve();
							});

						// On CSSComb process error
						}, (reason) => {

							// If we want to display CSSComb errors, then log the error
							if (this.options.displayErrors) {
								let error = reason.stack || '';
								logs.push(`${chalk.redBright('[failed]')} ${path}`);
								logs.push(`${chalk.underline.whiteBright('Message')}: "${error}"\n`);
								touched = true;
							}
							resolve();
						});
					});
				});

				// Push promise to the premise array
				promises.push(thisPromies);
			});

			//When all files is processed
			Promise.all(promises).then(() => {
				logs.push(chalk.bgBlackBright.black('\n   CSSComb is done processing files.   \n'));

				// Console log all messages if some file where touched
				if (touched === true) {
					logs.forEach((message) => {
						console.log(message);
					});
				}

				// Webpack callback..
				callback();
			});

		});
	}
}

export default CSSCombWebpackPlugin;