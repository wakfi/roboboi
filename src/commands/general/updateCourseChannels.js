const configPath = `${process.cwd()}/util/components/course.json`;
const config = require(configPath);
const fs = require("fs/promises");

/** @typedef {{"allCourses": Object.<number, string>, "coursesBeingOffered":  Object.<number, string>, "term": string}} AttachmentJSON */
/** @typedef {"mainline" |  "elective" | "special" | "graduate"} CourseCategory */
/** @typedef {{channel: string, position: number}[]} ChannelPositions */

const courseMappingPath = `${process.cwd()}/util/components/courseMapping.json`;
const courseMapping = require(courseMappingPath);
const mainlineCourses = config.mainlineCourses;

/**
 * Saves the course mapping to the file
 */
async function saveCourseMapping() {
  await fs.writeFile(courseMappingPath, JSON.stringify(courseMapping, null, 2));
}

async function saveConfig() {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * Validates whether the attachment is a valid AttachmentJSON object
 *
 * @param {AttachmentJSON} attachment
 *
 * @throws {Error} If the attachment is not a valid AttachmentJSON object
 */
function validateAttachment(attachment) {
  if (typeof attachment.term !== "string") {
    throw new Error("Attachment is missing the 'term' property");
  }

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
 * Normalizes a course name. This is basically what the channel name will get converted to since
 * discord channel names can't have certain characters.
 *
 * @param {string} courseName The course name to normalize
 * @returns {string} The normalized course name
 */
function normalizeCourseName(courseName) {
  return courseName
    .toLowerCase()
    .replace(/[ /&]/g, "-")
    .replace(/[^a-zA-Z0-9\-]/g, "");
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
    return normalizeCourseName(courseName);
  }

  return courseNumber.toLowerCase();
}

/**
 * Gets the course ID from a channel name
 *
 * @param {*} channelName The name of the channel
 *
 * @returns {string} The course ID
 */
function getCourseIdFromChannel(channel) {
  if (channel.id in courseMapping) {
    return courseMapping[channel.id].id;
  }

  throw new Error(
    `Channel ${channel.name} does not have a corresponding course ID`
  );
}

/**
 * Gets the channel name from a course ID
 *
 * @param {string} courseId The course ID
 *
 * @returns {string} The channel name
 */
function getChannelName(courseId, courseName, category) {
  if (category === "special") {
    return normalizeCourseName(courseName);
  }

  return `cpsc-${courseId}`;
}

/**
 * Categorizes a course into one of the following categories:
 * - mainline
 * - graduate
 * - special
 * - elective
 *
 * @param {string} courseNumber The course number
 * @param {string} courseName The course name
 * @returns
 */
function categorizeCourse(courseNumber, courseName) {
  if (mainlineCourses.includes(courseNumber)) {
    return "mainline";
  } else if (parseInt(courseNumber) >= 500) {
    return "graduate";
  } else if (
    courseName.includes("Special Topics") ||
    courseName.includes("Advanced Topics")
  ) {
    return "special";
  } else {
    return "elective";
  }
}

/**
 * @param {string} courseId The course Id
 * @param {string} courseName The course name
 * @param {string} syntax The syntax to use for the channel name. For example, `cpsc-{{number}}-{{name}}`
 * would be transformedto `cpsc-121-introduction-to-computer-science`.
 * @param {CourseCategory} category The category of the course
 * @param {string} courseNumber The course number
 *
 * @returns {string} The channel name
 */
function getChannelNameFromSyntax(courseId, courseName, syntax, category, courseNumber = undefined) {
  if (!syntax) {
    return getChannelName(courseId, courseName, category);
  }

  const normalizedCourseName = normalizeCourseName(courseName);

  return syntax
    .replaceAll("{{number}}", courseNumber)
    .replaceAll("{{name}}", normalizedCourseName);
}

async function parseAttachment(message) {
  // Get the file attached to the message
  const attachmentURL = message.attachments.first()?.attachment;

  if (!attachmentURL) {
    // The user didn't attach a file, so tell them what file the command expects
    throw new Error(
      "Attachment not found! To use this command:\n" +
        "1. Log in to Zagweb\n" +
        "2. Go to https://xe.gonzaga.edu/StudentRegistrationSsb/ssb/term/termSelection?mode=search\n" +
        "3. Run the following JavaScript in the console: https://raw.githubusercontent.com/soitchu/zagweb-registration-api/refs/heads/main/dist/index.js. After the script runs successfully, it will download a file called `result.json`\n" +
        "4. Run this command again, but attach the downloaded `result.json` file"
    );
  }

  /** @type {AttachmentJSON} */
  let attachment;

  try {
    attachment = await (await fetch(attachmentURL)).json();
  } catch (e) {
    throw new Error(`Error fetching attachment: ${e.message})`);
  }

  // Validate the attachment
  validateAttachment(attachment);

  return attachment;
}

async function rearrange(message, nameSyntax, channelCategories) {
  const attachment = await parseAttachment(message);
  const { coursesBeingOffered, allCourses, term } = attachment;

  // Add courses to their respective categories
  for (const courseNumber in coursesBeingOffered) {
    const category = categorizeCourse(courseNumber, allCourses[courseNumber]);
    channelCategories[category].courses.push(courseNumber);
  }

  // Set of course IDs that are being offered
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
  // Stores the channel positions in the category
  const channelPositions = [];

  // Action rearrange onwards
  for (const category in channelCategories) {
    // Stores whether a channel already exists for a course number
    const existingChannelIds = new Set();
    const { offeredChannel, notOfferedChannel, courses } =
      channelCategories[category];

    // Rearrage and add channels
    // We can have three cases:
    // Case 1: The course channel is in the offered channel, but the course is not being offered
    for (const channel of offeredChannel.children.values()) {
      // Get the course ID from the channel name
      const courseId = getCourseIdFromChannel(channel);

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
      const courseId = getCourseIdFromChannel(channel);

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
      const courseName = coursesBeingOffered[courseNumber];
      const channelName = getChannelNameFromSyntax(
        courseId,
        courseName,
        nameSyntax,
        category,
        courseNumber
      );
      const channel = await message.guild.channels.create(channelName, {
        parent: offeredChannel.id,
      });

      // Add the course to the course mapping
      courseMapping[channel.id] = {
        id: courseId,
        number: courseNumber,
        name: courseName,
      };

      await channel.setTopic(courseName);
    }

    // Sort the channels lexicographically. This also works for non-special courses since
    // all the course numbers are 3 digits.
    const offeredChannelChildrenSorted = [
      ...offeredChannel.children.values(),
    ].sort((a, b) => {
      if(a.name === b.name) return 0;
      return a.name > b.name ? 1 : -1;
    });

    const notOfferedChannelChildrenSorted = [
      ...notOfferedChannel.children.values(),
    ].sort((a, b) => {
      if(a.name === b.name) return 0;
      return a.name > b.name ? 1 : -1;
    });

    for (let i = 0; i < offeredChannelChildrenSorted.length; i++) {
      const channel = offeredChannelChildrenSorted[i];

      await channel.send(`***Start of ${term}***`);

      channelPositions.push({
        channel: channel.id,
        position: i,
      });
    }

    for (let i = 0; i < notOfferedChannelChildrenSorted.length; i++) {
      const channel = notOfferedChannelChildrenSorted[i];

      channelPositions.push({
        channel: channel.id,
        position: i,
      });
    }
  }

  await saveCourseMapping();
  await message.guild.setChannelPositions(channelPositions);
}

async function rename(message, nameSyntax, channelCategories) {
  for (const category in channelCategories) {
    const { offeredChannel, notOfferedChannel } = channelCategories[category];
    const allChannels = [
      ...offeredChannel.children.values(),
      ...notOfferedChannel.children.values(),
    ];

    for (const channel of allChannels) {
      const channelId = channel.id;

      if (!(channelId in courseMapping)) continue;
      
      const {id, number, name} = courseMapping[channelId];

      await channel.setName(
        getChannelNameFromSyntax(id, name, nameSyntax, null, number)
      );
    }
  }
}

async function reset(channelCategories) {
  for (const category in channelCategories) {
    const { offeredChannel, notOfferedChannel } = channelCategories[category];
    for (const channel of offeredChannel.children.values()) {
      if (channel.type !== "text") continue;

      await channel.delete();
    }

    for (const channel of notOfferedChannel.children.values()) {
      if (channel.type !== "text") continue;

      await channel.delete();
    }
  }

  for (const key in courseMapping) {
    delete courseMapping[key];
  }

  await saveCourseMapping();
}

async function changeSyntax(args) {
  if (args.length !== 2) {
    throw new Error(
      "Invalid number of arguments. Expected only one argument: `changeSyntax <syntax>`\n" +
        "Example: `changeSyntax cpsc-{{number}}-{{name}}`\n" +
        "This will change the channel name to something like `cpsc-121-computer-science-i`. Run `!updateCourseChannels rename` to apply the changes."
    );
  }

  config.nameSyntax = args[1];
  return await saveConfig();
}

module.exports = {
  name: "updateCourseChannels",
  usage: ["<rearrange|rename|changeSyntax> [nameSyntax]"],
  aliases: ["ucc"],
  description:
    "Updates the course channels' names and position.\n" +
    "- The syntax of the channel name can be changed using the `changeSyntax` subcommand.\n" +
    "- The new syntax can be applied using the `rename` subcommand.\n" +
    "- The syntax can be any string with `{{number}}` and `{{name}}` as placeholders for the course number and name, respectively. For example, `cpsc-{{number}}-{{name}}` would be transformed to `cpsc-121-introduction-to-computer-science`.\n" +
    "- To rearrange the channels based on what course is being offered currently, use the `rearrange` subcommand.",
  category: "development",
  permLevel: "Moderator",
  noArgs: false,
  async execute(message, args) {
    // Let the user know that the command is running
    const action = args[0];
    const nameSyntax = config.nameSyntax;
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

    let waitingReaction = await message.react("⌛");
    try {
      switch (action) {
        case "rename":
          await rename(message, nameSyntax, channelCategories);
          break;
        case "changeSyntax":
          await changeSyntax(args);
          break;
        case "reset":
          await reset(channelCategories);
          break;
        case "rearrange":
          await rearrange(message, nameSyntax, channelCategories);
          break;
        default:
          throw new Error(
            "Invalid action. Expected one of `rename`, `rearrange`, or `changeSyntax`"
          );
      }

      await waitingReaction.remove();
      await message.react("✅");
    } catch (e) {
      await waitingReaction.remove();
      await message.react("❌");
      await message.reply(e.message);
    }
  },
};
