var jscuster = jscuster || {};
jscuster.ButtonTable = function (boardID, width, height, callback) {
	'use strict';
	boardID = "#" + boardID;
	var btns = [],
		btnPtr = 0,

		getButtons = function () {
			for (var i = 0; i < width * height; i++) {
				btns[i] = $("#btn"+i);
			} //i
		}, //getButtons

	move = function (x) {
		btnPtr = x;
		btns[btnPtr].focus();
	},

	setFocusFromKeyboard = function (code) {
		switch (code) {
		case 37:
			if ((btnPtr % width) != 0) {
				move(btnPtr - 1);
			}
			break;
		case 38:
			if (btnPtr >= height) {
				move(btnPtr - height);
			}
			break;
		case 39:
			if ((btnPtr % width) < width - 1) {
				move(btnPtr + 1);
			}
			break;
		case 40:
			if ((btnPtr + height) < width * height) {
				move(btnPtr + height);
			}
			break;
		default:
			break;
		} //switch
	}, //func

	addClickHandler = function () {
		$(".boardButton").click(function () {
			callback(Number(this.id.slice(3)));
		}); //handler
	}, //addClickEvent

	buildTable = function () {
		var tbl = '<table id=\"boardTable\">',
			ctr = 0;
		for (var i = 0; i < height; i++) {
			tbl += "<tr>";
			for (var j = 0; j < width; j++) {
				tbl += "<td class = \"boardCell\">" +
"<input type=\"button\" class = \"boardButton\" id=\"btn" + ctr + "\">" +
"</td>";
ctr += 1;
			} //j
			tbl += "</tr>";
		} //i
		tbl += "</table>";
		$(boardID).html(tbl);
		getButtons();
		addClickHandler();
	}; //function

	this.setText = function (btn, txt) {
		btns[btn].prop('value', txt);
	}; //setText

	this.getText = function (btn) {
		return btns[btn].prop('value');
	}; //getText

	this.focus = function (x) {
		if (x) {
			move(x);
		} else {
			return btnPtr;
		} //if
	}; //focus

	this.buttonIndex = function(x, y) {
		return (y*height) + x;
	}; //buttonIndex

	this.getLines = function(x, y) {
		var lines = {},
			horizontal = [],
			vertical = [],
			diagDown = [],
			diagUp = [],
			tmp, tmpx, tmpy, ctr;
		//vertical
		for (var i = 0; i < height; i++) {
			vertical [i] = x + (height * i);
		} //for vertical
		lines.vertical = vertical;
		//horizontal
		tmp = y * height;
		for (var i = 0; i < width; i++) {
			horizontal[i] = i + tmp;
		} //for horizontal
		lines.horizontal = horizontal;
		//diagDown
		//find topleft point
		tmpx = x;
		tmpy = y;
		while (tmpx && tmpy) {
			tmpx--;
			tmpy--;
		};
		//tmpx and tmpy are at the top-left side of the line.
		for (ctr = 0; tmpx < width && tmpy < height; ctr++, tmpx++, tmpy++) {
			diagDown[ctr] = tmpx + (tmpy*width);
		}
		lines.diagDown = diagDown;
		tmpx = x;
		tmpy = y;
		//diagUp;
		while (tmpy !== 0 && tmpx < width) {
			tmpx++;
			tmpy--;
		};
		for (ctr = 0; tmpx >= 0 && tmpy < height; tmpx--, tmpy++, ctr++) {
			diagUp[ctr] = tmpx + (width * tmpy);
		}
		lines.diagUp = diagUp;
		tmp = this.buttonIndex(x, y);
		lines.verticalIndex = vertical.indexOf(tmp);
		lines.horizontalIndex = horizontal.indexOf(tmp)
		lines.diagDownIndex = diagDown.indexOf(tmp);
		lines.diagUpIndex = diagUp.indexOf(tmp);
		return lines;
}

	buildTable();
	$(document).keydown(function (evt) {
		setFocusFromKeyboard(evt.which);
	}); //key
}; //ButtonTable

