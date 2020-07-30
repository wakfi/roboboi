module.exports = {
	name: 'kill',
	description: 'Emergency Kill switch to restart the bot and log an error',
	category: 'development',
	permLevel: 'Moderator',
	noArgs: true,
	async execute(message, args) {
		console.error(`KILL COMMAND EXECUTED HERE`); //leaves a clear message in the log to make the location easy to find,
		process.exit(1);							 //in the event i want to know where in the log this occurred. exits with error.
	}
};