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
			
			//set roles collection. Collection is an extension of javascript Map object with expanded functionality, primarily for mapping ID (aka snowflake) to object
			rollIn.roleInputArray.map(roleToCall => { 
				if(this.guild.roles.has(roleToCall.role))
				{
					this.roles.set(roleToCall.emoji,this.guild.roles.get(roleToCall.role));
					console.log(`mapped ${roleToCall.emoji} to ${this.roles.get(roleToCall.emoji)}`);
				} else {
					console.error(`error: ${this.guild} does not have role resolvable with ${roleToCall.role}`);
				}
			});
			
			//collect matching reaction objects from existing reactions
			this.message.reactions && this.message.reactions.array().map(reaction => 
			{
				console.log(`has ${reaction.emoji.name}: ${this.roles.has(reaction.emoji.name)}`);
				if(this.roles.has(reaction.emoji.name))
				{
					this.reactions.set(reaction.emoji.name,reaction);
				}
			});
			
			//fill in any remaining reactions as required in order to fill out collections
			if(this.reactions.size < rollIn.roleInputArray.length) rollIn.roleInputArray.map(roleToCall => { 
				if(!this.reactions.has(roleToCall.emoji))
				{
					let emoji = roleToCall.emoji.includes(`<`) ? guild.emoji.names.get(roleToCall.emoji) : roleToCall.emoji;
					reactArr.push(
						this.message.react(emoji)
						.then(reaction => this.reactions.set(reaction.emoji.name,reaction))
						.catch(error => {
							console.log(`Error adding reaction ${emoji} to roleCall message ${this.message.id}`);
							
						})
					);
				}
			});
			
			//wait until *this finishes adding its own reactions before adding the reaction listeners, so that it doesnt try to handle iteself
			Promise.all(reactArr).then(async done=> 
			{
				this.client.setMaxListeners(this.client.getMaxListeners() + 2);
				
				this.client.on(`messageReactionAdd`, this.reactionAdded.bind(this));
				this.client.on(`messageReactionRemove`, this.reactionRemoved.bind(this));
				console.log(`done`);
				/* await this.sendMe.call(this,`Please react with the corresponding emoji below to receive the appropriate roles:`);
				const iterator = this.roles.entries();
				let myMsg = ``;
				for(let i = 0; i < this.roles.size; i++)
				{
					let entry = `${iterator.next().value}`.split(',');
					myMsg += `${entry[0]} - \\${entry[1]}\n`;
				}
				await this.sendMe.call(this,myMsg);  */
				//this.message.channel.send(`(more reactions)`);
			});
		});
		
		
	}
	
	reactionAdded(reaction,user)
	{
		//console.log(reaction.message.id != this.message.id);
		//console.log(!this.reactions.has(reaction.emoji.name));
		//console.log(user.bot);
		if(reaction.message.id != this.message.id) return;
		if(!this.reactions.has(reaction.emoji.name)) return;
		if(user.bot) return;
		let guild = this.client.guilds.get(this.guild.id);
		//console.log(`recieved reaction ${reaction} added`);
		if(!guild.roles.get(this.roles.get(reaction.emoji.name).id).members.has(user.id))
		{
			guild.members.get(user.id).addRole(this.roles.get(reaction.emoji.name)).catch(console.error);
		}
	}
	
	reactionRemoved(reaction,user)
	{
		//console.log(reaction.message.id != this.message.id);
		//console.log(!this.reactions.has(reaction.emoji.name));
		//console.log(user.bot);
		if(reaction.message.id != this.message.id) return;
		if(!this.reactions.has(reaction.emoji.name)) return;
		if(user.bot) return;
		let guild = this.client.guilds.get(this.guild.id);
		//console.log(`recieved reaction removed`);
		if(guild.roles.get(this.roles.get(reaction.emoji.name).id).members.has(user.id))
		{ 
			guild.members.get(user.id).removeRole(this.roles.get(reaction.emoji.name)).catch(console.error);
		}
	}
	
			//[helper function] sends a specific user (in this case myself) a desired message. Allows simpler debugging
		/* sendMe(content) {
			return new Promise((resolve,reject) =>{
				this.client.fetchUser("193160566334947340")
				.then(async wakfi => {
					resolve(await wakfi.send(content).catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)}));
				})
				.catch(console.error);
			});
		} */
}

module.exports = RoleCall;