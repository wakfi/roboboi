const path = require('path');
const configPath = path.resolve('./components/config.json');
const config = require(configPath);
const recordFile = require(`${process.cwd()}/util/recordFile.js`);
const selfDeleteReply = require(`${process.cwd()}/util/selfDeleteReply.js`);
const USERS_PATTERN = /@!?(\d{17,18})/i;

module.exports = {
	name: 'removeMod',
	description: 'Remove a user from the access list to moderation commands',
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
		const index = config.moderators.indexOf(user.id);
		if(index == -1) return selfDeleteReply(message, `${user} is not currently a moderator`);
		config.moderators.splice(index, 1);
		await recordFile(config, configPath).catch(e=>
		{
			console.error(e.stack);
			return selfDeleteReply(message, `looks like something went wrong; ${user} wasn't removed from moderators (Error: ${e})`, '25s');
		});
		await selfDeleteReply(message, `removed ${user} from moderators. ***Please restart me to apply this change***`, '15s');
	}
};