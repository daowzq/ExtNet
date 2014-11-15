
// @source core/form/FieldLabeler.js
/*!
 * Ext JS Library 3.1+
 * Copyright(c) 2006-2009 Ext JS, LLC
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.ns("Ext.ux");

/**
 * @class Ext.ux.FieldLabeler
 * <p>A plugin for Field Components which renders standard Ext form wrapping and labels
 * round the Field at render time regardless of the layout of the Container.</p>
 * <p>Usage:</p>
 * <pre><code>
   {
        xtype: "combo",
        plugins: [ Ext.ux.FieldLabeler ],
        triggerAction: "all",
        fieldLabel: "Select type",
        store: typeStore
    }
 * </code></pre>
 */
Ext.ux.FieldLabeler = (function () {

    // Pulls a named property down from the first ancestor Container it's found in
    var getParentProperty = function (propName) {
        var p;
        
        for (p = this.ownerCt; p; p = p.ownerCt) {
            if (p[propName]) {
                return p[propName];
            }
        }
    };

    return {
        // Add behaviour at important points in the Field"s lifecycle.
        init : function (f) {
            f.labeler = this;
            f.onRender = f.onRender.createSequence(this.onRender);            
        },

        onRender : function () {
            // Do nothing if being rendered by a form layout
            if (this.ownerCt) {
                if (this.ownerCt.layout instanceof Ext.layout.FormLayout || (this.ownerCt.el && this.ownerCt.el.hasClass("x-form-composite"))) {
                    delete this.labeler;
                    return;
                }
            }
            
            this.onResize = this.labeler.onResize;
            this.onDestroy = this.onDestroy.createSequence(this.labeler.onDestroy);
            var isToolbar = (this.wrap || this.el).up(".x-toolbar");
            
            this.resizeEl = (this.wrap || this.el).wrap({
                cls   : "x-form-element",
                style : (Ext.isIE6 || Ext.isIE7) && !isToolbar ? "position:absolute;overflow:visible;left:0;" : ""
            });
            
            this.positionEl = this.itemCt = this.resizeEl.wrap({
                cls   : "x-form-item ",
                style : (isToolbar ? "margin-bottom:0px;" : "") + (Ext.isIE && isToolbar ? "margin-top:1px;" : "") /*+ (Ext.isIE6 && !isToolbar ? "display:inline;" : "")*/
            });
            
            if (this.nextSibling()) {
                this.margins = Ext.apply({
                    top    : 0,
                    right  : 0,
                    bottom : this.positionEl.getMargins("b"),
                    left   : 0
                }, this.margins);
            }
            
            this.actionMode = "itemCt";

            // If our Container is hiding labels, then we"re done!
            if (!Ext.isDefined(this.hideLabels)) {
                this.hideLabels = getParentProperty.call(this, "hideLabels");
            }
            
            if (this.hideLabels) {
                this.resizeEl.setStyle("padding-left", "0px");
                return;
            }

            // Collect the info we need to render the label from our Container.
            if (!Ext.isDefined(this.labelSeparator)) {
                this.labelSeparator = getParentProperty.call(this, "labelSeparator");
            }
            
            if (!Ext.isDefined(this.labelPad)) {
                this.labelPad = getParentProperty.call(this, "labelPad");
            }
            
            if (!Ext.isDefined(this.labelAlign)) {
                this.labelAlign = getParentProperty.call(this, "labelAlign") || "left";
            }
            
            this.itemCt.addClass("x-form-label-" + this.labelAlign);

            if (this.labelAlign === "top") {
                if (!this.labelWidth) {
                    this.labelWidth = "auto";
                }
                
                this.resizeEl.setStyle("padding-left", "0px");
            } else {
                if (!Ext.isDefined(this.labelWidth)) {
                    this.labelWidth = getParentProperty.call(this, "labelWidth") || 100;
                }
                
                if ((Ext.isIE6 || Ext.isIE7) && isToolbar) {
                    this.resizeEl.setStyle("padding-left", (this.labelPad || 5) + "px");
                } else {
                    this.resizeEl.setStyle("padding-left", (this.labelWidth + (this.labelPad || 5)) + "px");
                }
            }

            this.label = this.itemCt.insertFirst({
                tag   : "label",
                cls   : "x-form-item-label",
                style : {
                    width : this.labelWidth + "px"
                },
                html  : this.fieldLabel + (this.labelSeparator || ":")
            });
        },

        // private
        // Ensure the input field is sized to fit in the content area of the resizeEl (to the right of its padding-left)
        // We perform all necessary sizing here. We do NOT call the current class"s onResize because we need this control
        // we skip that and go up the hierarchy to Ext.form.Field
        onResize : function (w, h) {
            Ext.form.Field.prototype.onResize.apply(this, arguments);
            
            if (w) {
                w -= this.resizeEl.getPadding("l");                
                
                if (this.getTriggerWidth) {
                    this.wrap.setWidth(w);
                    this.el.setWidth(w - this.getTriggerWidth());
                } else {                    
                    this.el.setWidth(w);
                }
            }            
            
            if (h && (this.el.dom.tagName.toLowerCase() === "textarea" || Ext.isIE6 || Ext.isIE7)) {
                h = this.resizeEl.getHeight(true);
            
                if (!this.hideLabels && (this.labelAlign === "top")) {
                    h -= this.label.getHeight();
                }
            
                if (!Ext.isIE6 && !Ext.isIE7) {
                    this.el.setHeight(h);
                } else {
                    this.el.up(".x-form-item").setHeight(h);
                }
            }
        },

        // private
        // Ensure that we clean up on destroy.
        onDestroy : function () {
            this.itemCt.remove();
        }
    };
})();