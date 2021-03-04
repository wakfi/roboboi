const Scraper = require(`scraper-node`);
const recordFile = require(`${process.cwd()}/util/general/recordFile.js`);
const {MessageAttachment} = require(`${process.cwd()}/util/discord/structs.js`);
const scraperConfigPath = `${process.cwd()}/util/components/scraperConfig.json`;
var scraperConfig = require(scraperConfigPath);
const pollRate = `15m`;

function initScrapers(client)
{
	Object.entries(scraperConfig).forEach(entry =>
	{
		const [url, channelID] = entry;
		const scraper = new Scraper(url, pollRate);
		client.scrapers.set(url, scraper);
		
		scraper.on('error', e => console.error(e.stack));
		
		scraper.on('scrape', async response =>
		{
			if(response.status === 200)
			{
				if(response.headers.get('content-type') === 'application/pdf')
				{
					const channel = await client.channels.fetch(channelID);
					const attachment = new MessageAttachment(response.url);
					let messageText = null;
					if(response.url.includes('bowers'))
					{
						const itemType = ((name) => {
							switch(name)
							{
								case 'lect': return 'lecture';
								case 'hw': return 'homework';
								default: return 'document';
							}
						})(response.url.split('/').pop().split('-')[0]);
						messageText = `A new ${itemType} is available for this course`;
					} else {
						messageText = `A new document is available for this course`;
					}
					await channel.send([messageText, `\n<`, response.url, `>`].join(''), attachment);
					try 
					{
						const targetURL = new URL(response.url);
						const pathnameComponents = targetURL.pathname.split('.pdf')[0].split('/');
						const fileNameComponents = pathnameComponents.pop().split('-');
						let fileNum = Number(fileNameComponents[1]);
						fileNum++;
						fileNameComponents[1] = fileNum.toString();
						const filename = `${fileNameComponents.join('-')}.pdf`;
						pathnameComponents.push(filename);
						targetURL.pathname = pathnameComponents.join('/');
						scraper.setURL(targetURL.href);
						delete scraperConfig[response.url];
						scraperConfig[scraper.url] = channelID;
						await recordFile(scraperConfig, scraperConfigPath);
						client.scrapers.delete(response.url);
						client.scrapers.set(scraper.url, scraper);
					} catch(e) {
						console.error(e.stack);
						scraper.stop();
					}
				}
			}
		});
		
	});
}

module.exports = initScrapers;
