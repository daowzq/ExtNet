/********
 * @version   : 1.0.0 - Professional Edition (Ext.Net Professional License)
 * @author    : Ext.NET, Inc. http://www.ext.net/
 * @date      : 2009-06-30
 * @copyright : Copyright (c) 2010, Ext.NET, Inc. (http://www.ext.net/). All rights reserved.
 * @license   : See license.txt and http://www.ext.net/license/. 
 ********/
 
 Ext.net.TabMenu = Ext.extend(Object, {
    init : function (tabPanel) {
        this.tabPanel = tabPanel;        
        this.tabPanel.initTab = this.tabPanel.initTab.createSequence(this.initTab, this);
        this.tabPanel.onStripMouseDown = this.tabPanel.onStripMouseDown.createInterceptor(this.onStripMouseDown);
        
        this.tabPanel.addEvents("beforetabmenushow");
        
        var m;
        if (m = this.tabPanel.defaultTabMenu) {
            this.tabPanel.defaultTabMenu = m.render ? m : Ext.ComponentMgr.create(m, "menu");
        }
    },
    
    initTab : function (item, index) {
        var m;
        if (m = item.tabMenu) {
            item.tabMenu = m.render ? m : Ext.ComponentMgr.create(m, "menu");            
        }
        
        if ((item.tabMenu || this.tabPanel.defaultTabMenu)) {            
            Ext.fly(item.tabEl).addClass("x-tab-strip-withmenu");
            
            item.menuEl = Ext.fly(item.tabEl).insertFirst({
                tag : "a", 
                cls : "x-tab-strip-menu", 
                onclick : "return false;"
            });
            
            if (item.tabMenuHidden === true) {
                item.menuEl.hide();
            }
            
            item.hideTabMenu = this.hideTabMenu.createDelegate(item);
            item.showTabMenu = this.showTabMenu.createDelegate(item);
        }
    },
    
    hideTabMenu : function () {
        this.menuEl.hide();
    },
    
    showTabMenu : function () {
        this.menuEl.show();
    },
    
    onStripMouseDown : function (e) {
        if (e.button !== 0) {
            return;
        }
        
        var t = this.findTargets(e),
            isMenu = e.getTarget(".x-tab-strip-menu", this.strip),
            menu;
            
        if (isMenu) {
            e.preventDefault();
            menu = t.item.tabMenu || this.defaultTabMenu;
            
            if (this.fireEvent("beforetabmenushow", this, t.item, menu) === false) {
                return false;
            }
            
            menu.tab = t.item;
            menu.show(t.item.menuEl);
            return false;
        }
    }
});

if (typeof Sys !== "undefined") { Sys.Application.notifyScriptLoaded(); }