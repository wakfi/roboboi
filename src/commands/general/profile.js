const path = require('path');
const MessageEmbed = require((require.resolve('discord.js')).split(path.sep).slice(0, -1).join(path.sep) + `${path.sep}structures${path.sep}MessageEmbed.js`);
const cleanReply = require(`${process.cwd()}/util/cleanReply.js`);
const selfDeleteReply = require(`${process.cwd()}/util/selfDeleteReply.js`);
const millisecondsToString = require(`${process.cwd()}/util/millisecondsToString.js`);
const printTimePretty = require(`${process.cwd()}/util/printTimePretty.js`);
const USERS_PATTERN = /<@!?(\d{17,18})>/i
const DISCORD_EPOCH = 1420070400000 //unix of first second of 2015

String.prototype.startsWithIgnoreCase = function(searchString, position)
{
	if(typeof position === 'undefined') position = 0;
	const searching = this.toLowerCase();
	const search = searchString.toLowerCase();
	return searching.startsWith(search, position);	
}

const basicUserProfile = async (message, args) => {
	let user;
	if(args.length > 0)
	{
		const joinArgs = args.join(' ');
		const toResolve = USERS_PATTERN.test(joinArgs) ? USERS_PATTERN.exec(joinArgs)[1] : joinArgs;
		try	{
			const manager = message.client.users;
			user = await manager.fetch(manager.resolveID(toResolve));
		} catch(e) {
			return selfDeleteReply(message, `could not resolve "${joinArgs}" to a user`);
		}
	} else {
		user = message.author;
	}
	const accountCreationTimestamp = (user.id/Math.pow(2,22)) + DISCORD_EPOCH;
	const accountCreationTime = new Date(accountCreationTimestamp); //calculate user account creation timestamp
	const accountCreationTimeDays = printTimePretty(millisecondsToString(Math.trunc((Date.now() - accountCreationTimestamp)/1000)*1000), 'd') || '0 days';
	const embed = new MessageEmbed()
		.setThumbnail(user.displayAvatarURL())
		.setColor(0xFF00FF)
		.setTitle(`User Profile`)
		.setDescription(`Profile data for ${user}:`)
		.addField(`Username & Discriminator:`, user.tag, true)
		.addField(`ID:`, user.id, true)
		.addField(`Created Discord Account:`, `${accountCreationTime.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${accountCreationTime.toLocaleTimeString(undefined,{hour12:true})}\n(${accountCreationTimeDays})`, true)
		.setTimestamp(new Date())
		.setFooter(`Requested by: ${message.author.tag}`, message.author.displayAvatarURL());
	message.channel.send(embed);
}

module.exports = {
	name: 'profile',
	description: 'Display information about a user in the server',
	category: 'general',
	usage: ['[member resolvable]'],
	permLevel: 'User',
	async execute(message, args) {
		if(message.channel.type === 'dm')
		{
			basicUserProfile(message, args);
		} else {
			let member;
			if(args.length > 0)
			{
				const joinArgs = args.join(' ');
				const toResolve = USERS_PATTERN.test(joinArgs) ? USERS_PATTERN.exec(joinArgs)[1] : joinArgs;
				const manager = message.guild.members;
				try	{
					member = await manager.fetch(manager.resolveID(toResolve));
				} catch(e) {
					member = manager.cache.find(member => member.displayName.startsWithIgnoreCase(joinArgs));
					if(member == null)
					{
						return basicUserProfile(message, args);
					}
				}
			} else {
				member = message.member;
			}
			const accountCreationTimestamp = (member.id/Math.pow(2,22)) + DISCORD_EPOCH;
			const accountCreationTime = new Date(accountCreationTimestamp); //calculate user account creation timestamp
			const cliStatus = member.presence.clientStatus;
			const currentDevice = !cliStatus		? null :
								  member.user.bot 	? 'Bot' :
								  cliStatus.desktop ? 'Desktop' : 
								  cliStatus.web		? 'Web Browser' :
								  cliStatus.mobile	? 'Mobile' :
													  'Unknown Client';
			const status = member.presence.status.charAt(0).toUpperCase() + member.presence.status.slice(1);
			const richActivity = member.presence.activities.length > 0 ? member.presence.activities[0] : 'None';
			const currentActivityString = richActivity.type ? `**${richActivity.type.charAt(0).toUpperCase()}${richActivity.type.slice(1).toLowerCase()} ${richActivity}** for ${printTimePretty(millisecondsToString(Date.now() - richActivity.createdTimestamp),'largest unit available')}` : richActivity;
			const premiumSinceDays = member.premiumSinceTimestamp ? printTimePretty(millisecondsToString(Math.trunc((Date.now() - member.joinedAtTimestamp)/1000)*1000), 'd') || '0 days' : '';
			const accountCreationTimeDays = printTimePretty(millisecondsToString(Math.trunc((Date.now() - accountCreationTimestamp)/1000)*1000), 'd') || '0 days';
			const joinedAtDays = printTimePretty(millisecondsToString(Math.trunc((Date.now() - member.joinedTimestamp)/1000)*1000), 'd') || '0 days';
			const embed = new MessageEmbed()
				.setThumbnail(member.user.displayAvatarURL())
				.setColor(0xFF00FF)
				.setTitle(`User Profile`)
				.setDescription(`Profile data for ${member}:`)
				.addField(`Username & Discriminator:`, member.user.tag, true)
				.addField(`ID:`, member.id, true)
				.addField(`Server Booster?`, `${member.premiumSinceTimestamp ? 'Since ' + member.premiumSince.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'}) + ' ' + member.premiumSince.toLocaleTimeString(undefined,{hour12:true}) + '\n(' + premiumSinceDays + ')'  : 'No'}`, true)
				.addField(`Highest Role:`, member.roles.highest, true)
				.addField(`Status`, `${status}${currentDevice?' on '+currentDevice:''}`, true)
				.addField(`Current Activity`, currentActivityString, true)
				.addField(`Created Discord Account:`, `${accountCreationTime.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${accountCreationTime.toLocaleTimeString(undefined,{hour12:true})}\n(${accountCreationTimeDays})`, true)
				.addField(`Joined the Server:`, `${member.joinedAt.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${member.joinedAt.toLocaleTimeString(undefined,{hour12:true})}\n(${joinedAtDays})`, true)
				.setTimestamp(new Date())
				.setFooter(`Requested by: ${message.author.tag}`, message.author.displayAvatarURL());
			message.channel.send(embed);
		}
	}
};