const selfDeleteReply = require(`${process.cwd()}/util/reply/selfDeleteReply.js`);

function cleanReply(message, input, duration)
{
	return new Promise(async (resolve,reject) =>
	{
		let errReply = await selfDeleteReply(message,input,duration);
		try {
			if(message.channel.type !== 'dm') await message.delete();
			else reject(message.channel);
		} catch(e) {
			console.error(`Error with cleanReply:\n${e}`);
		}
		resolve(errReply);
	});
}

module.exports = cleanReply;
