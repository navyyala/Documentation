sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Core",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/Device",
	"sap/ui/util/Storage",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/m/Button",
	"sap/m/library",
	"sap/ui/core/UIComponent",
	"sap/ui/thirdparty/jquery"
	], function (Controller, Core, JSONModel, Filter, FilterOperator, Device, Storage, Dialog, Text, Button,
	mLibrary, UIComponent, jQuery) {
	"use strict";

	return Controller.extend("PO_PM_DOCS.view.Master", {

		onInit: function () {
			this.oInitialLoadFinishedDeferred = jQuery.Deferred();
			this._oEventBus = Core.getEventBus();

			var oList = this.getView().byId("list");
			var modelColor;
			oList.attachEvent("updateFinished", function () {
				this.oInitialLoadFinishedDeferred.resolve();
				//Add list item color class
				var listLength = oList.getItems().length;
				var listColor = [];
				for (var i = 0; i < listLength; i++) {
					oList.getItems()[i].addStyleClass(oList.getItems()[i].data("color"));
					listColor[i] = oList.getItems()[i].data("color");

				}
				modelColor = new JSONModel(listColor);
				this.getView().setModel(modelColor, "modelColor");
			}, this);

			//On phone devices, there is nothing to select from the list. There is no need to attach events.
			if (Device.system.phone) {
				return;
			}

			this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
			this._oEventBus.subscribe("Detail", "GoHome", this.onHomeDirect, this);
			if (Core.byId("homeBtn")) {
				Core.byId("homeBtn").setVisible(false);
			}

			var that = this;
			var oModel = this.getView().getModel();

			Core.getEventBus().subscribe("idAppControl", "RemoveSelectionEvt", function (sChannelId, sEventId, oModel) {

				that.byId("list").removeSelections(true);

			});
		},

		onAfterRendering: function () {},

		onNavBack: function () {
			window._backFromFLP = true; // eslint-disable-line sap-no-global-define
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "#"
				}
			});
			// window.history.go(-1);
		},

		//Navigation triggered
		onRouteMatched: function (oEvent) {
			this.getView().getModel().setCountSupported(false);
			var sName = oEvent.getParameter("name");
			if (sName !== "main") {
				return;
			}

			//Get Storage object to use
			var oStorage = new Storage(Storage.Type.session);
			//Get data from Storage
			var sFrom = oStorage.get("from");

			if (sFrom === "maintenance") {
				//Clear Storage
				oStorage.clear();

				location.reload(); // eslint-disable-line sap-no-location-reload
				return;
			}

			//Load the detail view in desktop
			this.loadDetailView();

			// var startupParams = this.getOwnerComponent().getComponentData().startupParameters; // get Startup params from Owner Component
			// if ((startupParams.supplierID && startupParams.supplierID[0])) {
			// 	this.getRouter().navTo("details", {
			// 		entity: "/ORDERLISTSet('" + startupParams.supplierID[0] + "')" // read Supplier ID. Every parameter is placed in an array therefore [0] holds the value
			// 	}, true);
			// }
			// else {
			// 	this.loadDetailView();
			// }

		},

		//Navigation to detail view
		loadDetailView: function () {
			this.getRouter().myNavToWithoutHash({
				currentView: this.getView(),
				targetViewName: "PO_PM_DOCS.view.Detail",
				targetViewType: "XML"
			});
		},

		//List search event
		onSearch: function () {
			this.oInitialLoadFinishedDeferred = jQuery.Deferred();
			// Add search filter
			var filters = [];
			var searchString = this.getView().byId("searchField").getValue();
			if (searchString && searchString.length > 0) {
				filters = [new Filter("Description", FilterOperator.Contains, searchString)];
			}
			this.getView().byId("list").getBinding("items").filter(filters);

			//On phone devices, there is nothing to select from the list
			if (Device.system.phone) {
				return;
			}
			this.getView().byId("listNav").removeSelections(true);
			this.getView().byId("list").removeSelections(true);
		},

		//List item selected event
		onSelect: function () {
			this.getView().byId("listNav").removeSelections(true);
			var selectedItem = this.getView().byId("list").getSelectedItem();
			//Navigation to sub items
			// var lowerLevel = selectedItem.data("lowerLevel");
			var filters = [];
			// MTAUCH récupérer la selection
			var nameSelected = selectedItem.getBindingContext().getObject("Name");
			// var nameSelected = selectedItem.getBindingContext().toString();

			// nameSelected = nameSelected.split("'")[1];
			// Fin MTAUCH
			if (nameSelected && nameSelected.length > 0) {
				var filterName = new Filter("Name", FilterOperator.Contains, nameSelected);
				filters.push(filterName);
				this.getView().byId("list").getBinding("items").filter(filters);
				// console.log(this.getView().byId("list").getBinding("items"));
				// Also send ObjectType to OData service for navigation path filtering
				var objTypeSelected = selectedItem.data("objType");
				this._tmpObjTypeSelected = "F";
				this._tmpObjTypeSelected = objTypeSelected;
				var filterObjType = new Filter("ObjType", FilterOperator.Contains, objTypeSelected);
				filters.push(filterObjType);
				this.getView().byId("listNav").getBinding("items").filter(filters);
				this._oEventBus.publish("Master", "InitAttachments", selectedItem); // fait reference à initAttachments dans Details Controller
				// this._oEventBus.publish("Master", "onDisplayAttachmt", selectedItem);
			}

			var base64 = selectedItem.data("base64");
			window._logo = base64; // eslint-disable-line sap-no-global-define

			// If we're on a phone device, include nav in history
			var bReplace = Device.system.phone ? false : true;
			this.getRouter().navTo("detail", {
				from: "master",
				entity: selectedItem.getBindingContext().getPath().substr(1)
			}, bReplace);
		},

		//Navigation path selected event
		onSelectNav: function () {
			this.getView().byId("list").removeSelections(true);
			var selectedItem = this.getView().byId("listNav").getSelectedItem();
			window._logo = selectedItem.data("base64"); // eslint-disable-line sap-no-global-define
			var filters = [];
			var nameSelected = selectedItem.data("name");
			// console.log(nameSelected);
			if (nameSelected && nameSelected.length > 0) {
				var filterName = new Filter("Name", FilterOperator.Contains, nameSelected);
				filters.push(filterName);
				this.getView().byId("list").getBinding("items").filter(filters);
				var objTypeSelected = this._tmpObjTypeSelected;
				var filterObjType = new Filter("ObjType", FilterOperator.Contains, objTypeSelected);
				filters.push(filterObjType);
				this.getView().byId("listNav").getBinding("items").filter(filters);
				this._oEventBus.publish("Master", "InitAttachments", selectedItem);
				this._oEventBus.publish("Master", "onAttachmentsSelect", selectedItem);

			}
			window._postDescription = selectedItem.getTitle(); // eslint-disable-line sap-no-global-define
			window._equipeDescription = ""; // eslint-disable-line sap-no-global-define
		},

		//Get Router
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		//Refresh list button clicked
		onRefreshList: function () {
			//Show both master and detail views, and show plant plan
			var oSplitApp = this.getRouter()._findSplitApp(this.getView());
			oSplitApp.setMode(mLibrary.SplitAppMode.ShowHideMode);
			this.getView().byId("list").getBinding("items").filter();
			this.getView().byId("list").setSelectedItem();
			this.getView().byId("listNav").getBinding("items").filter();
			window._logo = window._homeLogo; // eslint-disable-line sap-no-global-define
			this._oEventBus.publish("Master", "ShowLogo");
			this._oEventBus.publish("Master", "clearPlan");
		},

		//Home button clicked
		onHome: function () {
			//Cancel order button click event
			var self = this;
			//Confirmation dialog
			var i18nBundle = this.getView().getModel("i18n").getResourceBundle();
			var dialog = new Dialog({
				// title: "Annulation",
				title: i18nBundle.getText("homeDialogTitle"),
				type: "Message",
				content: new Text({
					text: i18nBundle.getText("questionRetourAccueil")
				}),
				beginButton: new Button({
					text: i18nBundle.getText("reponseOui"),
					press: function () {
						//Close dialog + Show master and detail pages + show canvas plan + clear canvas and user input
						dialog.close();
						var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
						// oCrossAppNavigator.toExternal({
						// 	target: {
						// 		semanticObject: "#",
						// 	}
						// });
						// var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
						// 	target: {
						// 		semanticObject: "ZPMSEMORDERCREATE",
						// 		action: "DISPLAY_V3"
						// 	}
						// })) || "";
						// oCrossAppNavigator.toExternal({
						// 	target: {
						// 		shellHash: hash
						// 	}
						// });
						oCrossAppNavigator.toExternal({
							target: {
								semanticObject: "ZPMSEMORDERCREATE",
								action: "DISPLAY_V3"
							}
						});
						return;

						//Show both master and detail views, and show plant plan
						var oSplitApp = self.getRouter()._findSplitApp(self.getView());
						oSplitApp.setMode(mLibrary.SplitAppMode.ShowHideMode);
						self.getView().byId("list").getBinding("items").filter();
						self.getView().byId("list").setSelectedItem();
						self.getView().byId("listNav").getBinding("items").filter();
						window._logo = window._homeLogo; // eslint-disable-line sap-no-global-define
						self._oEventBus.publish("Master", "ShowLogo");
						self._oEventBus.publish("Master", "clearPlan");

					}
				}),
				endButton: new Button({
					text: i18nBundle.getText("reponseNon"),
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},
		onHomeDirect: function () {
			//Show both master and detail views, and show plant plan
			var oSplitApp = this.getRouter()._findSplitApp(this.getView());
			oSplitApp.setMode(mLibrary.SplitAppMode.ShowHideMode);
			this.getView().byId("list").getBinding("items").filter();
			this.getView().byId("list").setSelectedItem();
			this.getView().byId("listNav").getBinding("items").filter();
			window._logo = window._homeLogo; // eslint-disable-line sap-no-global-define
			this._oEventBus.publish("Master", "ShowLogo");
			this._oEventBus.publish("Master", "clearPlan");
		},

		onCreateOrderSample: function () {
			this._getCreateOrderDialog().open();
		},

		_getCreateOrderDialog: function () {
			if (!this._createOrderFragmentSP) {
				this._createOrderFragmentSP = sap.ui.xmlfragment("PO_PM_DOCS.view.fragment.createOrder", this);
				this.getView().addDependent(this._createOrderFragmentSP);
			}

			return this._createOrderFragmentSP;
		},

		onClose: function () {
			if (this._createOrderFragmentSP) {
				this._createOrderFragmentSP.close();
			}
		}
	});
});
