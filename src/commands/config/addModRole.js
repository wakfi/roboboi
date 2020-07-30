const path = require('path');
const configPath = path.resolve('./components/config.json');
const config = require(configPath);
const recordFile = require(`${process.cwd()}/util/recordFile.js`);
const selfDeleteReply = require(`${process.cwd()}/util/selfDeleteReply.js`);
const ROLES_PATTERN = /@&(\d{17,18})/i;

module.exports = {
	name: 'addModRole',
	description: 'Add a role to the access list for moderation commands',
	category: 'config',
	usage: ['<RoleResolvable>'],
	permLevel: 'Bot Admin',
	guildOnly: true,
	args: true,
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
		const index = config.modRoles.indexOf(toResolve);
		if(index != -1) return selfDeleteReply(message, `${role} is already in the list of mod roles!`);
		config.modRoles.push(role.id);
		await recordFile(config, configPath).catch(e=>
		{
			console.error(e.stack);
			return selfDeleteReply(message, `looks like something went wrong; ${role} was not added as a mod role (Error: ${e})`, '25s');
		});
		selfDeleteReply(message, `added ${role} as a mod role! ***Please restart me to apply this change***`, '15s');
	}
};