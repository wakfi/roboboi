/*MIT License

Copyright (c) 2020 MrAugu

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

Derived from https://github.com/MrAugu/modmail-js/blob/83788e51610c4ba9371261f6d7f98d62b758963d/config.js
*/
const config = require('./config.json');

const permLevels = [
    { level: 0,
      name: "User",
      check: () => true
    },

	{ level: 2,
	  name: "MC",
	  check: () => {
		  try {
			  if (config.mc.includes(message.author.id) || config.mcRoles.find(roleID => message.member.roles.has(roleID))) {
				  return true;
			  } else {
				  return false;
			  }
		  } catch (e) {
			  return false;
		  }
	  }
	},

    { level: 5,
      name: "Moderator",
      check: (message) => {
        try {
          if (config.modRoles.find(roleID => message.member.roles.has(roleID)) || config.moderators.includes(message.author.id)) {
            return true;
          } else {
            return false;
          }
        } catch (e) {
          return false;
        }
      }
    },

	{ level: 8,
      name: "Bot Admin",
      check: (message) => {
		  try {
			  if (config.admins.includes(message.author.id) || config.adminRoles.find(roleID => message.member.roles.has(roleID))) {
				  return true;
			  } else {
				  return false;
			  }
		  } catch (e) {
			  return false;
		  }
	  }
    },

    { level: 9,
      name: "Server Owner",
      check: (message) => {
		try
		{
		  if(message.author.id == message.guild.ownerID)
		  {
			return true;
		  } else {
			return false;
		  }
		} catch (e) {
		  return false;
		}
	  }
    },

	{ level: 10,
      name: "Bot Developer",
      check: (message) => config.developers.includes(message.author.id)
    },

    { level: 11,
      name: "Bot Owner",
      check: (message) => config.owner == message.author.id
    }
  ];

module.exports = permLevels;
