const fs = require('fs-extra');

//[helper function] save to a JSON file. returns as function to allow easy usage with schedulers
function recordFile(obj, path)
{
	return new Promise(async (resolve,reject) =>
	{
		//obj should be valid for JSON, here is an example
		//var obj = {'hotList': hotList, "res": res};
		const objJson = JSON.stringify(obj,function(k,v){
				if(v instanceof Array)
					return JSON.stringify(v);
				return v;
			},4).replace(/\\/g, '')
				.replace(/\"\[/g, '[')
				.replace(/\]\"/g,']')
				.replace(/\"\{/g, '{')
				.replace(/\}\"/g,'}');
		try{
			await fs.outputFile(path, objJson);
		} catch (e) {
			reject(e); // Error while writing file
			return;
		};
		resolve();
	});
}

module.exports = recordFile;
