function main()
{
	
const Discord = require('discord.js');
var rp = require('request-promise');
const emojiUnicode = require('emoji-unicode');
var svgToPng = require('svg-to-png');
var path = require('path');
var fs = require('fs-extra');
const RoleCall = require('discord-role-call');
const PollCollector = require('../components/PollCollector.js');
const recordFile = require('../components/recordFile.js');
const clientOps = require('../components/clientOps.json');
const emojiMap = require('../components/emojilib.json');

/* emojiMap license
The MIT License (MIT)

Copyright (c) 2014 Mu-An Chiou

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const client = new Discord.Client(clientOps);

var d = new Date();
//adds timestamps to log outputs
function addTimestampLogs() 
{
	let origLogFunc = console.log;
	let origErrFunc = console.error;
	console.log = input =>
	{
		d = new Date();
		let ms = d.getMilliseconds();
		if(typeof input === 'string')
		{
			let inArr = input.split(`\n`);
			inArr.map(tex => {origLogFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${tex}`)});
		} else {
			origLogFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${input}`)
		}
	}
	console.error = input =>
	{
		d = new Date();
		let ms = d.getMilliseconds();
		if(typeof input === 'string')
		{
			let inArr = input.split(`\n`);
			inArr.map(tex => {origErrFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${tex}`)});
		} else {
			origErrFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${input}`)
		}
	}
}

//config information for the bot
const config = require('../components/config.json');
const channelInit = require('../components/channelInit.json');
const channelIdArray = channelInit.channelIdArray;

//inputs for the RoleCall objects
const roleCallConfig = require('../components/roleCallConfig.json');
const roleCallConfigContinued = require('../components/roleCallConfigContinued.json');

/*
 declare the variables that hold the RoleCall objects. they
 cannot be instantiated here because the client has to login
 first, so they have to be instantiated in .ready (below)
*/
var roleCall;
var roleCallContinued;

const yearRoles = new Discord.Collection();
const majorRoles = new Discord.Collection();
const courseRoles = new Discord.Collection();

var myGuilds = [];
var myChannels = [];

//I call this .ready, even though there isn't actually a .ready anywhere
client.on("ready", async () => {
	const memberRoleId = '674746958170292224';
	//fetch guilds and channels
	 myGuilds.push(await fetchGuild('673769572804853791'));
	 await initializeChannelsFromArray(0,channelIdArray);
	addTimestampLogs();
	let firstRoleArr = roleCallConfig.roleInputArray;
	let secondRoleArr = roleCallConfigContinued.roleInputArray;
	for(let i = 0; i < 5; i++)						{ yearRoles.set(firstRoleArr[i].role, client.guilds.array()[myGuilds[0]].roles.get(firstRoleArr[i].role)) }
	for(let i = 5; i < 10; i++)						{ majorRoles.set(firstRoleArr[i].role, client.guilds.array()[myGuilds[0]].roles.get(firstRoleArr[i].role)) }
	for(let i = 10; i < firstRoleArr.length; i++)	{ courseRoles.set(firstRoleArr[i].role, client.guilds.array()[myGuilds[0]].roles.get(firstRoleArr[i].role)) }
	for(let i = 0; i < secondRoleArr.length; i++)	{ courseRoles.set(secondRoleArr[i].role, client.guilds.array()[myGuilds[0]].roles.get(secondRoleArr[i].role)) }
	
	console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
	client.user.setActivity(`Beep Boop`);
	
	try	{
		roleCall = new RoleCall(client,roleCallConfig);
		roleCallContinued = new RoleCall(client,roleCallConfigContinued);
	} catch(err) {
		await client.guilds.array()[myGuilds[0]].channels.array()[myChannels[0][0]].send(`oh no we boned`);
		throw err;
	}
		
	
		roleCall.on('roleReactionAdd', (reaction,member,role) =>
		{
			if(!role.members.has(member.id)) //check if user already has role
			{
				let addTheRole = true;
				if(yearRoles.has(role.id)) //check if year role
				{
					yearRoles.array().map(role => addTheRole = addTheRole && !role.members.has(member.id)); //check if user already has a year role
				}
				
				addTheRole ? roleCall.addRole(member,role).catch(err=>{console.error(err.stack)})	:
							 reaction.remove(member)												;
							 
				if(addTheRole)
				{
					if(!member.roles.has(memberRoleId))
					{
						roleCall.addRole(member,member.guild.roles.get(memberRoleId));
					}
				}
			}
		});

		roleCallContinued.on('roleReactionAdd', (reaction,member,role) =>
		{
			if(!role.members.has(member.id)) //check if user already has role
			{
				roleCall.addRole(member,role)
				.catch(err=>{console.error(err.stack)});
				
				if(!member.roles.has(memberRoleId))
				{
					roleCall.addRole(member,member.guild.roles.get(memberRoleId));
				}
			}
		});

		roleCall.on('roleReactionRemove', (reaction,member,role) =>
		{
			if(role.members.has(member.id)) //check if user does not have role
			{
				roleCall.removeRole(member,role)
				.then(newMember => 
				{
					if(newMember.roles.size == 2)
					{
						if(newMember.roles.has(memberRoleId))
						{
							roleCall.removeRole(newMember,newMember.guild.roles.get(memberRoleId));
						} else {
							roleCall.addRole(newMember,newMember.guild.roles.get(memberRoleId));
						}
					}
				})
				.catch(err=>{console.error(err.stack)});
			}
		});

		roleCallContinued.on('roleReactionRemove', (reaction,member,role) =>
		{
			if(role.members.has(member.id)) //check if user does not have role
			{
				roleCall.removeRole(member,role)
				.then(newMember => 
				{
					if(newMember.roles.size == 2)
					{
						if(newMember.roles.has(memberRoleId))
						{
							roleCall.removeRole(newMember,newMember.guild.roles.get(memberRoleId));
						} else {
							roleCall.addRole(newMember,newMember.guild.roles.get(memberRoleId));
						}
					}
				})
				.catch(err=>{console.error(err.stack)});
			}
		});
});

//[helper function] recursively initalize a large amount of channels
function initializeChannelsFromArray(guildIndex, channelIdArray)
{
	return new Promise(async (resolve,reject) =>
	{
		
		if(channelIdArray.length == 0) 
		{
			resolve(`Loaded`);
		} else {
			myChannels[guildIndex].push(await fetchChannel(client.guilds.array()[myGuilds[guildIndex]], channelIdArray.shift()));
			resolve(await initializeChannelsFromArray(guildIndex, channelIdArray));
		}
	});
}

//[helper function] returns the index of a guild (passed by name) in the client.guilds.array()
function fetchGuild(id)
{
	return new Promise((resolve,reject) => {
		for(let arr = client.guilds.array(), i = 0; i < arr.length; i++)
		{
			if(arr[i].id == id)
			{
				myChannels.push([]);
				resolve(i);
			}
		}
		throw `Error: Not a member of guild ${id}`;
	});
}

//[helper function] returns the index of a channel (passed by name) in the guild.channels.array() of a passed in guild object
function fetchChannel(guild,id)
{
	return new Promise((resolve,reject) => {
		for(let arr = guild.channels.array(), i = 0; i < arr.length; i++)
		{
			if(arr[i].id == id)
			{
				resolve(i);
			}
		}
		throw `Error: Channel ${id} not found in ${guild}`;
	});
}

//This event triggers when the bot joins a guild.
client.on("guildCreate", guild => {
	console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

//this event triggers when the bot is removed from a guild.
client.on("guildDelete", guild => {
	console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

//runs when a new user joins the server
client.on("guildMemberAdd", member => {});    //nothing

//runs when a user leaves the server
client.on("guildMemberRemove", member => {}); //nothing

//this event triggers when a message is sent in a channel the bot has access to
client.on("message", async message => {
	/*
	 This event will run on every single message received, from any channel or DM.
	 I's good practice to ignore other bots. This also makes your bot ignore itself
	 and not get into a spam loop (we call that "botception").
	*/
	
	//commands to be issued by other bots go here. currently there are none, so they get ignored
	if(message.author.bot) {
		return;
	}
	
	/* 
	 Here we separate our "command" name, and our "arguments" for the command. 
	 e.g. if we have the message "!say Is this the real life?" , we'll get the following:
	 command = say;
	 args = ["Is", "this", "the", "real", "life?"];
	 
	 Splits the message into space seperated words, cuts off any white space from the end,
	 and grabs the command word from the from the front. This is the magic.
	*/
	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift();
	
	//hugemoji handler
	if(message.isMentioned(client.user)) 
	{	
		const discordAssetUri = `https://cdn.discordapp.com/emojis/`;
		const twemojiDomain = `https://github.com/twitter/twemoji/blob/master/assets/svg/`;
		const unicodeDomain = `https://unicode.org/emoji/charts/full-emoji-list.html`;
		let argv = message.content.trim().split(/ +/g);
		argv.map(async messageElement => 
		{
			if(messageElement.includes(`>`) && messageElement.includes(`:`))
			{
				//emoji is a custom server emoji
				const splitEmoji = messageElement.split(`:`);
				const fileType = splitEmoji.shift() === `<a` ? `.gif` : `.png`; //animated or image
				const emojiName = splitEmoji.shift();
				const emojiSnowflake = splitEmoji.shift().split(`>`)[0];
				const emojiImageUrl = `${discordAssetUri}${emojiSnowflake}${fileType}`;
				message.channel.send({files: 
					[{attachment: emojiImageUrl,
					name: `${emojiName}${fileType}`}]
				})
				.catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)});
			} else if(!messageElement.includes(`>`)) {
				//text is a string
				const emojiToVerify = messageElement;
				const emojiInUnicode = emojiUnicode(emojiToVerify).split(' ').join('-');
				const svgDomain = `${twemojiDomain}${emojiInUnicode}.svg`;
				let githubResponseA = null;
				try {
					//we need to verify that its an emoji
					githubResponseA = await rp(svgDomain);
				} catch(err) {
					//there are some emojis that have slight disconnections between their codepoints and their url, so try to fix
					try {
						const svgSecondDomain = `${twemojiDomain}${emojiInUnicode.slice(0,emojiInUnicode.lastIndexOf('-'))}.svg`;
						githubResponseA = await rp(svgSecondDomain);
					} catch(moreErr) {
						//not an emoji. the condition is checking if its throwing a real error or just 404 not found
						if(!JSON.stringify(moreErr).includes(`<!DOCTYPE html>`)) 
							console.error(moreErr)
					}
				}
				//this is a syntax trick to quickly see if one of the attempts succeeded before continueing
				githubResponseA && rp(githubResponseA.split(`<iframe class="render-viewer " src="`)[1].split('"')[0])
				.then(async githubResponseB =>
				{
					//emoji is a unicode emoji 
					//the order here is: get svg image from remote (save local), convert to png (save local), send png, delete local svg and png
					const emojiName = emojiMap[messageElement] ? emojiMap[messageElement][0] : emojiInUnicode;
					const picFolder = `file_dump`;
					const emojiSvg = await rp(githubResponseB.split('data-image  = "')[1].split('"')[0]);
					await fs.outputFile(`./${picFolder}/${emojiInUnicode}.svg`,emojiSvg);
					await svgToPng.convert(path.join(__dirname,picFolder,`${emojiInUnicode}.svg`),path.join(__dirname,picFolder),{defaultWidth:722,defaultHeight:722},{type:"image/png"});
					await message.channel.send({files: 
						[{attachment: `./${picFolder}/${emojiInUnicode}.png`,
						name: `${emojiName}.png`}]
					}).catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)});
					await fs.remove(`./${picFolder}/${emojiInUnicode}.svg`)
					.catch(err => {
						console.error(err)
					});
					await fs.remove(`./${picFolder}/${emojiInUnicode}.png`)
					.catch(err => {
						console.error(err)
					});
				});
				if(githubResponseA)
				{
					return; //should add limit of one high-res hugemoji per message (will stop all emojis after it tho). this is outside the async body so that it ends iteration immediatly
				}
			}
		});
	}
	
	if(message.content.indexOf(config.prefix) !== 0) return;
	
	console.log("processing " + command + " command");
	
	// commands from users using prefix go below here
	let commandLUT = {
		//utilizes a bulk message deltion feature available to bots, able to do up to 100 messages at once, minimum 3. Adjusted to quietly erase command message as well
		//Emergency Kill switch, added after channel spam so that i would have a way other than ssh to stop it
		"kill": async function() {
			const minimumPermissions = 0x80; //permission bitfield for VIEW_AUDIT_LOG
			if(message.member.hasPermission(minimumPermissions,false,true,true)) 
			{
				console.error(`KILL COMMAND EXECUTED HERE`); //leaves a clear message in the log to make the location easy to find,
				process.exit(1);							 //in the event i want to know where in the log this occurred. exits with error.
			}
		},
		
		//non-emergency restart, for convenience. the process manager (pm2) will restart it automatically
		"restart": async function() {
			const minimumPermissions = 0x80; //permission bitfield for VIEW_AUDIT_LOG
			if(message.member.hasPermission(minimumPermissions,false,true,true))
			{
				process.exit(0);
			}
		},
		
		// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
		// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
		"ping": async function() {
			const m = await message.channel.send("Ping?");
			m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
		},
		
		//responds with the current time connected to the discord server in hh:mm:ss format. If hour exceeds 99, will adjust to triple digit, etc
		"uptime": async function() {
			function pad(n, z) {
				z = z || 2;
				return ('00' + n).slice(-z);
			}
			let s = client.uptime;
			let ms = s % 1000;
			s = (s - ms) / 1000;
			let secs = s % 60;
			s = (s - secs) / 60;
			let mins = s % 60;
			let hrs = (s - mins) / 60;
			let p = Math.floor(Math.log10(hrs)) + 1;
			if(Math.log10(hrs) < 2) {
				p = false;
			}
			message.channel.send("I have been running for " + pad(hrs, p) + ':' + pad(mins) + ':' + pad(secs)).catch(err=>{});
		},
		
		"purge": async function() {
			const minimumPermissions = 0x80; //permission bitfield for VIEW_AUDIT_LOG
			if(!message.member.hasPermission(minimumPermissions,false,true,true))
				return message.author.send(`Sorry, you don't have permissions to use this!`);
			// This command removes all messages from all users in the channel, up to 100
			
			// get the delete count, as an actual number.
			const deleteCount = parseInt(args[0], 10) + 1;
			
			// combined conditions. <3 user must input between 2-99
			if(!deleteCount || deleteCount < 3 || deleteCount > 100)
				return message.reply(`Please provide a number between 2 and 99 (inclusive) for the number of messages to delete`);
			
			// So we get our messages, and delete them. Simple enough, right?
			const fetched = await message.channel.fetchMessages({count: deleteCount});
			message.channel.bulkDelete(deleteCount)
			.catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
		},
		
		//this is a way I've found of aliasing commands when using a LUT
		//sends the user a help dialog listing available commands
		"command": async function(){commandLUT["help"]()},
		"commands": async function(){commandLUT["help"]()},
		"?": async function(){commandLUT["help"]()},
		"help": async function() {
			let comms = new Discord.RichEmbed()
				.setTitle(`Command Help`)
				.setAuthor(client.user.username, client.user.avatarURL)
				.setDescription(`Please contact [@wakfi#6999](https://discordapp.com/users/193160566334947340) with additional questions`)
				.setColor(0xFF00FF)
				.setFooter(`${config.prefix}commands, ${config.prefix}command, ${config.prefix}?`)
				.setTimestamp(new Date())
				.addField(`${config.prefix}ping`,`Provides the current client latency`)
				.addField(`${config.prefix}uptime`,`States how long the bot has been online and connected to Discord continuously, since the most recent interuption`)
				.addField(`Role Call`,`Select roles that indicate your Year, Major, and what courses you are in and have taken, by pressing the reaction buttons on the messages in [#welcome](https://discordapp.com/channels/673769572804853791/674870421237268483/674874071099375637). Users are limited in the channels they can view until they have chosen at least one role`);
			const minimumPermissions = 0x80; //permission bitfield for VIEW_AUDIT_LOG
			if(client.guilds.array()[myGuilds[0]].members.get(message.author.id).hasPermission(minimumPermissions,false,true,true))
			{
				comms
				.addBlankField()
				.addField(`Special Commands`,`For Admin Privileges.`)
				.addField(`${config.prefix}kill`,`Emergency Shutoff. Should restart on its own`)
				.addField(`${config.prefix}restart`,`Non-emergency shutoff,`)
				.addField(`${config.prefix}purge <2-99>`,`Will delete the most recent 2-99 messages in the channel that you execute this command in. Good for cleaning up spam`)
				.addField(`${config.prefix}poll <question>`,`Follow the prompts after that. I can provide a general blueprint of the syntax for all of the prompts if wanted`);
			}
			message.author.send(comms);	
		},
		
		"poll": async function() {
			let duration = 7200000; //default duration is 2 hours
			let targetChan = myChannels[0][1]; //defualt target channel is the general chat channel
			if(message.member.highestRole.calculatedPosition <= message.guild.members.get(client.user.id).highestRole.calculatedPosition)
				return message.author.send(`Sorry, you don't have permissions to use this!`); //verify permission; must be Tutor, TA, Mod, or Admin
			
			if(message.mentions.channels.size > 0) //optional target channel specicification other than sniff-discussion
			{
				targetChan = (await fetchChannel(message.guild, message.mentions.channels.first().id).catch(console.err));
				args.splice(args.indexOf(message.mentions.channels.first().name),1);
			}
			const question = args.join(" "); //create const question. removed by this point are [config.prefix][poll] ... <targetChan>, so all thats left is the question
			message.reply(`How many response options? (${config.prefix}amount #)`); //request amount of options to wait for, using prefix to specialize message
			message.channel.awaitMessages(m => m.content.startsWith(config.prefix) && m.content.replace(`${config.prefix}option`, '') !== '' && m.author === message.author, {maxMatches: 1, time: 90000, errors: ['time'] })
			.then(total => { //this is the message waiter, which is the primary driver of this function. it is only waiting for the author of this poll (but others can be running at the same time for other authors)
				let response = total.array()[0];
				const ammount = response.content.slice(config.prefix.length).trim().split(/ +/g);
				ammount.shift().toLowerCase();
				const responseCount = +ammount[0]; //create a usable number
				if(!responseCount || responseCount < 2 || responseCount > 8)
					return message.reply(`Number from 2-8 must be provided. Poll request terminated.`); //followed a strict-build design, if the syntax is wrong at any point it terminates, so that it doesn't send
				message.reply(`Specify options in individual messages (${config.prefix}option <option>)`); //would like to rewrite with savable promises eventually, so that polls can be saved, edited, sent later, etc
				let buttons = [];
				message.channel.awaitMessages(n => n.content.startsWith(`${config.prefix}option `)  && n.author === message.author, {maxMatches: responseCount, time: 300000, errors: ['time'] })
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
						const edit = new Discord.RichEmbed() //generates the actual RichEmbed object
							.setTitle(poll.content) //title is the text of the message we are going to edit this into
							.setAuthor(message.member.displayName, message.author.avatarURL) //author is the poll authors name and avatar, to show who wrote it
							.setColor(0xFF00FF) //my signiture FF00FF pink
							.setFooter(foot, client.user.avatarURL) //footer is the voting instruction and Sniff Bot's avatar
							.setTimestamp(new Date()) //timestamp for posterity
							.addField(header, answers); //adds the actual poll to the embed. added fields are (key, value) with the key treated as a header/title, so i used the question as the 'key' and the options as the 'value'
						poll.edit("", edit); //edits the embed into the message so that the user can see the results
						message.reply(`Is this correct? (${config.prefix}y or ${config.prefix}n)\nWarning: Once confirmed poll must be manually cancelled with ${config.prefix}endpoll`);
						message.channel.awaitMessages(mn => mn.content.startsWith(config.prefix) && mn.author === message.author, {maxMatches: 1, time: 90000, errors: ['time'] })
						.then(conf => { //awaits confirmation. this is the final chance to cancel, because if they say yes then supposedly this is what they want
							if(conf.array()[0].content.slice(config.prefix.length).trim() === "y")
							{//on yes
								message.reply(`How long (minutes) should the poll remain open? (${config.prefix}time #) (default = 120)`); //default time 2 hours, can be any time >= 1 minute. i suppose 0 wouldn't throw any errors but that would be pretty useless
								message.channel.awaitMessages(mno => mno.content.startsWith(config.prefix) && mno.author === message.author, {maxMatches: 1, time: 40000, errors: ['time'] })
								.then(async dur => { //async keyword is required in the function declaration to use await keyword
									const life = dur.array()[0].content.slice(config.prefix.length).trim().split(/ +/g);
									life.shift().toLowerCase();
									let input = +life[0]; //create int from time input
									if(!isNaN(input)) //check if there was a time given, else it stays default
										duration = input * 60000;
									let filename = `${__dirname}/poll_results/pollresult_${message.id}`; //initalize filename
									let pollMsg = await message.guild.channels.array()[targetChan].send(edit) //send copy of poll message to targetChan
									.then(pinner => pinner.pin()) //pins poll to channel
									.catch(e => {console.error(e)});
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
									const collector = new PollCollector(pollMsg, filter, {time: duration}); //initialize reaction collector with filter and specified duration
									const endCollector = message.channel.guild.channels.array()[targetChan].createMessageCollector(m => m.author === message.author && m.content === `${config.prefix}endpoll`, {time: duration}); //initialize message collector with filter and specified duration
									recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'answers' : answers, 'totalVotes' : collector.collected.size, 'voters' : collector.collected.users, 'complete' : false}, `${filename}.json`)();
									console.log(`started poll timeout = ${duration/60000}`);
									
									//event handler for message collector, allows realtime updating of results and output file (and poll stop). Currently not supporting updating of results
									endCollector.on('collect', p => 
									{ 
										collector.stop();
										endCollector.stop();
									});
									collector.on('collect', p => {
										if(!buttons.includes(p.reaction.emoji.name))
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
										recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'answers' : answers, 'totalVotes' : collector.collected.size, 'voters' : collector.collected.users, 'complete' : false}, `${filename}.json`)();
									});
									
									//event emitted at the end of duration, or if author sends !endpoll command
									collector.on('end', collected => 
									{ 
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
										//records final results in file, including completion status. currently not used
										recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'toSend' : toSend, 'totalVotes' : collected.size, 'voters' : collected.users, 'complete' : true}, `${filename}.json`)();
									});
								})
								.catch(e => console.log(e));
							} else if(conf.array()[0].content.slice(config.prefix.length).trim() === "n") { //on no
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
	}
	/*
	 This command handler is formatted as a lookup table.
	 Additional commands can be added by simply adding the
	 command word with its corresponding value being an async
	 function containing the handling of the command. There
	 shouldnt need to be any paramters passed in as it should
	 already have access to them.
	*/
	let execute = commandLUT[command] || async function(){}
	execute();
});



//logs client in
client.login(config.token);

}

/*

 If you noticed that the entire program is wrapped in main(),
 nice! Apprarently, this makes things faster. Like quite a good
 bit faster. Something to do with globabl variables existing
 makes things slow, so by wrapping everything in one big function,
 we get only function scope variables (stack), which are faster.
 Thus, this call to main is *technically* the only line in the
 program.
 
 */
main();