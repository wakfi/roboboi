module.exports = {
	name: 'unloadCommand',
	description: 'Remove a command from the currently available commands',
	category: 'development',
	usage: ['<commandName>'],
	aliases: ['ulc'],
	permLevel: 'Bot Developer',
	guildOnly: false,
	dmOnly: false,
	args: true,
	async execute(message, args) {
		const commandName = args.shift();
		try { 
			const command = message.client.commands.get(commandName) ||
							message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
			const cn = command.name; //trip try/catch on resolution failure
			try {
				const commandPath = `${process.cwd()}/commands/${command.category}/${command.name}.js`;
				delete require.cache[require.resolve(commandPath)];
				message.client.commands.sweep(cmd => cmd.name === command.name);
				message.reply(`successfully unloaded \`${command.name}\``);
			} catch (e) {
				console.error(e.stack);
				message.channel.send(`There was an error while unloading a command \`${command.name}\`:\n\`${e.message}\``);
			}
		} catch(er) {
			message.channel.send(`There is currently no command with name or alias \`${commandName}\` loaded`);
		}
	}
};