
// @source core/utils/Element.js

Ext.Element.addMethods({
    addKeyListenerEx : function (key, fn, scope) {
        this.addKeyListener(key, fn || key.fn, scope || key.scope);
        return this;
    },
    
    initDDEx : function (group, config, overrides) {
        this.initDD(group, config, overrides);
        return this;
    },
    
    initDDProxyEx : function (group, config, overrides) {
        this.initDDProxy(group, config, overrides);
        return this;
    },

    initDDTargetEx : function (group, config, overrides) {
        this.initDDTarget(group, config, overrides);
        return this;
    },
    
    positionEx : function (pos, zIndex, x, y) {
        this.position(pos, zIndex, x, y);
        return this;
    },
    
    relayEventEx : function (eventName, observable) { 
        this.relayEvent(eventName, observable);
        return this;
    },
    
    scrollEx : function (direction, distance, animate) {
        this.scroll(direction, distance, animate);
        return this;
    },
    
    unmaskEx : function () {
        this.unmask();
        return this;
    },
    
    singleSelect : function (selector, unique) {
        return Ext.get(Ext.select(selector, unique).elements[0]);
    },
    
    setValue : function (val) {
        if (Ext.isDefined(this.dom.value)) {
            this.dom.value = val;
        }
        
        return this;
    },
    
    getValue : function () {
        return Ext.isDefined(this.dom.value) ? this.dom.value : null;
    },
    
    mask : function (msg, msgCls) {
        var me  = this,
            dom = me.dom,
            dh  = Ext.DomHelper,
            EXTELMASKMSG = "ext-el-mask-msg",
            el,
            mask;

        if (!(/^body/i.test(dom.tagName) && me.getStyle("position") === "static") && !me.hasClass("x-page-mask")) {
            me.addClass("x-masked-relative");
        }
        
        el = Ext.Element.data(dom, "maskMsg");
        if (el) {
            el.remove();
        }
        
        el = Ext.Element.data(dom, "mask");
        if (el) {
            el.remove();
        }

        mask = dh.append(dom, {
            cls : "ext-el-mask"
        }, true);
        
        Ext.Element.data(dom, "mask", mask);

        me.addClass("x-masked");
        mask.setDisplayed(true);
        
        if (typeof msg === "string") {
            var mm = dh.append(dom, {
                cls : EXTELMASKMSG, 
                cn  : {
                    tag : "div"
                }
            }, true);
            
            Ext.Element.data(dom, "maskMsg", mm);
            mm.dom.className = msgCls ? EXTELMASKMSG + " " + msgCls : EXTELMASKMSG;
            mm.dom.firstChild.innerHTML = msg;
            mm.setDisplayed(true);
            mm.center(me);
        }
        
        // ie will not expand full height automatically
        if (Ext.isIE && !(Ext.isIE7 && Ext.isStrict) && me.getStyle("height") === "auto") {
            mask.setSize(undefined, me.getHeight());
        }
        
        return mask;
    } 
});