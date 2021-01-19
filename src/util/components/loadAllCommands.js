const fs = require('fs');
const assert = require('assert').strict;

function loadAllCommands(client, dirPath, filemask)
{
	let loadedCount = 0;
	return new Promise(async (resolve,reject) =>
	{
		if(typeof filemask === 'undefined') filemask = '.js';
		const commandFiles = fs.readdirSync(`${dirPath}`).filter(file => file.endsWith(filemask));
		const subDirs = fs.readdirSync(`${dirPath}`, {withFileTypes:true}).filter(subdir => subdir.isDirectory());
		for(const file of commandFiles) {
			const command = require(`${dirPath}/${file}`);
		assert(!client.commands.has(command.name), `The expression evaluated to a falsy value:

  assert(!client.commands.has(command.name))
  
for command.name of: ${command.name}
          from file: ${file}`);
			client.commands.set(command.name, command);
			loadedCount++;
		}
		for(const subdir of subDirs) {
			loadedCount += await loadAllCommands(client, `${dirPath}/${subdir.name}`, filemask);
		}
		resolve(loadedCount);
	});
}

module.exports = loadAllCommands;
