function resolveMention(string, pattern)
{
	if(!(pattern instanceof RegExp)) throw new TypeError('pattern must be a regular expression');
	if(!string) return null;
	return pattern.test(string) ? pattern.exec(string)[1] : string;
}

module.exports = resolveMention;