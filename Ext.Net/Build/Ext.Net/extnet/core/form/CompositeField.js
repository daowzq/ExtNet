
// @source core/form/CompositeField.js

Ext.form.CompositeField.override({
    buildLabel : function (segments) {
        var label = "";

        Ext.each(segments, function (segment) {
            if (!Ext.isEmpty(segment, false)) {
                label += (!Ext.isEmpty(label, false) ? this.labelConnector : "") + segment;
            }
        }, this);
        
        return label;
    },
    
    initComponent: function () {
        if (!this.items) {
            this.items = [];
        }
        
        var labels = [],
            items  = this.items,
            item,
            i = 0,
            j;

        for (i, j = items.length; i < j; i++) {
            item = items[i];

            labels.push(item.fieldLabel);

            //apply any defaults
            Ext.applyIf(item, this.defaults);

            //apply default margins to each item except the last
            if (!(i === j - 1 && this.skipLastItemMargin)) {
                Ext.applyIf(item, {margins: this.defaultMargins});
            }
        }

        this.fieldLabel = this.fieldLabel || this.buildLabel(labels);

        /**
         * @property fieldErrors
         * @type Ext.util.MixedCollection
         * MixedCollection of current errors on the Composite's subfields. This is used internally to track when
         * to show and hide error messages at the Composite level. Listeners are attached to the MixedCollection's
         * add, remove and replace events to update the error icon in the UI as errors are added or removed.
         */
        this.fieldErrors = new Ext.util.MixedCollection(true, function (item) {
            return item.field;
        });

        this.fieldErrors.on({
            scope   : this,
            add     : this.updateInvalidMark,
            remove  : this.updateInvalidMark,
            replace : this.updateInvalidMark
        });

        Ext.form.CompositeField.superclass.initComponent.apply(this, arguments);
        
        this.innerCt = new Ext.Container({
            layout  : "hbox",
            items   : this.items,
            cls     : "x-form-composite",
            layoutConfig   : this.layoutConfig,
            autoDoLayout   : this.autoDoLayout,
            defaultMargins : "0 3 0 0"
        });
        
        this.fields = this.innerCt.findBy(function (c) {
            return c.isFormField;
        }, this);

        this.items = new Ext.util.MixedCollection();
        this.items.addAll(Ext.isArray(items) ? items : [items]);
        
        Ext.each(items, function (item) {
            if (item && item.on) {
                if (!item.getName) {
                    item.getName = Ext.emptyFn;
                }
                
                item.on("show", function () {
                    this.doLayout(); 
                }, this);
                
                item.on("hide", function () {
                    this.doLayout(); 
                }, this);
            }
        }, this);
    },
    
    onRender : function (ct, position) {
        if (!this.el) {
            /**
             * @property innerCt
             * @type Ext.Container
             * A container configured with hbox layout which is responsible for laying out the subfields
             */
            var innerCt = this.innerCt;
            innerCt.render(ct);

            this.el = innerCt.getEl();

            //if we're combining subfield errors into a single message, override the markInvalid and clearInvalid
            //methods of each subfield and show them at the Composite level instead
            if (this.combineErrors) {
                this.eachItem(function (field) {
                    Ext.apply(field, {
                        markInvalid  : this.onFieldMarkInvalid.createDelegate(this, [field], 0),
                        clearInvalid : this.onFieldClearInvalid.createDelegate(this, [field], 0)
                    });
                });
            }

            //set the label "for" to the first item
            var l = this.el.parent().parent().child("label", true);
            
            if (l && this.fields && this.fields.length > 0) {
                l.setAttribute("for", this.items.items[0].id);
            }
        }

        Ext.form.CompositeField.superclass.onRender.apply(this, arguments);
    },
    
    isField : function (c) {
        return !!c.setValue && !!c.getValue && !!c.markInvalid && !!c.clearInvalid;
    },
    
    eachItem : function (fn, scope) {
        if (this.items && this.items.each) {
            var i = 0,
                len;

            for (i, len = this.items.length; i < len; i++) {
                var item = this.items.get(i);
              
                if (this.isField(item) && fn.call(scope || this, item, i, len) === false) {
                    break;
                }
            }
        }
    },
    
    addClass : function (cls) {
        Ext.form.CompositeField.superclass.addClass.call(this, cls);
        
        var i;
        
        for (i = 0; i < this.items.length; i++) {
            if (this.items.get(i).addClass) {
                this.items.get(i).addClass(cls);
            }
        }
    },
    
    removeClass : function (cls) {
        Ext.form.CompositeField.superclass.removeClass.call(this, cls);
        var i;
        
        for (i = 0; i < this.items.length; i++) {
            if (this.items.get(i).removeClass) {
                this.items.get(i).removeClass(cls);
            }
        }
    },
    
    disable : function () {
        Ext.form.CompositeField.superclass.disable.call(this);
        var i;
        
        for (i = 0; i < this.items.length; i++) {
            if (this.items.get(i).disable) {
                this.items.get(i).disable();
            }
        }
    },
    
    enable : function () {
        Ext.form.CompositeField.superclass.enable.call(this);
        var i;
        
        for (i = 0; i < this.items.length; i++) {
            if (this.items.get(i).enable) {
                this.items.get(i).enable();
            }
        }
    },
    
    setDisabled : function (disabled) {
        Ext.form.CompositeField.superclass.setDisabled.call(this, disabled);
        var i;
        
        if (this.rendered) {
            for (i = 0; i < this.items.length; i++) {
                if (this.items.get(i).setDisabled) {
                    this.items.get(i).setDisabled(disabled);
                }
            }
        }
        this.disabled = disabled;
    },
    
    onFieldMarkInvalid : function (field, message) {
        var name  = field.fieldLabel || field.dataIndex || (field.getName ? field.getName() : ""),
            error = {
                field: name, 
                errorName: field.fieldLabel || name,
                error: message
            };
        
        this.fieldErrors.replace(name, error);
        
        field.el.addClass(field.invalidClass);
    },
    
    onFieldClearInvalid : function (field) {
        this.fieldErrors.removeKey(field.fieldLabel || field.dataIndex || (field.getName ? field.getName() : ""));
        
        field.el.removeClass(field.invalidClass);
    },
    
    sortErrors : function () {
        var fields = this.items;
        
        this.fieldErrors.sort("ASC", function (a, b) {
            var findByName = function (key) {
                return function (field) {
                    return (field.fieldLabel || field.dataIndex || (field.getName ? field.getName() : "")) === key;
                };
            };
            
            var aIndex = fields.findIndexBy(findByName(a.field)),
                bIndex = fields.findIndexBy(findByName(b.field));
            
            return aIndex < bIndex ? -1 : 1;
        });
    },
    
    doLayout : function (shallow, force) {
        if (this.rendered) {
            var innerCt = this.innerCt;

            innerCt.forceLayout = this.ownerCt ? this.ownerCt.forceLayout : false;
            innerCt.doLayout(shallow, force);
        }
    }
});