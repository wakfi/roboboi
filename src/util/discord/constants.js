const path = require('path');
const Constants = require((require.resolve('discord.js')).split(path.sep).slice(0, -1).join(path.sep) + `${path.sep}util${path.sep}Constants.js`);

module.exports = Constants;
