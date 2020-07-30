const selfDeleteReply = require(`${process.cwd()}/util/reply/selfDeleteReply.js`);
const parseTime = require(`${process.cwd()}/util/time/parseTime.js`);
const millisecondsToString = require(`${process.cwd()}/util/time/millisecondsToString.js`);

module.exports = {
	name: 'mstime',
	description: 'Convert a time from milliseconds into a readable time, or a readable time into milliseconds. Readable times are in the format \`1d 1h 1m 1s 1ms\`; any zero values will be omitted from the returned result',
	category: 'science',
	usage: ['<readable time>','<decimal>','<hexadecimal>','<octal>','<binary>'],
	permLevel: 'User',
	args: true,
	async execute(message, args) {
		const toConvert = args.join('').trim(); //this causes https://github.com/wakfi/roboboi/issues/11 and fix needs to happen before this or replace it
		if(isNaN(toConvert))
		{
			try {
				const millisecondConversion = parseTime(toConvert);
				message.channel.send(millisecondConversion);
			} catch(e) {
				selfDeleteReply(message, `Conversion failed: ${e.message}`);
			}
		} else {
			const readable = millisecondsToString(toConvert);
			message.channel.send(readable);
		}
	}
};