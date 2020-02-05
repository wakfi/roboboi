const EventEmitter = require('events');
const Discord = require('discord.js');
const Collection = Discord.Collection;

class RoleCall extends EventEmitter
{
	/*
	 
	 @param client: Discord.Client object representing the bot client
	 @param rollIn: json containing an array of objects with properties{ "role":string, "emoji":string }, and a guild id, channel id, and message id(s) for targeting the role call message(s)
	
	*/
	constructor(client,rollIn) 
	{
		super();
		this.client = client;
		this.guild = client.guilds.get(rollIn.guildId); 
		let reactArr = [];
		this.guild.channels.get(rollIn.channelId).fetchMessage(rollIn.messageId).then(theMessage=>{
			const messageReactionCap = 20;
			this.message = theMessage;
			this.roles = new Collection(); //type: Collection<Snowflake, Role> where Snowflake is the snowflake of the emoji that is associate with the role
			this.reactions = new Collection(); //type: Collection<Snowflake,MessageReaction> passed in as emoji resolvables
			
			rollIn.roleInputArray.map(roleToCall => { //set roles list
				if(this.guild.roles.has(roleToCall.role))
				{
					this.roles.set(roleToCall.emoji,this.guild.roles.get(roleToCall.role));
					console.log(`mapped ${roleToCall.emoji} to ${this.roles.get(roleToCall.emoji)}`);
				} else {
					console.error(`error: ${this.guild} does not have role resolvable with ${roleToCall.role}`);
				}
			});
			
			this.message.reactions && this.message.reactions.array().map(reaction =>
			{
				console.log(`has ${reaction.emoji.name}: ${this.roles.has(reaction.emoji.name)}`);
				if(this.roles.has(reaction.emoji.name))
				{
					this.reactions.set(reaction.emoji.name,reaction);
				}
			});
			if(this.reactions.size < rollIn.roleInputArray.length) rollIn.roleInputArray.map(roleToCall => {
				if(!this.reactions.has(roleToCall.emoji))
				{
					let emoji = roleToCall.emoji.includes(`<`) ? guild.emoji.names.get(roleToCall.emoji) : roleToCall.emoji;
					reactArr.push(
						this.message.react(emoji)
						.then(reaction => this.reactions.set(reaction.emoji.name,reaction))
						.catch(error => console.log(`Error adding reaction ${emoji} to roleCall message ${this.message.id}`))
					);
				}
			});
			Promise.all(reactArr).then(done=>
			{
				this.client.setMaxListeners(this.client.getMaxListeners() + 2);
				
				this.client.on(`messageReactionAdd`, this.reactionAdded.bind(this));
				this.client.on(`messageReactionRemove`, this.reactionRemoved.bind(this));
				console.log(`done`);
			});
		});
		
	}
	
	reactionAdded(reaction,user)
	{
		let guild = this.client.guilds.get(this.guild.id);
		//console.log(reaction.message.id != this.message.id);
		//console.log(!this.reactions.has(reaction.emoji.name));
		if(reaction.message.id != this.message.id) return;
		if(!this.reactions.has(reaction.emoji.name)) return;
		//reaction.message.channel.send(`recieved reaction ${reaction} added`);
		//console.log(`guild.roles.get(this.roles.get(reaction.emoji.name).id): ${guild.roles.get(this.roles.get(reaction.emoji.name).id).members}`);//members.has(user.id): ${guild.roles.get(this.roles.get(reaction.emoji.name).id).members.has(user.id)});
		if(!guild.roles.get(this.roles.get(reaction.emoji.name).id).members.has(user.id))
		{
			guild.members.get(user.id).addRole(this.roles.get(reaction.emoji.name)).catch(console.error);
		}
	}
	
	reactionRemoved(reaction,user)
	{
		let guild = this.client.guilds.get(this.guild.id);
		//console.log(reaction.message.id != this.message.id);
		//console.log(!this.reactions.has(reaction.emoji.name));
		if(reaction.message.id != this.message.id) return;
		if(!this.reactions.has(reaction.emoji.name)) return;
		//console.log(`recieved reaction removed`);
		if(guild.roles.get(this.roles.get(reaction.emoji.name).id).members.has(user.id))
		{ 
			guild.members.get(user.id).removeRole(this.roles.get(reaction.emoji.name)).catch(console.error);
		}
	}
}

module.exports = RoleCall;