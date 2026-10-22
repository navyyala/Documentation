sap.ui.define([
	"PO_PM_DOCS/controller/Detail.controller"
], function (DetailController) {
	"use strict";

	QUnit.module("Detail controller — isNull formatter");

	QUnit.test("returns true for an empty string value", function (assert) {
		var oController = new DetailController();
		assert.strictEqual(oController.isNull(""), true, "Empty value is treated as null/enabled-for-delete");
	});

	QUnit.test("returns false for a non-empty string value", function (assert) {
		var oController = new DetailController();
		assert.strictEqual(oController.isNull("IFLOT-001"), false, "Non-empty value is treated as not-null");
	});
});
