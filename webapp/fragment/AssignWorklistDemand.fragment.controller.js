sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/support/boost/util/helpers",
	"sap/support/boost/model/formatter",
	"sap/support/boost/util/i18n",
	"sap/support/boost/fragment/AssignmentsWarningHelper.fragment.controller",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/support/boost/model/formatterReuse",
	"sap/support/boost/util/ErrorCodeHelper",
	"sap/support/boost/util/CalendarHelper"
], function (Controller, helpers, formatter, i18n, AssignmentsWarningHelper,
	MessageBox, MessageToast, formatterReuse, ErrorCodeHelper, CalendarHelper) {

	"use strict";

	var that;

	return Controller.extend("sap.support.boost.fragment.AssignWorklistDemand", {
		formatter: formatter,
		formatterReuse: formatterReuse,

		onBeforeOpen: function (oEvent) {
			//that = oEvent.getSource().getController();

			this._oDialog = oEvent.getSource();

			var oFragment = oEvent.getSource(),
				oParentController = oFragment.getParent().getController();

			this.oParentController = oParentController;
			this.setAssignmentWarningDetails();

			this.oDemand = this.getView().getModel("WorklistDemandsToStaff").getProperty("/");

			if (this.oDemand[0].EditMode) {
				this._oDialog.setTitle(i18n.getText("FRAGMENT_EDIT_SERVICE_ORDER_TITLE"));
			} else {
				this._oDialog.setTitle(i18n.getText("FRAGMENT_ASSIGN_SERVICE_ORDER_TITLE"));
			}
		},

		/**
		 * When the dates are changed, set the date in the assingnment warning helper so that the
		 * warning message can be displayed if necessary
		 * @public
		 * @returns {void}
		 */
		onDatesChanged: function () {
			var oCurrentAssignment = this.getView().getModel("WorklistDemandsToStaff").getData()[0];
			AssignmentsWarningHelper.setDatesForAssignment(oCurrentAssignment.BegDate, oCurrentAssignment.EndDate, oCurrentAssignment.StartTime,
				oCurrentAssignment.EndTime);

			// Restrict the selected dates, Edit/Create mode, if user can select past dates
			/*if (this.getDateString(oCurrentAssignment.BegDate) < this.getDateString(new Date())) {
				this.getView().byId("begDate").setValueState("Error");
				this.getView().byId("begDate").setValueStateText("Select Valid Date...");
				sap.m.MessageBox.warning("You can't Select/modify past dates..");
				this.getView().getModel("WorklistDemandsToStaff").updateBindings(true);
				this.getView().getModel("WorklistDemandsToStaff").refresh(true);
				return;
			} else if (this.getDateString(oCurrentAssignment.BegDate) > this.getDateString(oCurrentAssignment.EndDate)) {
				sap.m.MessageBox.error("Begin Date is (" + this.getDateString(oCurrentAssignment.BegDate) + ")" + " " + "is greater than " + " " +
					"(" + this.getDateString(oCurrentAssignment.EndDate) + ") \n" + "Could you please select correct Dates.");
			} else {
				this.getView().byId("begDate").setValueState("None");
				this.getView().byId("begDate").setValueStateText("");
			}*/
			// allow staffing/changes for current and past week
				var oJan = new Date(new Date().getFullYear(),0,1);
				var today = new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate());
				var daysOfyear = Math.floor((today - oJan ) / (24*60*60*1000));
				var currentWeek = Math.ceil(daysOfyear / 7);

				var selectedDate = new Date(oCurrentAssignment.BegDate.getFullYear(),oCurrentAssignment.BegDate.getMonth(),oCurrentAssignment.BegDate.getDate());
				var daysOfYearselectedDate = Math.floor((selectedDate - oJan ) / (24*60*60*1000));
				var selectedtWeek = Math.ceil(daysOfYearselectedDate / 7);
			if (currentWeek-1<=selectedtWeek) {
				//	this.getView().setBusy(false);
				this.getView().byId("begDate").setValueState("None");
				this.getView().byId("begDate").setValueStateText("");
				
				 if (this.getDateString(oCurrentAssignment.BegDate) > this.getDateString(oCurrentAssignment.EndDate)) {
				sap.m.MessageBox.error("Begin Date is (" + this.getDateString(oCurrentAssignment.BegDate) + ")" + " " + "is greater than " + " " +
					"(" + this.getDateString(oCurrentAssignment.EndDate) + ") \n" + "Could you please select correct Dates.");
					this.getView().byId("endDate").setValueState("Error");
					this.getView().byId("endDate").setValueStateText("Select Valid Date...");
					return;
			}else{
				this.getView().byId("endDate").setValueState("None");
				this.getView().byId("endDate").setValueStateText("");
			}
			} else {
				this.getView().byId("begDate").setValueState("Error");
				this.getView().byId("begDate").setValueStateText("Select Valid Date...");
				sap.m.MessageBox.warning("You can't Select/modify before past week dates..\n allow staffing/changes for current and past week only");
				this.getView().getModel("WorklistDemandsToStaff").updateBindings(true);
				this.getView().getModel("WorklistDemandsToStaff").refresh(true);
				return;
			}
		},

		/**
		 * Calls update/create functions depending on whether dialog is in 'edit mode'
		 *
		 * @public
		 * @returns {void}
		 */
		onSaveAssignServiceOrder: function (oEvent) {
			this.onDatesChanged();
		//	if (this.oDemand[0].TaskType && this.oDemand[0].StaffFraction) {
				if (this.getView().byId("begDate").getValueState() === "Error" || this.getView().byId("endDate").getValueState() === "Error") {
					sap.m.MessageToast.show("Could you please select valide Dates");
					return;
				}
				if (this.oDemand[0].EditMode) {
					this.onEditAssignServiceOrder();
				} else {
					this.onCreateAssignServiceOrder();
				}
		//	} else {
		//		MessageToast.show("Please Maintain TaskType and Fraction fields");
		//		return;
		//	}
		},

		onCreateAssignServiceOrder: function () {
			var that = this;
			var aDialogData = this.getView().getModel("WorklistDemandsToStaff").getData()[0],
				oCurrentAssignment = aDialogData;
			//	oCurrentAssignment = AssignmentsWarningHelper.displayWarningMessageWhenNeeded(aDialogData);

			//	if (AssignmentsWarningHelper.getWarningAccepted()) {
			this.getView().setBusy(true);
			this.oAssignmentRequest = this._createAssignmentRequest(oCurrentAssignment);

			var CW = CalendarHelper.getCWFromDate(new Date(this.oAssignmentRequest.BegDate));
			var CurrentCW = CalendarHelper.getCWFromDate(new Date());

			if (CurrentCW < CW) {
				MessageBox.information("The Assigned's Date Calender Week is ahead of Current CW");
			}

			/*Promise.all([this.validateAlreadyStaffed(this.oAssignmentRequest)]).then(function () {
					return that._createSingleAssignment(that.oAssignmentRequest);
				}.bind(that)).then(function () {
					return that.readInternalOrder();
			    }.bind(that)).then(function () {
					return that.readPernr();
				}.bind(that)).then(function () {
					return that.staffResIO();
				}.bind(that)).catch(function (oError) {
					if (!(oError == undefined)) {
						if (oError.message == undefined) {
							MessageBox.error(oError);
						}
					}
					that.getView().setBusy(false);
				});*/

			//Only to IC Call
			Promise.all([this.validateAlreadyStaffed(this.oAssignmentRequest)]).then(function () {
				return that._createSingleAssignment(that.oAssignmentRequest);
			}.bind(that)).catch(function (oError) {
				if (!(oError == undefined)) {
					if (oError.message == undefined) {
						MessageBox.error(oError);
					}
				}
				that.getView().setBusy(false);
			});
			//	}
		},

		validateAlreadyStaffed: function (oRequest) {
			return new Promise(function (resolve, reject) {
				var flag = true,
					that = this;

				var staffDemands = this.getView().getModel("DemandID").getData();
				// check validation with itemGuid 
				// shown other region staffs in default page(EMEA BACKOFFICE)
				// allowing if not same itemGuid's when compare to other staffs 
				var staffedarray = [];
				for(var i=0; i<staffDemands.length;i++){
					if(staffDemands[i].ItemGuid !== oRequest.ItemGuid){
						//staffDemands.splice(0,1);
						staffedarray.push(staffDemands[i]);
						staffedarray.splice(0,staffedarray.length);
					}else{
						staffedarray.push(staffDemands[i]);
					}
				}

				if (staffedarray.length > 0) {
					staffedarray.forEach(function (x) {
						if (new Date(oRequest.BegDate).getTime() <= new Date(x.Assignmentenddate.toJSON().split(".")[0]).getTime() &&
							new Date(x.Assignmentstartdate.toJSON().split(".")[0]).getTime() <= new Date(oRequest.EndDate).getTime()) {
							flag = false;
							that._removeItemFromModel(oRequest.ItemGuid);
							reject("OverLapping Staffing is not allowed");
						}
					});
				}
				if (flag) {
					resolve();
				}
			}.bind(this));
		},
		/**
		 * Display warning message (for assignment dates, if needed) and create assignment request body
		 *
		 * @public
		 * @param {string} sItemGuid - string representing the item guid which is a unique identifier
		 * @returns {object} - object with guid matching the passed parameter
		 */
		onEditAssignServiceOrder: function () {
			var that = this;
			var aDialogData = this.getView().getModel("WorklistDemandsToStaff").getData()[0],
				oCurrentAssignment = AssignmentsWarningHelper.displayWarningMessageWhenNeeded(aDialogData);

			if (AssignmentsWarningHelper.getWarningAccepted()) {
				this.getView().setBusy(true);
				this.oAssignmentRequest = this._createEditAssignmentRequest(oCurrentAssignment);

				var CW = CalendarHelper.getCWFromDate(new Date(this.oAssignmentRequest.BegDate));
				var CurrentCW = CalendarHelper.getCWFromDate(new Date());

				if (CurrentCW < CW) {
					MessageBox.information("The Assigned's Date Calender Week is ahead of Current CW");
				}

				/*Promise.all([this.validateAlreadyStaffed(this.oAssignmentRequest)]).then(function () {
					return that._updateAssignment(that.oAssignmentRequest);
				}.bind(that)).then(function () {
					return that.readInternalOrder();
				}.bind(that)).then(function () {
					return that.readPernr();
				}.bind(that)).then(function () {
					return that.readStaffDetailsISP();
				}.bind(that)).then(function () {
					return that.staffResIO();
				}.bind(that)).catch(function (oError) {
					if (!(oError == undefined)) {
						if (oError.message == undefined) {
							MessageBox.error(oError);
						}
					}
					that.getView().setBusy(false);
				});*/

				// Only For IC CALL
				this.getView().getModel("default").sDefaultUpdateMethod = "PUT";
				//var that = this,
				if(this.oAssignmentRequest.IoNumber === "IO Number not Maintained"){
					this.oAssignmentRequest.IoNumber = "";
				}
				var sUrl = "/AssignmentList(EmpID='" + this.oAssignmentRequest.EmpID + "',BegDate=datetime'" + this.oAssignmentRequest.BegDate +
					"',EndDate=datetime'" + this.oAssignmentRequest
					.EndDate +
					"',AsgnGuid='" + this.oAssignmentRequest.AsgnGuid + "')";

				this.getView().getModel("default").update(sUrl, this.oAssignmentRequest, {
					method: "PUT",
					success: function (oResponse) {
						that.getView().setBusy(false);
						that._updateWorkListWithSavedRecord(that.oDemand[0].ItemGuid);
						/*var oResults = oResponse.results;
						sap.m.MessageBox.success(i18n.getText("FRAGMENT_ASSIGN_SERVICE_ORDER_UPDATE_SUCCESS") + "\n" + oResults[0].Gwmsg + "\n" +
							oResults[1].Gwmsg1 + "\n" + oResults[2].Gwmsg2, {
								title: "Success"
							});*/
						sap.m.MessageToast.show(i18n.getText("FRAGMENT_ASSIGN_SERVICE_ORDER_UPDATE_SUCCESS"));
						that.oParentController._oDemandPop.close();
						that.oParentController._assignWorklistItems.close();
						that.oParentController.trackEvent(that.oParentController.getOwnerComponent(),that.oParentController.EDIT_ASSIGNMENTS);
						var oEventBus = sap.ui.getCore().getEventBus();
						oEventBus.publish("day", "getDayStaffing");
						//	resolve();
					},
					error: function (oResponse) {
						that.getView().setBusy(false);
						var oEventBus = sap.ui.getCore().getEventBus();
						oEventBus.publish("day", "getDayStaffing");
						that.oParentController._assignWorklistItems.getModel().refresh(true);
						that.oParentController._assignWorklistItems.getModel("WorklistDemandsToStaff").refresh(true);
						that.oParentController._assignWorklistItems.getModel("WorklistDemandsToStaff").updateBindings(true);
						that.oParentController._assignWorklistItems.close();
						that.oParentController._oDemandPop.close();
						sap.m.MessageToast.show("Your Staffing Assignment Failed \n" + oResponse.message);
					//	sap.m.MessageBox.error(JSON.parse(oResponse.responseText).error.message.value + "\n\n" + "Please Check Manually In Both Systems");
						that._updateWorkListWithSavedRecord(that.oDemand[0].ItemGuid);
						that._displayAssignmentFailureDialogOnErrorResponse(oResponse);
						that._removeItemFromModel(that.oDemand[0].ItemGuid);
						//reject();
					}
				});
			}
		},

		readStaffDetailsISP: function () {
			return new Promise(function (resolve, reject) {
				var that = this;
				sap.support.boost.ISModel.setUseBatch(false);
				var InternalOrder = this.getView().getModel("IODetails").getProperty("/InternalOrd");
				sap.support.boost.ISModel.read("/InternalOrderHeaderSet('" + InternalOrder + "')", {
					urlParameters: {
						"$expand": "OrderHeaderStaffingRes"
					},
					success: function (oData) {
						if (oData.OrderHeaderStaffingRes.results.length > 0) {
							var oldAssign = that.getView().getModel("AssigndDemand").getProperty("/results");
							that.reqData = undefined;
							that.endate = "";
							oData.OrderHeaderStaffingRes.results.forEach(function (x) {
								if (that.getDateString(x.Begda) === that.getDateString(oldAssign[0].Assignmentstartdate) &&
									that.getDateString(x.Endda) === that.getDateString(oldAssign[0].Assignmentenddate) &&
									x.UserId === oldAssign[0].Employee) {
									that.reqData = {
										"ActBegda": null,
										"ActEndda": null,
										"Actexp": "A",
										"ActexpStr": "Activities",
										"Action": "2",
										"Arktx": "",
										"Aufnr": "",
										"Begda": that.startDateTime,
										"BegdaStr": that.startDateTime ? that.getDateString(that.startDateTime) : '00000000',
										"Bukrs": "0001",
										"CostObjType": "IO",
										"CreatedBy": x.CreatedBy,
										"CreatedOn": x.CreatedOn,
										"Endda": that.endDateTime,
										"EnddaStr": that.endDateTime ? that.getDateString(that.endDateTime) : '00000000',
										"EntryId": x.EntryId,
										"Ethrs": "0",
										"LastChangedBy": x.LastChangedBy,
										"LastChangedOn": x.LastChangedOn,
										"Longtext": "",
										"Name": x.Name,
										"Objnr": x.Objnr,
										"Pdays": x.Pdays,
										"PernrStr": x.Pernr,
										"Posnr": "000000",
										"Pthrs": "0.0",
										"ReadOnly": false,
										"Snote": x.Snote,
										"Status": "",
										"StatusStr": "",
										"TaskLevel": "",
										"TaskLevelStr": "",
										"Tasktype": "",
										"TasktypeStr": "",
										"Trtkl": "",
										"TrtklStr": "",
										"UIM_INFO": "",
										"UserId": x.UserId,
										"UserType": "",
										"UsrRole": "",
										"Vbeln": x.Vbeln,
										"Zzcontpers": ""
									};
									that.endate = that.getDateString(x.Endda);
								}
							});
							if (that.reqData) {
								resolve();
							} else {
								that._updateWorkListWithSavedRecord(that.oDemand[0].ItemGuid);
								that._removeItemFromModel(that.oDemand[0].ItemGuid);
								reject();
							}
						} else {
							that._updateWorkListWithSavedRecord(that.oDemand[0].ItemGuid);
							that._removeItemFromModel(that.oDemand[0].ItemGuid);
							reject();
						}
					},
					error: function (oData) {
						that._updateWorkListWithSavedRecord(that.oDemand[0].ItemGuid);
						that._removeItemFromModel(that.oDemand[0].ItemGuid);
						reject();
					}
				});
			}.bind(this));
		},

		onCloseDialog: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			this.oParentController.getView().setModel(this.oParentController.getOwnerComponent().getModel("default"));
			this.oParentController.getView().setModel(this.oParentController.getOwnerComponent().getModel("resReq"));
			oDialog.close();

			//TODO: Make it possible to close all.
		},

		_createAssignmentRequest: function (oCurrentAssignment) {
			var dBegDate = oCurrentAssignment.BegDate,
				dEndDate = oCurrentAssignment.EndDate,
				dBegTstmp = oCurrentAssignment.BegDate,
				dEndTstmp = oCurrentAssignment.EndDate;

			dBegTstmp.setHours(oCurrentAssignment.StartTime.getHours());
			dBegTstmp.setMinutes(oCurrentAssignment.StartTime.getMinutes());

			dEndTstmp.setHours(oCurrentAssignment.EndTime.getHours());
			dEndTstmp.setMinutes(oCurrentAssignment.EndTime.getMinutes());

			this.startDateTime = dBegDate;
			this.endDateTime = dEndDate;

			//TODO: Calc with the timezone?
			return {
				"BegDate": formatterReuse.removeTimeOffset(dBegDate).toJSON().split(".")[0],
				"EndDate": formatterReuse.removeTimeOffset(dEndDate).toJSON().split(".")[0],
				"ItemGuid": oCurrentAssignment.ItemGuid,
				"ResGuid": oCurrentAssignment.ResGuid,
				"BegTstmp": formatterReuse.removeTimeOffset(dBegTstmp).toJSON().split(".")[0],
				"EndTstmp": formatterReuse.removeTimeOffset(dEndTstmp).toJSON().split(".")[0],
				"Monday": oCurrentAssignment.Monday,
				"Tuesday": oCurrentAssignment.Tuesday,
				"Wednesday": oCurrentAssignment.Wednusday,
				"Thursday": oCurrentAssignment.Thursday,
				"Friday": oCurrentAssignment.Friday,
				"Saturday": oCurrentAssignment.Saturday,
				"Sunday": oCurrentAssignment.Sunday,
				"TaskType": oCurrentAssignment.TaskType,
				"StaffFraction": oCurrentAssignment.StaffFraction,
				"StaffingManager": oCurrentAssignment.StaffingManager
			};
		},

		/**
		 * Create assignment request body
		 *
		 * @public
		 * @param {Object} oCuurentAssignment - the assignment we're currently editing
		 * @returns {Object} - object with request body
		 */
		_createEditAssignmentRequest: function (oCurrentAssignment) {
			var dBegDate = oCurrentAssignment.BegDate,
				dEndDate = oCurrentAssignment.EndDate;

			dBegDate.setHours(oCurrentAssignment.StartTime.getHours());
			dBegDate.setMinutes(oCurrentAssignment.StartTime.getMinutes());
			dBegDate.setSeconds(oCurrentAssignment.StartTime.getSeconds());

			dEndDate.setHours(oCurrentAssignment.EndTime.getHours());
			dEndDate.setMinutes(oCurrentAssignment.EndTime.getMinutes());
			dEndDate.setSeconds(oCurrentAssignment.EndTime.getSeconds());

			var startDateTimeFormatted = formatterReuse.removeTimeOffset(dBegDate),
				endDateTimeFormatted = formatterReuse.removeTimeOffset(dEndDate);

			this.startDateTime = dBegDate;
			this.endDateTime = dEndDate;
			var sRegion = this.getView().getModel("selectedKey").getProperty("/region");
			/*if(oCurrentAssignment.action === "Day"){
				this.ChangeIndicator = "D";
			}else{
				 this.ChangeIndicator = "R";
			}*/

			return {
				"AsgnGuid": oCurrentAssignment.Asgnguid,
				"EmpID": oCurrentAssignment.Employee,
				"BegDate": startDateTimeFormatted.toJSON().split(".")[0],
				"EndDate": endDateTimeFormatted.toJSON().split(".")[0],
				"ItemGuid": oCurrentAssignment.ItemGuid,
				"ResGuid": oCurrentAssignment.ResGuid,
				"BegTstmp": startDateTimeFormatted.toJSON().split(".")[0],
				"EndTstmp": endDateTimeFormatted.toJSON().split(".")[0],
				"Description": oCurrentAssignment.Itemdescription,
				"OperationInd": oCurrentAssignment.action,
				"TaskType": oCurrentAssignment.TaskType,
				"IoNumber": oCurrentAssignment.InternalOrder,
				"Region": sRegion,
				"StaffFraction": oCurrentAssignment.StaffFraction,
				"StaffingManager": oCurrentAssignment.StaffingManager

			};
		},

		/**
		 * Calls service to create an assignment
		 *
		 * @public
		 * @param {Object} oRequest - the request body of the assignment
		 */

		_createSingleAssignment: function (oRequest) {
			return new Promise(function (resolve, reject) {
				var that = this;
				var sRegion = this.getView().getModel("selectedKey").getProperty("/region");
				var sUrl = ["TaskType='" + oRequest.TaskType + "'&Region='" + sRegion + "'&Monday='" + oRequest.Monday + "'&Tuesday='" +
					oRequest.Tuesday + "'&Wednesday='" + oRequest.Wednesday + "'&Thursday='" + oRequest.Thursday + "'&Friday='" + oRequest.Friday +
					"'&Saturday='" + oRequest.Saturday + "'&Sunday='" + oRequest.Sunday + "'&ResGuid='" + oRequest.ResGuid + "'&ItemGuid='" +
					oRequest.ItemGuid + "'&EndTstmp=datetime'" + oRequest.EndTstmp + "'&BegTstmp=datetime'" + oRequest.BegTstmp + "'&StaffFraction='" + oRequest.StaffFraction + "'&StaffingManager='" + oRequest.StaffingManager +"'"
				];

				//sending date for create the assignment/seat through read call
				this.getView().getModel("default").read("/Assignment_FI", {
					urlParameters: sUrl,
					success: function (oResponse) {
						that.getView().setBusy(false);
						/*if (oResponse.GWMsg === "CREATE_SUCCESS") {
							that._updateWorkListWithSavedRecord(oResponse.ItemGuid);
							sap.m.MessageToast.show(i18n.getText("FRAGMENT_ASSIGN_SERVICE_ORDER_" + oResponse.GWMsg));
							that.oParentController._oDemandPop.close();
							var oEventBus = sap.ui.getCore().getEventBus();
							oEventBus.publish("day", "getDayStaffing");
							resolve();
						} else {
							that.getView().setBusy(false);
							that._updateWorkListWithSavedRecord(oResponse.ItemGuid);
							that._displayAssignmentFailureDialog(oResponse.ItemGuid);
							that._removeItemFromModel(that.oDemand[0].ItemGuid);
							reject();
						}*/
						var oresults = oResponse.results;
						for (var i = 0; i < oresults.length - 1; i++) {
							that._updateWorkListWithSavedRecord(oresults[i].ItemGuid);
						}
						var msgResponce = [];
						var msgResponceRfc = [];
						for (var i = 0; i < oresults.length; i++) {
							if (oresults[i].Gwmsg) {
								msgResponce.push(oresults[i].Gwmsg + "\n");
							} else {
								msgResponceRfc.push(oresults[i].GwmsgRfc);
							}
						}
						if(oresults.length - 1 === 0){
							sap.m.MessageBox.error("Assignment is not created Successfully");
						}else{
						sap.m.MessageBox.success(oresults.length - 1 + " " + "Assignments Created Successfully and" + "\n" + msgResponceRfc, {
							title: "Success"
						});
						}
						that.oParentController._oDemandPop.close();
						that.oParentController._assignWorklistItems.close();
						var oEventBus = sap.ui.getCore().getEventBus();
						oEventBus.publish("day", "getDayStaffing");
						resolve();
					},
					error: function (oResponse) {
						that.getView().setBusy(false);
						that.oParentController._oDemandPop.close();
						that.oParentController._assignWorklistItems.close();
						var oEventBus = sap.ui.getCore().getEventBus();
						oEventBus.publish("day", "getDayStaffing");
					/*	sap.m.MessageBox.error(JSON.parse(oResponse.responseText).error.message.value +
							"\n IC-IS System Staffing Failed Please check Manually or Raise a ticket");*/
						that._updateWorkListWithSavedRecord(that.oDemand[0].ItemGuid);
						that._displayAssignmentFailureDialogOnErrorResponse(oResponse);
						that._removeItemFromModel(that.oDemand[0].ItemGuid);
						reject();
					}
				});
			}.bind(this));
		},

		readInternalOrder: function () {
			return new Promise(function (resolve, reject) {
				var that = this;
				var resItem = this.oDemand[0].serviceItem;
				var sRegion = this.getView().getModel("selectedKey").getProperty("/region");

				this.getView().getModel("default").read("/Mapping(Region='" + sRegion + "',ItemNumber='" + resItem + "')", {
					success: function (oData) {
						if (!oData.InternalOrder) {
							that._removeItemFromModel(that.oDemand[0].ItemGuid);
							reject();
						} else {
							that.getView().getModel("IODetails").setProperty("/InternalOrd", oData.InternalOrder);
							that.getView().getModel("IODetails").setProperty("/StaffFactor", oData.StaffFraction);
							resolve();
						}
					}.bind(this),

					error: function (error) {
						that._removeItemFromModel(that.oDemand[0].ItemGuid);
						reject("No Internal Order Maintained");
					}
				});
			}.bind(this));
		},

		readPernr: function () {
			return new Promise(function (resolve, reject) {
				var that = this;
				var Employee = this.oDemand[0].Employee;
				var query = "uname eq '" + Employee + "'";

				sap.support.boost.ISModel.read("/UserSearchHelps", {
					urlParameters: {
						'$filter': query
					},
					success: function (oData) {
						that.getView().getModel("IODetails").setProperty("/Pernr", oData.results[0].Pernr);
						that.getView().getModel("IODetails").setProperty("/Bukrs", oData.results[0].Bukrs);
						resolve();
					}.bind(this),

					error: function (error) {
						that._removeItemFromModel(that.oDemand[0].ItemGuid);
						reject("Pernr details not found..Staffing need to maintain manually");
					}
				});
			}.bind(this));
		},

		staffResIO: function () {
			var that = this;
			var fullname = this.oDemand[0].FullName.substr(4);
			var Tasktype = this.oDemand[0].TaskType;
			var itemdescription = this.oDemand[0].Itemdescription;
			var BegDate = this.startDateTime;
			var EndDate = this.endDateTime;
			var BegdaStr = this.startDateTime ? this.getDateString(this.startDateTime) : '00000000';
			var EnddaStr = this.endDateTime ? this.getDateString(this.endDateTime) : '00000000';
			var pernr = this.getView().getModel("IODetails").getProperty("/Pernr");

			var IntOrd = this.getView().getModel("IODetails").getProperty("/InternalOrd");
			var noOfDays;

			if (BegDate.getDay() > EndDate.getDay()) {
				noOfDays = BegDate.getDay() - EndDate.getDay();
			} else {
				noOfDays = EndDate.getDay() - BegDate.getDay();
			}
			var StaffFactor = that.getView().getModel("IODetails").getProperty("/StaffFactor");

			noOfDays = ((noOfDays + 1) * StaffFactor).toString();

			sap.support.boost.ISModel.setUseBatch(true);
			sap.support.boost.ISModel.setDeferredGroups(['ReqCreate']);

			if (!this.oDemand[0].EditMode) {
				var bukrs = this.getView().getModel("IODetails").getProperty("/Bukrs");
				var oResource = [{
					Bukrs: bukrs,
					Name: fullname,
					Pernr: pernr
				}];
				var users = JSON.stringify(oResource);
				var payload = new sap.ui.model.json.JSONModel({
					Actexp: "A",
					ActexpStr: "Activities",
					Action: "2",
					Begda: BegDate.toJSON().split(".")[0],
					BegdaStr: BegdaStr,
					Bukrs: "0001",
					CostObjType: "IO",
					Endda: EndDate.toJSON().split(".")[0],
					EnddaStr: EnddaStr,
					EntryId: "M",
					Ethrs: "0",
					MultiUsers: users,
					Name: fullname,
					Objnr: undefined,
					Pernr: "00000000",
					PernrStr: pernr,
					Posnr: "",
					Snote: itemdescription,
					Tasktype: Tasktype,
					TaskLevel: "",
					Vbeln: IntOrd,
					Zexpdays: noOfDays
				}).getData();

				return new Promise(function (resolve, reject) {
					sap.support.boost.ISModel.create("/ReqDetails", payload, {
						groupId: 'ReqCreate',
					});

					sap.support.boost.ISModel.submitChanges({
						groupId: 'ReqCreate',
						success: function (oData) {
							that._removeItemFromModel(that.oDemand[0].ItemGuid);
							that.successHandling(oData, resolve, reject);
						},
						error: function (error) {
							that._removeItemFromModel(that.oDemand[0].ItemGuid);
							reject("Failed to update Staffing Request");
						}
					});
				}.bind(this));
			} else {
				this.reqData["Zexpdays"] = noOfDays;
				payload = this.reqData;

				var sPath = "/ReqDetails(" + "EnddaStr=" + "'" + this.endate + "',Vbeln='" + payload.Vbeln +
					"',Posnr='" + payload.Posnr + "',Objnr='" + payload.Objnr + "',Pernr='" + pernr + "',Tasktype='" + payload.Tasktype + "'" +
					",TaskLevel='" + payload.TaskLevel + "'" + ")";

				sap.support.boost.ISModel.sDefaultUpdateMethod = sap.ui.model.odata.UpdateMethod.Merge;

				return new Promise(function (resolve, reject) {
					sap.support.boost.ISModel.update(sPath, payload, {
						groupId: 'ReqCreate',
						eTag: '*',
					});

					sap.support.boost.ISModel.submitChanges({
						groupId: 'ReqCreate',
						success: function (oData) {
							that._removeItemFromModel(that.oDemand[0].ItemGuid);
							that.successHandling(oData, resolve, reject);
							that.getView().setBusy(false);
						},
						error: function (error) {
							that._removeItemFromModel(that.oDemand[0].ItemGuid);
							reject("Failed to update Staffing Request");
						}
					});
				}.bind(this));
			}
		},

		successHandling: function (oData, resolve, reject) {
			var header = oData.__batchResponses[0].__changeResponses[0].headers;

			if (header) {
				var sapMessage = header["sap-message"];
				if (sapMessage) {
					var jsonSAPMessage = JSON.parse(sapMessage);
					var newTmpMessage = "Please carry out staffing manually at ISP" + "\n" + (jsonSAPMessage.severity == 'warning' ? 'Warning: ' : (
							jsonSAPMessage.severity == 'error' ? 'Error: ' : '')) +
						jsonSAPMessage.message + "\n";
					return reject(newTmpMessage);
				} else {
					sap.m.MessageToast.show("Staffing Request saved successfully at ISP");
					return resolve();
				}
			}
		},
		/**
		 * Bypasses date selection, calls backwards schedule directly and then create/update staffing
		 *
		 * @public
		 * @returns {void}
		 */
		createAssignment: function () {
			var aDialogData = this.getView().getModel("WorklistDemandsToStaff").getData()[0],
				oCurrentAssignment = AssignmentsWarningHelper.setBackwardScheduledDate(aDialogData),
				oAssignmentRequest;

			if (this.oDemand.EditMode) {
				this.getView().setBusy(true);
				oAssignmentRequest = this._createEditAssignmentRequest(oCurrentAssignment);

				this._updateAssignment(oAssignmentRequest);
			} else {
				this.getView().setBusy(true);
				oAssignmentRequest = this._createAssignmentRequest(oCurrentAssignment);

				this._createSingleAssignment(oAssignmentRequest);
			}
		},

		/**
		 * Gets all the necessary params to call the error code helper functions
		 *
		 * @public
		 * @param {string} oResponse - failure response from back-end
		 * @returns {void}
		 */
		//function duplicate in AssignServiceOrder + AssignWorklistDemand
		_displayAssignmentFailureDialogOnErrorResponse: function (oResponse) {
			var sErrorMsg = JSON.parse(oResponse.responseText);
			var sItemGuid = sErrorMsg.error.message.value;
			/*if (sItemGuid.includes("Period overlaps with existing staffing")) {
				var errorlength = sErrorMsg.error.innererror.errordetails;
				var aArray = [];
				for (var i = 0; i < errorlength.length; i++) {
					aArray.push(errorlength[i].message + "\n");
				}
				sap.m.MessageBox.warning(sItemGuid + "\n" + aArray);

			} else if (sItemGuid.includes("internal server error occurred")) {
				sap.m.MessageBox.error(sItemGuid);
			}*/
			var oDemand = this.getView().getModel("resReq").getProperty("/ResDemandSet('" + this.oDemand[0].ItemGuid + "')");
			var oOrg = this.getView().getModel("resReq").getProperty("/ResServiceTeamSet('" + oDemand.Organization + "')"),
				aErrorCodes = sErrorMsg.error.innererror.errordetails,
				sErrorMsgDisplay = "";
				var aErrorcodeArray = [];
				if(aErrorCodes){
					for(var i=0;i<aErrorCodes.length;i++){
						if(aErrorCodes[i].message){
						aErrorcodeArray.push(aErrorCodes[i].message + "\n");
						}
					}
				}else{
					aErrorCodes = " ";
					aErrorcodeArray.push(sItemGuid + "\n Please contact your Backoffice");
				}
			sErrorMsgDisplay += ErrorCodeHelper.getMessageForErrorCodes(aErrorCodes, oDemand, oOrg);
			ErrorCodeHelper.displaySoErrorDialog(sErrorMsgDisplay + "\n\n" + aErrorcodeArray);

		},

		/**
		 * Send an update request to update the details of the assignment
		 *
		 * @public
		 * @param {Object} oRequest - request body
		 * @returns {object} - object with guid matching the passed parameter
		 */
		_updateAssignment: function (oRequest) {
			return new Promise(function (resolve, reject) {
				var that = this,
					sUrl = "/AssignmentList(EmpID='" + oRequest.EmpID + "',BegDate=datetime'" + oRequest.BegDate + "',EndDate=datetime'" + oRequest
					.EndDate +
					"',AsgnGuid='" + oRequest.AsgnGuid + "')";

				this.getView().getModel("default").update(sUrl, oRequest, {
					success: function () {
						//that.getView().setBusy(false);
						that._updateWorkListWithSavedRecord(that.oDemand[0].ItemGuid);
						sap.m.MessageToast.show(i18n.getText("FRAGMENT_ASSIGN_SERVICE_ORDER_UPDATE_SUCCESS"));
						that.oParentController._oDemandPop.close();
						var oEventBus = sap.ui.getCore().getEventBus();
						oEventBus.publish("day", "getDayStaffing");
						resolve();
					},
					error: function (oResponse) {
						that.getView().setBusy(false);
						that._updateWorkListWithSavedRecord(that.oDemand[0].ItemGuid);
						that._displayAssignmentFailureDialogOnErrorResponse(oResponse);
						that._removeItemFromModel(that.oDemand[0].ItemGuid);
						reject();
					}
				});
			}.bind(this));
		},

		/**
		 * modification NGIPIRELAND05-481 - update records after save without refreshing worklist
		 * alternative, not backend related solution might be possible
		 * @private
		 */
		_updateWorkListWithSavedRecord: function (sItemGuid) {
			this.getView().getModel("resReq").read("/ResDemandSet('" + sItemGuid + "')");
		},

		_displayAssignmentFailureDialog: function (sItemGuid) {
			var oDemand = this.getView().getModel("resReq").getProperty("/ResDemandSet('" + sItemGuid + "')"),
				oOrg = this.getView().getModel("resReq").getProperty("/ResServiceTeamSet('" + oDemand.Organization + "')"),
				sServiceTeam = oOrg === undefined ? "" : oOrg.ServiceTeamName,
				sId = oDemand.DemandID,
				sText = i18n.getText("ASSIGNMENT_FAILURE_DIALOG1") + formatter.toInteger(sId) + " " + i18n.getText("ASSIGNMENT_FAILURE_DIALOG2") +
				formatter.toInteger(sId) + " " + i18n.getText("ASSIGNMENT_FAILURE_DIALOG3") + " " + formatter.toInteger(sId) + " " + i18n.getText(
					"ASSIGNMENT_FAILURE_DIALOG4") + " " + sServiceTeam + i18n.getText("ASSIGNMENT_FAILURE_DIALOG5");

			sap.m.MessageBox.error(sText, {
				title: "Error",
				styleClass: "",
				initialFocus: null,
				textDirection: sap.ui.core.TextDirection.Inherit
			});
		},

		_removeItemFromModel: function (sItemGuid) {
			var oModel = this.getView().getModel("WorklistDemandsToStaff"),
				oData = oModel.getData();

			oData.shift();
			this.oParentController.getView().setModel(this.oParentController.getOwnerComponent().getModel("default"));
			this.oParentController.getView().setModel(this.oParentController.getOwnerComponent().getModel("resReq"));
			this._closeDialogWhenFinished(oModel);
		},

		_getSelectedAssignment: function (oController) {
			var aSelectedItems = this.getView().getModel("WorklistDemandsToStaff").getData(),
				sPathSelected = aSelectedItems[0].getBindingContextPath(),
				oAssignmentSelected = this.getView().getModel().getProperty(sPathSelected);

			return oAssignmentSelected;
		},

		setAssignmentWarningDetails: function () {
			var oCurrentAssignment = this.getView().getModel("WorklistDemandsToStaff").getData()[0],
				iAssignmentDuration = parseFloat(oCurrentAssignment.Effort),
				iAssignmentCalloff = parseFloat(oCurrentAssignment.Calloffincl);

			AssignmentsWarningHelper.initialize(oCurrentAssignment.Startdate, oCurrentAssignment.Endate, iAssignmentDuration,
				iAssignmentCalloff, this);

		},

		/**
		 * Closes the staffing dialog
		 *
		 * @public
		 * @returns {void}
		 */
		closeStaffingDialog: function () {
			this._removeItemFromModel();
		},

		_closeDialogWhenFinished: function (oModel) {
			if ((oModel.getData().length <= 0 && this.oParentController._assignWorklistItems.isOpen())) {
				this.oParentController._assignWorklistItems.close();

			} else {
				this.setAssignmentWarningDetails();
				this.getView().getModel("WorklistDemandsToStaff").updateBindings(true);
			}
		},
		getDateString: function (date) {
			var year = date.getFullYear();
			var month = date.getMonth() + 1;
			if (month < 10) {
				var month_append = "0";
			} else {
				var month_append = "";
			}
			var dat = date.getDate();
			if (dat < 10) {
				var dat_append = "0";
			} else {
				var dat_append = "";
			}

			return (year + "" + month_append + "" + month + "" + dat_append + "" + dat);
		},
		handleTasktypeDropdown: function (oEvent) {

		},
		handleFractionDropdown: function(oEvent){
			
		},
		onHelpButtonClickfrStaffManager : function(oEvent){
			var oButn = oEvent.getSource().sId;
			this._rowCombo = oButn.split("-")[4];
			if (!this._ProdId) {
				this._ProdId = sap.ui.xmlfragment("sap.support.boost.fragment.f4helpp", this);
				this.getView().addDependent(this._ProdId);
			}
			this._ProdId.addStyleClass("sapUiSizeCompact");
			var myModel = new sap.ui.model.json.JSONModel({
				empData: []
			});
			this.getView().setModel(myModel, "userEmpModel");

			this._ProdId.open();
			sap.ui.getCore().byId("idFrstName").setValue("");
			sap.ui.getCore().byId("idLstName").setValue("");
			sap.ui.getCore().byId("idEmpNum").setValue("");
		},
		onSearchName: function () {
			var urlFilter;
			sap.ui.getCore().byId("idF4Table").getModel("userEmpModel").setData({
				empData: []
			});
			var fName = sap.ui.getCore().byId("idFrstName").getValue();
			var lName = sap.ui.getCore().byId("idLstName").getValue();
			var cId = sap.ui.getCore().byId("idEmpNum").getValue();
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-ddTHH:MM:ss"
			});
			var date = oDateFormat.format(new Date());
			if (fName !== "" && lName === "" && cId === "") {
				urlFilter = ["$filter=(substringof('" + fName + "',FirstName)and BegDate eq datetime'" + date + "' and EndDate eq datetime'" +
					date + "')"
				];
			} else if (lName !== "" && fName === "" && cId === "") {
				urlFilter = ["$filter=(substringof('" + lName + "',LastName)and BegDate eq datetime'" + date + "' and EndDate eq datetime'" +
					date + "')"
				];
			} else if (cId !== "" && fName === "" && lName === "") {
				urlFilter = ["$filter=( EmpId eq '" + cId + "' and BegDate eq datetime'" + date + "' and EndDate eq datetime'" + date + "')"];
			} else if (fName !== "" && lName !== "" && cId === "") {
				urlFilter = ["$filter=(substringof('" + fName + "',FirstName) and substringof('" + lName +
					"',LastName) and BegDate eq datetime'" + date + "' and EndDate eq datetime'" + date + "')"
				];
			} else if (fName !== "" && cId !== "" && lName === "") {
				urlFilter = ["$filter=(substringof('" + fName + "',FirstName) and EmpId eq '" + cId +
					"' and BegDate eq datetime'" + date + "' and EndDate eq datetime'" + date + "')"
				];
			} else if (lName !== "" && cId !== "" && fName === "") {
				urlFilter = ["$filter=(substringof('" + lName + "',LastName) and EmpId eq '" + cId +
					"' and BegDate eq datetime'" + date + "' and EndDate eq datetime'" + date + "')"
				];
			} else if (fName !== "" && lName !== "" && cId !== "") {
				urlFilter = ["$filter=(substringof('" + fName + "',FirstName) and substringof('" + lName + "',LastName) and EmpId eq '" + cId +
					"' and BegDate eq datetime'" + date + "' and EndDate eq datetime'" + date + "')"
				];
			}
			this._ProdId.setBusy(true);
			this.getView().getModel("resReq").read("/ResourceList", {
				async: true,
				method: "GET",
				urlParameters: urlFilter,
				success: function (oData, response) {
					this._ProdId.setBusy(false);
					var mData = oData.results;
					if (mData.length > 0) {
						for (var i = 0; i <= mData.length - 1; i++) {
							this.getView().getModel("userEmpModel").getProperty("/empData").push(mData[i]);
						}
						this.getView().getModel("userEmpModel").refresh(true);
					} else {
						sap.m.MessageToast.show("NO DATA");
					}
				}.bind(this),
				error: function (err) {
					this._ProdId.setBusy(false);
					sap.m.MessageToast.show("Error in getting values");
				}
			});

		},
		onSelectionF4Name: function (oEvent){
			var selItem = oEvent.getParameter("listItem").getBindingContext("userEmpModel").getObject();
			this._selEmpId = selItem.EmpId;
			this._selEmpName = selItem.FullName;
		//	this.getView().byId("idStaffManager").setText(selItem.EmpId+" - "+selItem.FullName);
		//	this.getView().byId("idStaffManager").setProperty("text",selItem.EmpId+"-"+selItem.FullName);
		//	this.getView().byId("idStaffManagerName").setText(selItem.EmpId);
			this.getView().getModel("WorklistDemandsToStaff").getData()[0].StaffMngrName = selItem.FullName;
			this.getView().getModel("WorklistDemandsToStaff").getData()[0].StaffingManager = selItem.EmpId;
			this.getView().byId("idStaffManager").setVisible(true);
			this.getView().byId("idStaffManagerName").setVisible(false);
			this.getView().byId("idStaffManagerName").getParent().setJustifyContent("Start");
			this.getView().getModel("WorklistDemandsToStaff").updateBindings(true);
			this.getView().getModel("WorklistDemandsToStaff").refresh(true);
		},
		onf4HelpOk: function (oEvent){
			this._ProdId.close();
		},
		onCancelFragment : function(oEvent){
			this._ProdId.close();
		}
	});

});