var WebTracker = WebTracker || {};
WebTracker.logger = new function () {
	lines = [];
	this.log = function (x) {
		lines.push(x);
	}; //this.log
	this.getLog = function (sep) {
		sep = sep || "\n"
		return lines.join(sep);
	}; //getLog
}; //logger