module.exports = {
	name: 'mstime',
	description: 'Convert a time from milliseconds into a readable time, or a readable time into milliseconds. Readable times are in the format \`1d 1h 1m 1s 1ms\`; any zero values will be omitted from the returned result',
	category: 'science',
	usage: ['<readable time>','<decimal>','<hexadecimal>','<octal>','<binary>'],
	permLevel: 'User',
	args: true,
	async execute(message, args) {
		if(args.length == 0) return message.channel.send(`Missing argument for conversion`);
		const toConvert = args.join('').trim();
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