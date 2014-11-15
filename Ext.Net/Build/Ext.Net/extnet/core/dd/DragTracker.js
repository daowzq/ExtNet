
// @source core/dd/DragTracker.js

Ext.dd.DragTracker.override({
    onMouseMove : function (e, target) {
        // HACK: IE hack to see if button was released outside of window. */
        if (this.active && Ext.isIE && !e.browserEvent.button && !Ext.isIE9) {
            e.preventDefault();
            this.onMouseUp(e);

            return;
        }

        e.preventDefault();
        var xy = e.getXY(), s = this.startXY;
        this.lastXY = xy;

        if (!this.active) {
            if (Math.abs(s[0]-xy[0]) > this.tolerance || Math.abs(s[1]-xy[1]) > this.tolerance) {
                this.triggerStart(e);
            } else {
                return;
            }
        }

        this.fireEvent('mousemove', this, e);
        this.onDrag(e);
        this.fireEvent('drag', this, e);
    }
});

Ext.net.DragTracker = function (config) {
    Ext.net.DragTracker.superclass.constructor.call(this, config);    
};

Ext.extend(Ext.net.DragTracker, Ext.dd.DragTracker, {
    proxyCls : "x-view-selector",
    
    onStart : function (xy) {
        if (!this.proxy) {
            this.proxy = this.el.createChild({ cls : this.proxyCls });
        } else {
            this.proxy.setDisplayed("block");
        }
    },

    onDrag : function (e) {
        var startXY = this.startXY,
            xy = this.getXY(),
            x = Math.min(startXY[0], xy[0]),
            y = Math.min(startXY[1], xy[1]),
            w = Math.abs(startXY[0] - xy[0]),
            h = Math.abs(startXY[1] - xy[1]);
        
        this.dragRegion.left = x;
        this.dragRegion.top = y;
        this.dragRegion.right = x + w;
        this.dragRegion.bottom = y + h;

        this.proxy.setRegion(this.dragRegion);	
    },

    onEnd : function (e) {
        if (this.proxy) {
            this.proxy.setDisplayed(false);
        }
    }
});

Ext.lib.Region.prototype.isIntersect = function (region) {
	var t = Math.max(this.top, region.top),
	    r = Math.min(this.right, region.right),
	    b = Math.min(this.bottom, region.bottom),
	    l = Math.max(this.left, region.left);

    return b >= t && r >= l;
};