sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/util/MockServer",
	"sap/ui/core/Core",
	"sap/m/MessageToast",
	"sap/ui/Device",
	"PO_PM_DOCS/MyRouter"
], function (UIComponent, JSONModel, MockServer, Core, MessageToast, Device /*, MyRouter*/ ) {
	"use strict";

	return UIComponent.extend("PO_PM_DOCS.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * Initializes the component. The default OData model and the "i18n" resource model
		 * are created automatically by UIComponent based on manifest.json (metadata: "json").
		 * This init only wires up behavior that cannot be expressed declaratively: mock server
		 * bootstrap, the device/display-settings/user-mode/order-field JSON models, and the
		 * metadata-failed event-bus notification - preserving the original Component.js logic.
		 * @public
		 */
		init: function () {
			UIComponent.prototype.init.apply(this, arguments);

			var sServiceUrl = this.getManifestEntry("/sap.app/dataSources/mainService/uri") ||
				"/sap/opu/odata/sap/ZGPM_DOCUMENTATIONS_SRV/";

			// This code is only needed for testing the application when there is no local proxy available
			var bIsMocked = new URLSearchParams(window.location.search).get("responderOn") === "true";
			// Start the mock server for the domain model
			if (bIsMocked) {
				this._startMockServer(sServiceUrl);
			}

			var oModel = this.getModel();
			if (oModel && oModel.attachMetadataFailed) {
				oModel.attachMetadataFailed(function () {
					this.getEventBus().publish("Component", "MetadataFailed");
				}, this);
			}

			// Set device model
			var oDeviceModel = new JSONModel({
				isTouch: Device.support.touch,
				isNoTouch: !Device.support.touch,
				isPhone: Device.system.phone,
				isNoPhone: !Device.system.phone,
				listMode: Device.system.phone ? "None" : "SingleSelectMaster",
				listItemType: Device.system.phone ? "Active" : "Inactive",
				system: Device.system
			});
			oDeviceModel.setDefaultBindingMode("OneWay");
			this.setModel(oDeviceModel, "device");

			this.setModel(new JSONModel(), "displaySettings");
			// this._getDisplaySettings();
			this.setModel(new JSONModel({
				"admin": false
			}), "userMode");
			this.setModel(new JSONModel({
				requestor: false,
				workType: false,
				groupCode: false
			}), "orderEnableFields");

			this.getRouter().initialize();
		},

		/**
		 * Starts a MockServer simulating the domain model metadata for local/demo testing.
		 * @param {string} sServiceUrl the OData service root URI to mock
		 * @private
		 */
		_startMockServer: function (sServiceUrl) {
			var oMockServer = new MockServer({
				rootUri: sServiceUrl
			});
			var iDelay = +(new URLSearchParams(window.location.search).get("responderDelay") || 0);
			MockServer.config({
				autoRespondAfter: iDelay
			});
			oMockServer.simulate("model/metadata.xml", "model/");
			oMockServer.start();
			MessageToast.show("Running in demo mode with mock data.", {
				duration: 4000
			});
		},

		getEventBus: function () {
			return Core.getEventBus();
		},

		/**
		 * Loads the DISPLAY_SETTINGSSet and stores the result in the "displaySettings" model.
		 * Not invoked by default - preserved as in the original Component.js.
		 * @private
		 */
		_getDisplaySettings: function () {
			var self = this;
			this.getModel().read("/DISPLAY_SETTINGSSet", {
				success: function (oData) {
					self.getModel("displaySettings").setData(oData);
				},
				error: function (oError) {}
			});
		}
	});
});
