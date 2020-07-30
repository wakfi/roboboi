function padZeros(number, zeros) {
	zeros = zeros || 2;
	const padded = (Array.from({length:zeros}, ()=>'0')).join('');
	return padded.slice(-(number.length))+number;
}

module.exports = padZeros;