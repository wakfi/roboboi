//adds timestamps to log outputs
var d = new Date();
function addTimestampLogs() 
{
	let origLogFunc = console.log;
	let origErrFunc = console.error;
	console.log = input =>
	{
		d = new Date();
		let ms = d.getMilliseconds();
		if(typeof input === 'string')
		{
			let inArr = input.split(`\n`);
			inArr.map(tex => {origLogFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${tex}`)});
		} else {
			origLogFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${input}`)
		}
	}
	console.error = input =>
	{
		d = new Date();
		let ms = d.getMilliseconds();
		if(typeof input === 'string')
		{
			let inArr = input.split(`\n`);
			inArr.map(tex => {origErrFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${tex}`)});
		} else {
			origErrFunc(`${d.toLocaleString('en-US',{year:'numeric',month:'numeric',day:'numeric'})} ${d.toLocaleTimeString(undefined,{hour12:false})}:${ms}${ms>99?'  ':ms>9?'   ':'    '}${input}`)
		}
	}
}

module.exports = addTimestampLogs;
