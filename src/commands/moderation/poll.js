const path = require(`path`);
const recordFile = require(`${process.cwd()}/util/general/recordFile.js`);
const {prefix} = require(`${process.cwd()}/util/components/config.json`);
const namedChannels = require(`${process.cwd()}/util/components/namedChannels.json`);
const PollCollector = require(`${process.cwd()}/util/components/PollCollector.js`);
const PollError = require(`${process.cwd()}/util/errors/PollError.js`);
const {MessageEmbed} = require(`${process.cwd()}/util/discord/structs.js`);
const selfDeleteReply = require(`${process.cwd()}/util/reply/selfDeleteReply.js`);
const millisecondsToString = require(`${process.cwd()}/util/time/millisecondsToString.js`);
const parseTime = require(`${process.cwd()}/util/time/parseTime.js`);

//TODO: extract all poll config prompts & their purposes served out into subcommands
const amountRegex = new RegExp(`^${prefix}a(?:mount)? [0-9]`, `i`);
const optionRegex = new RegExp(`^${prefix}o(?:ption)? `, `i`);
const confirmationRegex = new RegExp(`^${prefix}(?:y(?:es)?|no?)$`, `i`);
const confirmYesRegex = new RegExp(`^${prefix}y(?:es)?$`, `i`);
const polltimeRegex = new RegExp(`^${prefix}(?:pt|polltime) [0-9]`, `i`); //TODO: make no args polltime command return current time setting
const pollstartRegex = new RegExp(`^${prefix}(?:ps|pollstart|start)$`, `i`);
const endCollectorRegex = new RegExp(`^${prefix}(?:poll(?:end|cancel)|(?:end|cancel)poll)$`, `i`); //added support of pollend and pollcancel for consistency

module.exports = {
	name: 'poll',
	description: `Follow the prompts provided. I can provide a general blueprint of the syntax for all of the prompts if wanted. Note: don't make more than one poll per user without starting it, the syntax hasn't been prepared for that yet`,
	category: 'moderation',
	usage: ['<question> [channel]'],
	permLevel: 'MC',
	guildOnly: true,
	args: true,
	async execute(message, args) 
	{
		try {
			const client = message.client; //bind client to a variable
			let duration = 86400000; //default duration is 24 hours
			let targetChan = namedChannels.polls; //defualt target channel is the polls channel
			//check if a target channel was given, to poll non-default channel. this is optional
			if(message.mentions.channels.size > 0) 
			{
				targetChan = message.mentions.channels.first().id;
				args.splice(args.indexOf(message.mentions.channels.first().name),1);
			}
			console.log(`target channel: ${targetChan}`);
			//create question const. removed by this point are <prefix><poll> ... [targetChan], so all thats left is the question
			const question = args.join(' ');
			if(question.length > 256)
			{
				message.reply(`Your question\n\`\`\`${question}\`\`\`\nis too long! Max question length: \`256\` characters`);
				throw new PollError(`poll question exceeds character limit (256)`);
			}
			const oversizedQuestion = question.length > (question.includes(`?`) ? 241 : 242);
			console.log(`${question.length} > ${(question.includes(`?`) ? 241 : 242)}: ${oversizedQuestion}`);
			//request amount of options to wait for, using prefix to specialize message
			message.reply(`How many response options? (${prefix}amount #)`);
			//this is the message waiter, which is the primary driver of this function. it is only waiting for the author of this poll (but others can be running at the same time for other authors)
			//catch any errors, primarily timeout on awaitMessage
			const amount = (await message.channel.awaitMessages(msg => msg.author === message.author && amountRegex.test(msg.content) && msg.content.replace(`${prefix}amount`, '') !== '', {max: 1, time: 120000, errors: ['time'] })
				.catch(async e => {
					await message.reply(`Your poll request has timed out (max response time: 120 seconds)`);
					throw new PollError(`${prefix}amount timeout`);
				})
			).first().content.slice(prefix.length).trim().split(/ +/g).slice(1); 
			const responseCount = Number(amount); //create a usable number
			if(!responseCount || responseCount < 2 || responseCount > 8)
			{
				return message.reply(`Number from 2-8 must be provided. Poll request terminated.`); //followed a strict-build design, if the syntax is wrong at any point it terminates, so that it doesn't send
			}
			message.reply(`Specify options in individual messages (${prefix}option <option>)`); //would like to rewrite with savable promises eventually, so that polls can be saved, edited, sent later, etc
			let buttons = [];
			//another user input, another message waiter
			const options = await message.channel.awaitMessages(msg => msg.author === message.author && optionRegex.test(msg.content), {max: responseCount, idle: 300000, errors: ['idle']})
				.catch(async e => {
					await message.reply(`Your poll request has timed out (idle timeout: 300 seconds)`);
					throw new PollError(`${prefix}option timeout`);
				}); 
			//we have the input we need, now its time to start generating the embed
			const authorTitle = `Poll by ${message.member.displayName}`;
			const title =  (()=>{
				if(oversizedQuestion)
					return `${question}${!question.includes('?')?'?':''}`;
				return `**Question: ${question}${!question.includes('?')?'?':''}**`; //this is the line I was writing when I learned the ternary operator, and I adore it
			})();
			const answerOptions = [`Choices:`];
			//map choices into a new array and append those elements by expanding the resulting array
			answerOptions.push(...options.map(option =>
			{
				const choice = option.content.trim().split(/ +/g).slice(1);
				if(!client.emojis.resolveIdentifier(choice[0]))
				{
					message.reply(`The first element of each option must be an emoji`);
					throw new PollError();
				}
				if(buttons.includes(choice[0]))
				{
					message.reply(`Emojis given as vote buttons must be unique`);
					throw new PollError();
				}
				buttons.push(choice[0]);
				return `\t${choice.join(' ')}`;
			}));
			let foot = `Vote by reacting with the corresponding emoji!`;
			console.log(`${title}\n${title.length}`);
			const embed = new MessageEmbed() //instantiates the MessageEmbed object
				.setColor(0xFF00FF) //my signiture FF00FF pink hex
				.setAuthor(authorTitle, message.author.displayAvatarURL()) //author is the poll authors name and avatar, to show who wrote it
				.setTitle(title) //embed title is a statement about it being a poll
				.setDescription(answerOptions.join(`\n`)) //adds the actual poll to the embed. added fields are (key, value) with the key treated as a header/title, so i used the question as the 'key' and the options as the 'value'
				.setFooter(foot, client.user.avatarURL) //footer is the voting instruction and Sniff Bot's avatar
				.setTimestamp(new Date()); //timestamp for posterity
			//send the embed so the user can preview the poll
			const poll = await message.channel.send(embed)
				.catch(e => {
					console.error(`Error sending poll message:\n\t${typeof e==='string'?e.split('\n').join('\n\t'):e}`)
					throw new Error(`poll message preview send error`);
				});
			message.reply(`Is this correct? (${prefix}y or ${prefix}n)\nWarning: Once confirmed poll must be manually cancelled with ${prefix}endpoll`);
			//awaits confirmation. this is the final chance to cancel, because if they say yes then supposedly this is what they want
			const confirmation = (await message.channel.awaitMessages(msg => msg.author === message.author && confirmationRegex.test(msg.content), {max: 1, time: 180000, errors: ['time']})
				.catch(async e => { //TODO: improve filter conditions
					await message.reply(`Your poll request has timed out (max response time: 180 seconds)`);
					//deletes poll message 
					//TODO: reconsider this
					await poll.delete();
					throw new PollError(`poll confirmation timeout`);
				})
			).first().content;
			// if 'n' or 'no'
			if(!confirmYesRegex.test(confirmation))
			{
				message.reply(`Poll terminated`);
				//deletes poll message
				//TODO: reconsider this
				poll.delete(); 
				console.error(`poll declined, creation terminated`);
				return;
			}
			message.reply(`Poll creation complete. Poll will be saved for 24 hours. Type ${prefix}pollstart to begin the poll. You can type ${prefix}polltime to change the duration of the poll; the default duration is 24 hours`);
			const timeCollector = message.channel.createMessageCollector(msg => msg.author === message.author && polltimeRegex.test(msg.content), {time: duration, errors: ['time'] });
			timeCollector.on('collect', msg => 
			{
				//remove command word from text
				const timeInput = msg.content.trim().split(/ +/g).slice(1).join('');
				//create milliseconds int from time input
				const parsedTime = parseTime(timeInput); 
				//check if there was a time given, else it stays default
				if(!isNaN(parsedTime)) 
				{
					console.log(`setting time to ${timeInput} which is ${parsedTime}ms`);
					message.channel.send(`Duration changed to \`${timeInput}\` which is \`${parsedTime}ms\``);
					duration = parsedTime;
				} else { 
					console.log(`using previous time ${duration}`);
					selfDeleteReply(message, `An error occured with that time input. The previous time ${millisecondsToString(duration)} (${duration}) will be used`, '25s');
				}
			});
			await message.channel.awaitMessages(msg => msg.author === message.author && pollstartRegex.test(msg.content), {max: 1, time: duration, errors: ['time'] })
				.catch(async e => {await message.reply(`Your poll for \`${title}\` has timed out. Polls are timed out 24 hours after creation if they have not been started`); throw new PollError(`${prefix}pollstart timeout`);});
			timeCollector.stop();
			//initalize pollfileName with path
			const pollfileName = path.normalize(`${process.cwd()}/../poll_results/pollresult_${message.id}`); 
			//send copy of poll message to targetChan
			const pollMsg = await message.guild.channels.cache.get(targetChan).send(embed).catch(e => {throw new Error(e)});
			await pollMsg.pin();
			const pinnedSystemMsg = message.channel.lastMessage;
			if(pinnedSystemMsg.type === 'PINS_ADD') pinnedSystemMsg.delete();
			const cleanResults = [];
			try {
				for(let i = 0; i < buttons.length; i++)
				{
					await pollMsg.react(buttons[i]);
					cleanResults.push(1);
				}
			} catch(err) {
				console.error(`Error adding poll buttons\n\t${err}`);
				return;
			}
			const filterButtons = buttons.map(button => button.includes(`>`) ? button.split(`:`)[2].split(`>`)[0] : button);
			//create filter for message collector
			const filter = (reaction, user) => 
			{
				if(user.id == client.user.id) return false;
				if(filterButtons.includes(reaction.emoji.id || reaction.emoji.name))
				{
					return true;
				} else {
					reaction.users.remove(user.id);
					return false;
				}
			}; 
			let cancelled = false;
			//initialize reaction collector with filter and specified duration
			const collector = new PollCollector(pollMsg, filter, {time: duration});
			//initialize message collector with filter and specified duration
			const endCollector = message.channel.guild.channels.cache.get(targetChan).createMessageCollector(msg => msg.author === message.author && endCollectorRegex.test(msg.content), {time: duration});
			recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'answerOptions' : answerOptions, 'totalVotes' : collector.collected.size, 'collected': collector.collected, 'voters' : collector.collected.users, 'complete' : false}, `${pollfileName}.json`);
			console.log(`Started poll (${pollMsg.id}) for ${message.author.username}, timeout = ${millisecondsToString(duration)}`);
			
			//event handler for message collector, allows realtime updating of results and output file (and poll stop). Currently not supporting updating of results
			endCollector.on('collect', msg => 
			{ 
				if(msg.content === `${prefix}cancelpoll`) cancelled = true;
				endCollector.stop();
				collector.stop();
			});
			collector.on('collect', (reaction, user) => 
			{
				setTimeout(_ => {
					for(i = 0; i < buttons.length; i++) 
					{
						cleanResults[i] = pollMsg.reactions.cache.find(reac => `${(reac.emoji.id || reac.emoji.name)}` === filterButtons[i]).count;
					}
					recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'answerOptions' : answerOptions, 'totalVotes' : collector.collected.size, 'collected': collector.collected, 'voters' : collector.users, 'complete' : false}, `${pollfileName}.json`);
				}, 0);
			});
			
			//event emitted at the end of duration, or if author sends !endpoll/cancelpoll command
			collector.on('end', collected => 
			{
				if(cancelled)
				{
					console.log(`Poll cancelled (${pollMsg.id})`);
					pollMsg.delete();
					//TODO: check for file and mark complete or delete if present
				} else {
					console.log(`Poll complete (${pollMsg.id})`);
					//begin constructing poll result embed
					const resultHeader = `__Results for poll: ${question}${!question.includes('?')?'?':''}__`; 
					//final result of options
					const results = answerOptions.slice(1).map((option,i) => `${option.trim()}: ${cleanResults[i]-1}`);
					results.push(`\tTotal Votes: ${collected.size}`);
					//result embed
					const endBed = new MessageEmbed() 
						.setTitle(title)
						.setAuthor(message.member.displayName, message.author.avatarURL)
						.setColor(0xFF00FF)
						.setFooter(`Thank you to everyone who responded`, client.user.avatarURL)
						.setTimestamp(new Date())
						.addField(resultHeader, results.join(`\n`));
					//swap the results of the poll into message, and removes the vote instructions from the bottom
					pollMsg.edit('', endBed); 
					//unpins, as it is no longer an active poll
					pollMsg.unpin();
					//DM a copy of results to the author
					message.author.send(endBed); 
					//records final results in file, including completion status. currently not used
					recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'results' : results, 'totalVotes' : collected.size, 'collected': collected, 'voters' : collector.users, 'complete' : true}, `${pollfileName}.json`);
				}
			});
		} catch(e) {
			if(!(e instanceof PollError))
			{
				throw e;
			} else {
				console.error(e.stack);
				// ignore other than logging stack trace
			}
		}
	}
};
