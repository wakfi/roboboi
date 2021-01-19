function firstLetterCapital(string)
{
	const adjustedString = string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
	return adjustedString;
}

module.exports = firstLetterCapital;
