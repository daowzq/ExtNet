
// @source core/utils/Observable.js

(function () {
    Ext.util.Observable.prototype.constructor = Ext.util.Observable.prototype.constructor.createInterceptor(function () {
        if (this.initialConfig) {
            var id = this.initialConfig.proxyId || this.initialConfig.id;
            
            if (this.forbidIdScoping !== true && !Ext.isEmpty(id, false) && id.indexOf("ext-comp-") !== 0) {
                var ns = this.ns || Ext.net.ResourceMgr.ns;
                
                if (ns) {                    
                    (Ext.isObject(ns) ? ns : Ext.ns(ns))[this.initialConfig.itemId || id] = this;
                } else {
                    window[id] = this;
                }
            }
        }
    });

    Ext.util.Observable.prototype.constructor.prototype = Ext.util.Observable.prototype;

    var fns = {}, 
        v,
        i;

    for (i in Ext.util.Observable) {
        v = Ext.util.Observable[i];
        
        if (typeof v === "function") {
            fns[i] = v;
        }
    }

    Ext.util.Observable = Ext.util.Observable.prototype.constructor;
    Ext.applyIf(Ext.util.Observable, fns);
})();

Ext.util.Observable.prototype.purgeListeners = Ext.util.Observable.prototype.purgeListeners.createSequence(function () {
    this.cleanId();
});

Ext.override(Ext.util.Observable, {
    cleanId : function () {        
        if (this.forbidIdScoping !== true) {
            var ns = this.ns || Ext.net.ResourceMgr.ns,
                id = this.itemId || this.proxyId || this.storeId || this.id,
                nsObj;
            
            if (ns && id) {                
                if (Ext.isObject(ns) && ns[id]) {
                    try {
                        delete ns[id];
                    } catch (e) {
                        ns[id] = undefined;
                    }
                } else if (Ext.net.ResourceMgr.getCmp(ns + "." + id)) {
                    try {
                        delete Ext.ns(ns)[id];
                    } catch (f) {
                        Ext.ns(ns)[id] = undefined;
                    }
                }
            } else if (window[this.proxyId || this.storeId || this.id]) {
                window[this.proxyId || this.storeId || this.id] = null;
            }
        }
    },

    destroy : function () {
        this.cleanId();
    },
    
	fireEvent : function () {
		if (!(this.isAjaxInit || false)) {
            this.isAjaxInit = true;
            this.ajaxListeners = {};
            
            if (this.directEvents) {
                this.addAjaxListener(this.directEvents);
            }
        }
		
		var a = Ext.toArray(arguments),
			ename = a[0].toLowerCase(),
			me = this,
			ret = true,
			ce = me.events[ename],
			ace = me.ajaxListeners[ename],
			q,
			c;
			
		if (me.eventsSuspended === true) {
            if (me.eventQueue) {
                q = me.eventQueue;
                q.push(a);
            }
		} else if (Ext.isObject(ce) && ce.bubble) {
			if (ce.fire.apply(ce, a.slice(1)) === false) {
				return false;
			}
			
			if (Ext.isObject(ace) && ace.fire.apply(ace, a.slice(1)) === false) {
				return false;
			}
			
			c = me.getBubbleTarget && me.getBubbleTarget();
			
			if (c && c.enableBubble) {
				if (!c.events[ename] || !Ext.isObject(c.events[ename]) || !c.events[ename].bubble) {
                    c.enableBubble(ename);
                }
                return c.fireEvent.apply(c, a);
			}
		} else {			
			if (Ext.isObject(ce) || Ext.isObject(ace)) {
			    a.shift();
			}
			
			if (Ext.isObject(ce)) {	
				ret = ce.fire.apply(ce, a);
			}
			
			if (ret !== false && Ext.isObject(ace)) {				
				ret = ace.fire.apply(ace, a);
			}
		}
		
		return ret;
	},
	
	addAjaxListener : function (eventName, fn, scope, o) {
		var me = this,
			e,
			oe,
			filterOptRe = /^(?:scope|delay|buffer|single)$/,
			ce;
			
		if (Ext.isObject(eventName)) {
			o = eventName;
			
			for (e in o) {
				oe = o[e];
				
				if (!filterOptRe.test(e)) {
					me.addAjaxListener(e, oe.fn || oe, oe.scope || o.scope, oe.fn ? oe : o);
				}
			}
		} else {
			eventName = eventName.toLowerCase();
			ce = me.ajaxListeners[eventName] || true;
			
			if (Ext.isBoolean(ce)) {
				me.ajaxListeners[eventName] = ce = new Ext.util.Event(me, eventName);
			}
			
			o = Ext.isObject(o) ? o : {};
			
			if (Ext.isEmpty(o.delay)) {
                o.delay = 20;
            }
            
			ce.addListener(fn, scope, o);
		}
	}
});