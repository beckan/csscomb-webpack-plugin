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

		const context = this.options.context || compiler.context;

		this.options = assign({
			configFile: './.csscomb',
			displayErrors: true,
			files: '**/*.s?(c|a)ss'
		}, this.options);

		console.log(chalk.underline.whiteBright('CSSComb is processing files:\n'));

		const configPath = path.resolve(this.options.configFile);
		let config = null;

		if (fs.existsSync(configPath)) {
			console.log(`Using custom config file "${configPath}"...\n`);
			config = JSON.parse(fs.readFileSync(path.resolve(this.options.configFile), 'utf8'));
		}
		else {
			console.log('Using default config file...\n');
			config = Comb.getConfig('csscomb');
		}

		const comb = new Comb();

		globby(this.options.files).then(paths => {

			comb.configure(config);

			let promises = [];

			paths.forEach((path) => {
				let thisPromies = new Promise((resolve, reject) => {
					let css = fs.readFileSync(path).toString();

					comb.processString(css).then((data) => {
						console.log(`${chalk.greenBright('[success]')} ${path}`);
						resolve();
					}, (reason) => {
						console.log(`${chalk.redBright('[failed]')} ${path}`);
						if (this.options.displayErrors) {
							let error = reason.stack || '';
							console.log(`${chalk.underline.whiteBright('Message')}: "${error}"\n`);
						}
						resolve();
					});
				});

				promises.push(thisPromies);
			});

			Promise.all(promises).then(() => {
				console.log(chalk.underline.whiteBright('\nCSSComb is done processing files.\n'));
				callback();
			});

		});

	});
}

module.exports = CSSCombWebpackPlugin;