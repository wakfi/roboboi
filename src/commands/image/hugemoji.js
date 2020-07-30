const got = require('got');
const rp = (query) => got(query, {resolveBodyOnly: true}); //originally use request-promise, now deprecated. This lambda is for backwards compatability
const emojiUnicode = require('emoji-unicode');
var svgToPng = require('svg-to-png');
var path = require('path');
var fs = require('fs-extra');

/* license for emojilib.json adapted from another source
The MIT License (MIT)

Copyright (c) 2014 Mu-An Chiou

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
const emojiMap = require(`${process.cwd()}/components/emojilib.json`);

module.exports = {
	name: 'hugemoji',
	description: 'create a real big version of an emoji',
	category: 'image',
	usage: ['<emoji>'],
	aliases: ['hugeemoji'],
	permLevel: 'User',
	args: true,
	async execute(message, args) {
		const messageElement = args[0];
		if(messageElement.includes(`>`) && messageElement.includes(`:`))
		{
			//emoji is a custom server emoji
			const discordEmojisUri = `https://cdn.discordapp.com/emojis/`;
			const splitEmoji = messageElement.split(`:`);
			const fileType = splitEmoji.shift() === `<a` ? `.gif` : `.png`; //animated or image
			const emojiName = splitEmoji.shift();
			const emojiSnowflake = splitEmoji.shift().split(`>`)[0];
			const emojiImageUrl = `${discordEmojisUri}${emojiSnowflake}${fileType}`;
			message.channel.send({files: 
				[{attachment: emojiImageUrl,
				name: `${emojiName}${fileType}`}]
			})
			.catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err.stack}`)});
		} else if(!messageElement.includes(`>`)) {
			//text is a string
			const twemojiDomain = `https://github.com/twitter/twemoji/blob/master/assets/svg/`;
			const emojiToVerify = messageElement;
			const emojiInUnicode = emojiUnicode(emojiToVerify).split(' ').join('-');
			const svgDomain = `${twemojiDomain}${emojiInUnicode}.svg`;
			let githubResponseA = null;
			try {
				//we need to verify that its an emoji
				githubResponseA = await rp(svgDomain);
			} catch(err) {
				//there are some emojis that have slight disconnections between their codepoints and their url, so try to fix
				try {
					const svgSecondDomain = `${twemojiDomain}${emojiInUnicode.slice(0,emojiInUnicode.lastIndexOf('-'))}.svg`;
					githubResponseA = await rp(svgSecondDomain);
				} catch(moreErr) {
					//the number/digit emojis have the 'fe0f' codepoint in the middle but their twemoji urls don't for some reason
					try {
						const svgThirdDomain = `${twemojiDomain}${emojiInUnicode.split('fe0f-').join('')}.svg`;
						githubResponseA = await rp(svgThirdDomain);
					} catch(stillErr) {
						//not an emoji. the conditional is checking if its throwing a real error or just 404 not found
						if(!JSON.stringify(e).includes(`Response code 404 (Not Found)`))
						{
							console.error(e.stack);
						}
					}
				}
			}
			//this is a syntax trick to quickly see if one of the attempts succeeded before continueing
			if(githubResponseA) 
			{
				//emoji is a unicode emoji 
				const githubResponseB = await rp(githubResponseA.split(`<iframe class="render-viewer " src="`)[1].split('"')[0]);
				//the order here is: get svg image from remote (save local), convert to png (save local), send png, delete local svg and png
				const emojiName = emojiMap[messageElement][0] || emojiInUnicode;
				const picFolder = `${process.cwd()}/file_dump`;
				await fs.ensureDir(picFolder).catch(e=>{return console.error(e.stack)});
				//data for vector image of emoji
				const emojiSvg = await rp(githubResponseB.split('data-image  = "')[1].split('"')[0]);
				await fs.outputFile(`${picFolder}/${emojiInUnicode}.svg`,emojiSvg);
				//convert from svg to png
				await svgToPng.convert(path.join(picFolder,`${emojiInUnicode}.svg`), picFolder, {defaultWidth:722,defaultHeight:722},{type:"image/png"});
				await message.channel.send({files: 
					[{attachment: `${picFolder}/${emojiInUnicode}.png`,
					name: `${emojiName}.png`}]
				}).catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err.stack}`)});
				//cleanup created files
				await fs.remove(`${picFolder}/${emojiInUnicode}.svg`)
				.catch(err => {
					console.error(err.stack)
				});
				await fs.remove(`${picFolder}/${emojiInUnicode}.png`)
				.catch(err => {
					console.error(err.stack)
				});
			}
		}
	}
};