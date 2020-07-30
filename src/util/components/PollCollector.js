const path = require('path');
const ReactionCollector = require((require.resolve('discord.js')).split(path.sep).slice(0, -1).join(path.sep) + `${path.sep}structures${path.sep}ReactionCollector.js`);

class PollCollector extends ReactionCollector
{
	constructor(message, filter, options = {}) 
	{
		super(message, filter, options);
		this.client.setMaxListeners(this.client.getMaxListeners() + 1);
		
		this.client.on(`messageReactionRemove`, (reaction, user) => {
			if(reaction.message.id != this.message.id) return;
			if(this.collected.get(user.id) && this.collected.get(user.id).reaction == reaction)
			{
				this.collected.delete(user.id);
				this.users.delete(user.id);
				this.total--;
			} 	
		});
	}
	
	//in essence, this is a reaction collecter that limits users to one reaction
	handle(reaction, user)
	{
		let k = super.handle(reaction);
		if(k === null) return null;
		if(this.users.array().includes(user))
		{
			reaction.remove(user);
			return null;
		}
		let v = {"reaction":reaction,"author":user};
		return {
			key: user.id,
			value: v,
		};
	}
	
	cleanup() 
	{
		super.cleanup();
		this.client.setMaxListeners(this.client.getMaxListeners() - 1);
	}	
}

module.exports = PollCollector;