Ext.ux.plugins.GridPanelMaintainScrollPositionOnRefresh = Ext.extend(Ext.util.Observable, {    

    constructor: function (config) {
        Ext.apply(this, config);
        Ext.ux.plugins.GridPanelMaintainScrollPositionOnRefresh.superclass.constructor.call(this, config);
    },
    
    init: function (grid) {
        if (Ext.isEmpty(this.restoreDelay)) {
            this.restoreDelay = Ext.isGecko ? 50 : 10;
        }
        
        grid.restoreDelay = this.restoreDelay;
        grid.on("render", function () {
            this.view.onLoad = Ext.emptyFn;
            
            this.view.on("beforerefresh", function (v) {
               v.scrollTop = v.scroller.dom.scrollTop;
               v.scrollHeight = v.scroller.dom.scrollHeight;
               
               v.scrollLeft = v.scroller.dom.scrollLeft;
               v.scrollWidth = v.scroller.dom.scrollWidth;
            });
            
            this.view.on("refresh", function (v) {
               v.scroller.dom.scrollTop = v.scrollTop + 
                (v.scrollTop === 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
                
               v.scroller.dom.scrollLeft = v.scrollLeft + 
                (v.scrollLeft === 0 ? 0 : v.scroller.dom.scrollWidth - v.scrollWidth);
            }, this.view, { delay : this.restoreDelay });
        });            
    }
});

if (typeof Sys!=="undefined") {Sys.Application.notifyScriptLoaded();}
