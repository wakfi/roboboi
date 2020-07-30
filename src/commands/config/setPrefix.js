const path = require('path');
const configPath = path.resolve('./components/config.json');
const config = require(configPath);
const recordFile = require(`${process.cwd()}/util/recordFile.js`);
const selfDeleteReply = require(`${process.cwd()}/util/selfDeleteReply.js`);

module.exports = {
	name: 'setPrefix',
	description: 'Change the prefix to the provided string',
	category: 'config',
	usage: ['<newPrefix>'],
	permLevel: 'Bot Admin',
	guildOnly: true,
	args: true,
	async execute(message, args) {
		config.prefix = args.join(' ');
		await recordFile(config, configPath).catch(e=>
		{
			console.error(e.stack);
			return selfDeleteReply(message, `looks like something went wrong, and your prefix wasn't updated. You should still be able to use the old prefix (Error: ${e})`, '35s');
		});
		selfDeleteReply(message, `the prefix was successfully updated to \`${config.prefix}\`! ***Please restart me to apply this change***`, '15s');
	}
};