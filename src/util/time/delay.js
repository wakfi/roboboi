const parseTime = require(`${process.cwd()}/util/time/parseTime.js`);

/*

 create a timed delay promise
 
 */
function delay(timeToDelay)
{
	return new Promise(async (resolve,reject)=>
	{
		const timeInMilliseconds = parseTime(timeToDelay);
		if(isNaN(timeInMilliseconds)) reject();
		setTimeout(async function(){
			resolve(true);
		}, timeInMilliseconds);
	});
}

module.exports = delay;
