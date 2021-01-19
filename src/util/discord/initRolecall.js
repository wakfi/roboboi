const RoleCall = require(`discord-role-call`);
const {Collection} = require(`${process.cwd()}/util/discord/structs.js`);
const namedChannels = require(`${process.cwd()}/util/components/namedChannels.json`);

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
		roleCallConfigArray.forEach(async configObject =>
		{
			try	{
				const roleCall = new RoleCall(client,configObject);
				client.roleCalls.push(roleCall);
				removeRolesMap.set(roleCall, configObject.roleInputArray);
				
				roleCall.on('roleReactionAdd', async (reaction,member,role) =>
				{
					if(!role.members.has(member.id)) //check if user already has role
					{
						await roleCall.addRole(member,role).catch(e=>{console.error(e.stack)});
						await checkRemoveLists(member, role, roleCall);
						if(yearRoles.has(role.id))
						{
							let hasYearRole = true;
							let yearRole = null;
							while(hasYearRole)
							{
								hasYearRole = yearRoles.every(otherRole => 
								{
									yearRole = otherRole;
									return otherRole.members.has(member.id) && otherRole.id != role.id;
								}); //check if user already has a year role
								if(hasYearRole)
								{
									try {
										await roleCall.removeReaction(member, yearRole);
									} catch(e) {
										console.error(e.stack);
									}
								}
							}
						}
						if(member.roles.cache.has(studentRole))
						{
							if(role.id == alumniRole)
							{
								roleCall.removeRole(member, studentRole).catch(e=>{console.error(e.stack)});
							}
						} else {
							if(!member.roles.cache.has(studentRole) && (!member.roles.cache.has(alumniRole) || role.id == alumniRole))
							{
								roleCall.addRole(member, member.guild.roles.cache.get(studentRole));
							}
						}
					}
				});
				
				roleCall.on('roleReactionRemove', (reaction, member, role) =>
				{
					if(role.members.has(member.id)) //check if user does not have role
					{
						roleCall.removeRole(member, role)
						.then(newMember => 
						{
							const hasAStudentRole = [...roleLists.yearRoles, ...roleLists.majorRoles, ...roleLists.courseRoles].some(roleID => newMember.roles.cache.some(studentRole => studentRole.id == roleID));
							if(hasAStudentRole && role.id == alumniRole) 
							{
								if(!newMember.roles.cache.has(studentRole))
								{
									roleCall.addRole(newMember, newMember.guild.roles.cache.get(studentRole));
								}
							}
						})
						.catch(err=>{console.error(err.stack)});
					}
				});
			} catch(err) {
				await client.guilds.cache.get(server).channels.cache.get(namedChannels.testing).send(`role call went\n> yikes`);
				reject(err);
				return;
			}	
		});
		if(client.roleCalls.length)
		{
			client.addRoleInRoleCall = client.roleCalls[client.roleCalls.length-1].addRole;
			client.removeRoleInRoleCall = client.roleCalls[client.roleCalls.length-1].removeRole;
			client.removeReactionInRoleCall = client.roleCalls[client.roleCalls.length-1].removeReaction;
		}
		resolve(client.roleCalls);
		
		async function checkRemoveLists(member, role, roleCall) 
		{
			const roleInputArray = removeRolesMap.get(roleCall);
			const removeRoles = roleInputArray.find(roleInput => roleInput.role == role.id).removeRoles;
			if(!(removeRoles && removeRoles.length)) return;
			if(removeRoles && removeRoles.length)
			{
				for(let i = 0; i < removeRoles.length; i++)
				{
					const roleToRemove = removeRoles[i];
					if(!member.roles.cache.has(roleToRemove)) continue;
					const targetRoleCall = client.roleCalls.find(roleCall => roleCall.roles.has(roleToRemove));
					if(!targetRoleCall)
					{
						roleCall.removeRole(member, roleToRemove).catch(e=>{console.error(e.stack)});
						continue;
					}
					const roleToRemoveObject = await guild.roles.fetch(roleToRemove);
					try {
						targetRoleCall.removeReaction(member, roleToRemoveObject);
					} catch(e) {
						console.error(e.stack);
					}
				};
			}
		}
	});
}

module.exports = initRolecall;
