/*

 milliseconds into a human readable string
 
*/
function millisecondsToString(milliseconds)
{
	if(isNaN(milliseconds))
	{
		throw new TypeError(`milliseconds must be a number`);
	}
	let timeString = ``;
	let days = 0;
	let hours = 0;
	let minutes = 0;
	let seconds = 0;
	seconds = Math.trunc(milliseconds/1000);
	minutes = Math.trunc(seconds/60);
	hours = Math.trunc(minutes/60);
	days = Math.trunc(hours/24);
	milliseconds = milliseconds % 1000;
	seconds = seconds % 60;
	minutes = minutes % 60;
	hours = hours % 24;
	if(days != 0)
	{
		timeString += `${days}d`
	}
	if(hours != 0)
	{
		timeString += `${hours}h`
	}
	if(minutes != 0)
	{
		timeString += `${minutes}m`
	}
	if(seconds != 0)
	{
		timeString += `${seconds}s`
	}
	if(milliseconds != 0)
	{
		timeString += `${milliseconds}ms`
	}
	return timeString;
}

module.exports = millisecondsToString;