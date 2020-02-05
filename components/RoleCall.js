const Discord = require('discord.js');
const Collection = Discord.Collection;

class RoleCall extends EventEmitter
{
	constructor(client,rollIn) 
	{
		this.client = client;
		this.guild = client.guilds.get(rollIn.guildId); 
		this.message = guild.channels.get(rollIn.channelId).fetchMessage(rollIn.messageId);
		this.roles = new Collection(); //type: Collection<Snowflake, Role> where Snowflake is the snowflake of the emoji that is associate with the role
		
		//rollIn is a json containing an array of objects with properties{ "role":string, "emoji":string }, and a guild id, channel id, and message id for targeting the role call message
		rollIn.roleInputArray.map(roleToCall => { //set roles list
			if(this.guild.roles.has(roleToCall.role))
			{
				this.roles.set(roleToCall.emoji,this.guild.roles.get(roleToCall.role));
			} else {
				console.error(`error: ${this.guild} does not have role resolvable with ${roleToCall.role}`);
			}
		});
		
		this.reactions = new Collection(); //type: Collection<Snowflake,MessageReaction> passed in as emoji resolvables
		this.message.reactions.toArray().map(reaction =>
		{
			if(roles.has(reaction.emoji.identifier))
			{
				this.reactions.set(reaction.emoji.identifier,reaction);
			}
		});
		
		this.client.setMaxListeners(this.client.getMaxListeners() + 2);
		
		this.client.on(`messageReactionAdd`, reactionAdded(reaction, user));
		this.client.on(`messageReactionRemove`, reactionRemoved(reaction, user));
	}
	
	reactionAdded(reaction,user)
	{
		if(reaction.message.id != this.message.id) return;
		if(!this.reactions.has(reaction.emoji.identifier)) return;
		this.emit('roleCalledToAdd', (user, this.guild, this.roles.get(reaction.emoji.identifier)));
	}
	
	reactionRemoved(reaction,user)
	{
		if(reaction.message.id != this.message.id) return;
		if(!this.reactions.has(reaction.emoji.id)) return;
		this.emit('roleCalledToRemove', (user, this.guild, this.roles.get(reaction.emoji.identifier)));
	}
}

module.exports = RoleCall;