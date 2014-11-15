Ext.ux.TabStrip = Ext.extend(Ext.TabPanel, {
    defaultType     : "panel",
    border          : false,
    header          : false,
    autoGrow        : true,
    plain           : true,
    syncOnTabChange : false,
    
    initComponent : function () {
        Ext.ux.TabStrip.superclass.initComponent.call(this);
        
        if (this.initialConfig.width) {
            this.autoGrow = false;
        }
    },
    
    onRender : function (ct, position) {
        Ext.ux.TabStrip.superclass.onRender.call(this, ct, position);

        if (this.tabPosition !== "bottom") {
            this.bwrap.addClass("x-hidden");
        } else {
            this.body.addClass("x-hidden");
        }
        
        var toolbar = this.el.up(".x-toolbar");
        
        if (toolbar) {            
            if (Ext.isIE6 || Ext.isIE7) {
                this.el.applyStyles("margin:0px 0 -1px 0;");
                toolbar.setStyle("padding-bottom", "0px");
            } else if (Ext.isWebKit) {
                this.el.applyStyles("margin:0px 0 -3px 0;");
            } else {
                this.el.applyStyles("margin:-1px 0 -3px 0;");
            }       
            
            if(Ext.isIE8 || Ext.isIE9){
                toolbar.setStyle("padding-bottom", "3px");
                this.el.child(".x-tab-strip-spacer").setStyle("border-bottom-width", "0px");
            }     
        }         
        
        this.strip.setStyle("margin-right", "2px");
        
        this.tabsRendered = true;
        
        this.items.each(function (item) { 
            item.on({
                "titlechange" : this.syncSize,
                "iconchange"  : this.syncSize,
                "close" : this.syncSize,
                "hide"  : this.syncSize,
                "show"  : this.syncSize,
                scope   : this
            });
        }, this);

        this.syncSize();
    },

    setActiveTab : function (item) {
        item = this.getComponent(item);
        
        var index = this.items.indexOf(item),
            activeIndex = this.items.indexOf(this.activeTab);
        
        if (this.fireEvent("beforetabchange", this, item, this.activeTab, index, activeIndex) === false) {
            return;
        }
        
        if (!this.rendered) {
            this.activeTab = item;
            return;
        }
        
        if (this.activeTab != item) {
            if (item && item.actionItem) {
                var cmp = Ext.getCmp(item.actionItem),
                    hideCmp,
                    hideEl,
                    hideCls;
                    
                var hideFunc = function () {
                    this.items.each(function (tabItem) {
                        if (tabItem != item && tabItem.actionItem) {
                            hideCmp = Ext.getCmp(tabItem.actionItem);
                            
                            if (hideCmp) {
                                hideCmp.hideMode = tabItem.hideMode;
                                hideCmp.hide();
                            } else {
                                hideEl = Ext.net.getEl(tabItem.actionItem);
                                
                                if (hideEl) {
                                    switch (tabItem.hideMode) {
                                        case "display" :
                                            hideCls = "x-hide-display";
                                            break;
                                        case "offsets" :
                                            hideCls = "x-hide-offsets";
                                            break;
                                        case "visibility" :
                                            hideCls = "x-hide-visibility";
                                            break;
                                        default :
                                            hideCls = "x-hide-display";
                                            break;
                                    }
                                    
                                    hideEl.addClass(hideCls);
                                }
                            }
                        }
                    }, this);
                };
                
                if (cmp) {                
                    if (cmp.ownerCt && cmp.ownerCt.layout && cmp.ownerCt.layout.setActiveItem) {
                        cmp.ownerCt.layout.setActiveItem(index);
                    } else {
                        hideFunc.call(this);                        
                        cmp.show();
                    }
                } else {
                    var el = Ext.net.getEl(item.actionItem);
                    
                    if (el) {
                        hideFunc.call(this);                        
                        el.removeClass(["x-hidden", "x-hide-display", "x-hide-visibility", "x-hide-offsets"]);
                    }
                }
            }
            
            if (this.activeTab) {
                var oldEl = this.getTabEl(this.activeTab);
            
                if (oldEl) {
                    Ext.fly(oldEl).removeClass("x-tab-strip-active");
                }
            }

            if (item) {
                var el = this.getTabEl(item);
                Ext.fly(el).addClass("x-tab-strip-active");
                
                this.activeTab = item;
                this.stack.add(item);

                this.layout.setActiveItem(item);
                
                if (this.scrolling) {
                    this.scrollToTab(item, this.animScroll);
                }
            }            
            
            this.syncSize();
            
            if (this.actionContainer) {
                this.setActiveCard(index);
            }
            
            this.fireEvent("tabchange", this, item, index);
        }
    },
    
    setActiveCard : function (index) {
        var cmp = Ext.getCmp(this.actionContainer);
        
        if (cmp.getLayout().setActiveItem) {
            cmp.getLayout().setActiveItem(index);
        } else {
            cmp.activeItem = index;
        }
    },
    
    syncSize : function () {
        if (!this.autoGrow || !this.tabsRendered) {
            return;
        }
        
        var width = 0,
            maxWidth = 0,
            maxActiveWidth = 0,
            clean,
            tempWidth,
            tempMaxWidth;
            
        this.beginUpdate();
        
        this.strip.select("li").each(function (li) {
           if (this.syncOnTabChange) {
              width += li.getWidth();
           } else {
               clean = false;
               tempWidth = li.getWidth();
               width += tempWidth;
               
               if (!li.hasClass("x-tab-strip-active")) {
                  li.addClass("x-tab-strip-active");
                  clean = true;
               } 
               
               tempMaxWidth = li.getWidth();
               
               if (tempMaxWidth > maxActiveWidth) {
                   maxWidth = tempWidth;
                   maxActiveWidth = tempMaxWidth; 
               }                         
               
               if (clean) {
                  li.removeClass("x-tab-strip-active");
               }
           }
                     
        }, this);
        
        this.setWidth(width - maxWidth + maxActiveWidth + this.tabMargin * this.items.getCount() + 1);
        this.endUpdate();
    },
    
    initTab : function (item, index) {
        Ext.ux.TabStrip.superclass.initTab.call(this, item, index);
        
        if (item.hidden) {
            this.hideTabStripItem(item);
        }
        
        this.syncSize();
    },
    
    setTabTitle : function (item, title) {
        item = this.getComponent(item);
        item.setTitle(title);
    },
    
    setTabHidden : function (item, hidden) {
        item = this.getComponent(item);
        item.hidden = hidden;
        this[hidden ? "hideTabStripItem" : "unhideTabStripItem"](item);
    },
    
    setTabIconCls : function (item, iconCls) {
        item = this.getComponent(item);
        item.setIconClass(iconCls);
    }
});

Ext.ux.TabStrip.prototype.hideTabStripItem = Ext.ux.TabStrip.prototype.hideTabStripItem.createSequence(function (item) {
    this.syncSize();
});

Ext.ux.TabStrip.prototype.unhideTabStripItem = Ext.ux.TabStrip.prototype.unhideTabStripItem.createSequence(function (item) {
    this.syncSize();
});

Ext.reg("tabstrip", Ext.ux.TabStrip);