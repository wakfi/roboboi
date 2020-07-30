String.prototype.reverse = function() {
    return this.split('').reverse().join('');
};

function replaceLast(string, substring, replacement) {
    return string.reverse().replace(new RegExp(substring.reverse()), replacement.reverse()).reverse();
};

module.exports = replaceLast;