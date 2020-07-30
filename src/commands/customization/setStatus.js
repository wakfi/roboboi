const path = require('path');
const configPath = path.resolve('./components/config.json');
const config = require(configPath);
const recordFile = require(`${process.cwd()}/util/recordFile.js`);
const selfDeleteReply = require(`${process.cwd()}/util/selfDeleteReply.js`);

module.exports = {
	name: 'setStatus',
	description: 'Change the status of the bot',
	category: 'customization',
	usage: ['<online|idle|dnd|invisible>'],
	permLevel: 'Bot Admin',
	args: true,
	async execute(message, args) {
		const newStatus = (function(args){ //switch expression workaround
			switch(args.join(' ').toLowerCase())
			{
				case 'online':
				case 'on':
				case 'active':
				case 'available':
				case 'green':
					return 'online';
				case 'idle':
				case 'away':
				case 'afk':
				case 'yellow':
					return 'idle';
				case 'dnd':
				case 'do not disturb':
				case 'silent':
				case 'silence':
				case 'unavailable':
				case 'busy':
				case 'red':
					return 'dnd';
				case 'invisible':
				case 'offline':
				case 'off':
				case 'gray':
				case 'grey':
					return 'invisible';				
				default:
					return null;
			}
		})(args);
		if(!newStatus) return selfDeleteReply(message, `invalid status option: ${args.join(' ')}`);
		await message.client.user.setStatus(newStatus);
		console.log(message.client.presence.status);
		config.clientStatus = { "status" : message.client.presence.status };
		await recordFile(config, configPath).catch(e=>
		{
			console.error(`Error saving updated status`);
			console.error(e.stack);
		});
		selfDeleteReply(message, `status has been changed to \`${newStatus}\``, '6s');
	}
};