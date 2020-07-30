const selfDeleteReply = require(`${process.cwd()}/util/selfDeleteReply.js`);

module.exports = {
	name: 'setUsername',
	description: 'Change the username of the bot. NOTE: This is heavily rate limited by Discord, with only 2 requests permitted every hour',
	category: 'customization',
	usage: ['<username>'],
	permLevel: 'Bot Admin',
	args: true,
	async execute(message, args) {
		const newUsername = args.join(' ');
		try {
			await message.client.user.setUsername(newUsername);
			selfDeleteReply(message, `my username is now ${message.client.user.username}`, '8s');
		} catch(e) {
			console.error(e.stack);
			selfDeleteReply(message, `an error occurred while trying to change my username: ${e}`, '15s');
		}
	}
};