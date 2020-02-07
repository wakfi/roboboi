const Discord = require('discord.js');
var rp = require('request-promise');
const emojiUnicode = require('emoji-unicode');
var svgToPng = require('svg-to-png');
var path = require('path');
var fs = require('fs-extra');
const RoleCall = require('discord-role-call');
const emojiMap = require('./components/emojilib.json');
const clientOps = require('./components/clientOps.json');
const client = new Discord.Client(clientOps);


//--------------------------------------------------------------//
//		  GU CPSC Bot v1.0.0  ~~ by ~~  wakfi#6999  u/wakfi		//
//					-source code available at- 					//
//			https://github.com/wakfi/cpsc-rolecall-bot			//
//				Open Source Under MIT License (2020)			//
//--------------------------------------------------------------//

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
const config = require('./components/config.json');

//inputs for the RoleCall objects
const roleCallConfig = require('./components/roleCallConfig.json');
const roleCallConfigContinued = require('./components/roleCallConfigContinued.json');

/*
 declare the variables that hold the RoleCall objects. they
 cannot be instantiated here because the client has to login
 first, so they have to be instantiated in .ready (below)
*/
var roleCall;
var roleCallContinued;

var myGuilds = [];
var myChannels = [];

//I call this .ready, even though there isn't actually a .ready anywhere
client.on("ready", async () => {
	//fetch guilds and channels
	 myGuilds.push(await fetchGuild('673769572804853791'));
		 myChannels[0].push(await fetchChannel(client.guilds.array()[myGuilds[0]], '674352244136869891'));
	
	addTimestampLogs();
	roleCall = new RoleCall(client,roleCallConfig);
	roleCallContinued = new RoleCall(client,roleCallConfigContinued);
	console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
	client.user.setActivity(`Beep Boop`);
});

//[helper function] returns the index of a guild (passed by name) in the client.guilds.array()
function fetchGuild(id)
{
	return new Promise((resolve,reject) => {
		for(let arr = client.guilds.array(), i = 0; i < arr.length; i++)
		{
			if(arr[i].id === id)
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
			if(arr[i].id === id)
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
client.on("guildMemberAdd", member => {
	//adds Computer Science Student role to all new entrants of the server
	const baseRoleId = '674746958170292224';
	member.addRole(baseRoleId);
});

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
		//utilizes a bulk message deltion feature available to bots, able to do up to 100 messages at once, minimum 3. Adjusted to erase command message as well
		"purge": async function() {
			if(message.guild.members.get(message.author.id).highestRole.calculatedPosition <= message.guild.members.get(client.user.id).highestRole.calculatedPosition)
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