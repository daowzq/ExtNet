
// @source core/form/Hyperlink.js

Ext.net.HyperLink = Ext.extend(Ext.form.Label, {
    cls : "",
    url : "#",

    valueElement : function () {
        var textEl = document.createElement("a");
        
        textEl.style.verticalAlign = "middle";
        
        if (!Ext.isEmpty(this.cls, false)) {
            textEl.className = this.cls;
        }

        textEl.setAttribute("href", this.url);
        
        this.textEl = Ext.get(textEl);
		this.textEl.setOverflow = Ext.emptyFn;

        if (this.disabled) {
            textEl.setAttribute("disabled", "1");
            textEl.removeAttribute("href");
        }

        if (!Ext.isEmpty(this.target, false)) {
            textEl.setAttribute("target", this.target);
        }

        if (this.imageUrl) {
            textEl.innerHTML = '<img src="' + this.imageUrl + '" />';
        } else {
            textEl.innerHTML = this.text ? Ext.util.Format.htmlEncode(this.text) : (this.html || "");
        }
        
        return textEl;
    },

    setDisabled : function (disabled) {
        Ext.net.HyperLink.superclass.setDisabled.apply(this, arguments);
        
        if (disabled) {
            this.textEl.dom.setAttribute("disabled", "1");
            this.textEl.dom.removeAttribute("href");
        } else {
            this.textEl.dom.removeAttribute("disabled");
            this.textEl.dom.setAttribute("href", this.url);
        }
    },

    setImageUrl : function (imageUrl) {
        this.imageUrl = imageUrl;
        this.textEl.dom.innerHTML = '<img style="border:0px;" src="' + this.imageUrl + '" />';
    },

    setUrl : function (url) {
        this.url = url;
        this.textEl.dom.setAttribute("href", this.url);
    },

    setTarget : function (target) {
        this.target = target;
        this.textEl.dom.setAttribute("target", this.target);
    }
});

Ext.reg("nethyperlink", Ext.net.HyperLink);