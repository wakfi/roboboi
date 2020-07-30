const path = require('path');
const MessageEmbed = require((require.resolve('discord.js')).split(path.sep).slice(0, -1).join(path.sep) + `${path.sep}structures${path.sep}MessageEmbed.js`);
const replaceLast = require(`${process.cwd()}/util/replaceLast.js`);
const pad = require(`${process.cwd()}/util/padZeros.js`);

module.exports = {
	name: 'uptime',
	description: 'Displays the current time the bot has been connected to Discord',
	category: 'general',
	permLevel: 'User',
	noArgs: true,
	async execute(message, args) {
		let s = message.client.uptime;
		let ms = s % 1000;
		s = (s - ms) / 1000;
		let secs = s % 60;
		s = (s - secs) / 60;
		let mins = s % 60;
		let h = (s - mins) / 60;
		let hours = h % 24;
		let days = (h - hours) / 24;
		let p = Math.floor(Math.log10(days)) + 1;
		if(Math.log10(days) < 1) {
			p = false;
		}
		let uptimeArgs = [];
		if(days) uptimeArgs.push(`**${days}** ${days>1?'days':'day'}`);
		if(hours) uptimeArgs.push(`**${hours}** ${hours>1?'hours':'hour'}`);
		if(mins) uptimeArgs.push(`**${mins}** ${mins>1?'minutes':'minute'}`);
		if(secs) uptimeArgs.push(`**${secs}** ${secs>1?'seconds':'second'}`);
		let uptimeString = `I have been online for ${uptimeArgs.join(', ')}`;
		if(/,/.test(uptimeString))
		{
			if((uptimeString.match(/,/g) || []).length > 1)
			{
				uptimeString = replaceLast(uptimeString, ',', ', and')
			} else {
				uptimeString = replaceLast(uptimeString, ',', ' and')
			}
		}
		const embed = new MessageEmbed()
			.setTitle(`Uptime`)
			.setDescription(uptimeString)
			.setColor(0xFF00FF);
		message.channel.send(embed);
	}
};