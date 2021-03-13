class TwemojiError extends Error
{
	// new TwemojiError([input[, unicode[, expected_link[, message[, fileName[, lineNumber]]]]]])
	constructor(input = null, unicode = null, expected_link = null, ...params)
	{
		super(...params);
		// Maintain proper stack trace in V8
		if (Error.captureStackTrace)
		{
			Error.captureStackTrace(this, TwemojiError);
		}
		this.name = "TwemojiError";
		// TwemojiError information
		this.input = input;
		this.unicode = unicode;
		this.expected_link = expected_link;
	}
}

module.exports = TwemojiError;
