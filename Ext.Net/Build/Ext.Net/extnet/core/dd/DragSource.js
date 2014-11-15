
// @source core/dd/DragSource.js

Ext.dd.DragSource.override({
    getDropTarget : function (id) {
        var dd = null,
            i;
        
        for (i in Ext.dd.DragDropMgr.ids) {
            if (Ext.dd.DragDropMgr.ids[i][id]) {
                dd = Ext.dd.DragDropMgr.ids[i][id];
                
                if (dd.isNotifyTarget) {
                    return dd;
                }
            }
        }
        return dd;
    },
    
    onDragEnter : function (e, id) {
        var target = this.getDropTarget(id, true);
        this.cachedTarget = target;
        
        if (this.beforeDragEnter(target, e, id) !== false) {
            if (target.isNotifyTarget) {
                var status = target.notifyEnter(this, e, this.dragData);
                this.proxy.setStatus(status);
            } else {
                this.proxy.setStatus(this.dropAllowed);
            }
            
            if (this.afterDragEnter) {
                this.afterDragEnter(target, e, id);
            }
        }
    }
});

// in future, check that Window is dragable under Chrome, if true then remove the following code
Ext.dd.DragDropMgr.getLocation = function(oDD) {
	if (! this.isTypeOfDD(oDD)) {
		return null;
	}

	var el = oDD.getEl(), pos, x1, x2, y1, y2, t, r, b, l;

	try {
		pos= Ext.lib.Dom.getXY(el);
	} catch (e) { }

	if (!pos) {
		return null;
	}

	x1 = pos[0];
	x2 = x1 + el.offsetWidth;
	y1 = pos[1];
	y2 = y1 + el.offsetHeight;

	t = y1 - oDD.padding[0];
	r = x2 + oDD.padding[1];
	b = y2 + oDD.padding[2];
	l = x1 - oDD.padding[3];

	return new Ext.lib.Region( t, r, b, l );
};