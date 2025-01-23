sap.ui.define([
	"sap/support/boost/controller/mainPage.controller",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function(MainPage, ManagedObject, ODataModel, JSONModel) {
	"use strict";

	QUnit.module("mainPage", {
		before: function(){
			this.oDataModel = new ODataModel("/sap/opu/odata/test", true);
			this.odatePickModel = new JSONModel();
			this.oConfigModel = new JSONModel();
			
			this.oComponent = new ManagedObject();
			this.oComponent.setModel(this.oDataModel);
			this.oComponent.setModel(this.odatePickModel, "datePick");
			this.oComponent.setModel(this.oConfigModel, "Config");
		},
		after: function(){
			this.oDataModel.destroy();
			this.odatePickModel.destroy();
			this.oComponent.destroy();
		},
		beforeEach: function() {
			this.oMainPage = new MainPage();
			sinon.stub(this.oMainPage, "getOwnerComponent").returns(this.oComponent);
		},
		afterEach: function() {
			this.oMainPage.destroy();
			sinon.restore();
		}
	});
	
	QUnit.test("Should read 'Regions' and 'Teams' data after page initialized.", function(assert){
		//Arrangement
		var oStubRegion = this.stub(this.oMainPage, "getRegions");
		var oStubTeam = this.stub(this.oMainPage, "getTeams");
		//Action
		this.oMainPage.onInit();
		//Assertion
		assert.equal(oStubRegion.callCount, 1);
		assert.equal(oStubTeam.callCount, 1);
		
	});
	
	QUnit.test("Should read 'Regions' data base current date ", function(assert){
		//Arrangement
		this.oComponent.getModel("datePick").setProperty("/", {
				"date": new Date("2020-01-16")
			}); // suppose current date is 2020-01-16
		var oStubRead = this.stub(this.oDataModel, "read");
		//Action
		this.oMainPage.getRegions();
		//Assertion
		assert.deepEqual(oStubRead.args[0][1].urlParameters, ["$filter= Date eq datetime'2020-01-16T00:00:00'"]);
		
	});
	
	QUnit.test("Should read 'Teams' data one month from now and base on selected region.", function(assert){
		//Arrangement
		this.oComponent.getModel("datePick").setProperty("/", {
				"date": new Date("2020-01-06")
			}); // suppose current date is 2020-01-16
		this.oControlStub = sinon.stub(this.oMainPage, "byId").returns(new sap.m.ComboBox("combo_Region",{selectedKey :"EMEA"}));
		var oStubRead = this.stub(this.oDataModel, "read");
		//Action
		this.oMainPage.getTeams();
		//Assertion
		assert.deepEqual(oStubRead.args[0][1].urlParameters, ["$filter= Date ge datetime'2019-12-06T00:00:00' and Date le datetime'2020-01-06T00:00:00' and  Region eq 'EMEA'",
  "$orderby=Team_Id"]);
		
	});
	
	QUnit.test("Should read 'Teams' data when datePicker changed.", function(assert){
		//Arrangement
		var oStubTeam = this.stub(this.oMainPage, "getTeams");
		//Action
		this.oMainPage.handleDatePickerChange();
		//Assertion
		assert.equal(oStubTeam.callCount, 1);
	});
	
	QUnit.test("Should read 'Teams' data when Region changed.", function(assert){
		//Arrangement
		var oStubTeam = this.stub(this.oMainPage, "getTeams");
		//Action
		this.oMainPage.handleRegionChange();
		//Assertion
		assert.equal(oStubTeam.callCount, 1);
	});
	
	QUnit.test("When click 'Day' button, region ComboBox should available and team ComboBox should unavailable.", function(assert){
		//Arrangement
		//Action
		this.oMainPage.onDay();
		//Assertion
		assert.equal(this.oComponent.getModel("Config").getProperty("/region"), true);
		assert.equal(this.oComponent.getModel("Config").getProperty("/team"), false);
	});
	
	QUnit.test("When click 'Month' button, region ComboBox should available and team ComboBox should available.", function(assert){
		//Arrangement
		//Action
		this.oMainPage.onMonth();
		//Assertion
		assert.equal(this.oComponent.getModel("Config").getProperty("/region"), true);
		assert.equal(this.oComponent.getModel("Config").getProperty("/team"), true);
	});
	
	QUnit.test("When click 'Duty Manager' button, region ComboBox should unavailable and team ComboBox should unavailable.", function(assert){
		//Arrangement
		//Action
		this.oMainPage.onDutyManager();
		//Assertion
		assert.equal(this.oComponent.getModel("Config").getProperty("/region"), false);
		assert.equal(this.oComponent.getModel("Config").getProperty("/team"), false);
	});

});
























