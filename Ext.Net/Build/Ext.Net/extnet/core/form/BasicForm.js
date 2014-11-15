
// @source core/form/BasicForm.js

Ext.form.BasicForm.override({
    getValues : function (asString) {
        var isForm = !Ext.isEmpty(this.el.dom.elements),
            fs = Ext.lib.Ajax.serializeForm(isForm ? this.el.dom : this.el.up("form").dom, isForm ? undefined : this.el);
        
        if (asString === true) {
            return fs;
        }
        
        return Ext.urlDecode(fs);
    },
    
    getFieldValues : function (dirtyOnly, keyField) {
        var o = {},
            n,
            key,
            val,
            addField = function (f) {
                if (dirtyOnly !== true || f.isDirty()) {
                    n = keyField ? f[keyField] : f.getName();
                    key = o[n];
                    val = f.getValue();
                    
                    if (Ext.isDefined(key)) {
                        if (Ext.isArray(key)) {
                            o[n].push(val);
                        } else {
                            o[n] = [key, val];
                        }
                    } else {
                        o[n] = val;
                    }
                }
            };
            
        this.items.each(function (f) {
            if (f.isComposite && f.eachItem) {
                f.eachItem(function (cf) {
                    addField(cf);
                });
            } else {
                addField(f);
            }
        });
        return o;
    },
    
    findField : function (id) {
        var field = this.items.get(id);

        if (!Ext.isObject(field)) {
            //searches for the field corresponding to the given id. Used recursively for composite fields
            var findMatchingField = function (f) {
                if (f.isFormField) {
                    if (f.dataIndex === id || f.id === id || f.getName() === id || f.name === id) {
                        field = f;
                        return false;
                    } else if ((f.isComposite && f.rendered) || (f instanceof Ext.form.CheckboxGroup && f.items)) {
                        return f.items.each(findMatchingField);
                    }
                }
            };

            this.items.each(findMatchingField);
        }
        
        return field || null;
    },
    
    updateRecord : function (record) {
        record.beginEdit();
        var fs = record.fields;
        
        fs.each(function (f) {
            var field = this.findField(f.name);
            
            if (field) {
                var value = field.getValue();
                
                if (value && value.getGroupValue) {
                    value = value.getGroupValue();
                } else if (field.eachItem) {
                    value = [];
                    field.eachItem(function (item) { 
                        value.push(item.getValue());
                    });
                }
                
                record.set(f.name, value);
            }
        }, this);
        
        record.endEdit();
        return this;
    }
});