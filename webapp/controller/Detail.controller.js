sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Core",
	"sap/ui/core/Fragment",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Image",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/ColumnListItem",
	"sap/m/UploadCollectionParameter",
	"sap/m/library",
	"sap/ui/util/Storage",
	"sap/ui/thirdparty/jquery"
	], function (Controller, Core, Fragment, UIComponent, JSONModel, ODataModel, Filter, FilterOperator, MessageToast,
	Dialog, Image, Button, Text, ColumnListItem, UploadCollectionParameter, mLibrary, Storage, jQuery) {
	"use strict";

	return Controller.extend("PO_PM_DOCS.view.Detail", {
		onInit: function () {
			if (window._backFromFLP) {
				location.reload(); // eslint-disable-line sap-no-location-reload
			} else {
				window._backFromFLP = false; // eslint-disable-line sap-no-global-define
			}
			this._oView = this.getView();
			this._oComponent = this.getOwnerComponent();
			this._oResourceBundle = this._oComponent.getModel("i18n").getResourceBundle();
			this._frgIdLogo = this._oView.getId() + "-logo";
			// this._frgIdCanvas = this._oView.getId() + "-canvas";
			this._frgIdListAttachments = this._oView.getId() + "-listAttachments";
			// this._listAttachments = sap.ui.xmlfragment(this._frgIdListAttachments, "PO_PM_DOCS.view.fragment.listAttachments", this);
			this._frgIdCreateOrder = this._oView.getId() + "-createOrder";
			this._frgIdaddEditItemDialog = this._oView.getId() + "-addEditItemDialog";
			this._itemsModel = new JSONModel();
			this.getRouter().attachRouteMatched(this.onRouteMatched, this);
			this.showLogo();
			this._oEventBus = Core.getEventBus();
			this._oEventBus.subscribe("Master", "ShowLogo", this.showLogo, this);
			this._oEventBus.subscribe("Master", "InitAttachments", this.initAttachments, this);
			this._oEventBus.subscribe("Master", "clearPlan", this.clearPlan, this);
			//Disable Swipe event to prevent showing master page in detail page
			// jQuery(window).on("swipe", function (e) {
			// 	throw "stop";
			// });
			this._canvasEventsAdded = false;

			var self = this;
			var uri = "/sap/opu/odata/sap/ZGPM_DOCUMENTATIONS_SRV/";
			// create OData model from URL
			var oModel = new ODataModel(uri, true);
			oModel.read("/PHOTOSet", null, null, true,
				function (oEvent) {
					self._logo = oEvent.results[0].Base64.replace("application/octet-stream", "image/png");
					window._homeLogo = self._logo; // eslint-disable-line sap-no-global-define
					Fragment.byId(self._frgIdLogo, "img_logo").setSrc(self._logo);
				},
				function (oEvent) {
					// console.log("An error occured while reading Employees!");
				});

			var oViewModel = new JSONModel({
				imgVisible: true
			});
			this.getView().setModel(oViewModel, "createOrderViewModel");
		},
		//Page after rendering event
		onAfterRendering: function () {},

		//Navigation event
		onRouteMatched: function (oEvent) {
			var oParameters = oEvent.getParameters();
			// When navigating in the Detail page, update the binding context
			if (oParameters.name !== "detail") {
				return;
			}
			var sEntityPath = "/" + oParameters.arguments.entity;
			this._oView.bindElement(sEntityPath);
			this._sEntityPath = sEntityPath;
			//Get current poste/equipement from model
			var oModel = this._oView.getModel();
			//  MTAUCH : Ajouter table attachment
			if (this._data) {
				this.onDisplayAttachmt();
			} else {
				this.getRouter().navTo("master");
			}
			// this._planUrl = oModel.getProperty(sEntityPath + "/PathLayout");
			// if (!this._planUrl) {
			// 	this.getView().getModel("createOrderViewModel").setProperty("/imgVisible", false);
			// } else {
			// 	this.getView().getModel("createOrderViewModel").setProperty("/imgVisible", true);
			// }
			// this._objType = oModel.getProperty(sEntityPath + "/ObjType");
			// if (this._objType === "F") {
			// 	window._postName = oModel.getProperty(sEntityPath + "/Name");
			// 	window._postDescription = oModel.getProperty(sEntityPath + "/Description");
			// }
			// if (this._objType === "E") {
			// 	window._equipeName = oModel.getProperty(sEntityPath + "/Name");
			// 	window._equipeDescription = oModel.getProperty(sEntityPath + "/Description");
			// 	oModel.callFunction("/GET_FUNC_BY_EQU", // function import name
			// 		{
			// 			method: "GET",
			// 			urlParameters: {
			// 				"Equnr": window._equipeName
			// 			},
			// 			success: function (oData) {
			// 				window._postName = oData.Name;
			// 				window._postDescription = "";
			// 			},
			// 		function (oError) {

			// 		}); // callback function for error
			// }

			// //Get token
			// this.getUploadToken();

			// Fin MTAUCH
		},
		//Navigation back event
		onNavBack: function () {
			if (this._oView.byId("btn_cancelAttachmt")) {
				this._oView.byId("btn_cancelAttachmt").setVisible(false);
			}
			//Show master and detail pages + show canvas plan + clear canvas and user input
			var oSplitApp = this.getRouter()._findSplitApp(this._oView);
			oSplitApp.setMode(mLibrary.SplitAppMode.ShowHideMode);
			this._oEventBus.publish("Detail", "GoHome");
			this.onEffacer();
			this.clearAll(self);
		},
		//Get Router
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},
		//Clear user input
		clearAll: function (self) {
			Fragment.byId(this._frgIdCreateOrder, "cb_priority").setSelectedKey();
			Fragment.byId(this._frgIdCreateOrder, "cb_typeActivite").setSelectedKey();
			Fragment.byId(this._frgIdCreateOrder, "cb_emmeteur").setSelectedKey();
			// Fragment.byId(this._frgIdCreateOrder, "cb_group").setSelectedKey();
			Fragment.byId(this._frgIdCreateOrder, "cb_centreTravail").setSelectedKey();
			Fragment.byId(this._frgIdCreateOrder, "cb_CatFail").setSelectedKey();
			Fragment.byId(this._frgIdCreateOrder, "cb_FailCode").setSelectedKey();
			Fragment.byId(this._frgIdCreateOrder, "cb_CauseCode").setSelectedKey();
			Fragment.byId(this._frgIdCreateOrder, "cb_CatFunc").setSelectedKey();
			Fragment.byId(this._frgIdCreateOrder, "cb_FunCode").setSelectedKey();
			Fragment.byId(this._frgIdCreateOrder, "cb_CatFun").setSelectedKey();
			Fragment.byId(this._frgIdCreateOrder, "headerDesc").setValue("");
			Fragment.byId(this._frgIdCreateOrder, "Uploads").destroyItems();

			this.getOwnerComponent().getModel("orderEnableFields").setData({
				requestor: false,
				workType: false,
				groupCode: false
			});
			// window._equipeName = "";
			// window._equipeDescription = "";
			// window._postName = "";
			// window._postDescription = "";
			Fragment.byId(this._frgIdCreateOrder, "txt_Equipement").setText("");
			// Fragment.byId(this._frgIdCreateOrder, "txt_PosteTechniqe").setText("");
			self._canvasFrom = "plan";
			var model = this.getView().getModel();
			model.remove("/ATTACHSet(Tplnr='',Equnr='',Dktxt='')", null, null, function () {});
		},

		navToConfirmApp: function (sAufnr, sTechId) {

			//Get Storage object to use
			var oStorage = new Storage(Storage.Type.session);
			//Set data into Storage
			oStorage.put("from", "maintenance");

			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); // get a handle on the global XAppNav service
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					semanticObject: "ZPMORDERCONF",
					action: "DISPLAY_V3"
				},
				params: {
					"orderID": sAufnr,
					"technician": sTechId
				}
			})) || ""; // generate the Hash to display a order
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: hash
				}
			});
		}, // navigate to Supplier application

		// //Show plant plan
		showLogo: function () {
			if (!this._logoFragment) {
				this._logoFragment = sap.ui.xmlfragment(this._frgIdLogo, "PO_PM_DOCS.view.fragment.logo", this);
				this._oView.addDependent(this._logoFragment);
				this._oView.byId("detailPage").removeAllContent();
				this._oView.byId("detailPage").addContent(this._logoFragment);
			} else {
				if (this._oView.byId("detailPage")) {
					if (this._oView.byId("detailPage").getContent()[0] !== this._logoFragment) {
						this._oView.byId("detailPage").removeAllContent();
						this._oView.byId("detailPage").addContent(this._logoFragment);
					}
				}
			}
			if (this._oView.byId("btn_createOrder")) {
				this._oView.byId("btn_createOrder").setVisible(false);
			}
			if (this._oView.byId("btn_saveOrder")) {
				this._oView.byId("btn_saveOrder").setVisible(false);
			}
			if (this._oView.byId("btn_cancel")) {
				this._oView.byId("btn_cancel").setVisible(false);
			}
			if (this._oView.byId("btn_saveCanvas")) {
				this._oView.byId("btn_saveCanvas").setVisible(false);
			}
			if (this._oView.byId("btn_cancelCanvas")) {
				this._oView.byId("btn_cancelCanvas").setVisible(false);
			}
			if (this._oView.byId("btn_takePhoto")) {
				this._oView.byId("btn_takePhoto").setVisible(false);
			}

			Fragment.byId(this._frgIdLogo, "img_logo").setSrc(this._logo);
			if (window._logo !== "") { // eslint-disable-line sap-no-global-define
				Fragment.byId(this._frgIdLogo, "img_logo").setSrc(window._logo);
				window._logo = ""; // eslint-disable-line sap-no-global-define
			}
		},
		//Init Btn for show list Attachments
		initAttachments: function (channel, event, selectedItem) {
			// console.log(selectedItem);
			var self = this;
			if (channel === "Master") {
				if (this._oView.byId("btn_cancelAttachmt").getVisible() === false) {
					self._oView.byId("btn_displayAttachmt").setVisible(true);
				} else {
					self._oView.byId("btn_cancelAttachmt").setVisible(false);
					self._oView.byId("detailPage").removeAllContent();
					self._oView.byId("btn_displayAttachmt").setVisible(true);
				}
				self._oView.byId("btn_displayAttachmt").setVisible(true);
				// MTAUCH Référence to Selection Name
				// self._nameSelected = selectedItem.getBindingContext().toString();
				// self._nameSelected = self._nameSelected.split("'")[1];
				self._nameSelected = selectedItem.getBindingContext().getObject("Name");
				// self._objType = selectedItem.data("objType");
				self._objType = selectedItem.getBindingContext().getObject("ObjType");
				//  Fin MTAUCH
				self._descr = selectedItem.getProperty("title");
				self._data = [{
					"name": self._nameSelected,
					"title": self._descr,
					"objType": self._objType
				}];

				self.showListAttachments(self._data); //oData Results here
				// oData Request here.
				// [...]
			} else if (channel === "Details") {
				this.showListAttachments(self._data); //oData Results here
			}
		},

		// Show list of Attachments
		showListAttachments: function (oData) {
			this._oView.byId("btn_displayAttachmt").setVisible(false);
			this._oView.byId("btn_cancelAttachmt").setVisible(true);
			var oModel = new JSONModel(oData[0]);
			// console.log(oModel);
			this._oView.setModel(oModel, "list");

			if (!this._listAttachments) {
				this._listAttachments = sap.ui.xmlfragment(this._frgIdListAttachments, "PO_PM_DOCS.view.fragment.listAttachments", this);
				this._oView.addDependent(this._listAttachments);
				this._oView.byId("detailPage").removeAllContent();
				this._oView.byId("detailPage").addContent(this._listAttachments);
			} else {
				if (this._oView.byId("detailPage")) {
					if (this._oView.byId("detailPage").getContent()[0] !== this._listAttachments) {
						this._oView.byId("detailPage").removeAllContent();
						this._oView.byId("detailPage").addContent(this._listAttachments);
					}
				}
			}

			// MTAUCH filtre liste attachment selon selection (Functional location ou equipment)
			var oTable = Fragment.byId(this._frgIdListAttachments, "tableAttachments");
			if (oTable && oData.length > 0) {
				var oRef = oData[0];
				var aFilters = [];
				var sProperty;
				if (oRef.objType === "F") {
					sProperty = "FuncLoc";
				} else if (oRef.objType === "E") {
					sProperty = "Equipment";
				}
				if (sProperty) {
					aFilters.push(new Filter(sProperty, "EQ", oRef.name));

					oTable.getBinding("items").filter(aFilters);
				}
			}
			// Fin MTAUCH
		},

		//load list of Attachments
		onDisplayAttachmt: function () {
			this._channel = "Details";
			this.initAttachments(this._channel);
			// this.showListAttachments();
		},

		onCancelAttachmt: function () {
			if (this._oView.byId("detailPage")) {
				if (this._oView.byId("detailPage").getContent()[0] === this._listAttachments) {
					this._oView.byId("detailPage").removeContent(this._listAttachments);
					this._oView.byId("btn_cancelAttachmt").setVisible(false);
					this._oView.byId("btn_displayAttachmt").setVisible(true);
				} else if (this._oView.byId("detailPage").getContent()[0] === this._oHtml) {
					this._oView.byId("detailPage").removeContent(this._oHtml);
					this.initAttachments("Details");
				}
			}
			Core.getEventBus().publish("idAppControl", "RemoveSelectionEvt");
		},

		// #1
		onAttachmentsSelect: function (oEvent) {
			// console.log(oEvent);
			var that = this;
			var selectedItem = oEvent.getSource().getBindingContext().getPath().substr(11);
			// console.log(selectedItem);
			var oModel = this._oView.getModel();
			if (this._data[0].color === "CDCDCDC") {
				this._object = "EQUI";
			} else {
				this._object = "IFLOT";
			}
			// console.log(this._object);
			this._oValue = selectedItem.split("'");
			this.getView().setBusy(true);

			oModel.read("/ATTACHSet(DocType='" + this._oValue[1] + "',DocPart='" + this._oValue[3] + "',DocID='" + this._oValue[5] +
				"',DocVersion='" + this._oValue[7] + "',Object='" + this._object + "',ObjectKey='" + this._data[0].name + "')/$value", {
					success: function (oData, response) {
						that.getView().setBusy(false);
						// console.log(response); // Vérifier que les données sont bien la;
						if (response) { //if (oData && oData.results)

							that._oDataAttachments = response; // a modifier en fonction de la structure retournée
							that._oView.byId("detailPage").removeContent(that._listAttachments); // enleve la liste des documents de la page
							that.loadDocument(response); // load PDF with oData response

							that._oView.byId("btn_displayAttachmt").setVisible(true);

							// var file = response.requestUri;
							// window.open(file);
						}
					},

					error: function (oError) {
						that.getView().setBusy(false);
						var errorObj = JSON.parse(oError.response.body);
						MessageToast.show(errorObj.error.message.value);
					}
				});

		},

		// #2
		loadDocument: function (response) {
			this._oHtml = this._oView.byId("idFrame");
			this._sDocumentPath = response.requestUri;
			// var pdfWindow = window.open();
			// var sIFrame = pdfWindow.document.write("<iframe width='100%' height='100%' src='data:application/pdf;base64, " + encodeURI(response.data.Base64)+"'></iframe>");
			// console.log(response.data);
			// console.log(this._sDocumentPath);
			MessageToast.show("Chargement du fichier PDF, veuillez patientez");
			var sIFrame = '<iframe src="' + this._sDocumentPath + '" height="' + this._getAvailableHeight() + '" width="100%"></iframe>';
			this._oHtml.setContent(sIFrame);
			this._oView.byId("detailPage").addContent(this._oHtml);
			this._oView.byId("btn_cancelAttachmt").setVisible(true);
		},

		_getAvailableHeight: function () {
			var oHeight = jQuery(this._oView.byId("detailPage").getDomRef()).height();
			var iFrameHeight = oHeight - 104;
			return iFrameHeight + "px";
		},

		//Show create order page
		showCreateOrder: function () {
			if (!this._createOrderFragment) {
				this._createOrderFragment = sap.ui.xmlfragment(this._frgIdCreateOrder, "PO_PM_DOCS.view.fragment.createOrder", this);
				this._modifyOperationFragment = sap.ui.xmlfragment(this._frgIdCreateOrder, "PO_PM_DOCS.view.fragment.modifyOperation",
					this);
				this._oView.addDependent(this._createOrderFragment);
				this._oView.addDependent(this._modifyOperationFragment);
				this._oView.byId("detailPage").removeAllContent();
				this._oView.byId("detailPage").addContent(this._createOrderFragment);
				this._oView.byId("detailPage").addContent(this._modifyOperationFragment);
			} else {
				if (this._oView.byId("detailPage")) {
					if (this._oView.byId("detailPage").getContent()[0] !== this._createOrderFragment) {
						this._oView.byId("detailPage").removeAllContent();
						this._oView.byId("detailPage").addContent(this._createOrderFragment);
						this._oView.byId("detailPage").addContent(this._modifyOperationFragment);
					}
				}
			}
			this._oView.byId("btn_createOrder").setVisible(false);
			this._oView.byId("btn_saveOrder").setVisible(true);
			this._oView.byId("btn_cancel").setVisible(true);
			this._oView.byId("btn_saveCanvas").setVisible(false);
			this._oView.byId("btn_cancelCanvas").setVisible(false);
			if (!this.getView().getModel("device").getProperty("/system/desktop")) {
				this._oView.byId("btn_takePhoto").setVisible(true);
			}
		},
		//Clear canvas drawing
		onEffacer: function () {
			this._canvasChanged = false;
			var canvas = document.getElementById(this._frgIdCanvas + "--canvas");
			if (canvas) {
				var ctx = canvas.getContext("2d");
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}
		},
		//Pencil tool selected
		onPencil: function () {
			this._drawTool = "pencil";
		},
		//Circle tool selected
		onCircle: function () {
			this._drawTool = "circle";
		},
		//Clear plan
		clearPlan: function () {
			if (this._oView.byId("btn_cancelAttachmt")) {
				this._oView.byId("btn_cancelAttachmt").setVisible(false);
			}
			if (this._oView.byId("btn_displayAttachmt")) {
				this._oView.byId("btn_displayAttachmt").setVisible(false);
			}
			this._plan = null;
			window._equipeName = ""; // eslint-disable-line sap-no-global-define
			window._equipeDescription = ""; // eslint-disable-line sap-no-global-define
			this.onEffacer();
		},

		//Mini plan clicked, show dialog with full size plan
		imgPlanPressed: function () {
			var self = this;
			if (this.getView().getModel("createOrderViewModel").getProperty("/imgVisible")) {
				var dialog = new Dialog({
					title: "Plan",
					content: new Image({
						src: this._dataURL
					}),
					beginButton: new Button({
						text: self._oResourceBundle.getText("btnClose"),
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});

				//to get access to the global model
				this.getView().addDependent(dialog);
				dialog.open();
			}
		},

		//Add or modify item
		onAddEditItem: function (from) {
			if (!this._addEditItemDialog) {
				this._addEditItemDialog = sap.ui.xmlfragment(this._frgIdaddEditItemDialog, "PO_PM_DOCS.view.fragment.addEditItem", this);
				this._oView.addDependent(this._addEditItemDialog);
			}
			//Edit mode
			var itemIntervenant = null;
			var itemDesc = null;
			//var headerDesc = Fragment.byId(this._frgIdCreateOrder, "headerDesc").getValue();
			var selectedItemNo;
			if (from.getSource().getBinding("text") && from.getSource().getBinding("text").getPath() === "textBtnAddOperation") {
				// DONOTHING
			} else {
				selectedItemNo = from.getSource().getParent().getCells()[0].getText();
				for (var i = 0; i < this._itemsData.length; i++) {
					if (this._itemsData[i].Vornr === selectedItemNo) {
						itemIntervenant = this._itemsData[i].Pernr;
						if (this._itemsData[i].Description !== "") {
							itemDesc = this._itemsData[i].Description;
						} else {
							//itemDesc = headerDesc;
						}
						break;
					}
				}
			}
			// var selIntervenant = Fragment.byId(this._frgIdCreateOrder, "cb_intervenant").getSelectedKey();
			if (itemIntervenant === null && itemDesc === null) {
				Fragment.byId(this._frgIdaddEditItemDialog, "addEditItemDialog").setTitle(this._oResourceBundle.getText(
					"dialogAddOperation"));
			} else {
				Fragment.byId(this._frgIdaddEditItemDialog, "addEditItemDialog").setTitle(this._oResourceBundle.getText(
					"dialogModifyOperation"));
			}
			if (itemIntervenant && itemIntervenant.length > 0) {
				Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").setSelectedKey(itemIntervenant);
			} else {
				Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").setSelectedKey();
			}
			Fragment.byId(this._frgIdaddEditItemDialog, "itemDesc").setValue(itemDesc);
			this._tmpItemNo = selectedItemNo;
			this._addEditItemDialog.open();
		},
		closeDialog: function () {
			Fragment.byId(this._frgIdaddEditItemDialog, "itemDesc").setValueState("None");
			if (this._addEditItemDialog) {
				this._tmpItemNo = null;
				this._addEditItemDialog.close();
			}
		},
		saveItem: function () {
			Fragment.byId(this._frgIdaddEditItemDialog, "itemDesc").setValueState("None");
			var dialogIntervenant = Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").getSelectedKey();
			// var dialogIntervenantName = Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").getSelectedItem().getText();
			var dialogIntervenantName = (dialogIntervenant) ? Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").getSelectedItem()
				.getText() : "";

			var dialogDescription = Fragment.byId(this._frgIdaddEditItemDialog, "itemDesc").getValue();
			if (dialogDescription === "") {
				// & this._tmpItemNo !== "0010") {
				Fragment.byId(this._frgIdaddEditItemDialog, "itemDesc").setValueState("Error");
				return;
			}
			if (this._tmpItemNo) {
				for (var i = 0; i < this._itemsData.length; i++) {
					if (this._itemsData[i].Vornr === this._tmpItemNo) {
						this._itemsData[i].Pernr = dialogIntervenant;
						this._itemsData[i].Ename = dialogIntervenantName;
						this._itemsData[i].Description = dialogDescription;
						break;
					}
				}
			} else {
				var lastItem = this._itemsData[this._itemsData.length - 1];
				if (!lastItem) {
					lastItem = {};
					lastItem.Vornr = "0000";
				}
				var newItem = {};
				newItem.Pernr = dialogIntervenant;
				newItem.Ename = dialogIntervenantName;
				newItem.Description = dialogDescription;
				var tmpItemNo = "00" + (parseInt(lastItem.Vornr) + 10);
				newItem.Vornr = tmpItemNo.substring(tmpItemNo.length - 4);
				this._itemsData.push(newItem);
			}

			this.closeDialog();
			this.refreshTableItems();
		},
		//Delete item
		onDeleteItem: function (from) {
			var selectedItemNo = from.getSource().getParent().getCells()[0].getText();
			for (var i = 0; i < this._itemsData.length; i++) {
				if (this._itemsData[i].Vornr === selectedItemNo) {
					this._itemsData.splice(i, 1);
					break;
				}
			}
			this.refreshTableItems();
		},

		//Refresh items table
		refreshTableItems: function () {
			var tableItems = Fragment.byId(this._frgIdCreateOrder, "tableItems");
			tableItems.setModel(this._itemsModel);
			this._itemsModel.setData({
				jsonItems: this._itemsData
			});
			var oTemplate = new ColumnListItem({
				cells: [
					new Text({
						text: "{Vornr}"
					}),
					new Text({
						text: "{Gewrk}"
					}),
					new Text({
						text: "{Ename}"
					}),
					new Text({
						text: "{Description}"
					}),
					new Button({
						icon: "sap-icon://edit",
						press: [this.onAddEditItem, this]
					}),
					new Button({
						icon: "sap-icon://delete",
						press: [this.onDeleteItem, this]
					})
				]
			});
			tableItems.bindItems("/jsonItems", oTemplate);
		},

		onUploadComplete: function () {
			this.getView().getModel().refresh(true);
		},

		onBeforeUploadStarts: function () {},
		onChange: function (oEvent) {
			// Header Token
			var oCustomerHeaderToken = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: this._token //"securityTokenFromModel"
			});
			var oCustomerHeaderSlug = new UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameters().files[0].name
			});
			oEvent.getSource().addHeaderParameter(oCustomerHeaderToken);
			oEvent.getSource().addHeaderParameter(oCustomerHeaderSlug);
		},

		onFileDeleted: function (oEvent) {
			var sDocumentId = oEvent.getParameter("documentId");
			var model = this.getView().getModel();
			model.remove("/ATTACHSet(Tplnr='',Equnr='',Dktxt='" + sDocumentId + "')", null, null, function () {});
			this.getView().getModel().refresh(true);
			// oEvent.getSource().rerender();
		},

		// getUploadToken: function (callback) {
		// 	var self = this;
		// 	OData.request({
		// 			requestUri: window.location.origin + "/sap/opu/odata/sap/ZGPM_DOCS_SRV/FUNCLEVELSet",
		// 			method: "GET",
		// 			headers: {
		// 				"X-Requested-With": "XMLHttpsRequest",
		// 				"Content-Type": "application/xml;charset=utf-8",
		// 				"DataServiceVersion": "2.0",
		// 				"X-CSRF-Token": "Fetch"
		// 			}
		// 		},
		// 		function (data, response) {
		// 			callback(response.headers["x-csrf-token"]);
		// 		}
		// 	);

		// 	function callback(token) {
		// 		self._token = token;
		// 	}
		// },

		isNull: function (value) {
			if (value.length > 0) {
				return false;
			} else {
				return true;
			}
		},

		comboWRSelected: function (oEvent) {
			if (oEvent.getSource().getSelectedKey !== "00000000" & oEvent.getSource().getSelectedKey !== "") {
				oEvent.getSource().setValueState("None");
			}
			this.getWORule();
		},

		comboSelected: function (oEvent) {
			if (oEvent.getSource().getSelectedKey !== "00000000" & oEvent.getSource().getSelectedKey !== "") {
				oEvent.getSource().setValueState("None");
			}
		},

		getWORule: function () {
			var self = this;
			this.getOwnerComponent().getModel("orderEnableFields").setData({
				requestor: false,
				workType: false,
				groupCode: false
			});

			var sPriority = Fragment.byId(this._frgIdCreateOrder, "cb_priority").getSelectedKey();
			var sActType = Fragment.byId(this._frgIdCreateOrder, "cb_typeActivite").getSelectedKey();

			// Fragment.byId(this._frgIdCreateOrder, "cb_group").setSelectedKey();
			// Fragment.byId(this._frgIdCreateOrder, "cb_typeTravaux").setSelectedKey();
			// Fragment.byId(this._frgIdCreateOrder, "cb_typeTravaux").setEnabled(false);

			if (sPriority) {
				this.getOwnerComponent().getModel().read("/WO_RULESSet", {
					filters: [
						new Filter("Priority", "EQ", sPriority),
						new Filter("ActType", "EQ", sActType)
					],
					success: function (oData) {
						if (oData.results) {
							// MessageToast.show("rule found");
							if (oData.results.length > 0) {
								if (oData.results[0].Requestor) {
									self.getOwnerComponent().getModel("orderEnableFields").setProperty("/requestor", true);
								}
								if (oData.results[0].GroupCode) {
									self.getOwnerComponent().getModel("orderEnableFields").setProperty("/groupCode", true);

								}
								if (oData.results[0].Worktype) {
									self.getOwnerComponent().getModel("orderEnableFields").setProperty("/workType", true);
								}
							}
						} else {
							MessageToast.show("No rule found");
						}
					},
					error: function (oError) {
						MessageToast.show("No rule found");
					}
				});
			}
		},

		handleWorkGroupChange: function (oEvent) {
			if (oEvent.getSource().getSelectedKey !== "00000000" & oEvent.getSource().getSelectedKey !== "") {
				oEvent.getSource().setValueState("None");
			}
			this.getOwnerComponent().getModel("orderEnableFields").setProperty("/workType", true);
			// Fragment.byId(this._frgIdCreateOrder, "cb_typeTravaux").setEnabled(true);
			// Fragment.byId(this._frgIdCreateOrder, "cb_typeTravaux").setSelectedItem(null);
			var selectedKey = oEvent.getParameter("selectedItem").getKey();
			var filters = [];
			filters.push(new Filter("Codegruppe", FilterOperator.EQ, selectedKey));
			// Fragment.byId(this._frgIdCreateOrder, "cb_typeTravaux").getBinding("items").filter(filters);
		},

		textAreaChanged: function (oEvent) {
			if (oEvent.getSource().getValue !== "") {
				oEvent.getSource().setValueState("None");
			}
		},

		sliderCircleChanged: function (oEvent) {
			this._ratio = oEvent.getSource().getValue();
		},

		getBlobURL: function (base64) {
			// base64 string
			var base64str = base64.split(",")[1];
			// file type
			var fileType = base64.split(",")[0].replace("data:", "");
			fileType = fileType.replace(";base64", "");

			// decode base64 string, remove space for IE compatibility
			var binary = atob(base64str.replace(/\s/g, ''));
			// get binary length
			var len = binary.length;
			// create ArrayBuffer with binary length
			var buffer = new ArrayBuffer(len); // eslint-disable-line no-undef
			// create 8-bit Array
			var view = new Uint8Array(buffer); // eslint-disable-line no-undef
			// save unicode of binary data into 8-bit Array
			for (var i = 0; i < len; i++) {
				view[i] = binary.charCodeAt(i);
			}
			// create the blob object with content-type
			var blob = new Blob([view], {
				type: fileType
			});
			return window.URL.createObjectURL(blob);
		}
	});
});
