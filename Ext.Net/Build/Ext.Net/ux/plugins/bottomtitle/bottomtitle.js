Ext.net.BottomTitle = Ext.extend(Object, {
    init : function (bGroup) {
        this.bGroup = bGroup;
        this.title = bGroup.title;
        delete bGroup.title;
        
        bGroup.addClass("x-btn-group-ribbonstyle");
        bGroup.addClass("x-btn-group-notitle");
        bGroup.buttonAlign = "center";
        bGroup.fbar = [ this.title ];
        bGroup.createFbar(bGroup.fbar);
    }
});

if (typeof Sys !== "undefined") { Sys.Application.notifyScriptLoaded(); }