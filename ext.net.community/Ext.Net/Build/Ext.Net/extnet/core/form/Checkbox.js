
// @source core/form/Checkbox.js

Ext.form.Checkbox.prototype.onRender = Ext.form.Checkbox.prototype.onRender.createSequence(function (ct, position) {
    if (!Ext.isEmpty(this.cls)) {
        this.wrap.addClass(this.cls);
    }
    
    if (!this.checked && (this.value === true || this.value === "true")) {
        this.setValue(true);
    }
    
    this.labelEl = this.wrap.child(".x-form-cb-label");
    this.applyBoxLabelCss();
});

Ext.form.Checkbox.prototype.initComponent = Ext.form.Checkbox.prototype.initComponent.createInterceptor(function () {
    if (this.value) {
        this.checked = this.value;
    }
});

Ext.form.Checkbox.override({
    applyBoxLabelCss : function () {
        if (this.boxLabelCls) {
            this.setBoxLabelCls(this.boxLabelCls);
        }
        
        if (this.boxLabelStyle) {
            this.setBoxLabelStyle(this.boxLabelStyle);
        }
    },
    
    setBoxLabelStyle : function (style) {
        this.boxLabelStyle = style;

        if (this.labelEl) {
            this.labelEl.applyStyles(style);
        }
    },
    
    setBoxLabelCls : function (cls) {
        if (this.labeEl && this.boxLabelCls) {
            this.labelEl.removeClass(this.boxLabelCls);
        }
        
        this.boxLabelCls = cls;
        
        if (this.labelEl) {
            this.labelEl.addClass(this.boxLabelCls);
        }
    },
    
    setBoxLabel : function (label) {
        this.boxLabel = label;        
        
        if (this.rendered) {
            if (this.labelEl) {
                this.labelEl.update(label);
            } else {            
                this.labelEl = this.wrap.createChild({
                    tag     : "label",
                    htmlFor : this.el.id,
                    cls     : "x-form-cb-label",
                    html    : this.boxLabel
                });

                this.applyBoxLabelCss();
            }
        }
    },
    
    setValue : function (v) {
        var checked = this.checked,
            inputVal = this.inputValue;
            
        this.checked = (v === true || v === "true" || v === "1" || v === 1 || (inputVal ? v === inputVal : String(v).toLowerCase() === "on"));
        
		if (this.rendered) {
            this.el.dom.checked = this.checked;
            this.el.dom.defaultChecked = this.checked;
        }

        if (checked !== this.checked) {
            this.fireEvent("check", this, this.checked);

            if (this.handler) {
                this.handler.call(this.scope || this, this, this.checked);
            }
        }
        return this;
    }
});