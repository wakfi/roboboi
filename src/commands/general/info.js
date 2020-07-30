const got = require('got');
const path = require('path');
const MessageEmbed = require((require.resolve('discord.js')).split(path.sep).slice(0, -1).join(path.sep) + `${path.sep}structures${path.sep}MessageEmbed.js`);
const authorReply = require(`${process.cwd()}/util/authorReply.js`);
const { prefix } = require(`${process.cwd()}/components/config.json`);

module.exports = {
	name: 'info',
	description: 'Information about the bot and its development',
	category: 'general',
	permLevel: 'User',
	noArgs: true,
	async execute(message, args) {
		try {
			const botVersion = (await got('https://github.com/wakfi/suki/releases')).body.split('/wakfi/suki/releases/tag/')[1].split('"')[0];
			const djsVersion = (await got('https://github.com/wakfi/suki/blob/master/package.json', {resolveBodyOnly: true})).split('>discord.js<')[1].split('^')[1].split('<')[0];
			const embed = new MessageEmbed()
				.setTitle(`Suki`)
				.setThumbnail(message.client.user.displayAvatarURL())
				.setDescription(`This bot was created by <@193160566334947340> for the Clue Crew Server`)
				.addField(`Prefix`,`Use ${prefix} or ${message.client.user} to invoke commands`)
				.addField(`Help commands`,`${prefix}help, ${prefix}commands, ${prefix}command, ${prefix}?`)
				.addField(`Library`,`Created in JavaScript using [discord.js](https://discord.js.org/) v${djsVersion}, a powerful node.js module that allows you to interact with the Discord API very easily`)
				.addField(`Repository`,`This software is licensed under the MIT license. The GitHub repository for this project can be found at: https://github.com/wakfi/suki`)
				.setFooter(`suki ${botVersion}`)
				.setTimestamp(new Date())
				.setColor(0xFF00FF);
			authorReply(message, embed);
		} catch (error) {
			console.error(error);
		}
	}
};