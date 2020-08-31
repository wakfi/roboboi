const {prefix} = require(`${process.cwd()}/util/components/config.json`);
const recordFile = require(`${process.cwd()}/util/general/recordFile.js`);
const namedChannels = require(`${process.cwd()}/util/components/namedChannels.json`);


module.exports = {
	name: 'poll',
	description: `Follow the prompts after that. I can provide a general blueprint of the syntax for all of the prompts if wanted. Note: don't make more than one poll per user without starting it, the syntax hasn't been prepared for that yet`,
	category: 'moderation',
	usage: ['<question> [channel]'],
	permLevel: 'MC',
	guildOnly: true,
	args: true,
	async execute(message, args) {
		let duration = 86400000; //default duration is 24 hours
		let targetChan = namedChannels.polls; //defualt target channel is the general chat channel
		if(message.mentions.channels.size > 0) //optional target channel specicification other than sniff-discussion
		{
			targetChan = message.mentions.channels.first().id;
			args.splice(args.indexOf(message.mentions.channels.first().name),1);
		}
		console.log(`target channel: ${targetChan}`);
		const question = args.join(" "); //create const question. removed by this point are [prefix][poll] ... <targetChan>, so all thats left is the question
		message.reply(`How many response options? (${prefix}amount #)`); //request amount of options to wait for, using prefix to specialize message
		message.channel.awaitMessages(m => m.content.startsWith(prefix) && m.content.replace(`${prefix}amount`, '') !== '' && m.author === message.author, {maxMatches: 1, time: 90000, errors: ['time'] })
		.then(total => { //this is the message waiter, which is the primary driver of this function. it is only waiting for the author of this poll (but others can be running at the same time for other authors)
			let response = total.array()[0];
			const ammount = response.content.slice(prefix.length).trim().split(/ +/g);
			ammount.shift().toLowerCase();
			const responseCount = +ammount[0]; //create a usable number
			if(!responseCount || responseCount < 2 || responseCount > 8)
				return message.reply(`Number from 2-8 must be provided. Poll request terminated.`); //followed a strict-build design, if the syntax is wrong at any point it terminates, so that it doesn't send
			message.reply(`Specify options in individual messages (${prefix}option <option>)`); //would like to rewrite with savable promises eventually, so that polls can be saved, edited, sent later, etc
			let buttons = [];
			message.channel.awaitMessages(n => n.content.startsWith(`${prefix}option `)  && n.author === message.author, {maxMatches: responseCount, time: 300000, errors: ['time'] })
			.then(options => { //another user input, another message waiter
				message.channel.send(`*Poll by ${message.member.displayName}*`) //we have the input we need, now its time to start generating the embed
				.then(poll => { //an easy way to use an embed is to send a message and then swap the embed in with an edit
					let header =  `**Question: ${question}${!question.includes('?')?'?':''}**`; //this is the line I was writing when I learned the ternary operator, and I adore it
					let answers = `Choices:`;
					for(let i = 0; i < options.size; i++) //writes out the choices into ${answers} by appending them one by one
					{
						const pre = options.array()[i].content.trim().split(/ +/g);
						pre.shift();
						if(buttons.includes(pre[0]))
							return message.reply(`Emojis given as vote buttons must be unique`);
						buttons.push(pre.shift());
						const post = pre.join(" ");
						answers += `\n\t${buttons[buttons.length-1]} ${post}`;
					}
					let foot = `\nVote by reacting with the corresponding emoji!`;
					const edit = new Discord.MessageEmbed() //generates the actual RichEmbed object
						.setTitle(poll.content) //title is the text of the message we are going to edit this into
						.setAuthor(message.member.displayName, message.author.avatarURL) //author is the poll authors name and avatar, to show who wrote it
						.setColor(0xFF00FF) //my signiture FF00FF pink
						.setFooter(foot, client.user.avatarURL) //footer is the voting instruction and Sniff Bot's avatar
						.setTimestamp(new Date()) //timestamp for posterity
						.addField(header, answers); //adds the actual poll to the embed. added fields are (key, value) with the key treated as a header/title, so i used the question as the 'key' and the options as the 'value'
					poll.edit("", edit); //edits the embed into the message so that the user can see the results
					message.reply(`Is this correct? (${prefix}y or ${prefix}n)\nWarning: Once confirmed poll must be manually cancelled with ${prefix}endpoll`);
					message.channel.awaitMessages(mn => mn.content.startsWith(prefix) && mn.author === message.author, {maxMatches: 1, time: 180000, errors: ['time']})
					.then(conf => { //awaits confirmation. this is the final chance to cancel, because if they say yes then supposedly this is what they want
						if(conf.array()[0].content.slice(prefix.length).trim() === "y")
						{//on yes
							message.reply(`Poll creation complete. Poll will be saved for 24 hours. Type ${prefix}pollstart to begin the poll. You can type ${prefix}polltime to change the duration of the poll; the default duration is 24 hours`);
							const polltimeRegex = new RegExp(`^${prefix}polltime`);
							const timeCollector = message.channel.createMessageCollector(mno => mno.author === message.author && polltimeRegex.test(mno.content), {time: duration, errors: ['time'] });
							timeCollector.on('collect', msg => 
							{
								const life = msg.content.trim().split(/ +/g);
								life.shift(); //remove command text
								const timeInput = life.join('');
								const parsedTime = parseTime(timeInput); //create milliseconds int from time input
								if(!isNaN(parsedTime)) //check if there was a time given, else it stays default
								{
									console.log(`setting time to ${timeInput} which is ${parsedTime}`);
									message.channel.send(`Duration changed to \`${timeInput}\` which is \`${parsedTime}\``);
									duration = parsedTime;
								} else { 
									console.log(`using previous time ${duration}`);
									selfDeleteReply(message, `An error occured with that time input. The previous time ${millisecondsToString(duration)} (${duration}) will be used`, '25s');
								}
							});
							const pollstartRegex = new RegExp(`^${prefix}pollstart`);
							message.channel.awaitMessages(mno => mno.author === message.author && pollstartRegex.test(mno.content), {maxMatches: 1, time: duration, errors: ['time'] })
							.then(async dur => { //async keyword is required in the function declaration to use await keyword
								timeCollector.stop();
								const filename = path.normalize(`${process.cwd()}/../poll_results/pollresult_${message.id}`); //initalize filename & path
								let pinnedSystemMsg = null;
								let pollMsg = await message.guild.channels.get(targetChan).send(edit).catch(e => {console.error(e)}); //send copy of poll message to targetChan
								await pollMsg.pin();
								pinnedSystemMsg = message.channel.lastMessage;
								if(pinnedSystemMsg.type === 'PINS_ADD') pinnedSystemMsg.delete();
								let cleanResults = [0];
								try{
									for(let myI = 0; myI < buttons.length; myI++) 
									{
										await pollMsg.react((buttons[myI].includes(`>`) ?
															 message.guild.emojis.get(buttons[myI].substring(buttons[myI].lastIndexOf(`:`)+1,buttons[myI].length-1)) :
															 buttons[myI]
															));
										cleanResults.push(1);
									}
								} catch(err) {
									console.error(`Error adding poll buttons\n\t${err}`);
									return;
								}
								//create filter for message collector
								//these variable names suck please fix them
								const filter = (r,a) => {
									if(a.id == client.user.id) return false;
									let testButtons = [];
									buttons.forEach(button => {
										testButtons.push(
											(button.includes(`>`) ?
												button.substring(button.lastIndexOf(`:`)+1,button.length-1) :
												button
											));
									});
									return testButtons.includes((r.emoji.id || r.emoji.name));
								} 
								let cancelled = false;
								const collector = new PollCollector(pollMsg, filter, {time: duration}); //initialize reaction collector with filter and specified duration
								const endCollector = message.channel.guild.channels.get(targetChan).createMessageCollector(m => m.author === message.author && (m.content === `${prefix}endpoll` || m.content === `${prefix}cancelpoll`), {time: duration}); //initialize message collector with filter and specified duration
								recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'answers' : answers, 'totalVotes' : collector.collected.size, 'voters' : collector.collected.users, 'complete' : false}, `${filename}.json`);
								console.log(`started poll timeout = ${millisecondsToString(duration)}`);
								
								//event handler for message collector, allows realtime updating of results and output file (and poll stop). Currently not supporting updating of results
								endCollector.on('collect', msg => 
								{ 
									if(msg.content === `${prefix}cancelpoll`) cancelled = true;
									collector.stop();
									endCollector.stop();
								});
								collector.on('collect', msg => {
									if(!buttons.includes(msg.reaction.emoji.name))
									{
										cleanResults[0]++;
									}
									for(indexLocation = 0; indexLocation < buttons.length; indexLocation++) {
										cleanResults[indexLocation+1] = pollMsg.reactions.array().find(reac => `${(reac.emoji.id || reac.emoji.name)}` == 
											(buttons[indexLocation].includes(`>`) ?
												buttons[indexLocation].substring(buttons[indexLocation].lastIndexOf(`:`)+1,buttons[indexLocation].length-1) :
												buttons[indexLocation]
											))
										.count;
									}
									recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'answers' : answers, 'totalVotes' : collector.collected.size, 'voters' : collector.collected.users, 'complete' : false}, `${filename}.json`);
								});
								
								//event emitted at the end of duration, or if author sends !endpoll command
								collector.on('end', collected => 
								{ 
									if(cancelled)
									{
										console.log(`Poll cancelled`);
										pollMsg.delete();
										//pinnedSystemMsg.delete();
									} else {
										console.log(`Poll complete`);
										let toSendTitle = `__Results for poll: ${question}${!question.includes('?')?'?':''}__`; //begin constructing result version of poll
										let toSend = ``;
										//final result of options
										for(let j = 1; j <= responseCount; j++) 
										{
											const rPre = options.array()[j-1].content.trim().split(/ +/g);
											rPre.shift();
											const rPost = rPre.join(" ");
											toSend += `\nVotes for option "${rPost}": ${cleanResults[j]-1}`;
										}
										toSend += `\n\tTotal Votes: ${collected.size}`;
										//result embed
										endBed = new Discord.RichEmbed() 
											.setTitle(edit.title)
											.setAuthor(message.member.displayName, message.author.avatarURL)
											.setColor(0xFF00FF)
											.setFooter(`Thank you to those who responded`, client.user.avatarURL)
											.setTimestamp(new Date())
											.addField(toSendTitle, toSend);
										message.author.send(endBed); //DM a copy of results to the author
										pollMsg.edit("", endBed); //swap the results in for the poll (also removes the vote instructions from the bottom)
										pollMsg.unpin(); //unpins, as it is no longer an active poll
										//if(pinnedSystemMsg.author.id == client.user.id) pinnedSystemMsg.delete();
										//records final results in file, including completion status. currently not used
										recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'toSend' : toSend, 'totalVotes' : collected.size, 'voters' : collected.users, 'complete' : true}, `${filename}.json`);
									}
								});
							})
							.catch(e => console.log(e));
						} else if(conf.array()[0].content.slice(prefix.length).trim() === "n") { //on no
							message.reply(`Poll terminated`);
							poll.delete(); //delete poll embed message
							return;
						} else {
							message.reply(`Response was not y or n, poll terminated`); //on neither, interpret no
							poll.delete(); //delete poll embed message
							return;
						}
					})
					.catch(e => {message.reply(`Your poll request has timed out (max response time: 40 seconds)`);poll.delete();return;}); //delete poll message due to no answer, interpret no
				})
				.catch(err=>{console.error(`Error sending poll message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)}); //catch any errors for sending the poll message
			})
			.catch(e => {message.reply(`Your poll request has timed out (max response time: 300 seconds)`); return}); //catch any errors, primarily timeout on awaitMessage
		})
		.catch(e => {message.reply(`Your poll request has timed out (max response time: 90 seconds)`); return;}); //catch any errors, primarily timeout on awaitMessage
	}
};