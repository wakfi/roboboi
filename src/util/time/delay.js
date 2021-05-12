const parseTime = require(`${process.cwd()}/util/time/parseTime.js`);

//create a promise that resolves after the specified amount of time
function delay(timeToDelay, callback)
{
	return new Promise(async (resolve,reject) =>
	{
		const timeInMilliseconds = parseTime(timeToDelay);
		if(isNaN(timeInMilliseconds)) return void reject(new Error('timeInMilliseconds could not be parsed to a number'), timeInMilliseconds);
		if(callback !== undefined && !(callback instanceof Function)) {console.error(`delay(): callback must be a function (non-fatal)`); console.error((new Error()).stack); callback = undefined}
		setTimeout(async function()
		{
			resolve(new Promise(async (resolve,reject) =>
			{
				try {
					if(callback !== undefined) resolve(await callback());
					else resolve(true);
				} catch(...e) {reject(...e)}
			}));
		}, timeInMilliseconds);
	});
}

module.exports = delay;
