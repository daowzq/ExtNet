
// @source core/menu/HtmlElement.js

Ext.Toolbar.HtmlElement = function (config) {
    Ext.Toolbar.HtmlElement.superclass.constructor.call(this, config.target);
};

Ext.extend(Ext.Toolbar.HtmlElement, Ext.Toolbar.Item, {});

Ext.reg("nettbhtml", Ext.Toolbar.HtmlElement);