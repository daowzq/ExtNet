
// @source data/PropertyGrid.js

Ext.net.PropertyGrid = function () {
    Ext.net.PropertyGrid.superclass.constructor.call(this);	
	this.addEvents("beforesave", "save", "saveexception");
};

Ext.net.PropertyGrid = Ext.extend(Ext.grid.PropertyGrid, {
    editable : true,
        
    getDataField : function () {
        if (!this.dataField) {
            this.dataField = new Ext.form.Hidden({ id : this.id + "_Data", name : this.id + "_Data" });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.dataField);
        }
        
        return this.dataField;
    },

    initComponent : function () {
        Ext.net.PropertyGrid.superclass.initComponent.call(this);
        
        this.propertyNames = this.propertyNames || [];
        
        if (!this.editable) {
            this.on("beforeedit", function (e) {
                return false;
            });
        }
        
        this.on("propertychange", function (source) {
            this.saveSource(source);
        });
    },

    onRender : function () {
        Ext.net.PropertyGrid.superclass.onRender.apply(this, arguments);
        this.getDataField().render(this.el.parent() || this.el);
    },

    callbackHandler : function (response, result, context, type, action, extraParams) {
        try {
            var responseObj = result.serviceResponse;
            result = { success : responseObj.success, msg : responseObj.message || null };
        } catch (e) {
            context.fireEvent("saveexception", context, response, e);

            return;
        }

        if (result.success === false) {
            context.fireEvent("saveexception", context, response, { message : result.msg });

            return;
        }

        context.fireEvent("save", context, response);
    },

    callbackErrorHandler : function (response, result, context, type, action, extraParams) {
        context.fireEvent("saveexception", context, response, { message : result.errorMessage || response.statusText });
    },
    
    saveSource : function (source) {
        this.getDataField().setValue(Ext.encode(source || this.propStore.getSource()));
    },

    save : function () {
        var options = { params : {} };
        
        if (this.fireEvent("beforesave", this, options) !== false) {
            var config = {}, 
                ac = this.directEventConfig;
                
            ac.userSuccess = this.callbackHandler;
            ac.userFailure = this.callbackErrorHandler;
            ac.extraParams = options.params;
            ac.enforceFailureWarning = !this.hasListener("saveexception");

            Ext.apply(config, ac, { control : this, eventType : "postback", action : "update", serviceParams : Ext.encode(this.getSource()) });
            Ext.net.DirectEvent.request(config);
        }
    },
    
    setProperty : function (prop, value, create) {
        this.propStore.setValue(prop, value, create);   
        if (create) {
            this.saveSource(); 
        }
    },
    
    removeProperty : function (prop) {
        this.propStore.remove(prop);
        this.saveSource(); 
    } 
});

Ext.reg("netpropertygrid", Ext.net.PropertyGrid);