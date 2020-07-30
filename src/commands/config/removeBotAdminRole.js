const path = require('path');
const configPath = path.resolve('./components/config.json');
const config = require(configPath);
const recordFile = require(`${process.cwd()}/util/recordFile.js`);
const selfDeleteReply = require(`${process.cwd()}/util/selfDeleteReply.js`);
const ROLES_PATTERN = /<@&(\d{17,18})>/i

module.exports = {
	name: 'removeBotAdminRole',
	description: 'Remove a role from the list of Bot Administrator roles',
	category: 'config',
	usage: ['<RoleResolvable>'],
	permLevel: 'Server Owner',
	guildOnly: true,
	args: true,
	unlisted: true,
	async execute(message, args) {
		let role;
		const joinArgs = args.join(' ');
		const toResolve = ROLES_PATTERN.test(joinArgs) ? ROLES_PATTERN.exec(joinArgs)[1] : joinArgs;
		try	{
			const manager = message.guild.roles;
			role = await manager.fetch(manager.resolveID(toResolve));
			const rid = role.id;
		} catch(e) {
			return selfDeleteReply(message, `could not resolve "${joinArgs}" to a role`);
		}
		const index = config.adminRoles.indexOf(role.id);
		if(index == -1) return selfDeleteReply(message, `${role} isn't currently listed as a Bot Admin role`);
		config.adminRoles.splice(index, 1);
		await recordFile(config, configPath).catch(e=>
		{
			console.error(e.stack);
			return selfDeleteReply(message, `looks like something went wrong; ${role} wasn't removed from Bot Admin roles (Error: ${e})`, '25s');
		});
		selfDeleteReply(message, `removed ${role} from Bot Admin roles. ***Please restart me to apply this change***`, '15s');
	}
};