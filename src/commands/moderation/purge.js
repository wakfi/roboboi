const cleanReply = require(`${process.cwd()}/util/cleanReply.js`);

module.exports = {
	name: 'purge',
	description: 'Bulk deletes a specific amount of recent messages',
	category: 'moderation',
	usage: ['<number of messages>', 'count | <number of messages>', 'from | <messageID>', 'between | <olderMessageID> | <newerMessageID>'],
	aliases: null,
	permLevel: 'Moderator',
	guildOnly: true,
	dmOnly: false,
	args: true,
	async execute(message, args) {
		// This command removes all messages from all users in the channel, up to 100
		const manager = message.channel.messages;
		const lastAccessibleMessageID = (await manager.fetch({limit: 1, before: message.channel.lastMessageID})).first().id;
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
				if(!manager.resolveID(startID))
				{
					return cleanReply(message, `must provide a valid message ID`);
				}
				const afterResult = await manager.fetch({limit: 1, before: startID});
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
					await execute(message, args);
					return;
				} else {
					if(!manager.resolveID(startID) || !manager.resolveID(endID))
					{
						return cleanReply(message, `please provide valid message IDs`);
					}
					const afterResult = await manager.fetch({limit: 1, before: startID});
					const beforeResult = await manager.fetch({limit: 1, after: endID});
					afterID = (afterResult.size == 1) ? afterResult.first().id : startID;
					const beforeID = (beforeResult.size == 1) ? beforeResult.first().id : endID;
					
					const afterMessages = await manager.fetch({limit: 100, after: afterID});
					const beforeMessages = await manager.fetch({limit: 100, before: beforeID});

					const intersectionMessages = afterMessages.filter(msg => beforeMessages.has(msg.id));
					deleteCount = intersectionMessages.size;
					
					fetchOptions = {limit: deleteCount, after: afterID};
				}
			} else if(keyword === "count") {
				// get the delete limit, as an actual number.
				deleteCount = parseInt(pipedArgs.shift(), 10) + 1;
				
				fetchOptions = {limit: deleteCount};
			} else {
				return cleanReply(message, `unknown purge command: ${keyword}`);
			}
		}
		
		if(isNaN(deleteCount))
		{
			return cleanReply(message, `number of messages to delete must be a number`);
		}
		
		// combined conditions <3 user must input between 2-99
		if(!deleteCount || deleteCount < 3 || deleteCount > 100)
		{
			return cleanReply(message, `please provide a number between 2 and 99 (inclusive) for the number of messages to delete`);
		}
		
		// So we get our messages, and delete them. Simple enough, right?
		const fetched = await manager.fetch(fetchOptions);
		
		if(!fetched.has(endID) || startID && !fetched.has(startID))
		{
			const errText = keyword === "from" ? `message ID must be within 99 messages of the most recent message` :
												 `the older message provided must be within 99 messages of the newer message`;
			return cleanReply(message, errText);
		}
		
		message.channel.bulkDelete(fetched)
		.catch(async e => 
		{
			console.error(e.stack);
			cleanReply(message, `couldn't delete messages because of: ${e}`);
		});
	}
};