const dashflagRegex = /(?<=\s|^)-[a-zA-Z]+(?=\s|$)/;
const dashflag = '-';

function parsePositionalArgs(args,keys,flags,options) 
{
	if(typeof options === 'undefined') options = {};
	let flagPrefix = options.flagPrefix || dashflag;
	let flagRegex = options.flagRegex || (options.flagMatching ? new RegExp(`(?<=\\s|^)${flagPrefix}${options.flagMatching}(?=\\s|$)`,`gi`) : dashflagRegex);
	const singlePosition = options.singlePosition || false;
	if(!(flagRegex instanceof RegExp)) throw new TypeError(`flagRegex must be a Regular Expression`);
	if(keys.length != flags.length) throw new RangeError(`must have same number of keys and flags`);
	const originalFlags = flags;
	if(!options.disableAutoPrefix) flags = originalFlags.map(flag => flag = flagPrefix + flag);
	const obj = {};
	for(let i = 0; i < keys.length; i++)
	{
		const flag = flags[i];
		if(args.includes(flag))
		{
			const key = keys[i];
			const indexKey = args.indexOf(flag);
			const nextFlagIndex = singlePosition ? 1 : args.slice(indexKey+1).findIndex(arg => flagRegex.test(arg));
			const val = args.splice(indexKey+1, nextFlagIndex==-1 ? args.length : nextFlagIndex).join(' ');
			Object.defineProperty(obj, key, {value: val, writable: false, enumerable: true, configurable: true});
			args.splice(indexKey,1);
		}
	}
	Object.defineProperty(obj, 'args', {value: args, writable: false, enumerable: true, configurable: true});
	return obj;
}

module.exports = parsePositionalArgs;