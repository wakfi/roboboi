const path = require('path');
const configPath = path.resolve(`${process.cwd()}/components/config.json`);
const config = require(configPath);
const recordFile = require(`${process.cwd()}/util/recordFile.js`);
const selfDeleteReply = require(`${process.cwd()}/util/selfDeleteReply.js`);

module.exports = {
	name: 'updateServerOwner',
	description: 'Check the current server owner, and update the recorded ID if different',
	category: 'config',
	permLevel: 'Bot Admin',
	guildOnly: true,
	noArgs: true,
	async execute(message, args) {
		const currentServerOwner = message.guild.ownerID;
		if(config.serverOwner == currentServerOwner) return selfDeleteReply(message, `registered Server Owner is already up to date`);
		config.serverOwner = currentServerOwner;
		await recordFile(config, configPath).catch(e=>
		{
			console.error(e.stack);
			return selfDeleteReply(message, `looks like something went wrong, and I wasn't able to successfully update the server owner. Note that if you are seeing this, it means I've detected a different server owner, but am having trouble saving the change (Error: ${e})`, '20s');
		});
		selfDeleteReply(message, `the Server Owner was successfully updated to ${message.guild.owner}(${currentServerOwner})! ***Please restart me to apply this change***`, '15s');
	}
};