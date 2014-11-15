
// @source core/Window.js

Ext.Window.override({
    closeAction : "hide",
    
    initCenter  : true,
    
    defaultRenderTo : "body",
    
    showModal : function () {
        this.initMask();
        this.modal = true;
        Ext.getBody().addClass("x-body-masked");
        this.mask.setSize(Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true));
        this.mask.show();
    },
    
    hideModal : function () {
        this.initMask();
        this.modal = false;
        this.mask.hide();
        Ext.getBody().removeClass("x-body-masked");
    },
    
    initMask : function () {
        if (!this.mask) {
            this.mask = this.container.createChild({ cls : "ext-el-mask" }, this.el.dom);
            this.mask.enableDisplayMode("block");
            this.mask.hide();
            this.mask.on("click", this.focus, this);
        }
    },
    
    isModal : function () {
        return this.modal || false;
    },
    
    toggleModal : function () {
        var show = this.modal = !this.isModal();
        this[show ? "showModal" : "hideModal"]();
    },
    
    center : function () {
        var xy = this.el.getAlignToXY(Ext.getBody(), "c-c?");
        this.setPagePosition(xy[0], xy[1]);
        
        return this;
    },
    
    fitContainer : function () {
        var isForm = this.container.dom == (Ext.net.ResourceMgr.getAspForm() || {}).dom,
            vs = isForm ? Ext.getBody().getViewSize() : this.container.getViewSize(false);

        this.setSize(vs.width, vs.height);
    }
});

Ext.Window.prototype.initComponent = Ext.Window.prototype.initComponent.createInterceptor(function () {
    if (this.initCenter === true && Ext.isEmpty(this.pageX) && Ext.isEmpty(this.pageY)) {
        if (!this.maximized) {
            this.mon(this, "beforeshow", this.center, this, { single : true });
        } else {
            this.mon(this, "restore", this.center, this, { single : true });
        }
    }
});

Ext.Window.prototype.show = Ext.Window.prototype.show.createInterceptor(function () {
    if (!this.rendered) {
        this.render(this.renderTo || (this.defaultRenderTo === "body" ? Ext.getBody() : Ext.net.ResourceMgr.getAspForm()));
    }
});

Ext.MessageBox.show = Ext.MessageBox.show.createInterceptor(function () {
    var dlg = this.getDialog("&#160;");

    if (dlg.closeAction === "hide") {
        dlg.closeAction = "close";
        dlg.mon(dlg.tools.close, "click", dlg.close.createDelegate(dlg, []));
    }
});