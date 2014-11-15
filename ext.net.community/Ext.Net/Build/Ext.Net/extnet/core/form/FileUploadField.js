
// @source core/form/FileUploadField.js

Ext.form.FileUploadField = Ext.extend(Ext.form.TextField, {
    buttonText   : "Browse...",
    buttonOnly   : false,
    buttonOffset : 3,
    // private
    readOnly     : true,
    autoSize     : Ext.emptyFn,
    actionMode   : "wrap",
    
    // private
    initComponent : function () {
        Ext.form.FileUploadField.superclass.initComponent.call(this);

        this.addEvents("fileselected");
    },
    
    isIconIgnore : function () {
        return true;
    },
    
    syncSize : function () {
        Ext.form.FileUploadField.superclass.syncSize.apply(this, arguments);
        this.fileInput.setWidth(this.button.getEl().getWidth() + (Ext.isIE ? 4 : 0));
    },

    // private
    onRender : function (ct, position) {
        Ext.form.FileUploadField.superclass.onRender.call(this, ct, position);

        this.wrap = this.el.wrap({ 
            cls   : "x-form-field-wrap x-form-file-wrap", 
            style : "overflow:hidden;" + (Ext.isIE ? "height:22px;" : "") 
        });
        
        this.el.addClass("x-form-file-text");
        this.el.dom.removeAttribute("name");

        this.createFileInput();

        var btnCfg = Ext.applyIf(this.buttonCfg || {}, {
            text     : this.buttonText,
            disabled : this.disabled,
            iconCls  : this.iconCls
        });
        
        this.button = new Ext.Button(Ext.apply(btnCfg, {
            renderTo : this.wrap,
            cls      : "x-form-file-btn" + (btnCfg.iconCls ? (btnCfg.text ? " x-btn-text-icon" : " x-btn-icon") : "")
        }));
        
        var fiWidth = this.button.getEl().getWidth() + (Ext.isIE ? 4 : 0);
        
        if (fiWidth > (Ext.isIE ? 4 : 0)) {
            this.fileInput.setWidth(fiWidth);
        }

        if (this.buttonOnly) {
            this.el.setVisibilityMode(Ext.Element.DISPLAY);
            this.el.hide();
            
            this.wrap.setWidth(this.button.getEl().getWidth());            
        }
		
        this.bindListeners();
        this.resizeEl = this.positionEl = this.wrap;
    },
	
	bindListeners: function () {
        this.fileInput.on({
            scope      : this,
            mouseenter : function () {
                this.button.addClass([ "x-btn-over", "x-btn-focus" ]);
            },
            mouseleave : function () {
                this.button.removeClass([ "x-btn-over", "x-btn-focus", "x-btn-click" ]);
            },
            mousedown  : function () {
                this.button.addClass("x-btn-click");
            },
            mouseup    : function () {
                this.button.removeClass([ "x-btn-over", "x-btn-focus", "x-btn-click" ]);
            },
            change     : function () {
                var v = this.fileInput.dom.value,                
                    fileNameRegex = /[^\\]*$/im,
                    match = fileNameRegex.exec(v);
                    
                if (match !== null) {
	                v = match[0];
                }
                
                this.setValue(v);
                this.fireEvent("fileselected", this, v);    
            }
        }); 
    },

    createFileInput : function () {
        if (this.fileInput) {
            this.fileInput.remove();
        }

        this.fileInput = this.wrap.createChild({
            id    : this.getFileInputId(),
            name  : this.name || this.getFileInputId(),
            cls   : "x-form-file",
            tag   : "input",
            type  : "file",
            size  : 1
        });
        
        if (this.buttonOnly && this.button) {
            var fiWidth = this.button.getEl().getWidth() + (Ext.isIE ? 4 : 0);
            if (fiWidth > (Ext.isIE ? 4 : 0)) {
                this.fileInput.setWidth(fiWidth);
            }
        }
        
        if (this.disabled) {
            this.fileInput.dom.disabled = true;
        }
    },

    // private
    getFileInputId : function () {
        return this.id + "-file";
    },

    // private
    onResize : function (w, h) {
        Ext.form.FileUploadField.superclass.onResize.call(this, w, h);

        this.wrap.setWidth(w);        

        if (!this.buttonOnly) {
            w = this.wrap.getWidth() - this.button.getEl().getWidth() - this.buttonOffset;
            
            if (w > 0) {
                this.el.setWidth(w);
            }
        }
    },

    // private
    onDestroy: function () {
        Ext.form.FileUploadField.superclass.onDestroy.call(this);
        Ext.destroy(this.fileInput, this.button, this.wrap);
    },

	onDisable: function () {
        Ext.form.FileUploadField.superclass.onDisable.call(this);
        this.doDisable(true);
    },
    
    onEnable: function () {
        Ext.form.FileUploadField.superclass.onEnable.call(this);
        this.doDisable(false);
    },
    
    // private
    doDisable: function (disabled) {
        this.fileInput.dom.disabled = disabled;
        this.button.setDisabled(disabled);
    },

    // private
    preFocus : Ext.emptyFn,

    // private
    alignErrorIcon : function () {
        this.errorIcon.alignTo(this.wrap, "tl-tr", [2, 0]);
    },

    reset : function () {
        this.createFileInput();
        this.bindListeners();
        Ext.form.FileUploadField.superclass.reset.call(this);
    }
});

Ext.reg("fileuploadfield", Ext.form.FileUploadField);