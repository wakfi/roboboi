module.exports = {
	name: 'ping',
	description: 'Ping! Provides information about the bot\'s current connection latency',
	category: 'general',
	permLevel: 'User',
	guildOnly: false,
	dmOnly: false,
	args: false,
	noArgs: true,
	async execute(message, args) {
		const m = await message.channel.send("🏓 Ping?");
		m.edit(`🏓 Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(message.client.ws.ping)}ms`);
	},
};