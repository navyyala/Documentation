jQuery.sap.includeStyleSheet(sap.ui.resource("PO_PM_DOCS", "css/style.css"));
jQuery.sap.declare("PO_PM_DOCS.Component");
jQuery.sap.require("PO_PM_DOCS.MyRouter");
sap.ui.core.UIComponent.extend("PO_PM_DOCS.Component", {
	metadata: {
		name: "PO_PM_DOCS",
		version: "1.0",
		includes: [],
		dependencies: {
			libs: [
				"sap.m",
				"sap.ui.layout"
			],
			components: []
		},
		rootView: "PO_PM_DOCS.view.App",
		config: {
			"resourceBundle": "i18n/messageBundle.properties",
			"serviceConfig": {
				"name": "ZGPM_DOCUMENTATIONS_SRV",
				"serviceUrl": "/sap/opu/odata/sap/ZGPM_DOCUMENTATIONS_SRV/"
			}
		},
		routing: {
			config: {
				routerClass: PO_PM_DOCS.MyRouter, // eslint-disable-line no-undef
				viewType: "XML",
				viewPath: "PO_PM_DOCS.view",
				targetAggregation: "detailPages",
				clearTarget: false
			},
			routes: [{
				pattern: "",
				name: "main",
				view: "Master",
				targetAggregation: "masterPages",
				targetControl: "idAppControl",
				subroutes: [{
					pattern: "{entity}/:tab:",
					name: "detail",
					view: "Detail"
				}]
			}, {
				name: "catchallMaster",
				view: "Master",
				targetAggregation: "masterPages",
				targetControl: "idAppControl",
				subroutes: [{
					pattern: ":all*:",
					name: "catchallDetail",
					view: "NotFound",
					transition: "show"
				}]
			}]
		}
	},
	init: function () {
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
		var mConfig = this.getMetadata().getConfig();
		// Always use absolute paths relative to our own component
		// (relative paths will fail if running in the Fiori Launchpad)
		var oRootPath = jQuery.sap.getModulePath("PO_PM_DOCS");
		// Set i18n model
		var i18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl: [
				oRootPath,
				mConfig.resourceBundle
			].join("/")
		});
		this.setModel(i18nModel, "i18n");
		var sServiceUrl = mConfig.serviceConfig.serviceUrl;
		//This code is only needed for testing the application when there is no local proxy available
		var bIsMocked = jQuery.sap.getUriParameters().get("responderOn") === "true";
		// Start the mock server for the domain model
		if (bIsMocked) {
			this._startMockServer(sServiceUrl);
		}
		// Create and set domain model to the component
		var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, {
			json: true,
			loadMetadataAsync: true
		});
		oModel.attachMetadataFailed(function () {
			this.getEventBus().publish("Component", "MetadataFailed");
		}, this);
		this.setModel(oModel);
		// Set device model
		var oDeviceModel = new sap.ui.model.json.JSONModel({
			isTouch: sap.ui.Device.support.touch,
			isNoTouch: !sap.ui.Device.support.touch,
			isPhone: sap.ui.Device.system.phone,
			isNoPhone: !sap.ui.Device.system.phone,
			listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
			listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive",
			system: sap.ui.Device.system
		});
		oDeviceModel.setDefaultBindingMode("OneWay");
		this.setModel(oDeviceModel, "device");
		this.setModel(new sap.ui.model.json.JSONModel(), "displaySettings");
		// 		this._getDisplaySettings();
		this.setModel(new sap.ui.model.json.JSONModel({
			"admin": false
		}), "userMode");
		this.setModel(new sap.ui.model.json.JSONModel({
			requestor: false,
			workType: false,
			groupCode: false
		}), "orderEnableFields");
		this.getRouter().initialize();
	},
	_startMockServer: function (sServiceUrl) {
		jQuery.sap.require("sap.ui.core.util.MockServer");
		var oMockServer = new sap.ui.core.util.MockServer({
			rootUri: sServiceUrl
		});
		var iDelay = +(jQuery.sap.getUriParameters().get("responderDelay") || 0);
		sap.ui.core.util.MockServer.config({
			autoRespondAfter: iDelay
		});
		oMockServer.simulate("model/metadata.xml", "model/");
		oMockServer.start();
		sap.m.MessageToast.show("Running in demo mode with mock data.", {
			duration: 4000
		});
	},
	getEventBus: function () {
		return sap.ui.getCore().getEventBus();
	},
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