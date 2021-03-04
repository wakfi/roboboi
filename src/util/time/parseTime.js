const isTimeFormat = require(`${process.cwd()}/util/time/isTimeFormat.js`);

const numberRegDef = '(-?(?:\\d+|0b[01]+|0o[0-7]+|\\d+(?:\\.\\d+)?e-?\\d+|0x[\\dabcedf]+))';
const yearReg = new RegExp(numberRegDef+'y','i');
const weekReg = new RegExp(numberRegDef+'w','i');
const dayReg = new RegExp(numberRegDef+'d','i');
const hourReg = new RegExp(numberRegDef+'h','i');
const minReg = new RegExp(numberRegDef+'m(?!s)','i');
const secReg = new RegExp(numberRegDef+'s','i');
const msReg = new RegExp(numberRegDef+'ms','i');

/*
 parse time inputs with flexible syntax. accepts any mix of years, weeks, days, hours, minutes, seconds, milliseconds.
 does not accept months because how many days is a month anyways? why do you need that?
 
 1h 15m 30s 200ms
 1h
 15m
 30s
 200ms
 1h 30s
 15m 30s
*/
function parseTime(timeToParse)
{
	let timeValue = timeToParse;
	if(isNaN(timeToParse))
	{
		const timeString = timeToParse;
		if(!isTimeFormat(timeString))
		{
			throw new TypeError('must be in the format 1d 2h 3m 4s 5ms (any segment is optional, such as `1h 1m` is valid)');
		} else {
			let match = null;
			let years = 0;
			let weeks = 0;
			let days = 0;
			let hours = 0;
			let minutes = 0;
			let seconds = 0;
			let milliseconds = 0;
			match = yearReg.exec(timeString);
			if(match !== null)
			{
				years = Number(match[1]);
			}
			match = null;
			match = weekReg.exec(timeString);
			if(match !== null)
			{
				weeks = Number(match[1]);
			}
			match = null;
			match = dayReg.exec(timeString);
			if(match !== null)
			{
				days = Number(match[1]);
			}
			match = null;
			match = hourReg.exec(timeString);
			if(match !== null)
			{
				hours = Number(match[1]);
			}
			match = null;
			match = minReg.exec(timeString);
			if(match !== null)
			{
				minutes = Number(match[1]);
			}
			match = null;
			match = secReg.exec(timeString);
			if(match !== null)
			{
				seconds = Number(match[1]);
			}
			match = null;
			match = msReg.exec(timeString);
			if(match !== null)
			{
				milliseconds = Number(match[1]);
			}
			days += 365*years;
			days += 7*weeks;
			hours += 24*days;
			minutes += hours*60;
			seconds += minutes*60;
			milliseconds += seconds*1000;
			timeValue = milliseconds;
		}
	}
	return timeValue;
}

module.exports = parseTime;
