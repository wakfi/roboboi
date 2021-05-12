const RoleCall = require(`discord-role-call`);
const {Collection} = require(`${process.cwd()}/util/discord/structs.js`);
const namedChannels = require(`${process.cwd()}/util/components/namedChannels.json`);
const util = require('util');
//inputs for the RoleCall objects
const {roleCallConfigArray} = require(`${process.cwd()}/util/components/roleCallConfig.json`);
const roleLists = require(`${process.cwd()}/util/components/roleLists.json`);

const yearRoles = new Collection();
const majorRoles = new Collection();
const courseRoles = new Collection();
const removeRolesMap = new Collection();
const alumniRole = `674309198166753310`;

function initRolecall(client,server,studentRole)
{
	return new Promise(async (resolve,reject) =>
	{
		const guild = await client.guilds.fetch(server);
		const guildRoles = guild.roles.cache;
		roleLists.yearRoles.forEach(yearRole => yearRoles.set(yearRole, guildRoles.get(yearRole)));
		roleLists.majorRoles.forEach(majorRole => majorRoles.set(majorRole, guildRoles.get(majorRole)));
		roleLists.courseRoles.forEach(courseRole => courseRoles.set(courseRole, guildRoles.get(courseRole)));		
		roleCallConfigArray.forEach(configObject =>
		{
			try	{
				const roleCall = new RoleCall(client,configObject);
				//roleCall._constr;
				client.roleCalls.push(roleCall);
				removeRolesMap.set(roleCall, configObject.roleInputArray);
				
				roleCall.on('roleReactionAdd', async (reaction,member,role) =>
				{
					if(!role.members.has(member.id)) // ensure user does not have role
					{
						await roleCall.addRole(member,role).catch(e=>{console.error(e.stack)});
						await checkRemoveLists(member, role, roleCall);
						if(role.id == alumniRole)
						{
							if(member.roles.cache.has(studentRole))
							{
								roleCall.removeRole(member, studentRole).catch(e=>{console.error(e.stack)});
							}
						}
					}
				});
				
				roleCall.on('roleReactionRemove', (reaction, member, role) =>
				{
					if(role.members.has(member.id)) // ensure user has role
					{
						roleCall.removeRole(member, role)
						.then(newMember => 
						{
							if(role.id == alumniRole) 
							{
								if(!newMember.roles.cache.has(studentRole))
								{
									roleCall.addRole(newMember, newMember.guild.roles.cache.get(studentRole)).catch(e=>{console.error(e.stack)});
								}
							}
						})
						.catch(err=>{console.error(err.stack)});
					} else {
							if(role.id == alumniRole) 
							{
								if(!member.roles.cache.has(studentRole))
								{
									roleCall.addRole(member, member.guild.roles.cache.get(studentRole)).catch(e=>{console.error(e.stack)});
								}
							}
					}
				});
			} catch(err) {
				client.guilds.cache.get(server).channels.cache.get(namedChannels.testing).send(`role call went\n> yikes`).then(_=>reject(err));
				reject(console.log('you should not see this in initRolecalls'));
				return;
			}
		});
		Promise.all(client.roleCalls.map(roleCall => roleCall._constr));
		resolve(client.roleCalls);
		
		async function checkRemoveLists(member, role, roleCall) 
		{
			const roleInputArray = removeRolesMap.get(roleCall);
			const removeRoles = roleInputArray.find(roleInput => roleInput.role == role.id).removeRoles;
			if(!(removeRoles && removeRoles.length)) return;
			for(let i = 0; i < removeRoles.length; i++)
			{
				const roleToRemove = removeRoles[i];
				if(!member.roles.cache.has(roleToRemove)) continue;
				const targetRoleCall = client.roleCalls.find(roleCall => roleCall.roles.has(roleToRemove));
				console.log(util.inspect(targetRoleCall, {depth:1}));
				if(!targetRoleCall)
				{
					roleCall.removeRole(member, roleToRemove).catch(e=>{console.error(e.stack)});
					continue;
				}
				try {
					targetRoleCall.removeReaction(member, roleToRemove).catch(e=>{console.error(e.stack)});
				} catch(e) {
					console.error(e.stack);
				}
			};
		}
	});
}

module.exports = initRolecall;
