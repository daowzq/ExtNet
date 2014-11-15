
// @source core/TabPanel.js

Ext.TabPanel.prototype.initComponent = Ext.TabPanel.prototype.initComponent.createSequence(function () {
    this.addEvents("beforetabclose", "beforetabhide", "tabclose");
    
    this.on("beforetabchange", function (el, newTab) {
        newTab = newTab || {};
        this.getActiveTabField().setValue(this.getTabId(newTab) + ':' + el.items.indexOf(newTab));
    }, this);
    
    if (this.tabPostback) {
        this.on("afterrender", function () {
            this.on("beforetabchange", function (el, newTab) {
                this.tabPostback.call(this);
                return false;                
            }, this);
        }, this);
    }
    
    this.on("render", function () {
        this.getActiveTabField().render(this.el.parent() || this.el);
    }, this);
});

Ext.TabPanel.override({
    getTabId : function (tab) {
        return tab.id;
    },
    
    getActiveTabField : function () {
        if (!this.activeTabField) {
            this.activeTabField = new Ext.form.Hidden({ 
                id    : this.id + "_ActiveTab", 
                name  : this.id + "_ActiveTab", 
                value : this.id + ":" + (this.activeTab || 0)
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.activeTabField);	
        }

        return this.activeTabField;
    },

    onStripMouseDown : function (e) {
        if (e.button !== 0) {
            return;
        }
        
        if (!Ext.isIE9) {
            e.preventDefault();
        }

        this.focus();
        
        var t = this.findTargets(e);
        
        if (t.close) {
            this.closeTab(t.item);

            return;
        }
        
        if (t.item && t.item != this.activeTab) {
            if (Ext.isIE9) {
               this.setActiveTab.defer(100, this, [t.item]);
            } else {
                this.setActiveTab(t.item);
            }
        }
    },

    closeTab : function (tab, closeAction) {
        if (typeof tab === "string") {
            tab = this.getItem(tab);
        } else if (typeof tab === "number") {
            tab = this.items.get(tab);
        }

        if (Ext.isEmpty(tab)) {
            return;
        }

        var eventName = tab.closeAction || closeAction || "close",
            destroy = (eventName === "close");

        if (this.fireEvent("beforetab" + eventName, this, tab) === false) {
            return;
        }

        if (tab.fireEvent("before" + eventName, tab) === false) {
            return;
        }

        if (destroy) {
            tab.fireEvent("close", tab);
        }       
        
        if (!destroy) {
            this.hideTabStripItem(tab);        
            tab.addClass("x-hide-display");
        }
                
        this.fireEvent("tabclose", this, tab);
        
        this.remove(tab, destroy);
        
        if (!destroy) {
            tab.fireEvent("close", tab);
        }
    },

    addTab : function (tab, index, activate) {
        var config = {};

        if (!Ext.isEmpty(index)) {
            if (typeof index === "object") {
                config = index;
            } else if (typeof index === "number") {
                config.index = index;
            } else {
                config.activate = index;
            }
        }

        if (!Ext.isEmpty(activate)) {
            config.activate = activate;
        }

        if (this.items.getCount() === 0) {
            this.activeTab = null;
        }

        if (!Ext.isEmpty(config.index) && config.index >= 0) {
            tab = this.insert(config.index, tab);
        } else {
            tab = this.add(tab);
        }

        if (config.activate !== false) {
            this.setActiveTab(tab);
        }
    }
});