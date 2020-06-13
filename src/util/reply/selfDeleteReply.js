const path = require('path');
const Message = require((require.resolve('discord.js')).split(path.sep).slice(0, -1).join(path.sep) + `${path.sep}structures${path.sep}Message.js`);
const MessageEmbed = require((require.resolve('discord.js')).split(path.sep).slice(0, -1).join(path.sep) + `${path.sep}structures${path.sep}MessageEmbed.js`);
const delay = require(`${process.cwd()}/util/time/delay.js`);

function selfDeleteReply(message, input, options)
{
	return new Promise(async (resolve,reject) =>
	{
		let emb = undefined;
		if(typeof input === 'object' && typeof options === 'undefined') {options = input; input = '';}
		let duration = (typeof options === 'object') ? options.duration : options; //backwards compatability
		if(typeof options !== 'object') options = {};
		if(!(message instanceof Message)) throw new TypeError(`message is not Discord Message`);
		if(typeof input === 'undefined') input = 'an unknown error occured';
		if(typeof duration === 'undefined') duration = '15s';
		if(input instanceof MessageEmbed) {emb = input;input='';}
		else {emb = options.embed;}
		if(input) {options.content = input; input = ''}
		const messageOptions = {embed:emb, allowedMentions:{parse:options.mentionTypes,users:options.mentionUsers,roles:options.mentionRoles},content:options.content,tts:options.tts,nonce:options.nonce,files:options.files,code:options.code,split:options.split,reply:options.replyTo};
		const errReply = (options.sendStandard) ? await message.channel.send(input, messageOptions) : await message.reply(input, messageOptions);
		if(duration == 0) {resolve(errReply); return;}
		await delay(duration);
		await errReply.delete();
		resolve(errReply);
	});
}

module.exports = selfDeleteReply;