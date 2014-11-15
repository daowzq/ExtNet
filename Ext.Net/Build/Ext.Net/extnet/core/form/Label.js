
// @source core/form/Label.js

Ext.form.Label.override({
    iconAlign   : "left",
    isFormField : true,

    // for correct FormPanel reset
    reset    : Ext.emptyFn,
    getName  : Ext.emptyFn,
    
    validate : function () {
        return true;
    },
    
    isValid  : function () {
        return true;
    },

    valueElement : function () {
        var textEl = document.createElement("span");
        
        textEl.className = "x-label-value";
        textEl.innerHTML = this.text ? Ext.util.Format.htmlEncode(this.text) : (this.html || "");
        this.textEl = Ext.get(textEl);
		this.textEl.setOverflow = Ext.emptyFn;
        
        if (this.editor) {
            if (Ext.isEmpty(this.editor.field)) {
                this.editor.field = {
                    xtype : "textfield"
                };
            }
            
            this.editor.target = textEl;
            this.editor = new Ext.Editor({}, this.editor);
        }

        return textEl;
    },

    onRender : function (ct, position) {
        if (!this.el) {
            this.el = document.createElement(this.forId ? "label" : "span");
            this.el.className = "x-label";
            this.el.id = this.getId();

            var img = document.createElement("img");
            img.src = Ext.BLANK_IMAGE_URL;
            img.className = "x-label-icon " + (this.iconCls || "");

            if (Ext.isEmpty(this.iconCls)) {
                img.style.display = "none";
            }

            if (this.iconAlign === "left") {
                this.el.appendChild(img);
            }

            this.el.appendChild(this.valueElement());

            if (this.iconAlign === "right") {
                this.el.appendChild(img);
            }

            if (this.forId) {
                this.el.setAttribute("for", this.forId);
            }

            if (ct.hasClass("x-form-element")) {
                ct.setStyle("padding-top", "3px");
            }
        }

        Ext.form.Label.superclass.onRender.call(this, ct, position);
    },
    
    getContentTarget : function () {
        return this.textEl;
    },
    
    getText : function (encode) {
        return this.rendered ? encode === true ? Ext.util.Format.htmlEncode(this.textEl.dom.innerHTML) : this.textEl.dom.innerHTML : this.text;
    },

    setText : function (t, encode) {
        this.text = t;
        
        if (this.rendered) {
            var x = encode !== false ? Ext.util.Format.htmlEncode(t) : t;
            this.textEl.dom.innerHTML = (Ext.isEmpty(t) && !Ext.isEmpty(this.emptyText)) ? this.emptyText : !Ext.isEmpty(this.format) ? String.format(this.format, x) : x;
        }
        
        return this;
    },

    setIconClass : function (cls) {
        var oldCls = this.iconCls;
        this.iconCls = cls;
        
        if (this.rendered) {
            var img = this.el.child("img.x-label-icon");
            img.replaceClass(oldCls, this.iconCls);
            img.dom.style.display = (cls === "") ? "none" : "inline";
        }
    } 
});