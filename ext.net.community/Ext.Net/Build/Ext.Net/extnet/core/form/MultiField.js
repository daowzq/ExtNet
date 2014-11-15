
// @source core/form/MultiField.js

Ext.net.MultiField = Ext.extend(Ext.form.Field, {
    defaultAutoCreate : { 
        tag : "div"
    },
    
    initValue  : Ext.emptyFn,
    setValue   : Ext.emptyFn,
    getValue   : Ext.emptyFn,
    
    initComponent : function () {
        Ext.net.MultiField.superclass.initComponent.call(this);
        this.on("afterrender", function () {
            var h = 0, fh, i;
        
            if (this.fields.length > 0) {            
                for (i = 0; i < this.fields.length; i++) {                             
                    fh = (this.fields[i].positionEl || this.fields[i].getEl()).getHeight();
                    if (fh > h) {
                        h = fh;
                    }
                }
            }
            
            if (h !== 0) {
                this.setHeight(h);
            }
        }, this);
    },
    
    onRender : function (ct, position) {
        Ext.net.MultiField.superclass.onRender.call(this, ct, position);
        
        if (this.ownerCt) {
            this.ownerCt.bubble(function (c) {
                if (c.form) {
                    this.form = c.form;
                    return false;
                }
            }, this);
        }

        this.fields = this.fields || [];
        
        if (!Ext.isArray(this.fields)) {
            this.fields = [this.fields];
        }
        
        this.el.setStyle("border", "none");
        
        var h = 0, fh;
        
        if (this.fields.length > 0) {            
            var fields = [], 
                i;            
            
            for (i = 0; i < this.fields.length; i++) {
                var fieldCt = this.el.createChild({ cls : "x-field-multi" }),
                    field = new Ext.ComponentMgr.create(this.fields[i]);
                    
                if ((i + 1) === this.fields.length) {
                    fieldCt.setStyle("paddingRight", "0px");
                }

                field.render(fieldCt);
                fields.push(field);
                               
                if (this.form && field.isFormField) {
                    this.form.items.add(field);
                }
                
                fh = (field.positionEl || field.getEl()).getHeight();
                if (fh > h) {
                    h = fh;
                }
            }

            this.fields = fields;
        }
        
        if (h !== 0) {
            this.setHeight(h);
        }
    },
    
    onResize : function (w, h) {
        if (!Ext.isNumber(w) || w === 0) {
            return;
        }
        
        if (!this.rendered) {
            this.width = w;
            return;
        }
        
        if (this.fields && this.fields.length > 0) {
            var i,
                f,
                pw,
                aw,
                el,
                percentWidth = 0,
                sum = 0,
                ratio;   
            
            if (w < 1) {
                return;
            }
            
            pw = w;
            
            for (i = 0; i < this.fields.length; i++) {
                f = this.fields[i];
                
                if (!f.anchor) {
                    el = f.positionEl || f.getEl();
                    pw -= (el.getSize().width + el.getMargins("lr") + el.parent().getPadding("lr"));
                }
            }

            pw = pw < 0 ? 0 : pw;
            
            for (i = 0; i < this.fields.length; i++) {
                f = this.fields[i];
                
                if (f.anchor) {
                    if (f.anchor.indexOf("%") !== -1) {
                        aw = parseFloat(f.anchor.replace("%", ""));
                        ratio = aw * 0.01;
                        percentWidth += aw;
                    } else {
                        ratio = parseFloat(f.anchor);
                    }
                    
                    w = Math.floor(ratio * pw);
                    sum += w;
                    
                    if (percentWidth === 100 && i === (this.fields.length - 1)) {
                        w += (pw - sum);
                    }
                    
                    el = f.positionEl || f.getEl();
                    w = w - el.getMargins("lr") - el.parent().getPadding("lr");
                    f.setWidth(w);
                }
            }
        }
    },
    
    beforeDestroy : function () {
        Ext.Panel.superclass.beforeDestroy.call(this);
        
        var i = this.fields.length - 1;

        for (i; i >= 0; i--) {
            Ext.destroy(this.fields[i]);
        }
    },
    
    addClass : function (cls) {
        Ext.net.MultiField.superclass.addClass.call(this, cls);
        
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].addClass) {
                this.fields[i].addClass(cls);
            }
        }
    },
    
    removeClass : function (cls) {
        Ext.net.MultiField.superclass.removeClass.call(this, cls);
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].removeClass) {
                this.fields[i].removeClass(cls);
            }
        }
    },
    
    disable : function () {
        Ext.net.MultiField.superclass.disable.call(this);
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].disable) {
                this.fields[i].disable();
            }
        }
    },
    
    enable : function () {
        Ext.net.MultiField.superclass.enable.call(this);
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].enable) {
                this.fields[i].enable();
            }
        }
    },
    
    setDisabled : function (disabled) {
        Ext.net.MultiField.superclass.setDisabled.call(this, disabled);
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].setDisabled) {
                this.fields[i].setDisabled(disabled);
            }
        }
    },
    
    clearInvalid : function () {
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].clearInvalid) {
                this.fields[i].clearInvalid();
            }
        }
    },
    
    isDirty : function () {
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].isDirty && this.fields[i].isDirty()) {
                return true;
            }
        }
        
        return false;
    },
    
    isValid : function (preventMark) {
        var isValid = true;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].isValid && !this.fields[i].isValid(preventMark)) {
                isValid = false;
            }
        }
        
        return isValid;
    },
    
    markInvalid : function (msg) {
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].markInvalid) {
                this.fields[i].markInvalid(msg);
            }
        }
    },
    
    reset : function () {
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].reset) {
                this.fields[i].reset();
            }
        }
    },
    
    setReadOnly : function (readOnly) {
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].setReadOnly) {
                this.fields[i].setReadOnly(readOnly);
            }
        }
    },
    
    validate : function () {
        var isValid = true;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].validate && !this.fields[i].validate()) {
                isValid = false;
            }
        }
        
        return isValid;
    }
});

Ext.reg("netmultifield", Ext.net.MultiField);