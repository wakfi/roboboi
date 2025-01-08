const result = require("./result.json");

/** @typedef {{"allCourses": Object.<number, string>, "coursesBeingOffered":  Object.<number, string>}} CourseJSON */

/**
 * Validates whether the attachment is a valid CourseJSON object
 *
 * @param {CourseJSON} attachment
 *
 * @throws {Error} If the attachment is not a valid CourseJSON object
 */
function validateAttachment(attachment) {
  const keys = ["allCourses", "coursesBeingOffered"];

  for (const key of keys) {
    const value = attachment[key];

    if (!value) {
      throw new Error(`Attachment is missing the '${key}' property`);
    }

    for (const courseNumber in value) {
      const courseName = value[courseNumber];

      if (isNaN(parseInt(courseNumber))) {
        throw new Error(
          `Key ${courseNumber} in '${key}' is not a valid number`
        );
      }

      if (typeof courseName !== "string") {
        throw new Error(`Value ${courseName} in '${key}' is not a string`);
      }
    }
  }
}

function getChannelId(courseNumber, courseName, category) {
  if (category === "special") {
    courseName = courseName.toLowerCase();
    courseName = courseName.replaceAll("&amp;", "&");
    courseName = courseName.replaceAll(" ", "-");
    courseName = courseName.replace(/[^a-zA-Z0-9\-]/g, "");
  
    return courseName;
  }

  return courseNumber.toLowerCase();
}

function getCourseIdFromChannelName(channelName) {
  return channelName.replace("cpsc-", "").toLowerCase();
}

function getChannelName(courseId, category) {
  if (category === "special") {
    return courseId;
  }

  return `cpsc-${courseId}`;
}

module.exports = {
  name: "updateChannels",
  description: "Emergency Kill switch to restart the bot and log an error",
  category: "development",
  permLevel: "Moderator",
  noArgs: true,
  async execute(message, args) {
    // // Get the file attached to the message
    // const attachmentURL = message.attachments.first()?.attachment;

    // if (!attachmentURL) {
    //   return message.channel.send(
    //     `Attachment not found! To use this command:\n1. Go to https://xe.gonzaga.edu/StudentRegistrationSsb/ssb/term/termSelection?mode=search\n2. Log in\n3. Run the following JavaScript in the console: https://raw.githubusercontent.com/soitchu/zagweb-registration-api/refs/heads/main/dist/index.js`
    //   );
    // }

    // /** @type {CourseJSON} */
    // const attachment = await (await fetch(attachmentURL)).json();
    /** @type {CourseJSON} */
    const attachment = result;

    // try {
    //   validateAttachment(attachment);
    // } catch (e) {
    //   return message.channel.send(e.message);
    // }

    const mainlineCourses = [
      "121",
      "122",
      "223",
      "224",
      "260",
      "321",
      "326",
      "346",
      "348",
      "351",
      "450",
      "491",
      "491L",
      "492L",
      "499",
    ];

    const categories = {
      mainline: {
        offeredChannel: message.guild.channels.cache.get("1326315549185282048"),
        notOfferedChannel: message.guild.channels.cache.get(
          "1326315602603933828"
        ),
        courses: [],
      },
      electives: {
        offeredChannel: message.guild.channels.cache.get("1326331554003423316"),
        notOfferedChannel: message.guild.channels.cache.get(
          "1326331623163297852"
        ),
        courses: [],
      },
      special: {
        offeredChannel: message.guild.channels.cache.get("1326335649661321248"),
        notOfferedChannel: message.guild.channels.cache.get(
          "1326335681466732544"
        ),
        courses: [],
      },
      graduate: {
        offeredChannel: message.guild.channels.cache.get("1326335712013975685"),
        notOfferedChannel: message.guild.channels.cache.get(
          "1326335739461500948"
        ),
        courses: [],
      },
    };

    for (const courseNumber in attachment.coursesBeingOffered) {
      if (mainlineCourses.includes(courseNumber)) {
        categories.mainline.courses.push(courseNumber);
      } else if (parseInt(courseNumber) >= 500) {
        categories.graduate.courses.push(courseNumber);
      } else if (
        attachment.allCourses[courseNumber].includes("Special Topics") ||
        attachment.allCourses[courseNumber].includes("Advanced Topics")
      ) {
        categories.special.courses.push(courseNumber);
      } else {
        categories.electives.courses.push(courseNumber);
      }
    }

    const offeredSpecialCourseIds = categories.special.courses.map(
      (courseNumber) =>
        getChannelId(
          courseNumber,
          attachment.coursesBeingOffered[courseNumber],
          "special"
        )
    );

    function isBeingOffered(courseNumber, category) {
      if (category === "special") {
        return offeredSpecialCourseIds.includes(courseNumber);
      }

      return courseNumber.toUpperCase() in attachment.coursesBeingOffered;
    }

    offeredSpecialCourseIds.sort();
    const channelPositions = [];

    for (const category in categories) {
      // // Reset
      // for (const [_, channel] of categories[category].offeredChannel.children) {
      //   if (channel.type !== "text") continue;

      //   await channel.delete();
      // }

      // for (const [_, channel] of categories[category].notOfferedChannel.children) {
      //   if (channel.type !== "text") continue;

      //   await channel.delete();
      // }

      const existingChannelNames = new Set();

      const { offeredChannel, notOfferedChannel, courses } =
        categories[category];

      courses.sort()

      for (const [_, channel] of offeredChannel.children) {
        if (channel.type !== "text") continue;

        const channelName = channel.name;
        const courseNumber = getCourseIdFromChannelName(
          channelName,
          category
        );

        if (!courseNumber) continue;

        if (!isBeingOffered(courseNumber, category)) {
          await channel.setParent(notOfferedChannel.id);
        }

        existingChannelNames.add(courseNumber);
      }

      for (const [_, channel] of notOfferedChannel.children) {
        if (channel.type !== "text") continue;

        const channelName = channel.name;
        const courseNumber = getCourseIdFromChannelName(
          channelName,
          category
        );

        if (!courseNumber) continue;

        if (isBeingOffered(courseNumber, category)) {
          await channel.setParent(offeredChannel.id);
        }

        existingChannelNames.add(courseNumber);
      }

      for (const courseNumber of courses) {
        const channelId = getChannelId(
          courseNumber,
          attachment.coursesBeingOffered[courseNumber],
          category
        );

        if (!isBeingOffered(channelId, category)) {
          continue;
        }

        if (existingChannelNames.has(channelId)) {
          continue;
        }

        const channelName = getChannelName(channelId, category);

        await message.guild.channels.create(channelName, {
          parent: offeredChannel.id,
        });
      }

      let position = 0;
      
      for(const channelNumber of courses)
      {
        const channelId = getChannelId(
          channelNumber,
          attachment.coursesBeingOffered[channelNumber],
          category
        );

        const channelName = getChannelName(channelId, category);

        const channelObject = message.guild.channels.cache.find(
          (channel) => channel.name === channelName
        );

        if (!channelObject) {
          console.log(`Channel ${channelName} not found`, channelId);
          continue;
        }

        if(category === "special") {
          channelPositions.push({
            channel: channelObject.id,
            position: offeredSpecialCourseIds.indexOf(channelId),
          });
        } else {
          channelPositions.push({
            channel: channelObject.id,
            position,
          });
        }


        position++
      }
    }

    await message.guild.setChannelPositions(channelPositions);
  },
};
