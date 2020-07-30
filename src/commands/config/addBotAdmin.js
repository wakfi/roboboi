const path = require('path');
const configPath = path.resolve('./components/config.json');
const config = require(configPath);
const recordFile = require(`${process.cwd()}/util/recordFile.js`);
const selfDeleteReply = require(`${process.cwd()}/util/selfDeleteReply.js`);
const USERS_PATTERN = /<@!?(\d{17,18})>/i

module.exports = {
	name: 'addBotAdmin',
	description: 'Add a user to the list of Bot Administrators',
	category: 'config',
	usage: ['<UserResolvable>'],
	permLevel: 'Server Owner',
	guildOnly: true,
	args: true,
	async execute(message, args) {
		let user;
		const joinArgs = args.join(' ');
		const toResolve = USERS_PATTERN.test(joinArgs) ? USERS_PATTERN.exec(joinArgs)[1] : joinArgs;
		try	{
			const manager = message.client.users;
			user = await manager.fetch(manager.resolveID(toResolve));
			const uid = user.id;
		} catch(e) {
			return selfDeleteReply(message, `could not resolve "${joinArgs}" to a user`);
		}
		const index = config.admins.indexOf(user.id);
		if(index != -1) return selfDeleteReply(message, `${user} is already listed as a Bot Admin!`);
		config.admins.push(user.id);
		await recordFile(config, configPath).catch(e=>
		{
			console.error(e.stack);
			return selfDeleteReply(message, `looks like something went wrong; ${user} was not added as a Bot Admin (Error: ${e})`, '25s');
		});
		selfDeleteReply(message, `added ${user} as a Bot Admin! ***Please restart me to apply this change***`, '15s');
	}
};