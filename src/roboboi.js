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
const isTimeFormat = require(`${process.cwd()}/util/time/isTimeFormat.js`);
const millisecondsToString = require(`${process.cwd()}/util/time/millisecondsToString.js`);
const parseTime = require(`${process.cwd()}/util/time/parseTime.js`);
const delay = require(`${process.cwd()}/util/time/delay.js`);
const authorReply = require(`${process.cwd()}/util/reply/authorReply.js`);
const selfDeleteReply = require(`${process.cwd()}/util/reply/selfDeleteReply.js`);
const cleanReply = require(`${process.cwd()}/util/reply/cleanReply.js`);

/* license for emojilib.json
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
const emojiMap = require('../components/emojilib.json');

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
const server = "673769572804853791"; //guild ID
const config = require('../components/config.json');
const namedChannels = require('../components/namedChannels.json');

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

var pollChannelIndex;

//I call this .ready, even though there isn't actually a .ready anywhere
client.on("ready", async () => {
	const memberRoleId = '674746958170292224';
	addTimestampLogs();
	let firstRoleArr = roleCallConfig.roleInputArray;
	let secondRoleArr = roleCallConfigContinued.roleInputArray;
	for(let i = 0; i < 5; i++)						{ yearRoles.set(firstRoleArr[i].role, client.guilds.get(server).roles.get(firstRoleArr[i].role)) }
	for(let i = 5; i < 10; i++)						{ majorRoles.set(firstRoleArr[i].role, client.guilds.get(server).roles.get(firstRoleArr[i].role)) }
	for(let i = 10; i < firstRoleArr.length; i++)	{ courseRoles.set(firstRoleArr[i].role, client.guilds.get(server).roles.get(firstRoleArr[i].role)) }
	for(let i = 0; i < secondRoleArr.length; i++)	{ courseRoles.set(secondRoleArr[i].role, client.guilds.get(server).roles.get(secondRoleArr[i].role)) }
	
	console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
	client.user.setActivity(`${config.prefix}help for commands`);
	
	try	{
		roleCall = new RoleCall(client,roleCallConfig);
		roleCallContinued = new RoleCall(client,roleCallConfigContinued);
	} catch(err) {
		await client.guilds.get(server).channels.get(namedChannels.testing).send(`role call went\n> yikes`);
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

//handle reaction add and reaction remove on all messages, including uncached messages
client.on("raw", packet => 
{
	// We don't want this to run on unrelated packets
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
    // Grab the channel to check the message from
    const channel = client.channels.get(packet.d.channel_id);
    // There's no need to emit if the message is cached, because the event will fire anyway for that|| wrong yes there is
    //if (channel.messages.has(packet.d.message_id)) return;
    // Since we have confirmed the message is not cached, let's fetch it
    channel.fetchMessage(packet.d.message_id).then(message => {
		const user = client.users.get(packet.d.user_id);
		//if user is a bot, stop now. 
		if(user.bot) return;
        // Emojis can have identifiers of name:id format, so we have to account for that case as well
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        // This gives us the reaction we need to emit the event properly, in top of the message object
        const reaction = message.reactions.get(emoji);
        // Adds the currently reacting user to the reaction's users collection.
        if (reaction) reaction.users.set(packet.d.user_id, user);
		else return console.error(`Could not retrieve reaction for emoji ${emoji}`);
        // Check which type of event it is before emitting
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            messageReactionAdd(reaction, user);
        } else if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            messageReactionRemove(reaction, user);
        }
    });
});

//handles messageReactionAdd event passed by packet handler
async function messageReactionAdd(reaction,user)
{
	const message = reaction.message;
	if(message.channel.id == namedChannels.modmail)
	{
		if(reaction.emoji.name === `🗃`)
		{
			await message.guild.channels.get(namedChannels.mailArchive).send(new Discord.RichEmbed(message.embeds[0]));
			await message.delete();
		}
	}
}

//do nothing
//we have this so it can be expanded at later without editing raw packet handler
async function messageReactionRemove(reaction,user)
{}

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
	
	//ignore messages not including our prefix nor @ the bot
	if(message.content.indexOf(config.prefix) !== 0 && !message.isMentioned(client.user)) return;
	
	/* 
	 Here we separate our "command" name, and our "arguments" for the command. 
	 e.g. if we have the message "!say Is this the real life?" , we'll get the following:
	 command = say;
	 args = ["Is", "this", "the", "real", "life?"];
	 
	 Splits the message into space seperated words, cuts off any white space from the end,
	 and grabs the command word from the from the front. This is the magic.
	*/
	
	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	if(args.length < 2 && message.isMentioned(client.user))
	{
		cleanReply(message, `type ${config.prefix}help to see a list commands`);
		return;
	}
	const command = message.isMentioned(client.user) ? args[1] : args[0];
	args.shift(); if(message.isMentioned(client.user)) args.shift(); //clear command and mention if present
	
	//console.log("processing " + command + " command");
	
	// commands from users using prefix go below here
	let commandLUT = {
		//utilizes a bulk message deltion feature available to bots, able to do up to 100 messages at once, minimum 3. Adjusted to quietly erase command message as well
		//Emergency Kill switch, added after channel spam so that i would have a way other than ssh to stop it
		"kill": async function() {
			const minimumPermissions = 0x2000; //permission bitfield for MANAGE_MESSAGES
			if(message.member.hasPermission(minimumPermissions,false,true,true)) 
			{
				console.error(`KILL COMMAND EXECUTED HERE`); //leaves a clear message in the log to make the location easy to find,
				process.exit(1);							 //in the event i want to know where in the log this occurred. exits with error.
			}
		},
		
		//non-emergency restart, for convenience. the process manager (pm2) will restart it automatically
		"restart": async function() {
			const minimumPermissions = 0x2000; //permission bitfield for MANAGE_MESSAGES
			if(message.member.hasPermission(minimumPermissions,false,true,true))
			{
				process.exit(0);
			}
		},
		
		// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
		// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
		"ping": async function() {
			const m = await message.channel.send("🏓 Ping?");
			m.edit(`🏓 Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
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
		
		"mstime": async function() {
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
		},
		
		"info": async function() {
			const botVersion = (await rp('https://github.com/wakfi/roboboi/releases')).split('/wakfi/roboboi/releases/tag/')[1].split('"')[0];
			const richEmbed = new Discord.RichEmbed()
				.setTitle(`Mini Ada`)
				.setAuthor(`wakfi`, `https://cdn.discordapp.com/attachments/433771480505909248/698752752574005308/wakfi.png`)
				.setDescription(`This bot was created by <@193160566334947340> for the Gonzaga Computer Science Discord Server`)
				.addField(`Prefix`,`Use ${config.prefix} or ${client.user} to invoke commands`)
				.addField(`Help commands`,`${config.prefix}help, ${config.prefix}commands, ${config.prefix}command, ${config.prefix}?`)
				.addField(`Library`,`Created in JavaScript using [discord.js](https://discord.js.org/) v11.5.1, a powerful node.js module that allows you to interact with the Discord API very easily`)
				.addField(`Repository`,`This software is licensed under the MIT license. The GitHub repository for this project can be found at: https://github.com/wakfi/roboboi`)
				.setFooter(`roboboi ${botVersion}`)
				.setTimestamp(new Date())
				.setColor(0xFF00FF);
			authorReply(message, richEmbed).catch(e=>{});
		},
		
		//this is a way I've found of aliasing commands when using a LUT
		//sends the user a help dialog listing available commands
		"command": async function(){commandLUT["help"]()},
		"commands": async function(){commandLUT["help"]()},
		"?": async function(){commandLUT["help"]()},
		"help": async function() {
			const richEmbed = new Discord.RichEmbed()
				.setTitle(`Command Help`)
				.setAuthor(client.user.username, client.user.avatarURL)
				.setDescription(`Please contact <@193160566334947340> with additional questions`)
				.setColor(0xFF00FF)
				.setFooter(`${config.prefix}commands, ${config.prefix}command, ${config.prefix}?`)
				.setTimestamp(new Date())
				.addField(`${config.prefix}info`,`Information about the development of this bot`)
				.addField(`${config.prefix}mstime <number or duration>`,`Convert a time from milliseconds into a readable time, or a readable time into milliseconds. Readable times are in the format \`1d 1h 1m 1s 1ms\`; any zero values will be omitted from the returned result`)
				.addField(`${config.prefix}submit <text of message>`,`Send a message something to the Mod Mail. Currently only the message body will be sent, not any attachments. If you want to send an attachment, send a direct link to it instead`)
				.addField(`${config.prefix}ping`,`Provides the current client latency`)
				.addField(`${config.prefix}uptime`,`States how long the bot has been online and connected to Discord continuously, since the most recent interuption`)
				.addField(`Role Call`,`Select roles that indicate your Year, Major, and what courses you are in and have taken, by pressing the reaction buttons on the messages in <#674870421237268483>. Users are limited in the channels they can view until they have chosen at least one role`);
			const minimumPermissions = 0x2000; //permission bitfield for MANAGE_MESSAGES
			if(client.guilds.get(server).members.get(message.author.id).hasPermission(minimumPermissions,false,true,true))
			{
				richEmbed
				.addBlankField()
				.addField(`Special Commands`,`For Mod Privileges`)
				.addField(`${config.prefix}kill`,`Emergency Shutoff. Should restart on its own. Use this if the bot starts spamming rapidly without reason, for example`)
				.addField(`${config.prefix}restart`,`Non-emergency shutoff`)
				.addField(`${config.prefix}purge <arguments>`,`Will delete the most recent 2-99 messages in the channel that you execute this command in. Good for cleaning up spam. All messages to delete must be less than 14 days old due to the Discord API. Argument options:\n`
						+ `**${config.prefix}purge <2-99>** - delete the most recent X messages from this channel. You will need to count\n`
						+ `**${config.prefix}purge count | <2-99>** - identical to the previous syntax, but using an explicit command form\n`
						+ `**${config.prefix}purge from | <messageID>** - delete all messages between the most recent message and the provided messageID. Command will fail if the provided message is further than 99 messages from the most recent message\n`
						+ `**${config.prefix}purge between | <oldestID> | <newestID>** - delete all messages between oldestID and newestID, ***inclusive***. Does not need to be within 99 messages of the most recent message\n`)
				.addField(`${config.prefix}poll <question>`,`Follow the prompts after that. I can provide a general blueprint of the syntax for all of the prompts if wanted. Note: don't make more than one poll per user without starting it, the syntax hasn't been prepared for that yet`);
			}
			authorReply(message, richEmbed).catch(e=>{});
		},
		
		"submit": async function() {
			if(message.channel.type !== 'dm') 
			{ 
				selfDeleteReply(message, `try sending me that command as a direct message instead!`, '20s');
				try {
					await authorReply(message, `Here is your command, you can send this back to me or edit it first:` + '```\n' + message.content + '\n```');
				} catch(ignore) {
				}
				return;
			}
			if(args.length == 0) return selfDeleteReply(message, `you cannot submit an empty message`);
			const richEmbed = new Discord.RichEmbed()
				.setAuthor(message.author.username, message.author.avatarURL)
				.setDescription(`${args.join(' ')}\n${message.author}`)
				.setColor(0xFF00FF)
				.setTimestamp(new Date())
				.setFooter(`Submitted`);
			const newMail = await client.guilds.get(server).channels.get(namedChannels.modmail).send(richEmbed)
			.catch(err => {return selfDeleteReply(message, `An error has occured. Your message could not be submitted. Please try again later`, `25s`)});
			await newMail.react(`🗃`);
			authorReply(message, `${message.author}, thank you for using Mod Mail! Your submission has been successfully received. A member of the moderation team will review your submission as soon as possible`).catch(e=>{});
		},
		
		"hugemoji": async function() {
			const messageElement = args[0];
			if(messageElement.includes(`>`) && messageElement.includes(`:`))
			{
				//emoji is a custom server emoji
				const discordAssetUri = `https://cdn.discordapp.com/emojis/`;
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
				const twemojiDomain = `https://github.com/twitter/twemoji/blob/master/assets/svg/`;
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
					//data for vector image of emoji
					const emojiSvg = await rp(githubResponseB.split('data-image  = "')[1].split('"')[0]);
					await fs.outputFile(`./${picFolder}/${emojiInUnicode}.svg`,emojiSvg);
					//convert from svg to png
					await svgToPng.convert(path.join(__dirname,picFolder,`${emojiInUnicode}.svg`),path.join(__dirname,picFolder),{defaultWidth:722,defaultHeight:722},{type:"image/png"});
					await message.channel.send({files: 
						[{attachment: `./${picFolder}/${emojiInUnicode}.png`,
						name: `${emojiName}.png`}]
					}).catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)});
					//cleanup created files
					await fs.remove(`./${picFolder}/${emojiInUnicode}.svg`)
					.catch(err => {
						console.error(err)
					});
					await fs.remove(`./${picFolder}/${emojiInUnicode}.png`)
					.catch(err => {
						console.error(err)
					});
				});
			}
		},
		
		"purge": async function() {
			if(message.channel.type === 'dm') return selfDeleteReply(message, 'This command can only be used in a server!', '15s');
			const minimumPermissions = 0x2000; //permission bitfield for MANAGE_MESSAGES
			if(!message.member.hasPermission(minimumPermissions,false,true,true))
			{
				return await cleanReply(message, `Sorry, you don't have permissions to use this!`);
			}
			// This command removes all messages from all users in the channel, up to 100
			const lastAccessibleMessageID = (await message.channel.fetchMessages({limit: 1, before: message.channel.lastMessageID})).first().id;
			let keyword;
			let deleteCount = 100;
			let fetchOptions = null;
			let startID = null;
			let endID = message.channel.lastMessageID;
			let afterID = null;
			if(!args.includes(`|`))
			{
				// get the delete count, as an actual number.
				deleteCount = parseInt(args[0], 10) + 1;
				
				fetchOptions = {limit: deleteCount};
			} else {
				let pipedArgs = args.join(" ").split("|");
				pipedArgs = pipedArgs.map(arg => arg.trim().toLowerCase());
				keyword = pipedArgs.shift();
				if(keyword === "from")
				{
					startID = pipedArgs.shift();
					const startIDNum = +startID;
					if(isNaN(startIDNum))
					{
						return await cleanReply(message, `Must provide a valid message ID`);
					}
					const afterResult = await message.channel.fetchMessages({limit: 1, before: startID});
					afterID = (afterResult.size == 1) ? afterResult.first().id : startID;
					fetchOptions = {limit: deleteCount, after: afterID};
				} else if(keyword === `between`) {
					startID = pipedArgs.shift();
					endID = pipedArgs.shift();
					if(endID === lastAccessibleMessageID)
					{
						//changes execution to a 'from' command for simplicity, as the range selected is from some message
						//to the bottom, which is what 'from' does
						args[0] = `from`;
						commandLUT["purge"]();
						return;
					} else {
						const startIDNum = +startID;
						const endIDNum = +endID;
						if(isNaN(startIDNum) || isNaN(endIDNum))
						{
							return await cleanReply(message, `Please provide valid message IDs`);
						}
						const afterResult = await message.channel.fetchMessages({limit: 1, before: startID});
						const beforeResult = await message.channel.fetchMessages({limit: 1, after: endID});
						afterID = (afterResult.size == 1) ? afterResult.first().id : startID;
						const beforeID = (beforeResult.size == 1) ? beforeResult.first().id : endID;
						
						const afterMessages = await message.channel.fetchMessages({limit: 100, after: afterID});
						const beforeMessages = await message.channel.fetchMessages({limit: 100, before: beforeID});

						const intersectionMessages = afterMessages.filter(msg => beforeMessages.has(msg.id));
						deleteCount = intersectionMessages.size;
						
						fetchOptions = {limit: deleteCount, after: afterID};
					}
				} else if(keyword === "count") {
					// get the delete limit, as an actual number.
					deleteCount = parseInt(pipedArgs.shift(), 10) + 1;
					
					fetchOptions = {limit: deleteCount};
				} else {
					return await cleanReply(message, `Unknown purge command: ${keyword}`);
				}
			}
			
			if(isNaN(deleteCount))
			{
				return await cleanReply(message, `Number of messages to delete must be a number`);
			}
			
			// combined conditions <3 user must input between 2-99
			if(!deleteCount || deleteCount < 3 || deleteCount > 100)
			{
				return await cleanReply(message, `Please provide a number between 2 and 99 (inclusive) for the number of messages to delete`);
			}
			
			// So we get our messages, and delete them. Simple enough, right?
			const fetched = await message.channel.fetchMessages(fetchOptions);
			
			if(!fetched.has(endID) || startID && !fetched.has(startID))
			{
				const errText = keyword === "from" ? `Message ID must be within 99 messages of the most recent message` :
													 `The older message provided must be within 99 messages of the newer message`;
				return await cleanReply(message, errText);
			}
			
			message.channel.bulkDelete(fetched)
			.catch(async error => 
			{
				await cleanReply(message, `Couldn't delete messages because of: ${error}`, '16s');
			});
		},
		
		"poll": async function() {
			let duration = 86400000; //default duration is 24 hours
			let targetChan = namedChannels.polls; //defualt target channel is the general chat channel
			if(message.member.highestRole.calculatedPosition <= message.guild.members.get(client.user.id).highestRole.calculatedPosition)
				return message.author.send(`Sorry, you don't have permissions to use this!`); //verify permission; must be Tutor, TA, Mod, or Admin
			
			if(message.mentions.channels.size > 0) //optional target channel specicification other than sniff-discussion
			{
				targetChan = message.mentions.channels.first().id;
				args.splice(args.indexOf(message.mentions.channels.first().name),1);
			}
			console.log(`target channel: ${targetChan}`);
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
						message.channel.awaitMessages(mn => mn.content.startsWith(config.prefix) && mn.author === message.author, {maxMatches: 1, time: 180000, errors: ['time']})
						.then(conf => { //awaits confirmation. this is the final chance to cancel, because if they say yes then supposedly this is what they want
							if(conf.array()[0].content.slice(config.prefix.length).trim() === "y")
							{//on yes
								message.reply(`Poll creation complete. Poll will be saved for 24 hours. Type ${config.prefix}pollstart to begin the poll. You can type ${config.prefix}polltime to change the duration of the poll; the default duration is 24 hours`);
								const polltimeRegex = new RegExp(`^${config.prefix}polltime`);
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
										duration = parsedTime;
									} else { console.log(`using default time ${duration}`) }
								});
								const pollstartRegex = new RegExp(`^${config.prefix}pollstart`);
								message.channel.awaitMessages(mno => mno.author === message.author && pollstartRegex.test(mno.content), {maxMatches: 1, time: duration, errors: ['time'] })
								.then(async dur => { //async keyword is required in the function declaration to use await keyword
									timeCollector.stop();
									let filename = `${__dirname}/poll_results/pollresult_${message.id}`; //initalize filename
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
									const endCollector = message.channel.guild.channels.get(targetChan).createMessageCollector(m => m.author === message.author && (m.content === `${config.prefix}endpoll` || m.content === `${config.prefix}cancelpoll`), {time: duration}); //initialize message collector with filter and specified duration
									recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'answers' : answers, 'totalVotes' : collector.collected.size, 'voters' : collector.collected.users, 'complete' : false}, `${filename}.json`)();
									console.log(`started poll timeout = ${millisecondsToString(duration)}`);
									
									//event handler for message collector, allows realtime updating of results and output file (and poll stop). Currently not supporting updating of results
									endCollector.on('collect', msg => 
									{ 
										if(msg.content === `${config.prefix}cancelpoll`) cancelled = true;
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
										recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'answers' : answers, 'totalVotes' : collector.collected.size, 'voters' : collector.collected.users, 'complete' : false}, `${filename}.json`)();
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
											recordFile({'question' : question, 'authorName' : message.author.username, 'authorId' : message.author.id, 'pollMsg' : pollMsg.id, 'responseCount' : responseCount, 'cleanResults' : cleanResults, 'toSend' : toSend, 'totalVotes' : collected.size, 'voters' : collected.users, 'complete' : true}, `${filename}.json`)();
										}
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
	let log = true;
	let execute = commandLUT[command] || async function(){log=false}
	execute();
	if(log) console.log("processed " + command + " command");
});

//logs client in
client.login(config.token);

}

/*

 If you noticed that the entire bot is wrapped in main(),
 nice! Apprarently, this makes things faster. Like quite a good
 bit faster. Something to do with globabl variables existing
 makes things slow, so by wrapping everything in one big function,
 we get only function scope variables (stack), which are faster.
 Thus, this call to main is *technically* the only line in the
 program.
 
 */
main();
