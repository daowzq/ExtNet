/********
* @author: Ext.NET, Inc. http://www.ext.net/
* @date: 2009-03-17
* @copyright: Copyright (c) 2010, Ext.NET, Inc. All rights reserved.
* @license: The MIT License, see http://www.opensource.org/licenses/mit-license.php
********/

Ext.ns("Ext.ux", "Ext.ux.plugins");

Ext.ux.plugins.KeepActive = Ext.extend(Ext.Panel, {
    setup: false,
    
    init : function (pnl) {
        if (pnl.layout && (pnl.layout === "accordion" || pnl.layout.type === "accordion")) {
            pnl.on("afterlayout", this.onAfterLayout, this);
        }
    },

    onAfterLayout : function (pnl) {
        if (this.setup === false) {
            this.setup = true;
            pnl.items.each(function (item) {
                var tool = item.tools.toggle;

                if (tool) {
                    tool.disable = this.disableTool;
                    tool.enable = this.enableTool;
                    
                    if (!item.collapsed) {
                        tool.disable();
                        item.header.setStyle({ cursor: "default" });
                    }
                }
                
                item.header.un("click", item.toggleCollapse, item);
                item.header.on("click", this.headerClick, item);
                
                item.on("expand", this.onExpand, item);
                item.on("collapse", this.onBeforeCollapse, item);
            }, this);
        }
    },
    
    headerClick: function () {
        if (this.collapsed) {
            this.expand();
        }
    },
    
    disableTool: function () {
        this.removeAllListeners();
        this.addClass("x-item-disabled").removeClass("x-tool-toggle-over");
        this.setStyle({ cursor: "default" });
    },

    enableTool: function () {
        this.removeClass("x-item-disabled");
        this.setStyle({ cursor: "pointer" });
        this.addClassOnOver("x-tool-toggle-over");
    },
    
    onExpand: function (pnl) {
        if (this.tools.toggle) {
            this.tools.toggle.disable();
        }
        pnl.header.setStyle({ cursor: "default" });
        return true;
    },

    onBeforeCollapse: function (pnl) {
        pnl.ownerCt.items.each(function (item) {
            if (item.tools.toggle) {
                item.tools.toggle.enable();
            }
        });
        pnl.header.setStyle({ cursor: "pointer" });
        return true;
    }
});

if (typeof Sys!=="undefined") {Sys.Application.notifyScriptLoaded();}
