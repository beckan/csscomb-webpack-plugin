const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const arrify = require('arrify');
const assign = require('object-assign');
const globby = require('globby');
const Comb = require('csscomb');

function CSSCombWebpackPlugin (options) {
	this.options = options;
}

CSSCombWebpackPlugin.prototype.apply = function (compiler) {

	compiler.hooks.run.tapAsync('CSSCombWebpackPlugin', (compiler, callback) => {
		this.run(compiler, callback);
	});

	compiler.hooks.watchRun.tapAsync('CSSCombWebpackPlugin', (compiler, callback) => {
		this.run(compiler, callback);
	});
}

CSSCombWebpackPlugin.prototype.run = function (compiler, callback) {

	const context = this.options.context || compiler.context;

	this.options = assign({
		configFile: './.csscomb',
		displayErrors: true,
		files: '**/*.s?(c|a)ss'
	}, this.options);

	let logs = [];
	let touched = false;

	logs.push(chalk.underline.whiteBright('CSSComb is processing files:\n'));

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
							logs.push(`${chalk.underline.whiteBright('Message')}: "${error}"\n`);
						}
						resolve();
					});
				});
			});

			promises.push(thisPromies);
		});

		Promise.all(promises).then(() => {
			logs.push(chalk.underline.whiteBright('\nCSSComb is done processing files.\n'));

			if (touched === true) {
				logs.forEach((message) => {
					console.log(message);
				});
			}

			callback();
		});

	});
}

module.exports = CSSCombWebpackPlugin;