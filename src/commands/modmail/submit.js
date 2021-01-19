const {server} = require(`${process.cwd()}/util/components/config.json`);
const authorReply = require(`${process.cwd()}/util/reply/authorReply.js`);
const selfDeleteReply = require(`${process.cwd()}/util/reply/selfDeleteReply.js`);
const {MessageEmbed} = require(`${process.cwd()}/util/discord/structs.js`);
const {modmail} = require(`${process.cwd()}/util/components/namedChannels.json`);

module.exports = {
	name: 'submit',
	description: 'Send a message something to the Mod Mail. Currently only the message body will be sent, not any attachments. If you want to send an attachment, send a direct link to it instead',
	category: 'modmail',
	usage: ['<text of message to submit>'],
	permLevel: 'User',
	dmOnly: false, //technically it actually is, but special handling is used instead to return the command to the user
	args: true,
	async execute(message, args) {
		if(message.channel.type !== 'dm') 
		{ 
			selfDeleteReply(message, `try sending me that command as a direct message instead!`, '20s');
			authorReply(message, `Here is your command, you can send this back to me or edit it first:` + '```\n' + message.content + '\n```').catch();
			return;
		}
		if(args.length == 0) return selfDeleteReply(message, `you cannot submit an empty message`);
		const embed = new MessageEmbed()
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setDescription(`${args.join(' ')}\n${message.author}`)
			.setColor(0xFF00FF)
			.setTimestamp(new Date())
			.setFooter(`Submitted`);
		const newMail = await message.client.guilds.cache.get(server).channels.cache.get(modmail).send(embed)
		.catch(err => {return selfDeleteReply(message, `An error has occured. Your message could not be submitted. Please try again later`, `25s`)});
		await newMail.react(`🗃`);
		authorReply(message, `${message.author}, thank you for using Mod Mail! Your submission has been successfully received. A member of the moderation team will review your submission as soon as possible`).catch(e=>{});
	}
};
