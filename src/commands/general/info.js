const nf = require('node-fetch');
const rp = async (query) => await (await nf(query)).text(); //originally used request-promise, now deprecated. This lambda is for backwards compatability
const {MessageEmbed} = require(`${process.cwd()}/util/discord/structs.js`);
const authorReply = require(`${process.cwd()}/util/reply/authorReply.js`);
const {prefix} = require(`${process.cwd()}/util/components/config.json`);

module.exports = {
	name: 'info',
	description: 'Information about the bot and its development',
	category: 'general',
	permLevel: 'User',
	noArgs: true,
	async execute(message, args) {
		try {
			const botVersion = (await rp('https://github.com/wakfi/roboboi/releases')).split('/wakfi/roboboi/releases/tag/')[1].split('"')[0];
			const djsVersion = (await rp('https://github.com/wakfi/roboboi/blob/master/package.json')).split('>discord.js<')[1].split('^')[1].split('<')[0];
			const embed = new MessageEmbed()
				.setTitle(`Mini Ada`)
				.setThumbnail(message.client.user.displayAvatarURL())
				.setDescription(`This bot was created by <@193160566334947340> for the Gonzaga Computer Science Discord Server`)
				.addField(`Prefix`,`Use \`${prefix}\` or ${message.client.user} to invoke commands`)
				.addField(`Help commands`,`${prefix}help, ${prefix}commands, ${prefix}command, ${prefix}?`)
				.addField(`Library`,`Created in JavaScript using [discord.js](https://discord.js.org/) v${djsVersion}, a powerful node.js module that allows you to interact with the Discord API very easily`)
				.addField(`Repository`,`This software is licensed under the MIT license. The GitHub repository for this project can be found at: https://github.com/wakfi/roboboi`)
				.setFooter(`roboboi ${botVersion}`)
				.setTimestamp(new Date())
				.setColor(0xFF00FF);
			authorReply(message, embed);
		} catch (error) {
			console.error(error.stack);
		}
	}
};