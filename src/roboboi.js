function main()
{
const Discord = require('discord.js');
const fs = require('fs-extra');
const USERS_PATTERN = /<@!?\d{17,18}>/i

const { prefix, clientOptions, activity, clientStatus, welcome } = require(`${process.cwd()}/util/components/config.json`);
const {token} = require(`${process.cwd()}/util/components/token.json`);
const permLevels = require(`${process.cwd()}/util/components/permLevels.js`);

const addTimestampLogs = require(`${process.cwd()}/util/general/addTimestampLogs.js`);
const authorReply = require(`${process.cwd()}/util/reply/authorReply.js`);
const selfDeleteReply = require(`${process.cwd()}/util/reply/selfDeleteReply.js`);
const cleanReply = require(`${process.cwd()}/util/reply/cleanReply.js`);
const loadAllCommands = require(`${process.cwd()}/util/components/loadAllCommands.js`);
const initRolecall = require(`${process.cwd()}/util/discord/initRolecall.js`);

const client = new Discord.Client(clientOptions);
client.commands = new Discord.Collection();
loadAllCommands(client, `${process.cwd()}/commands`);

client.levelCache = {};
for (let i = 0; i < permLevels.length; i++) 
{
	const thisLevel = permLevels[i];
	client.levelCache[thisLevel.name] = thisLevel.level;
}

client.permlevel = (message) => {
	let permlvl = 0;

	const permOrder = permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

	while (permOrder.length) {
		const currentLevel = permOrder.shift();
		if (message.guild && currentLevel.guildOnly) continue;
		if (currentLevel.check(message)) {
			permlvl = currentLevel.level;
			break;
		}
	}
	return permlvl;
};

//config information for the bot
const server = `673769572804853791`; //guild ID
const namedChannels = require(`${process.cwd()}/util/components/namedChannels.json`);

/*
 declare the variables that hold the RoleCall objects. they
 cannot be instantiated here because the client has to login
 first, so they have to be instantiated in .ready (below)
*/
client.roleCalls = [];

//I call this .ready, even though there isn't actually a .ready anywhere
client.once('ready', async () => 
{
	initRolecall(client,server);
	addTimestampLogs();
	client.user.setPresence({activity:activity, status: clientStatus.status});
	console.log(`${client.user.username} has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds`);
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
			await message.guild.channels.get(namedChannels.mailArchive).send(new Discord.MessageEmbed(message.embeds[0]));
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
