const {Collection} = require(`${process.cwd()}/util/discord/structs.js`);
const namedChannels = require(`${process.cwd()}/util/components/namedChannels.json`);

//inputs for the RoleCall objects
const roleCallConfig = require(`${process.cwd()}/util/components/roleCallConfig.json`);
const roleCallConfigContinued = require(`${process.cwd()}/util/components/roleCallConfigContinued.json`);

const yearRoles = new Collection();
const majorRoles = new Collection();
const courseRoles = new Collection();

function initRolecall(client,server,memberRole)
{
	return new Promise(async (resolve,reject) =>
	{
		let firstRoleArr = roleCallConfig.roleInputArray;
		let secondRoleArr = roleCallConfigContinued.roleInputArray;
		for(let i = 0; i < 5; i++)						{ yearRoles.set(firstRoleArr[i].role, client.guilds.get(server).roles.get(firstRoleArr[i].role)) }
		for(let i = 5; i < 10; i++)						{ majorRoles.set(firstRoleArr[i].role, client.guilds.get(server).roles.get(firstRoleArr[i].role)) }
		for(let i = 10; i < firstRoleArr.length; i++)	{ courseRoles.set(firstRoleArr[i].role, client.guilds.get(server).roles.get(firstRoleArr[i].role)) }
		for(let i = 0; i < secondRoleArr.length; i++)	{ courseRoles.set(secondRoleArr[i].role, client.guilds.get(server).roles.get(secondRoleArr[i].role)) }
		
		
		try	{
			client.roleCalls.push(new RoleCall(client,roleCallConfig));
			client.roleCalls.push(new RoleCall(client,roleCallConfigContinued));
		} catch(err) {
			await client.guilds.get(server).channels.get(namedChannels.testing).send(`role call went\n> yikes`);
			reject(err);
			return;
		}	
		
			client.roleCalls[0].on('roleReactionAdd', (reaction,member,role) =>
			{
				if(!role.members.has(member.id)) //check if user already has role
				{
					let addTheRole = true;
					if(yearRoles.has(role.id)) //check if year role
					{
						yearRoles.array().map(role => addTheRole = addTheRole && !role.members.has(member.id)); //check if user already has a year role
					}
					
					addTheRole ? client.roleCalls[0].addRole(member,role).catch(err=>{console.error(err.stack)})	:
								 reaction.remove(member)												;
								 
					if(addTheRole)
					{
						if(!member.roles.has(memberRole))
						{
							client.roleCalls[0].addRole(member,member.guild.roles.get(memberRole));
						}
					}
				}
			});

			client.roleCalls[1].on('roleReactionAdd', (reaction,member,role) =>
			{
				if(!role.members.has(member.id)) //check if user already has role
				{
					client.roleCalls[1].addRole(member,role)
					.catch(err=>{console.error(err.stack)});
					
					if(!member.roles.has(memberRole))
					{
						client.roleCalls[1].addRole(member,member.guild.roles.get(memberRole));
					}
				}
			});

			client.roleCalls[0].on('roleReactionRemove', (reaction,member,role) =>
			{
				if(role.members.has(member.id)) //check if user does not have role
				{
					client.roleCalls[0].removeRole(member,role)
					.then(newMember => 
					{
						if(newMember.roles.size == 2)
						{
							if(newMember.roles.has(memberRole))
							{
								client.roleCalls[0].removeRole(newMember,newMember.guild.roles.get(memberRole));
							} else {
								client.roleCalls[0].addRole(newMember,newMember.guild.roles.get(memberRole));
							}
						}
					})
					.catch(err=>{console.error(err.stack)});
				}
			});

			client.roleCalls[1].on('roleReactionRemove', (reaction,member,role) =>
			{
				if(role.members.has(member.id)) //check if user does not have role
				{
					client.roleCalls[1].removeRole(member,role)
					.then(newMember => 
					{
						if(newMember.roles.size == 2)
						{
							if(newMember.roles.has(memberRole))
							{
								client.roleCalls[1].removeRole(newMember,newMember.guild.roles.get(memberRole));
							} else {
								client.roleCalls[1].addRole(newMember,newMember.guild.roles.get(memberRole));
							}
						}
					})
					.catch(err=>{console.error(err.stack)});
				}
			});
	});
}

module.exports = initRolecall;