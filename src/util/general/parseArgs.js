const parsePositionalArgs = require(`${process.cwd()}/util/parsePositionalArgs.js`);
const parseTruthyArgs = require(`${process.cwd()}/util/parseTruthyArgs.js`);

//convenience method to merge parsePositionalArgs and parseTruthyArgs into one function
function parseArgs(args,keys,flags,options)
{
	if(typeof options === 'undefined') options = {};
	if(typeof args === 'string') args = args.split(' '); //this causes strings to be valid which is convenient
	if(options.truthy)
	{
		if(options.positional) throw new SyntaxError(`options 'positional' and 'truthy' are mutually exclusive`);
		return parseTruthyArgs(args,keys,flags,options);
	}
	//default is positional, the check for both of them is just to avoid the appearance of unexpected behavior
	return parsePositionalArgs(args,keys,flags,options);
}