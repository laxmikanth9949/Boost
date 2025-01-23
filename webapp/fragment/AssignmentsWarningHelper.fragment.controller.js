sap.ui.define([
    "sap/support/boost/model/formatter",
    "sap/support/boost/util/i18n",
    "sap/m/Dialog"
], function(formatter, i18n, Dialog) {

    return {

        /**
         * Sets the initial values for the assignments start/end dates and its duration
         *
         * @public
         * @param {Date} dBegDate the start date for the assignment
         * @param {Date} dEndDate the end date for the assignment
         * @param {integer} iDuration the length of the service in days
         * @param {integer} iCallOff the length of the call off period
         * @param {Object} Controller the controller that called the warning helper
         */
        initialize: function(dBegDate, dEndDate, iDuration, iCallOff, oController) {
            this.bDurationNotSet = false;
            this.oParentController = oController;

            if (iDuration > 0) {
                this.iDuration = iDuration;
            } else if (iCallOff > 0) {
                this.iDuration = iCallOff;
            } else {
                // no duration was set up for selected line item
                this.bDurationNotSet = true;
                this.iDuration = 0;
            }

            this.setDatesForAssignment(dBegDate, dEndDate);
            this.setWarningAccepted(false);
        },

        /**
         * Creates the warning message for duration length when assigning a resource to a service
         *
         * @public
         */
        createWarningMessage: function() {
            var sMessage = "";

            if (this.bDurationNotSet) {
                sMessage = i18n.getText("FRAGMENT_WARNING_EFFORT") + " = 0 " + i18n.getText("FRAGMENT_WARNING_DAYS") + "\n\ ";
                sMessage += i18n.getText("FRAGMENT_WARNING_DATES") + " = " + formatter.daysDifference(this.dBegDate, this.dEndDate) + " " + i18n.getText(
                    "FRAGMENT_WARNING_DAYS") + "\n\ \n\ ";
                sMessage += i18n.getText("FRAGMENT_WARNING_DURATION_NOT_SETUP1") + " " + formatter.date(this.dEndDate) + " " + i18n.getText("FRAGMENT_WARNING_DURATION_NOT_SETUP2");
            } else {
                sMessage = i18n.getText("FRAGMENT_WARNING_EFFORT") + " = " + parseFloat(this.iDuration, 10) + " " + i18n.getText(
                    "FRAGMENT_WARNING_DAYS") + "\n\ ";
                sMessage += i18n.getText("FRAGMENT_WARNING_DATES") + " = " + formatter.daysDifference(this.dBegDate, this.dEndDate) + " " + i18n.getText(
                    "FRAGMENT_WARNING_DAYS") + "\n\ \n\ ";
                sMessage += i18n.getText("FRAGMENT_WARNING_CONSUME1") + " " + formatter.daysDifference(this.dBegDate, this.dEndDate) + " " + i18n.getText(
                        "FRAGMENT_WARNING_CONSUME2") + " " + parseFloat(this.iDuration, 10) + " " + i18n.getText("FRAGMENT_WARNING_CONSUME3") +
                    "\n\ ";
                sMessage += i18n.getText("FRAGMENT_WARNING_CONSUME4") + "\n\ \n\ ";
                sMessage += i18n.getText("FRAGMENT_WARNING_CHANGE1") + "\n\ \n\ ";
                sMessage += i18n.getText("FRAGMENT_WARNING_CHANGE2") + " " + parseFloat(this.iDuration, 10) + " " + i18n.getText(
                    "FRAGMENT_WARNING_CHANGE3") + " " + formatter.date(this.dEndDate);
            }

            this.oDialog = new sap.m.Dialog({
                title: i18n.getText("FRAGMENT_WARNING_TITLE"),
                type: 'Message',
                state: 'Warning',
                content: new sap.m.Text({
                    text: sMessage
                }),
                buttons: [
                    new sap.m.Button({
                        text: i18n.getText("FRAGMENT_WARNING_CHANGEDATE"),
                        press: function () {
                            this.closeDialog();
                        }.bind(this)
                    }),
                    new sap.m.Button({
                        text: i18n.getText("FRAGMENT_WARNING_BACKWARDS_SCHEDULE"),
                        press: function () {
                            this.onBackwardsSchedule();
                        }.bind(this)
                    }),
                    new sap.m.Button({
                        text: i18n.getText("FRAGMENT_WARNING_CLOSE"),
                        press: function () {
                            this.closeStaffingDialogs();
                        }.bind(this)
                    })
                ]
            });

            this.oDialog.open();
        },

        /**
         * Creates the warning message for duration length when assigning a resource to a service
         *
         * @public
         * @params {Object} oAssignment the currently selected assignment
         */
        displayWarningMessageWhenNeeded: function(oAssignment) {
            if ((this.getDisplayDurationWarning() === true) && (this.getWarningAccepted() === false)) {
                this.createWarningMessage();
            } else {
                if (this.getWarningAccepted()) { // Start date is backdated from the end date selected
                    this.setBackwardScheduledDate(oAssignment);
                } else {
                    // if the warning wasn't displayed but dates selected are valid
                    this.setWarningAccepted(true);
                }
                return oAssignment;
            }
        },

        /**
         * Sets the initial values for the assignments start/end dates and its duration
         *
         * @public
         * @param {Object} oCurrentAssignment the current assignment
         * @returns {Object} oCurrentAssignment the current assignment with the dates backward scheduled
         */
        setBackwardScheduledDate: function(oCurrentAssignment) {
            if (this.bDurationNotSet || this.iDuration === 1) {
                // dates need to backward scheduled one working day (8 hours)
                oCurrentAssignment.BegDate = new Date(oCurrentAssignment.EndDate);
                oCurrentAssignment.StartTime = new Date(oCurrentAssignment.EndTime);
                oCurrentAssignment.StartTime.setHours(oCurrentAssignment.StartTime.getHours() - 8);
            }
            else if (this.iDuration < 1) {
                // dates need to backward scheduled for a fractional day (ie, a half (4 hours) or quarter day (2 hours))
                oCurrentAssignment.BegDate = new Date(oCurrentAssignment.EndDate);
                oCurrentAssignment.StartTime = new Date(oCurrentAssignment.EndTime);
                oCurrentAssignment.StartTime.setHours(oCurrentAssignment.StartTime.getHours() - (8 * this.iDuration));
            }
            else{
                oCurrentAssignment.BegDate = new Date(oCurrentAssignment.EndDate);
                oCurrentAssignment.StartTime = new Date(oCurrentAssignment.EndTime);
                oCurrentAssignment.StartTime.setHours(oCurrentAssignment.StartTime.getHours() - 8);
                oCurrentAssignment.BegDate.setDate(oCurrentAssignment.BegDate.getDate() - (this.iDuration - 1));
                oCurrentAssignment.StartTime.setDate(oCurrentAssignment.StartTime.getDate() - (this.iDuration - 1));
            }
            return oCurrentAssignment;
        },

        /**
         * Sets whether the user has accepted the assignments duration warning
         *
         * @public
         * @param {Boolean} bAccepted
         */
        setWarningAccepted: function(bAccepted) {
            this.bWarningAccepted = bAccepted;
        },

        /**
         * Returns whether the user has accepted the assignments duration warning
         *
         * @public
         * @returns {Boolean} this.bWarningAccepted
         */
        getWarningAccepted: function() {
            return this.bWarningAccepted;
        },

        /**
         * Gets the start/end dates for assignment, checks if duration warning should be displayed
         *
         * @public
         * @param {Date} dBegDate the start date for the assignment
         * @param {Date} dEndDate the end date for the assignment
         * @param {Date} dStartTime the start time for the assignment
         * @param {Date} dEndTime the end time for the assignment
         */
        setDatesForAssignment: function(dBegDate, dEndDate, dStartTime, dEndTime) {
            this.dBegDate = dBegDate;
            this.dEndDate = dEndDate;

            if (dStartTime !== undefined) {
                // sets time values to help calculate date difference
                this.dBegDate.setHours(dStartTime.getHours());
                this.dBegDate.setMinutes(dStartTime.getMinutes());
                this.dEndDate.setHours(dEndTime.getHours());
                this.dEndDate.setMinutes(dEndTime.getMinutes());
            }

            this.setWarningAccepted(false);

            var iDatesDifference = Math.ceil((this.dEndDate - this.dBegDate) / (1000 * 3600 * 24));
            if (iDatesDifference > this.iDuration) {
                // difference between dates is calculated in whole values, need to check against whole/half day service if warning still needs to be displayed
                if ((iDatesDifference === 1) && (this.iDuration < 1)) {
                    this.setDisplayDurationWarning(false);
                }
                else {
                    this.setDisplayDurationWarning(true);
                }
            } else {
                this.setDisplayDurationWarning(false);
            }
        },

        /**
         * Sets whether the duration warning should be displayed
         *
         * @public
         * @param {Boolean} bDisplayWarning
         */
        setDisplayDurationWarning: function(bDisplayWarning) {
            this.bDisplayWarningMessage = bDisplayWarning;
        },

        /**
         * Returns whether the duration warning should be displayed
         *
         * @public
         * @returns {Boolean} this.bDisplayWarningMessage
         */
        getDisplayDurationWarning: function() {
            return this.bDisplayWarningMessage;
        },

        /**
         * Closes the warning message and sets that the user has seen and accepts the warning
         *
         * @public
         */
        closeDialog: function() {
            this.oDialog.close();
        },

        /**
         * Creates the staffing request straight away, skipping the date selection
         *
         * @public
         */
        onBackwardsSchedule: function() {
            this.oParentController.createAssignment();
            this.oDialog.close();
        },

        /**
         * Closes the warning message and close the staffing dialog
         *
         * @public
         */
        closeStaffingDialogs: function() {
            this.oDialog.close();
            this.oParentController.closeStaffingDialog();
        }
    };

});
