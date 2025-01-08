const configPath = `${process.cwd()}/util/components/config.json`;
const config = require(configPath);

/** @typedef {{"allCourses": Object.<number, string>, "coursesBeingOffered":  Object.<number, string>}} CourseJSON */
/** @typedef {"mainline" |  "elective" | "special" | "graduate"} CourseCategory */
/** @typedef {{channel: string, position: number}[]} ChannelPositions */

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

/**
 * Returns the channel ID for a course
 *
 * @param {string} courseNumber The course number. For example, CPSC 121's course number is 121. There are
 * some special cases where it isn't a number, such as CPSC 491L.
 * @param {string} courseName The name of the course. Only used when the category is "special". This is done because
 * special topics courses are not always consistent in their numbering.
 * @param {CourseCategory} category The category of the course. Either "mainline", "elective", "special", or "graduate".
 *
 * @returns {string} The channel ID for the course
 */
function getCourseIdFromCourseNumber(courseNumber, courseName, category) {
  if (category === "special") {
    courseName = courseName.toLowerCase();
    courseName = courseName.replaceAll("&amp;", "&");
    courseName = courseName.replaceAll(" ", "-");
    courseName = courseName.replace(/[^a-zA-Z0-9\-]/g, "");

    return courseName;
  }

  return courseNumber.toLowerCase();
}

/**
 * Gets the course ID from a channel name
 *
 * @param {string} channelName The name of the channel
 *
 * @returns {string} The course ID
 */
function getCourseIdFromChannelName(channelName) {
  return channelName.replace("cpsc-", "");
}

/**
 * Gets the channel name from a course ID
 *
 * @param {string} courseId The course ID
 *
 * @returns {string} The channel name
 */
function getChannelName(courseId, category) {
  if (category === "special") {
    return courseId;
  }

  return `cpsc-${courseId}`;
}

module.exports = {
  name: "updateCourseChannels",
  usage: ['<commandName>'],
	aliases: ['ucc'],
  description: "Updates the channels for the courses",
  category: "development",
  permLevel: "Moderator",
  noArgs: true,
  async execute(message) {
    // Get the file attached to the message
    const attachmentURL = message.attachments.first()?.attachment;

    if (!attachmentURL) {
      // The user didn't attach a file, so tell them what file the command expects
      return message.channel.send(
        `Attachment not found! To use this command:\n1. Go to https://xe.gonzaga.edu/StudentRegistrationSsb/ssb/term/termSelection?mode=search\n2. Log in\n3. Run the following JavaScript in the console: https://raw.githubusercontent.com/soitchu/zagweb-registration-api/refs/heads/main/dist/index.js`
      );
    }

    /** @type {CourseJSON} */
    const attachment = await (await fetch(attachmentURL)).json();

    // Validate the attachment
    try {
      validateAttachment(attachment);
    } catch (e) {
      return message.channel.send(e.message);
    }

    // Let the user know that the command is running
    const waitingReaction = await message.react('⌛');
    const { coursesBeingOffered, allCourses } = attachment;
    const mainlineCourses = config.mainlineCourses;
    const channelCategories = Object.fromEntries(
      ["mainline", "elective", "special", "graduate"].map((category) => [
        category,
        {
          offeredChannel: message.guild.channels.cache.get(
            config.courseCategories[category].offered
          ),
          notOfferedChannel: message.guild.channels.cache.get(
            config.courseCategories[category].notOffered
          ),
          courses: [],
        },
      ])
    );

    // Add courses to their respective categories
    for (const courseNumber in coursesBeingOffered) {
      if (mainlineCourses.includes(courseNumber)) {
        channelCategories.mainline.courses.push(courseNumber);
      } else if (parseInt(courseNumber) >= 500) {
        channelCategories.graduate.courses.push(courseNumber);
      } else if (
        allCourses[courseNumber].includes("Special Topics") ||
        allCourses[courseNumber].includes("Advanced Topics")
      ) {
        channelCategories.special.courses.push(courseNumber);
      } else {
        channelCategories.elective.courses.push(courseNumber);
      }
    }

    const offeredCourseIds = new Set();

    for (const category in channelCategories) {
      const { courses } = channelCategories[category];

      for (const courseNumber of courses) {
        offeredCourseIds.add(
          getCourseIdFromCourseNumber(
            courseNumber,
            coursesBeingOffered[courseNumber],
            category
          )
        );
      }
    }

    /** @type {ChannelPositions} */
    const channelPositions = [];

    for (const category in channelCategories) {
      // Stores whether a channel already exists for a course number
      const existingChannelIds = new Set();

      const { offeredChannel, notOfferedChannel, courses } =
        channelCategories[category];

      // We can have three cases:

      // Case 1: The course channel is in the offered channel, but the course is not being offered
      for (const channel of offeredChannel.children.values()) {
        // Get the course ID from the channel name
        const channelName = channel.name;
        const courseId = getCourseIdFromChannelName(channelName, category);

        if (!courseId) continue;

        if (!offeredCourseIds.has(courseId)) {
          // If it's not being offered, move it to the not offered channel
          await channel.setParent(notOfferedChannel.id);
        }

        // Update the set of existing channel names
        existingChannelIds.add(courseId);
      }

      // Case 2: The course channel is in the not offered channel, but the course is being offered
      for (const channel of notOfferedChannel.children.values()) {
        // Get the course ID from the channel name
        const channelName = channel.name;
        const courseId = getCourseIdFromChannelName(channelName, category);

        if (!courseId) continue;

        if (offeredCourseIds.has(courseId)) {
          // If it is being offered, move it to the offered channel
          await channel.setParent(offeredChannel.id);
        }

        // Update the set of existing channel names
        existingChannelIds.add(courseId);
      }

      // Case 3: The course isn't in either channels, but is being offered, so we need to create it
      for (const courseNumber of courses) {
        const courseId = getCourseIdFromCourseNumber(
          courseNumber,
          coursesBeingOffered[courseNumber],
          category
        );

        // Check that course is being offered
        if (!offeredCourseIds.has(courseId)) {
          continue;
        }

        // Check if the channel already exists
        if (existingChannelIds.has(courseId)) {
          continue;
        }

        // Create the channel
        const channelName = getChannelName(courseId, category);

        await message.guild.channels.create(channelName, {
          parent: offeredChannel.id,
        });
      }

      // Sort the channels lexicographically. This also works for non-special courses since
      // all the course numbers are 3 digits.
      const offeredChannelChildrenSorted = [
        ...offeredChannel.children.values(),
      ].sort((a, b) => {
        return a.name >= b.name ? 1 : -1;
      });

      const notOfferedChannelChildrenSorted = [
        ...notOfferedChannel.children.values(),
      ].sort((a, b) => {
        return a.name >= b.name ? 1 : -1;
      });

      for (let i = 0; i < offeredChannelChildrenSorted.length; i++) {
        const channel = offeredChannelChildrenSorted[i];

        channelPositions.push({
          channelName: channel.name,
          channel: channel.id,
          position: i,
        });
      }

      for (let i = 0; i < notOfferedChannelChildrenSorted.length; i++) {
        const channel = notOfferedChannelChildrenSorted[i];

        channelPositions.push({
          channelName: channel.name,
          channel: channel.id,
          position: i,
        });
      }
    }

    await message.guild.setChannelPositions(channelPositions);

    // Remove the waiting reaction and add a success reaction
    await waitingReaction.remove();
    await message.react("✅");
  },
};
