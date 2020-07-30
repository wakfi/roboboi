const path = require('path');
const configPath = path.resolve('./components/config.json');
const config = require(configPath);
const recordFile = require(`${process.cwd()}/util/recordFile.js`);
const parsePositionalArgs = require(`${process.cwd()}/util/parsePositionalArgs.js`);
const firstLetterCapital = require(`${process.cwd()}/util/firstLetterCapital.js`);
const selfDeleteReply = require(`${process.cwd()}/util/selfDeleteReply.js`);

module.exports = {
	name: 'setActivity',
	description: 'Change the rich presence activity of the bot',
	category: 'customization',
	usage: ['[PLAYING|LISTENING|WATCHING|STREAMING] <new activity>'],
	aliases: ['setPresence'],
	permLevel: 'Bot Admin',
	args: true,
	async execute(message, args) {
		const keys = ['application.id','name','type','url']
		const flags = ['a','n','t','u'];
		const newActivity = parsePositionalArgs(args, keys, flags);
		if(!newActivity.name)
		{
			const type = (function(args){ //switch expression workaround
				switch(args[0].toUpperCase())
				{
					case 'PLAYING':
					case 'PLAY':
						args.shift();
						return 'PLAYING';
					case 'STREAMING':
					case 'STREAM':
						args.shift();
						return 'STREAMING';
					case 'LISTENING':
					case 'LISTEN':
					case 'LISTENTO':
					case 'LISTENINGTO':
						args.shift();
						return 'LISTENING';
					case 'WATCHING':
					case 'WATCH':
						args.shift();
						return 'WATCHING';
					default:
						return 'PLAYING';
				}
			})(args);
			if(args.length == 0) return selfDeleteReply(message, `you must include activity text`, '15s');
			const activityText = args.join(' ');
			Object.defineProperty(newActivity, 'name', {value: activityText, writable: false, enumerable: true, configurable: true});
			Object.defineProperty(newActivity, 'type', {value: type, writable: false, enumerable: true, configurable: true});
		}
		const type = (function(arg){ //switch expression workaround
			switch(arg.toUpperCase())
			{
				case 'PLAYING':
				case 'PLAY':
					return 'PLAYING';
				case 'STREAMING':
				case 'STREAM':
					return 'STREAMING';
				case 'LISTENING':
				case 'LISTEN':
				case 'LISTENTO':
				case 'LISTENINGTO':
					return 'LISTENING';
				case 'WATCHING':
				case 'WATCH':
					return 'WATCHING';
				default:
					throw new TypeError('type must be one of: PLAYING, STREAMING, LISTENING, WATCHING');
			}
		})(newActivity.type || 'PLAYING');
		newActivity.type = type;
		try {
			config.activity = newActivity;
			await message.client.user.setPresence({activity:config.activity});
			await recordFile(config, configPath).catch(e=>
			{
				console.error(`Error saving updated activity`);
				console.error(e.stack);
			});
			selfDeleteReply(message, `activity has been changed to \`${firstLetterCapital(config.activity.type==='LISTENING'? 'LISTENING TO':config.activity.type)} ${config.activity.name}\``, '6s');
		} catch(e) {
			console.error(e.stack);
			selfDeleteReply(message, `an error occurred while trying to change my activity: ${e}`, '20s');
		}
	}
};