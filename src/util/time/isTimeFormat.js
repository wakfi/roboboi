function isTimeFormat(input)
{
	if(!/(?<=\d)[ywdhms]|(?<=m)s?/gi.test(input)) return false;
	if(/[^ywdhms\dxbeoacf.-]/gi.test(input)) return false;
	let regStrings = ['^'];
	if(/(?:(?<=^)(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))y(?=[\d-]|$))/gi.test(input)) regStrings.push('(?:(?<=^)(-?(?:\\d*|0b[01]+|0o[0-7]+|\\d+(?:\\.\\d+)?e-?\\d+|0x[\\dabcedf]+))y(?=[\\d-]|$))');
	if(/(?:(?<=^|[y])(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))w(?=[\d-]|$))/gi.test(input)) regStrings.push('(?:(?<=^|[y])(-?(?:\\d*|0b[01]+|0o[0-7]+|\\d+(?:\\.\\d+)?e-?\\d+|0x[\\dabcedf]+))w(?=[\\d-]|$))');
	if(/(?:(?<=^|[yw])(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))d(?=[\d-]|$))/gi.test(input)) regStrings.push('(?:(?<=^|[yw])(-?(?:\\d*|0b[01]+|0o[0-7]+|\\d+(?:\\.\\d+)?e-?\\d+|0x[\\dabcedf]+))d(?=[\\d-]|$))');
	if(/(?:(?<=^|[ywd])(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))h(?=[\d-]|$))/gi.test(input)) regStrings.push('(?:(?<=^|[ywd])(-?(?:\\d*|0b[01]+|0o[0-7]+|\\d+(?:\\.\\d+)?e-?\\d+|0x[\\dabcedf]+))h(?=[\\d-]|$))');
	if(/(?:(?<=^|[ywdh])(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))m(?=[\d-]|$))/gi.test(input)) regStrings.push('(?:(?<=^|[ywdh])(-?(?:\\d*|0b[01]+|0o[0-7]+|\\d+(?:\\.\\d+)?e-?\\d+|0x[\\dabcedf]+))m(?=[\\d-]|$))');
	if(/(?:(?<=^|[ywdhm])(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))s(?=[\d-]|$))/gi.test(input)) regStrings.push('(?:(?<=^|[ywdhm])(-?(?:\\d*|0b[01]+|0o[0-7]+|\\d+(?:\\.\\d+)?e-?\\d+|0x[\\dabcedf]+))s(?=[\\d-]|$))');
	if(/(?:(?<=^|[ywdhms])(-?(?:\d+|0b[01]+|0o[0-7]+|\d+(?:\.\d+)?e-?\d+|0x[\dabcedf]+))ms(?=$))/gi.test(input)) regStrings.push('(?:(?<=^|[ywdhms])(-?(?:\\d*|0b[01]+|0o[0-7]+|\\d+(?:\\.\\d+)?e-?\\d+|0x[\\dabcedf]+))ms(?=$))');
	if(regStrings.length == 1) return false;
	regStrings.push('$');
	const pattern = new RegExp(regStrings.join(''), 'gi');
	return pattern.test(input);
}

module.exports = isTimeFormat;
