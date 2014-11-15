
// @source core/form/HtmlEditor.js

Ext.form.HtmlEditor.override({
    escapeValue : true,
    
    syncValue : function () {
        if (this.initialized) {
            var bd = this.getEditorBody(),
                html = bd.innerHTML;
                
            if (Ext.isWebKit) {
                var bs = bd.getAttribute("style"),
                    m = bs.match(/text-align:(.*?);/i);

                if (m && m[1]) {
                    html = '<div style="' + m[0] + '">' + html + "</div>";
                }
            }

            html = this.cleanHtml(html);
            
            if (this.fireEvent("beforesync", this, html) !== false) {
                this.el.dom.value = this.escapeValue ? escape(html) : html;
                this.fireEvent("sync", this, html);
            }
        }
    },

    setValue : function (v) {
        Ext.form.HtmlEditor.superclass.setValue.call(this, (this.escapeValue && this.rendered) ? escape(v) : v);
        this.pushValue();
        return this;
    },

    getValue : function () {
        this[this.sourceEditMode ? "pushValue" : "syncValue"]();
        
        var v = Ext.form.HtmlEditor.superclass.getValue.call(this);
        
        if (!this.rendered) {
            return v;
        }
        
        return this.escapeValue ? unescape(v) : v;
    },

    toggleSourceEdit : function (sourceEditMode) {
        if (sourceEditMode === undefined) {
            sourceEditMode = !this.sourceEditMode;
        }
        
        this.sourceEditMode = sourceEditMode === true;
        
        var btn = this.tb.items.get("sourceedit");
        
        if (btn.pressed !== this.sourceEditMode) {
            btn.toggle(this.sourceEditMode);

            if (!btn.xtbHidden) {
                return;
            }
        }
        
        if (this.sourceEditMode) {
            this.disableItems(true);
            
            this.syncValue();
            
            if (this.escapeValue) {
                this.el.dom.value = unescape(this.el.dom.value);
            }
            
            this.iframe.className = "x-hidden";
            this.el.removeClass("x-hidden");
            this.el.dom.removeAttribute("tabIndex");
            this.el.focus();
        } else {
            if (this.initialized && !this.readOnly) {
                this.disableItems(false);
            }
            
            this.pushValue();
            
            if (this.escapeValue) {
                this.el.dom.value = escape(this.el.dom.value);
            }
            
            this.iframe.className = "";
            this.el.addClass("x-hidden");
            this.el.dom.setAttribute("tabIndex", -1);
            this.deferFocus();
        }
        
        var lastSize = this.lastSize;
        
        if (lastSize) {
            delete this.lastSize;
            this.setSize(lastSize);
        }
        
        this.fireEvent("editmodechange", this, this.sourceEditMode);
    },
    
    pushValue : function () {
        if (this.initialized) {
            var v = this.escapeValue ? unescape(this.el.dom.value) : this.el.dom.value;
            
            if (!this.activated && v.length < 1) {
                v = this.defaultValue;
            }
            
            if (this.fireEvent("beforepush", this, v) !== false) {
                this.getEditorBody().innerHTML = v;
                
                if (Ext.isGecko) {
                    // Gecko hack, see: https://bugzilla.mozilla.org/show_bug.cgi?id=232791#c8
                    this.setDesignMode(false);  //toggle off first

                }
                this.setDesignMode(true);
                
                this.fireEvent("push", this, v);
            }
        }
    },
    
    onEditorEvent: function () {
        if (Ext.isIE) {
            this.currentRange = this.getDoc().selection.createRange();
        }
        this.updateToolbar();
    },
    
    insertAtCursor : function (text) {
        if (!this.activated) {
            return;
        }

        if (Ext.isIE) {
            this.win.focus();
            var doc = this.getDoc(),
                r = this.currentRange || doc.selection.createRange();

            if (r) {
                r.pasteHTML(text);
                this.syncValue();
                this.deferFocus();
            }
        } else {
            this.win.focus();
            this.execCmd("InsertHTML", text);
            this.deferFocus();
        }
    }
});