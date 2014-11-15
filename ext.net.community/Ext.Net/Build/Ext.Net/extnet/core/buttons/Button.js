
// @source core/buttons/Button.js

Ext.override(Ext.Button, {
	getPressedField : function () {
        if (!this.pressedField) {
            this.pressedField = new Ext.form.Hidden({ 
                id   : this.id + "_Pressed", 
                name : this.id + "_Pressed" 
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.pressedField);
        }
        return this.pressedField;
    },
    
    menuArrow : true,
    
    toggleMenuArrow : function () {
        if (this.menuArrow === false) {
            this.showMenuArrow();
            this.menuArrow = true;
        } else {
            this.hideMenuArrow();
            this.menuArrow = false;
        }
    },
    
    showMenuArrow : function () {
        var el = this.el.child("td.x-btn-mc em");
        
        if (!Ext.isEmpty(el)) {
            el.addClass("x-btn-arrow" + (this.arrowAlign === "bottom" ? "-bottom" : ""));
        }
    },
    
    hideMenuArrow : function () {
        var bottom = this.arrowAlign === "bottom" ? "-bottom" : "",
            el = this.el.child("td.x-btn-mc em.x-btn-arrow" + bottom);
        
        if (!Ext.isEmpty(el)) {
            el.removeClass("x-btn-arrow" + bottom);
        }
    },
    
    setTarget : function (target) {
        this.target = target;
    },
    
    setNavigateUrl : function () {
        if (this.navigateUrl) {
            this.on("click", function () {
                if (this.target) {
                    window.open(this.navigateUrl, this.target);
                } else {
                    window.location = this.navigateUrl;
                }
            }, this);
        }
    }
});

Ext.Button.prototype.onRender = Ext.Button.prototype.onRender.createSequence(function (el) {
    if (this.enableToggle || !Ext.isEmpty(this.toggleGroup)) {
        this.getPressedField().render(this.el.parent() || this.el);
       
        this.on("toggle", function (el, pressed) {
            el.getPressedField().setValue(pressed);
        }, this);      
    }
    
    if (this.el.hasClass("x-btn-over")) {
        this.on("mouseout", function () {
            this.addClass("x-btn-over");
        }, this);
    }
    
    if (this.flat) {
        this.el.wrap({ cls : "x-toolbar x-inline-toolbar" }); 
    }
    
    if (this.menuArrow === false) {
        this.hideMenuArrow();
    }
    
    this.setNavigateUrl();
});