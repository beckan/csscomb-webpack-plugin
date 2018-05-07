const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const arrify = require('arrify');
const assign = require('object-assign');
const globby = require('globby');
const Comb = require('csscomb');

function apply (options = {}, compiler) {

	const context = options.context || compiler.context;

	options = assign({
		config: './.csscomb'
	}, options, {
		files: arrify(options.files || '**/*.s?(c|a)ss').map(function (file) {
			return path.join(context, '/', file);
		}),
	});

	console.log(chalk.underline.whiteBright('CSSComb is processing files:\n'));

	const configPath = path.resolve(options.config);
	let config = null;

	if (fs.existsSync(configPath)) {
		console.log(`Using custom config file "${configPath}"...\n`);
		config = JSON.parse(fs.readFileSync(path.resolve(options.config), 'utf8'));
	}
	else {
		console.log('Using default config file...\n');
		config = Comb.getConfig('csscomb');
	}

	const comb = new Comb();

	globby(options.files).then(paths => {

		comb.configure(config);

		let promises = [];

		paths.forEach((path) => {
			let thisPromise = new Promise((resolve, reject) => {
				comb.processFile(path).then((err) => {
					if (err) {
						console.log(`${chalk.redBright('[error]')} ${path}`);
						reject();
					}
					else {
						console.log(`${chalk.greenBright('[done]')} ${path}`);
						resolve();
					}
				});
			});

			promises.push(thisPromise);
		});

		Promise.all(promises).then(() => {
			console.log(`${chalk.underline.whiteBright('\nAll files are processed by CSSComb!')}\n`);
		});
	});
}

module.exports = function csscombWebpackPlugin (options) {
	return {
		apply: apply.bind(this, options)
	};
};