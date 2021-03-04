const nf = require('node-fetch');
const rp = async (query) => await (await nf(query)).text(); //originally used request-promise, now deprecated. This lambda is for backwards compatability
const emojiUnicode = require('emoji-unicode');
const svgToPng = require('svg-to-png');
const path = require('path');
const fs = require('fs-extra');
const urlSvgRegex = new RegExp("https?://[a-zA-Z0-9._~:/?#\\[\\]@!$&'()*+,;=%-]+\\.svg");
const notFound404Regex = /<img alt="404/;

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
const emojiMap = require(`${process.cwd()}/util/components/emojilib.json`);

const hugify = async (message,vectorImage,imageName,vectorName) =>
{
	if(/width|height/.test(vectorImage))
	{
		vectorImage = /(<svg.*width=")\d+(" height=")\d+(".*<\/svg>)/s.exec(vectorImage).slice(1).join('722');
	}
	if(imageName === undefined) imageName = 'image';
	if(vectorName === undefined) vectorName = imageName;
	const picPath = path.normalize(`${process.cwd()}/../file_dump/${vectorName}`);
	await fs.outputFile(`${picPath}.svg`,vectorImage);
	try {
		//convert from svg to png
		await svgToPng.convert(`${picPath}.svg`,path.normalize(`${process.cwd()}/../file_dump`),{defaultWidth:722,defaultHeight:722},{type:"image/png"});
		await message.channel.send({files: 
			[{attachment: `${picPath}.png`,
			name: `${imageName}.png`}]
		}).catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err}`)});
		//cleanup created png
		await fs.remove(`${picPath}.png`)
		.catch(err => {
			console.error(err)
		});
	} catch(e) {
		console.error(e.stack);
	}
	//delete svg regardless of png success
	await fs.remove(`${picPath}.svg`)
	.catch(err => {
		console.error(err)
	});
};

module.exports = {
	name: 'hugemoji',
	description: 'create a real big version of an emoji',
	category: 'image',
	usage: ['<emoji>'],
	aliases: ['hugeemoji','hugify','hugeify'],
	permLevel: 'User',
	args: true,
	async execute(message, args) {
		const messageElement = args[0];
		if(urlSvgRegex.test(messageElement))
		{
			const svgToHugify = await rp(messageElement);
			await hugify(message, svgToHugify);
		} else if(messageElement.includes(`>`) && messageElement.includes(`:`)) {
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
				if(notFound404Regex.test(githubResponseA))
				{
					throw new Exception();
				}
			} catch(err) {
				//there are some emojis that have slight disconnections between their codepoints and their url, so try to fix
				try {
					const svgSecondDomain = `${twemojiDomain}${emojiInUnicode.slice(0,emojiInUnicode.lastIndexOf('-'))}.svg`;
					githubResponseA = await rp(svgSecondDomain);
					if(notFound404Regex.test(githubResponseA))
					{
						throw new Exception();
					}
				} catch(moreErr) {
					//the number/digit emojis have the 'fe0f' codepoint in the middle but their twemoji urls don't for some reason
					try {
						const svgThirdDomain = `${twemojiDomain}${emojiInUnicode.split('fe0f-').join('')}.svg`;
						githubResponseA = await rp(svgThirdDomain);
						if(notFound404Regex.test(githubResponseA))
						{
							throw new Exception();
						}
					} catch(stillErr) {
						//not an emoji. the conditional is checking if its throwing a real error or just 404 not found
						if(!JSON.stringify(e).includes(`Response code 404 (Not Found)`))
						{
							console.error(e.stack);
						}
					}
				}
			}
			//check if one of the attempts succeeded before continueing
			if(githubResponseA) 
			{
				//confirmed emoji is a unicode emoji 
				const githubResponseB = await rp(githubResponseA.split(`<iframe class="render-viewer " src="`)[1].split('"')[0]);
				//the order here is: get svg image from remote (save local), convert to png (save local), send png, delete local svg and png
				const emojiName = emojiMap[messageElement] || emojiInUnicode;
				if(emojiName == emojiInUnicode)
				{
					console.log(`emoji missing name: ${messageElement}`);
				}
				//data for vector image of emoji
				const emojiSvg = await rp(githubResponseB.split('data-image  = "')[1].split('"')[0]);
				await hugify(message, emojiSvg, emojiName, emojiInUnicode);
			}
		}
	}
};
