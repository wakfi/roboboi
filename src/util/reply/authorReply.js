const path = require('path');
const {Message} = require(`${process.cwd()}/util/discord/structs.js`);
const selfDeleteReply = require(`${process.cwd()}/util/reply/selfDeleteReply.js`);

function authorReply(message, input)
{
	return new Promise(async (resolve,reject) =>
	{
		if(typeof message === "undefined") throw new TypeError(`message is undefined`);
		if(!(message instanceof Message)) throw new TypeError(`message is not Discord Message`);
		if(typeof input === "undefined") input = "an unknown error occured";
		let sent;
		try {
			sent = await message.author.send(input);
		} catch(e) {
			selfDeleteReply(message,`It looks like I can't DM you. Do you have DMs disabled?`);
			reject();
		}
		resolve(sent);
	});
}

module.exports = authorReply;
