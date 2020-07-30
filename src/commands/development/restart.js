module.exports = {
	name: 'restart',
	description: 'Normal restart. The process manager (pm2) will restart it automatically',
	category: 'development',
	permLevel: 'Moderator',
	noArgs: true,
	async execute(message, args) {
		await message.client.user.setStatus('invisible');
		await message.channel.send(`Restarting now...`);
		process.exit(0);
	}
};