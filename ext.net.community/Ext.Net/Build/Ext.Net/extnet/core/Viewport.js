
// @source core/Viewport.js

/**
* @class Ext.net.Viewport
* @extends Ext.Container
* A specialized content Container representing the viewable application area (the browser viewport).<br/>
*/
Ext.net.Viewport = Ext.extend(Ext.Container, {
    initComponent : function () {
        Ext.net.Viewport.superclass.initComponent.call(this);
        var html = document.getElementsByTagName("html")[0];
        html.className += " x-viewport";
        html.style.height = "100%";
        this.el = Ext.get(Ext.getBody());
        var el = Ext.get(this.renderTo || Ext.net.ResourceMgr.getAspForm());
        this.el.setHeight = this.el.setWidth = this.el.setSize = Ext.emptyFn;        
        this.el.dom.scroll = "no";

        if (el) {
            el.setHeight = el.setWidth = el.setSize = Ext.emptyFn;
            el.dom.scroll = "no";
        }

        this.allowDomMove = false;
        this.autoWidth = this.autoHeight = true;
        this.autoHeight = true;
        Ext.EventManager.onWindowResize(this.fireResize, this);
        //this.renderTo = this.el;
        
        Ext.getBody().applyStyles({
            overflow : "hidden",
            margin   : "0",
            padding  : "0",
            border   : "0px none",
            height   : "100%"
        });
        
        this.el.applyStyles({ height : "100%", width : "100%" });

        if (el) {
            el.applyStyles({ height : "100%", width : "100%" });
        }
        
        this.el = Ext.get(this.renderTo || Ext.net.ResourceMgr.getAspForm() || Ext.getBody());
        this.renderTo = this.el;
    },

    fireResize : function (w, h) {
        this.fireEvent("resize", this, w, h, w, h);
    }
});

Ext.reg("netviewport", Ext.net.Viewport);