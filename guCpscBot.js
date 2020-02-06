const Discord = require('discord.js');
var rp = require('request-promise');
const emojiUnicode = require('emoji-unicode');
var svgToPng = require('svg-to-png');
var path = require('path');
var fs = require('fs-extra');
const RoleCall = require('./components/RoleCall.js');
const emojiMap = require('./components/emojilib.json');
const clientOps = require('./components/clientOps.json');
const client = new Discord.Client(clientOps);


//--------------------------------------------------------------//
//		  GU CPSC Bot v0.3.0  ~~ by ~~  wakfi#6999  u/wakfi		//
//			source code at https://github.com/wakfi/			//
//				Open Source Under MIT License (2019)			//
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

const config = require('./components/config.json');
const roleCallConfig = require('./components/roleCallConfig.json');
const roleCallConfigContinued = require('./components/roleCallConfigContinued.json');
var roleCall;
var roleCallContinued;

var myGuilds = [];
var myChannels = [];

client.on("ready", async () => {
	//fetch guilds and channels
	 myGuilds.push(await fetchGuild('673769572804853791'));
		 myChannels[0].push(await fetchChannel(client.guilds.array()[myGuilds[0]], '674352244136869891'));
	
	addTimestampLogs();
	roleCall = new RoleCall(client,roleCallConfig);
	roleCallContinued = new RoleCall(client,roleCallConfigContinued);
	console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
	//client.user.setActivity(`Type ${config.prefix}help for help`);
	client.user.setActivity(`Beep Boop`);
	
	/* let msgStr = ``;
	client.guilds.array()[myGuilds[0]].roles.array().map(role => msgStr += `${role.id} - ${role.name!=='@everyone'?role.name:'everyone'}\n`);
	await client.guilds.array()[myGuilds[0]].channels.array()[myChannels[0]].send(msgStr); */
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

//[helper function] sends a specific user (in this case myself) a desired message. Allows simpler debugging
function sendMe(content) {
	client.fetchUser("193160566334947340")
	.then(wakfi => {
		wakfi.send(content).catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)});
	})
	.catch(console.error);
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
	// This event will run on every single message received, from any channel or DM.
	// It's good practice to ignore other bots. This also makes your bot ignore itself
	// and not get into a spam loop (we call that "botception").
	
	//commands to be issued by other bots go here//ignore other bots now
	if(message.author.bot) {
		return;
	}
	
	// Here we separate our "command" name, and our "arguments" for the command. 
	// e.g. if we have the message "!say Is this the real life?" , we'll get the following:
	// command = say
	// args = ["Is", "this", "the", "real", "life?"]
	//splits the message into space seperated words, cuts off any white space from the end, and grabs the command word from the from the front. This is the magic.
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
				const splitEmoji = messageElement.split(`:`);
				const fileType = splitEmoji.shift() === `<a` ? `.gif` : `.png`;
				const emojiName = splitEmoji.shift();
				const emojiSnowflake = splitEmoji.shift().split(`>`)[0];
				const emojiImageUrl = `${discordAssetUri}${emojiSnowflake}${fileType}`;
				message.channel.send({files: 
					[{attachment: emojiImageUrl,
					name: `${emojiName}${fileType}`}]
				})
				.catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)});
			} else if(!messageElement.includes(`>`)) {
				const emojiToVerify = messageElement;
				const emojiInUnicode = emojiUnicode(emojiToVerify).split(' ').join('-');
				const svgDomain = `${twemojiDomain}${emojiInUnicode}.svg`;
				let githubResponseA = null;
				try {
					githubResponseA = await rp(svgDomain);
				} catch(err) {
					try {
						const svgSecondDomain = `${twemojiDomain}${emojiInUnicode.slice(0,emojiInUnicode.lastIndexOf('-'))}.svg`;
						githubResponseA = await rp(svgSecondDomain);
					} catch(moreErr) {
						if(!JSON.stringify(moreErr).includes(`<!DOCTYPE html>`)) 
							console.error(moreErr)
					}
				}
				githubResponseA && rp(githubResponseA.split(`<iframe class="render-viewer " src="`)[1].split('"')[0])
				.then(async githubResponseB =>
				{
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
					return; //should add limit of one high-res hugemoji per message (will stop all emojis after it tho)
				}
			}
		});
	}
});

client.login(config.token);