
// @source core/form/DropDownField.js

Ext.net.DropDownField = Ext.extend(Ext.net.TriggerField, {
    lazyInit       : true,
    componentAlign : "tl-bl?",
    allowBlur      : false,
    mode           : "text",
    
    syncValue : Ext.emptyFn,
    
    initComponent : function () {
        Ext.net.DropDownField.superclass.initComponent.call(this);        
        this.addEvents("expand", "collapse");
        
        var cn = [], triggerCfg, isSimple;
        
        triggerCfg = {
            tag : "img",
            src : Ext.BLANK_IMAGE_URL,
            cls : "x-form-trigger"
        };
        
        if (!Ext.isEmpty(this.triggerClass, false)) {
            triggerCfg.cls += " " + this.triggerClass;
        }
        
        if (Ext.net.StringUtils.startsWith(this.triggerClass || "", "x-form-simple")) {            
            if (this.triggersConfig && this.triggersConfig.length > 0) {
                triggerCfg.cls += " shift-trigger";
            }
                                
            isSimple = true;
        }

        if (this.hideTrigger) {
            Ext.apply(triggerCfg, { style : "display:none", hidden : true });
            this.hideTrigger = false;
        }
        
        if (isSimple) {
            this.addClass("clear-right");
        }
        
        if (this.triggersConfig) {           
            this.triggerConfig.cn.push(triggerCfg);
        } else {
            cn.push(triggerCfg);   
            this.triggerConfig = { 
                tag : "span", 
                cls : "x-form-twin-triggers", 
                cn  : cn 
            };
        }
    },
    
    initTrigger : function () {
        Ext.net.DropDownField.superclass.initTrigger.call(this);        
        this.triggers[this.triggers.length - 1].removeListener("click", this.onCustomTriggerClick, this);
        this.triggers[this.triggers.length - 1].on("click", this.onTriggerClick, this);
    },
    
    initDropDownComponent : function () {
        if (this.component && !this.component.render) {
            this.component.floating = true;
            this.component = new Ext.ComponentMgr.create(this.component, "panel");
        }
        
        var renderTo = this.componentRenderTo || Ext.net.ResourceMgr.getAspForm() || document.body,
            zindex = parseInt(Ext.fly(renderTo).getStyle("z-index"), 10);
            
        if (this.ownerCt && !zindex) {
            this.findParentBy(function (ct) {
                zindex = parseInt(ct.getPositionEl().getStyle("z-index"), 10);
                return !!zindex;
            });
        }
        
        this.component.setWidth(this.component.initialConfig.width || this.getWidth());
        this.component.dropDownField = this;
        this.component.render(renderTo);
        this.component.hide();
        this.first = true;
        
        this.component.getPositionEl().position("absolute", (zindex || 12000) + 5);
        
        if (this.component.initialConfig.height) {
            this.component.setHeight(this.component.initialConfig.height);
        }
        
        this.syncValue(this.getValue(), this.getText());
    },
    
    onRender   : function (ct, position) {
        Ext.net.DropDownField.superclass.onRender.call(this, ct, position);
        
        if (Ext.isGecko) {
            this.el.dom.setAttribute("autocomplete", "off");
        }
        
        if (!this.lazyInit) {
            this.initDropDownComponent();
        } else {
            this.on("focus", this.initDropDownComponent, this, {single: true});
        }
        
        if (this.mode !== "text") {
            this.getUnderlyingValueField().render(ct);
        }
    },
    
    isExpanded : function () {
        return this.component && this.component.isVisible && this.component.isVisible();
    },
    
    collapse : function () {
        if (!this.isExpanded()) {
            return;
        }
        
        this.component.hide();
        
        if (this.allowBlur === false) {
            Ext.getDoc().un("mousewheel", this.collapseIf, this);
            Ext.getDoc().un("mousedown", this.collapseIf, this);
        }
        
        this.fireEvent("collapse", this);
    },
    
    collapseIf : function (e) {
        if (!e.within(this.wrap) && !e.within(this.component.el)) {
            this.collapse();
        }
    },
    
    expand : function () {
        if (this.isExpanded() || !this.hasFocus) {
            return;
        }
        
        if (this.first) {
            this.doResize(this.el.getWidth() + this.getTriggerWidth());
            delete this.first;
        } else if (this.bufferSize) {
            this.doResize(this.bufferSize);
            delete this.bufferSize;
        }
        
        var el = this.component.getPositionEl();
        el.setLeft(0);
        el.setTop(0);
        if(Ext.isIE6 || Ext.isIE7){
            this.component.show();
        }
        
        el.alignTo(this.wrap, this.componentAlign);
        
        if(!(Ext.isIE6 || Ext.isIE7)){
            this.component.show();
        }
        
        if (this.allowBlur === false) {
            this.mon(Ext.getDoc(), { 
                scope: this,
                mousewheel: this.collapseIf,
                mousedown: this.collapseIf
            });
        }
        
        this.fireEvent("expand", this);
    },
    
    onTriggerClick : function () {
        if (this.readOnly || this.disabled) {
            return;
        }
        
        if (this.isExpanded()) {
            this.collapse();
        } else {
            this.onFocus({});
            this.expand();
        }
        
        this.el.focus();  
    },
    
    validateBlur : function () {
        return !this.component || !this.component.isVisible();
    },
    
    onResize : function (w, h) {
        Ext.net.DropDownField.superclass.onResize.apply(this, arguments);
        
        if (this.isVisible() && this.component && this.componentAlign.render) {
            this.doResize(w);
        } else {
            this.bufferSize = w;
        }
    },
    
    doResize: function (w) {
        if (!Ext.isDefined(this.component.initialConfig.width)) {
            this.component.setWidth(w);
        }    
    },
    
    checkTab : function (me, e) {
        if (!this.isExpanded() && e.getKey() === e.TAB) {
            this.triggerBlur();
        }
    },
    
    onDestroy : function () {
        if (this.component && this.component.rendered) {
            this.component.destroy();
        }
        
        if (this.underlyingValueField && this.underlyingValueField.rendered) {
            this.underlyingValueField.destroy();
        }
        
        Ext.net.DropDownField.superclass.onDestroy.call(this);
    },
    
    setValue : function (value, text, collapse) {              
        if (this.mode === "text") {
            collapse = text;
            text = value;
        }
        
        Ext.net.DropDownField.superclass.setValue.apply(this, [text]);
        this.getUnderlyingValueField().setValue(value);
        
        if (!this.isExpanded()) {
            this.syncValue(value, text);
        }
        
        if (collapse !== false) {
            this.collapse();
        }
        
        return this;
    },
    
    setRawValue : function (value, text) {        
        Ext.net.DropDownField.superclass.setRawValue.call(this, value);
        this.getUnderlyingValueField().setValue(value);
        
        if (!this.isExpanded()) {
            this.syncValue(value, text);
        }
        
        return this;
    },
    
    initEvents : function () {
        Ext.net.DropDownField.superclass.initEvents.call(this);

        this.keyNav = new Ext.KeyNav(this.el, {
            "down"  : function (e) {
                if (!this.isExpanded()) {
                    this.onTriggerClick();
                }
            },
            "esc"   : function (e) {
                this.collapse();
            },
            "tab"   : function (e) {
                this.collapse();
                return true;
            },
            scope   : this,
            doRelay : function (e, h, hname) {
                if (hname === "down" || this.scope.isExpanded()) {
                    var relay = Ext.KeyNav.prototype.doRelay.apply(this, arguments);
                    
                    if (!Ext.isIE && Ext.EventManager.useKeydown) {
                        this.scope.fireKey(e);
                    }
                    
                    return relay;
                }
                return true;
            },

            forceKeyDown : true,
            defaultEventAction : "stopEvent"
        });
    },
    
    getUnderlyingValueField : function () {
        if (!this.underlyingValueField) {
            this.underlyingValueField = new Ext.form.Hidden({
                id    : this.id + "_Value",
                name  : this.id + "_Value",
                value : this.underlyingValue || ""
            });
 
			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.underlyingValueField);			
        }

        return this.underlyingValueField;
    },
    
    getText : function () {
        return Ext.net.DropDownField.superclass.getValue.call(this);
    },
    
    getValue : function () {
        return this.getUnderlyingValueField().getValue();
    },
    
    getRawValue : function () {
        return this.getValue();
    },
    
    reset : function () {        
        if (this.isTextMode()) {
            this.setValue(this.originalText, false);
        } else {
            this.setValue(this.originalValue, this.originalText, false);
        }

        this.clearInvalid();
        this.applyEmptyText();
    },
    
    isTextMode : function () {
        return this.mode === "text";
    },
    
    initValue : function () {
        Ext.net.DropDownField.superclass.initValue.call(this);   
        
        if (this.text !== undefined) {
            if (this.isTextMode()) {
                this.setValue(this.text, false);
            } else {
                this.setValue(this.getValue(), this.text, false);
            }            
        }
     
        this.originalText = this.getText();
    },
    
    clearValue : function () {
        this.setRawValue("", "");
        this.applyEmptyText();
    }
});

Ext.reg("netdropdown", Ext.net.DropDownField);