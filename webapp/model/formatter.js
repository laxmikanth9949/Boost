sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
	"use strict";
	return {
		dateFormatChange: function (date) {
			var filterDate = "";
			if (date.length === 8) {
				filterDate = date;
			} else {
				var sYear = date.getFullYear();
				var sMonth = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
				var sDate = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
				filterDate = filterDate + sYear + sMonth + sDate;
			}
			var oFormat = "datetime'" + filterDate.substr(0, 4) + "-" + filterDate.substr(4, 2) + "-" + filterDate.substr(6) + "T00:00:00'";
			return oFormat;
		},
		fnSetStartMonth: function (oDate) { // Get current Date and set it to beginning of the month, skip weekends
			return new Date(oDate.getFullYear(), oDate.getMonth(), 1);
		},
		fnSetDateAhead: function (oCurrentDate, iMonth, iDays) { // Get next month Date, plus iDays
			var oDateAhead = new Date();
			var iY = oCurrentDate.getFullYear();
			var iM = oCurrentDate.getMonth();
			var iD = oCurrentDate.getDate();
			if (iM <= 9)
				iM = "0" + iM;
			if (iD <= 9)
				iD = "0" + iD;
			oDateAhead.setFullYear(iY, iM, iD);
			if (iMonth != 0) {
				oDateAhead.setMonth(oDateAhead.getMonth() + iMonth);
			}
			if (iDays != 0) {
				oDateAhead.setDate(oDateAhead.getDate() + iDays);
			}
			return oDateAhead;
		},
		fnSetEndWeek: function (d) { // Set Date to the end of the week
			d = new Date(d);
			var day = d.getDay(),
				diff = d.getDate() + 7 - day;
			return new Date(d.setDate(diff));
		},

		fnSetStartWeek: function (d) { // Set Date to the start of the week
			d = new Date(d);
			var day = d.getDay(),
				diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
			return new Date(d.setDate(diff));
		},
		fnParseDate: function (oDate) { // Parse the date to filter format
			var nYear = oDate.getFullYear(),
				nMonth = oDate.getMonth() + 1,
				nDay = oDate.getDate();
			if (nMonth <= 9) {
				nMonth = "0" + nMonth;
			}
			if (nDay <= 9) {
				nDay = "0" + nDay;
			}
			var sFilterDate = "";
			sFilterDate = sFilterDate + nYear + nMonth + nDay;
			return sFilterDate;
		},
		fnNumberOfWeeks: function (date1, date2) { // Calculate number of weeks
			var num = (date2 - date1) / (1000 * 60 * 60 * 24 * 7).toFixed(2);
			return Math.round(num);
		},
		fnParseDateCompare: function (oDate) { // Parse the date to filter format
			var nYear = oDate.getFullYear(),
				nMonth = oDate.getMonth() + 1,
				nDay = oDate.getDate();
			if (nMonth <= 9) {
				nMonth = "0" + nMonth;
			}
			if (nDay <= 9) {
				nDay = "0" + nDay;
			}
			var sFilterDate = "";
			sFilterDate = sFilterDate + nYear + "-" + nMonth + "-" + nDay;
			return sFilterDate;
		},
		fnSetDatePast: function (oCurrentDate, iMonth, iDays) { // Get previous Date    
			var oDatePast = new Date();
			var iY = oCurrentDate.getFullYear();
			var iM = oCurrentDate.getMonth();
			var iD = oCurrentDate.getDate();
			if (iM <= 9)
				iM = "0" + iM;
			if (iD <= 9)
				iD = "0" + iD;

			oDatePast.setFullYear(iY, iM, iD);
			if (iMonth !== 0) {
				oDatePast.setMonth(oDatePast.getMonth() - iMonth);
			}
			if (iDays !== 0) {
				oDatePast.setDate(oDatePast.getDate() - iDays);
			}
			return oDatePast;
		},

		removeTimeOffset: function (oDate) {
			var iOffsetInverse = oDate.getTimezoneOffset() * 60000;
			return new Date(oDate.getTime() + iOffsetInverse);
		},
		/**
		 * Gets the number of days between two dates
		 * @public
		 * @param {Date} dBegDate
		 * @param {Date} dEndDate
		 * @returns {Integer} Amount of days
		 */
		daysDifference: function (dBegDate, dEndDate) {
			return Math.ceil((dEndDate - dBegDate) / (1000 * 3600 * 24));
		},
		/**
		 * Format the date as output string
		 *
		 * @public
		 * @param {object} oDate the date to be formatted
		 * @returns {string} sValue the formatted date
		 */
		date: function (oDate) {
			if (!oDate || !(oDate instanceof Date)) return;
			var oDateFormat = DateFormat.getDateInstance({
				pattern: "MMM d,YYYY"
			}, new sap.ui.core.Locale("en-US"));
			return oDateFormat.format(oDate);
		},
		/**
		 * Convert number given as string to a float.
		 * Useful to trim left zeros of numbers or for numbers mixed with strings
		 *
		 * @param {String} sNumber to be converted to string
		 * @return {Float} The number
		 * @public
		 */
		toFloat: function (sNumber) {
			var fNum = parseFloat(sNumber, 10);
			return isNaN(fNum) ? sNumber : fNum;
		},
		statusIndicators : function(sValue){
			var oIcon ;
			if(sValue === "Error"){
				oIcon = "sap-icon://error";
			}else{
				oIcon = "";
			}
			return oIcon;
		},
	};
});