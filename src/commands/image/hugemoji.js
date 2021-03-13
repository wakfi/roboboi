const fetch = require('node-fetch');
// moving away from the rp-based algorithm
const rp = async (query) => await (await fetch(query)).text(); //originally used request-promise, now deprecated. This lambda is for backwards compatability
const emojiUnicode = require('emoji-unicode');
const svgToPng = require('svg-to-png');
const path = require('path');
const fs = require('fs-extra');
const TwemojiError = require(`${process.cwd()}/util/errors/TwemojiError.js`);
const emojiMap = require(`${process.cwd()}/util/components/emojimap.json`);
const svgLinks = require(`${process.cwd()}/util/components/svglinkmap.json`);
const urlSvgRegex = new RegExp(`https?://[a-zA-Z0-9._~:/?#\\[\\]@!$&'()*+,;=%-]+\\.svg`);
const discordEmojiUri = `https://cdn.discordapp.com/emojis/`;
const twemojiUri = `https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/`;

// hugify(message, vectorImage[, imageName[, vectorName]]);
const hugify = async (message,vectorImage,imageName,vectorName) =>
{
	//the order here is: get svg image (save local), remove size constraints if needed, convert to png (save local), send png, delete local svg and png
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
	aliases: ['hugeemoji','hugify','hugeify', 'hgfy', 'hmji'],
	permLevel: 'User',
	args: true,
	async execute(message, args) {
		const messageElement = args[0];
		if(urlSvgRegex.test(messageElement))
		{
			let svgResponse = null;
			try
			{
				svgResponse = await fetch(messageElement);
			} catch(e) {
				// ignore
			}
			if(svgResponse && svgResponse.status === 200)
			{
				const svgToHugify = await svgResponse.text();
				await hugify(message, svgToHugify);
			} else {
				message.channel.send(`I can't reach this address. Check that there are no typos and that the webpage is online and publicly accessible`);
			}
		} else if(messageElement.includes(`>`) && messageElement.includes(`:`)) {
			//emoji is a custom server emote
			const splitEmoji = messageElement.split(`:`);
			const fileType = splitEmoji.shift() === `<a` ? `.gif` : `.png`; //animated or image
			const emojiName = splitEmoji.shift();
			const emojiSnowflake = splitEmoji.shift().split(`>`)[0];
			const emojiImageUrl = `${discordEmojiUri}${emojiSnowflake}${fileType}`;
			message.channel.send({files: 
			                        [{attachment: emojiImageUrl,
			                          name: `${emojiName}${fileType}`}]
			})
			.catch(err=>{console.error(`Error sending a message:\n\t${typeof err==='string'?err.split('\n').join('\n\t'):err.stack}`)});
		} else if(!messageElement.includes(`>`)) {
			//text is a string
			const emojiToVerify = messageElement;
			const emojiInUnicode = emojiUnicode(emojiToVerify).split(' ').join('-');
			// svgLinks only contains a small set of links to twemoji svg files
			// all the emojis in it have links that are different than their codepoints
			const svgDomain = svgLinks[emojiToVerify] || `${twemojiUri}${emojiInUnicode}.svg`;
			//we need to verify that the messageElement is a unicode standard emoji and retrieve the vector image (svg)
			let githubResponse = await fetch(svgDomain);
			if(githubResponse.status !== 200)
			{
				if(githubResponse.status === 404)
				{
					// there are some emojis that have slight disconnections between their codepoints and their url, so try to fix
						// theres a significant number of emojis that have two codepoints: one is the emoji, and the second is fe0f; twemoji
						// often likes to drop the fe0f from these
						// the number/digit emojis have the 'fe0f' codepoint in the middle but their twemoji urls don't for some reason
					const modifiedSvgDomain = `${twemojiUri}${emojiInUnicode.split('-fe0f').join('')}.svg`;
					githubResponse = await rp(modifiedSvgDomain);
				}

				//not an emoji (or no resolution method implemented for issue). the conditional is checking if its throwing a real error or just 404 not found
				if(githubResponse.status !== 200)
				{
					const e = new TwemojiError(messageElement, emojiInUnicode, svgDomain, `in hugemoji, with ${messageElement} resolving to ${emojiInUnicode} (${svgDomain})`);
					console.error(e);
					return;
				}
			}

			//emoji is confirmed to be a unicode emoji and we have the svg data ready now 
			const emojiSvg = await githubResponse.text();
			const emojiName = emojiMap[messageElement] || emojiInUnicode;
			if(emojiName == emojiInUnicode)
			{
				console.log(`emoji missing name: ${messageElement}`);
			}
			//data for vector image of emoji
			await hugify(message, emojiSvg, emojiName, emojiInUnicode);
		}
	}
};
