const RoleCall = require(`discord-role-call`);
const {Collection} = require(`${process.cwd()}/util/discord/structs.js`);
const namedChannels = require(`${process.cwd()}/util/components/namedChannels.json`);

//inputs for the RoleCall objects
const {roleCallConfigArray} = require(`${process.cwd()}/util/components/roleCallConfig.json`);
const roleLists = require(`${process.cwd()}/util/components/roleLists.json`);

const yearRoles = new Collection();
const majorRoles = new Collection();
const courseRoles = new Collection();

function initRolecall(client,server,memberRole)
{
	return new Promise(async (resolve,reject) =>
	{
		const guildRoles = client.guilds.resolve(server).roles.cache;
		roleLists.yearRoles.forEach(yearRole => yearRoles.set(yearRole, guildRoles.get(yearRole)));
		roleLists.majorRoles.forEach(majorRole => majorRoles.set(majorRole, guildRoles.get(majorRole)));
		roleLists.courseRoles.forEach(courseRole => courseRoles.set(courseRole, guildRoles.get(courseRole)));		
		roleCallConfigArray.forEach(async configObject =>
		{
			try	{
				const roleCall = new RoleCall(client,configObject);
				client.roleCalls.push(roleCall);
				
				roleCall.on('roleReactionAdd', async (reaction,member,role) =>
				{
					if(!role.members.has(member.id)) //check if user already has role
					{
						const addMemberRole = !member.roles.cache.has(memberRole);
						await roleCall.addRole(member,role).catch(err=>{console.error(err.stack)});
						if(!addMemberRole && !yearRoles.has(role.id)) return; //check if year role
						let hasAYearRole = !addMemberRole;
						let yearRole = null;
						while(hasAYearRole)
						{
							hasAYearRole = !yearRoles.every(otherRole => 
							{
								yearRole = otherRole;
								return !otherRole.members.has(member.id) || otherRole.id == role.id;
							}); //check if user already has a year role
							if(hasAYearRole)
							{
								try{
									await roleCall.removeReaction(member, yearRole);
								} catch(e) {
									console.error(e.stack);
								}
							}
						}
						if(addMemberRole)
						{
							if(!member.roles.cache.has(memberRole))
							{
								roleCall.addRole(member, member.guild.roles.cache.get(memberRole));
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
							const removeMemberRole = ![...roleLists.yearRoles, ...roleLists.majorRoles, ...roleLists.courseRoles].some(roleID => newMember.roles.cache.some(memberRole => memberRole.id == roleID));
							if(removeMemberRole)
							{
								if(newMember.roles.cache.has(memberRole))
								{
									roleCall.removeRole(newMember, newMember.guild.roles.cache.get(memberRole));
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
		resolve(client.roleCalls);
	});
}

module.exports = initRolecall;