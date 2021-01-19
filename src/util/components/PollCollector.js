const path = require('path');
const ReactionCollector = require((require.resolve('discord.js')).split(path.sep).slice(0, -1).join(path.sep) + `${path.sep}structures${path.sep}ReactionCollector.js`);
const Collection = require((require.resolve('discord.js')).split(path.sep).slice(0, -1).join(path.sep) + `${path.sep}util${path.sep}Collection.js`);
const {Events} = require((require.resolve('discord.js')).split(path.sep).slice(0, -1).join(path.sep) + `${path.sep}util${path.sep}Constants.js`);

class PollCollector extends ReactionCollector
{
	constructor(message, filter, options = {}) 
	{
		super(message, filter, options);
		this.client.incrementMaxListeners();
		this.client.on(Events.MESSAGE_REACTION_REMOVE, this._removedReaction.bind(this));
		this.once('end', () => {
			this.client.removeListener(Events.MESSAGE_REACTION_REMOVE, this._removedReaction);
			this.client.decrementMaxListeners();
		});
	}
	
	//in essence, this is a reaction collecter that limits users to one reaction
	collect(reaction, user)
	{
		if(reaction.message.id != this.message.id) return;
		if(this.collected.has(user.id) && this.filter(reaction, user))
		{
			const oldReaction = this.collected.get(user.id);
			this.collected.delete(user.id);
			this.users.delete(user.id);
			this.total--;
			oldReaction.users.remove(user.id);
		}
		return user.id;
	}
	
	_removedReaction(reaction, user)
	{
		if(reaction.message.id != this.message.id || !this.filter(reaction, user)) return;
		if(this.collected.has(user.id) && this.collected.get(user.id).emoji.name === reaction.emoji.name)
		{
			this.collected.delete(user.id);
			this.users.delete(user.id);
			this.total--;
		} 	
		this.emit('collect', reaction, user);
	}
}

module.exports = PollCollector;