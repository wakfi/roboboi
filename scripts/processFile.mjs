import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const baseDir = resolve(__dirname, '..')

const sourceDir = 'static'
const destDir = 'generated'

const sourceFile = join(baseDir, sourceDir, 'roboboi_roles_emoji_mapping_primary_list_with_names.txt')
const filepath = (filename, ext = 'txt') =>  join(baseDir, destDir, `${filename}.generated.${ext}`)
const TO_CONSOLE = false

const ensureDir = (path) => mkdir(path, { recursive: true })
ensureDir(join(baseDir, destDir))

// TODO: CLI configurability
/**
 *
 * @param {(data: string) => Awaitable<string>} operation
 */
async function readAndProcessFile(operation, dest) {
	const sourceData = await readFile(sourceFile, 'utf8')
	/** @type {string} */
	const output = await operation(sourceData)
	// Abstract equality against null is a check for both null and undefined
	if (output == null) return
	// TODO: Use cli to control this
	if(TO_CONSOLE) {
		console.log(output)
	} else {
		await writeFile(filepath(dest), output.trimEnd() + '\n')
	}
}

/** @type {Promise<any>[]} */
const promises = []
/**
 *
 * @param  {Parameters<typeof readAndProcessFile>} args
 * @return {Promise<void>}
 */
const main = (...args) => {
	/**
	 * @type {Promise<void>}
	 */
	const p = readAndProcessFile.apply(globalThis, args)
	promises.push(p)
	// This needs to be outside the push, otherwise the promise inside the push is the one
	// returned by the .then that performs the pop which is not good
	p.then(_ =>
		// Doesn't matter which promise is popped, we are just using array length as a semaphore
		promises.pop()
	)
	return p
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

async function waitForAllDone() {
	if(!promises.length) {
		console.log('Nothing to do')
		return
	}
	console.log('Generating files')
	console.time('All done generating')
	while(promises.length) {
		await sleep(50)
	}
	console.timeEnd('All done generating')
}

/**
 * @param {string} list
 * @return {string}
 */
function stripCourseNames(list){
	const lines = list.split('\n')
	const modifiedLines = lines.map((line) => {
		const eol = line.indexOf(']},')
		if(eol === -1) return line
		return line.slice(0, eol + 3)
	})
	const modifiedList = modifiedLines.join('\n')
	return modifiedList
}


const selectionSet = new Set([
	121,
	122,
	222,
	260,
	325,
	326,
	331,
	334,
	341,
	348,
	349,
	353,
	425,
	431,
	435,
].map(n => 'c' + n))

/**
 * @param {string} list
 * @return {string}
 */
function selectCoursesFromList(list) {
	const lines = list.split('\n')
	const modifiedLines = lines.map((line) => {
		const eol = line.indexOf(']},')
		if(eol === -1) return undefined
		if(!selectionSet.has(line.slice(-4))) return undefined
		return line.slice(0, eol + 3)
	}).filter(x => !!x)
	const modifiedList = modifiedLines.join('\n')
	return modifiedList
}

/**
 * @param {string} list
 * @return {string}
 */
function convertToMessageText(list){
	/**
 	* @param {string[]} list
 	* @return {string[]}
 	*/
	const generateMessageText = (lines) => {
		const modifiedLines = lines.map((line) => {
			const eol = line.indexOf(']},')
			if(eol === -1) return line
			let sliced = line.slice(0, eol + 2).trim()
			let {role, emoji} = JSON.parse(sliced)
			return `${emoji} - <@&${role}>`
		})

		return modifiedLines
	}
	const lines = list.split('\n')
	const modifiedLines = generateMessageText(lines)

	// Also generate message text for the current courses
	modifiedLines.push('','')
	const currentCoursesList = selectCoursesFromList(list);
	const currentCoursesLines = currentCoursesList.split('\n')
	const modifiedCurrentCoursesLines = generateMessageText(currentCoursesLines)
	modifiedLines.push.apply(modifiedLines, modifiedCurrentCoursesLines)

	// Join lines back together and return
	const modifiedList = modifiedLines.join('\n')
	return modifiedList
}

/**
 * @param {string} list
 * @return {string}
 */
function convertToBasicListWithNames(list){
	const lines = list.split('\n')
	const modifiedLines = lines.map((line) => {
		// Find end of JSON, where the name starts
		const eol = line.indexOf(']},')
		if(eol === -1) return line
		// Find start of `addRoles` array
		const cutoff = line.indexOf(', "a')
		// We will slice around addRoles and removeRoles to omit them
		const basicLine = line.slice(0, cutoff) + line.slice(eol + 1)
		return basicLine
	})
	const modifiedList = modifiedLines.join('\n')
	return modifiedList
}

/**
 * Version without names
 * @param {string} list
 * @return {string}
 */
function convertToBasicList(list){
	const lines = list.split('\n')
	const modifiedLines = lines.map((line) => {
		// Find end of JSON, where the name starts
		const eol = line.indexOf(']},')
		if(eol === -1) return line
		// Find start of `addRoles` array
		const cutoff = line.indexOf(', "a')
		// We will slice around addRoles and removeRoles to omit them
		const basicLine = line.slice(0, cutoff) + '},'
		return basicLine
	})
	const modifiedList = modifiedLines.join('\n')
	return modifiedList
}


// `main` will read the source file into a string and pass it to the operation;
// the operation is expected to return a string, which `main` will then write to
// the destination file

// Strip names
main(stripCourseNames, 'roboboi_roles_emoji_mapping_primary_list')

// Select a specific set of course config lines
main(selectCoursesFromList, 'current_courses_roles')

// Generate role call message content
main(convertToMessageText, 'role_call_messages')

// Generate basic_roles emoji mapping with names
main(convertToBasicListWithNames, 'roboboi_roles_emoji_mapping_basic_list_with_names')

// Generate basic_roles emoji mapping without names
main(convertToBasicList, 'roboboi_roles_emoji_mapping_basic_list')


waitForAllDone()
