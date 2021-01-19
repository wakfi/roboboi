const isTimeFormat = require(`${process.cwd()}/util/time/isTimeFormat.js`);
const replaceLast = require(`${process.cwd()}/util/general/replaceLast.js`);
const unitSizes = {'l':0,'y':7,'w':6,'d':5,'h':4,'m':3,'s':2,'ms':1};

function printTimePretty(readableTime, smallestUnit)
{
	const yearReg = /(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))y/gi;
	const weekReg = /(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))w/gi;
	const dayReg = /(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))d/gi;
	const hourReg = /(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))h/gi;
	const minReg = /(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))m(?!s)/gi;
	const secReg = /(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))s/gi;
	const msReg = /(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))ms/gi;
	if(!isTimeFormat(readableTime)) throw new SyntaxError(`invalid readableTime: ${readableTime}`);
	let unit = 0;
	let smUnit = '';
	if(typeof smallestUnit !== 'undefined')
	{
		smUnit = smallestUnit.charAt(0).toLowerCase();
		if(smUnit === 'm' && (smallestUnit.toLowerCase() === 'ms' || smallestUnit.toLowerCase() === 'milliseconds')) smUnit = 'ms';
		unit = unitSizes[smUnit];
	}
	let match = null;
	let allMatches = [];
	match = yearReg.exec(readableTime);
	if(match !== null)
	{
		allMatches.push(`${Number(match[1])} ${Number(match[1])>1?'years':'year'}`);
		if(smUnit === 'l') unit = 8;
	}
	match = null;
	match = weekReg.exec(readableTime);
	if(match !== null && unit <= unitSizes['w'])
	{
		allMatches.push(`${Number(match[1])} ${Number(match[1])>1?'weeks':'week'}`);
		if(smUnit === 'l') unit = 8;
	}
	match = null;
	match = dayReg.exec(readableTime);
	if(match !== null && unit <= unitSizes['d'])
	{
		allMatches.push(`${Number(match[1])} ${Number(match[1])>1?'days':'day'}`);
		if(smUnit === 'l') unit = 8;
	}
	match = null;
	match = hourReg.exec(readableTime);
	if(match !== null && unit <= unitSizes['h'])
	{
		allMatches.push(`${Number(match[1])} ${Number(match[1])>1?'hours':'hour'}`);
		if(smUnit === 'l') unit = 8;
	}
	match = null;
	match = minReg.exec(readableTime);
	if(match !== null && unit <= unitSizes['m'])
	{
		allMatches.push(`${Number(match[1])} ${Number(match[1])>1?'minutes':'minute'}`);
		if(smUnit === 'l') unit = 8;
	}
	match = null;
	match = secReg.exec(readableTime);
	if(match !== null && unit <= unitSizes['s'])
	{
		allMatches.push(`${Number(match[1])} ${Number(match[1])>1?'seconds':'second'}`);
		if(smUnit === 'l') unit = 8;
	}
	match = null;
	match = msReg.exec(readableTime);
	if(match !== null && unit <= unitSizes['ms'])
	{
		allMatches.push(`${Number(match[1])} ${Number(match[1])>1?'milliseconds':'millisecond'}`);
		if(smUnit === 'l') unit = 8;
	}
	let prettyTime = allMatches.join(', ');
	if(/,/.test(prettyTime))
	{
		if((prettyTime.match(/,/g) || []).length > 1)
		{
			upreadableTime = replaceLast(prettyTime, ',', ', and')
		} else {
			upreadableTime = replaceLast(prettyTime, ',', ' and')
		}
	}
	return prettyTime;
}

module.exports = printTimePretty;
