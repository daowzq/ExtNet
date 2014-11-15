
// @source core/buttons/SplitButton.js

Ext.override(Ext.SplitButton, {
    isClickOnArrow : function (e) {
	    if (this.arrowAlign !== "bottom") {
	        var visBtn = this.el.child("em.x-btn-split");

	        if (!visBtn) {
	            return false;
	        }
	        
            return e.getPageX() > (visBtn.getRegion().right - visBtn.getPadding("r"));
	    } else {
	        return e.getPageY() > this.btnEl.getRegion().bottom;
	    }
    },
    
    showMenuArrow : function () {
        var el = this.el.child("em.x-btn-split" + (this.arrowAlign === "bottom" ? "-bottom" : ""));

        if (!Ext.isEmpty(el)) {
            el.removeClass("x-btn-no-arrow");
        }
    },
    
    hideMenuArrow : function () {
        var el = this.el.child("em.x-btn-split" + (this.arrowAlign === "bottom" ? "-bottom" : ""));
        
		if (!Ext.isEmpty(el)) {
            el.addClass("x-btn-no-arrow");
        }
    }
});