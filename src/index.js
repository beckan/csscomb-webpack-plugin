import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import arrify from 'arrify';
import assign from 'object-assign';
import globby from 'globby';
import Comb from 'csscomb';

class CSSCombWebpackPlugin {
	constructor (options) {
		this.options = options;
	}
	apply (compiler) {
		// If Webpack 4, then use new plugin hooks
		if (compiler.hooks) {
			compiler.hooks.run.tapAsync('CSSCombWebpackPlugin', (compiler, callback) => {
				this.run(compiler, callback);
			});

			compiler.hooks.watchRun.tapAsync('CSSCombWebpackPlugin', (compiler, callback) => {
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
	run (compiler, callback) {
		const context = this.options.context || compiler.context;

		this.options = assign({
			configFile: './.csscomb',
			displayErrors: true,
			files: '**/*.s?(c|a)ss'
		}, this.options);

		let logs = [];
		let touched = false;
		logs.push(chalk.bgBlackBright.black('   CSSComb is processing files:   \n'));

		const configPath = path.resolve(this.options.configFile);
		let config = null;

		if (fs.existsSync(configPath)) {
			logs.push(`Using custom config file "${configPath}"...\n`);
			config = JSON.parse(fs.readFileSync(path.resolve(this.options.configFile), 'utf8'));
		}
		else {
			logs.push('Using default config file...\n');
			config = Comb.getConfig('csscomb');
		}

		const comb = new Comb();

		globby(this.options.files).then(paths => {

			comb.configure(config);

			let promises = [];

			paths.forEach((path) => {
				let thisPromies = new Promise((resolve, reject) => {
					fs.readFile(path, (err, data) => {
						let css = data.toString();
						comb.processString(css).then((processedData) => {
							if (css === processedData) {
								resolve();
								return;
							}

							fs.writeFile(path, processedData, () => {
								logs.push(`${chalk.greenBright('[success]')} ${path}`);
								touched = true;
								resolve();
							});
						}, (reason) => {
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

				promises.push(thisPromies);
			});

			Promise.all(promises).then(() => {
				logs.push(chalk.bgBlackBright.black('\n   CSSComb is done processing files.   \n'));

				if (touched === true) {
					logs.forEach((message) => {
						console.log(message);
					});
				}

				callback();
			});

		});
	}
}

export default CSSCombWebpackPlugin;