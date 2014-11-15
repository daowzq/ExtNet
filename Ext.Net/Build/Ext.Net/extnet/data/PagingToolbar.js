
// @source data/PagingToolbar.js

Ext.PagingToolbar.prototype.onRender = Ext.PagingToolbar.prototype.onRender.createSequence(function (el) {
    if (this.pageIndex) {
        if (this.store.getCount() === 0) {
            this.store.on("load", function () {
                this.changePage(this.pageIndex);
            }, this, { single : true });
        } else {
            this.changePage(this.pageIndex);
        }
    }
    
    this.on("change", function (el, data) {
        this.getActivePageField().setValue(data.activePage);
    }, this);
    
    this.getActivePageField().render(this.el.parent() || this.el);
    
    if (this.store.proxy.isMemoryProxy) {
        this.refresh.setHandler(function () {                    
            if (this.store.proxy.refreshData) {
                this.store.proxy.refreshData(null, this.store);
            }
            
            if (this.store.proxy.isUrl) {
                item.initialConfig.handler();
            }
        }, this);         
    }
    
    if (this.hideRefresh) {
        this.refresh.hide();
    }
});

Ext.PagingToolbar.prototype.initComponent = Ext.PagingToolbar.prototype.initComponent.createSequence(function () {
    if (this.ownerCt instanceof Ext.net.GridPanel) {
        this.ownerCt.on("viewready", this.fixFirstLayout, this, {single : true});
    } else {
        this.on("afterlayout", this.fixFirstLayout, this, {single : true});
    }
});

Ext.PagingToolbar.override({
    hideRefresh: false,
    onFirstLayout : Ext.emptyFn,
    
    getActivePageField : function () {
        if (!this.activePageField) {
            this.activePageField = new Ext.form.Hidden({ 
                id   : this.id + "_ActivePage", 
                name : this.id + "_ActivePage" 
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.activePageField);
        }
        
        return this.activePageField;
    },
    
    fixFirstLayout : function () {
        if (this.dsLoaded) {
            this.onLoad.apply(this, this.dsLoaded);
        }
    }   
});