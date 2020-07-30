const path = require('path');
const configPath = path.resolve('./components/config.json');
const config = require(configPath);
const recordFile = require(`${process.cwd()}/util/recordFile.js`);
const selfDeleteReply = require(`${process.cwd()}/util/selfDeleteReply.js`);
const USERS_PATTERN = /@!?(\d{17,18})/i;

module.exports = {
	name: 'addMod',
	description: 'Add a user to the access list for moderation commands',
	category: 'config',
	usage: ['<UserResolvable>'],
	permLevel: 'Bot Admin',
	guildOnly: true,
	args: true,
	unlisted: true,
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
		const index = config.moderators.indexOf(toResolve);
		if(index != -1) return selfDeleteReply(message, `${user} is already a moderator!`);
		config.moderators.push(user.id);
		await recordFile(config, configPath).catch(e=>
		{
			console.error(e.stack);
			return selfDeleteReply(message, `looks like something went wrong; ${user} was not added to moderators (Error: ${e})`, '25s');
		});
		selfDeleteReply(message, `added ${user} to moderators! ***Please restart me to apply this change***`, '15s');
	}
};