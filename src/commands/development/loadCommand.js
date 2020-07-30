const assert = require('assert');
const loadAllCommands = require(`${process.cwd()}/util/loadAllCommands.js`);

module.exports = {
	name: 'loadCommand',
	description: 'Load a new command that is not currently cached into the available commands',
	category: 'development',
	usage: ['<commandName>'],
	aliases: ['ldc'],
	permLevel: 'Bot Developer',
	guildOnly: false,
	dmOnly: false,
	args: true,
	async execute(message, args) {
		const commandName = args.shift();
		if(message.client.commands.has(commandName)) return message.channel.send(`${commandName} has already been loaded. Please use reloadCommand (rlc) instead`);
		try {
			const commandPath = `${process.cwd()}/commands/`
			const loadedCount = await loadAllCommands(message.client, commandPath, `${commandName}.js`);
			if(loadedCount < 1) return message.channel.send(`Could not find a command with name \`${commandName}\``);
			assert(!(loadedCount > 1)); //loadedCount == 1
			message.reply(`loaded \`${commandName}\` successfully`);
		} catch (e) {
			console.error(e.stack);
			message.channel.send(`There was an error while loading a command \`${commandName}\`:\n\`${e.message}\``);
		}
	}
};