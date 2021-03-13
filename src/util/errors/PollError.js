class PollError extends Error
{
	constructor(message)
	{
		super(message);
		this.name = "PollError";
	}
}

module.exports = PollError;
