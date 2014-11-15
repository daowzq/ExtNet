
// @source core/form/Field.js

Ext.form.Field.override({
    hideWithLabel      : true,
    dataIndexAsName    : true,    
    isRemoteValidation : false,
    remoteValidatingMessage : "Validating...",
    
    /***Remote validation**********/
    
    activateRemoteValidation : function () {
        this.originalIsValid = this.isValid;
        this.originalValidate = this.validate;
        
        this.isValid = this.rv_isValid;
        this.validate = this.rv_validate;
        
        this.rvConfig = Ext.apply({
            remoteValidated  : false,
            remoteValid      : false,
            validationEvent  : "keyup",
            eventOwner       : "element",
            validationBuffer : 500,
            showBusy         : true,
            busyIconCls      : "loading-indicator",
            busyTip          : "Validating...",
            initValueValidation : "valid",
            responseFields   : {
                success     : "valid",
                message     : "message",
                returnValue : "value"
            }            
        }, this.remoteValidationOptions || {});
        
        var fn = function () {
            this.rvTask = new Ext.util.DelayedTask(this.remoteValidate, this);
            (this.rvConfig.eventOwner === "element" ? this.el : this).on(this.rvConfig.validationEvent, this.performRemoteValidation, this);            
        };
        
        if (this.rendered) {
            fn();
        } else {
            this.on("render", fn);
            
            this.on("afterrender", function () {
                if (this.value !== undefined) {
                    switch (this.rvConfig.initValueValidation) {
                    case "valid":
                        this.markAsValid();
                        break;
                    case "invalid":
                        // do nothing
                        break;
                    case "validate":
                        this.remoteValidate();
                        break;
                    }
                }
            });
        }
    },    
    
    deactivateRemoteValidation : function () {
        this.isValid = this.originalIsValid;
        this.validate = this.originalValidate;
        
        if (this.rvTask) {
            this.rvTask.cancel();
        }
        
        (this.rvConfig.eventOwner === "element" ? this.el : this).un(this.rvConfig.validationEvent, this.performRemoteValidation, this);
        
        delete this.originalIsValid;
        delete this.originalValidate;
    },
    
    // this method is used with remote validation only
    markAsValid : function (abortRequest) {        
        if (!this.isRemoteValidation) {
            return;
        }
        
        this.rvConfig.validating = false;
        this.rvConfig.remoteValidated = true;
        this.rvConfig.remoteValid = true;
        
        if (this.validationId && abortRequest !== false) {
            Ext.net.DirectEvent.abort(this.validationId);
        }    
    },
    
    rv_isValid : function (preventMark) {
        if (this.disabled) {
            return true;
        }
        
        if (this.rvConfig.validating) {
            preventMark = true;
        }
        
        return this.originalIsValid.call(this, preventMark) && !this.rvConfig.validating && this.rvConfig.remoteValidated && this.rvConfig.remoteValid;
    },

    rv_validate : function () {
        var clientValid = this.originalValidate.call(this),
            orgPrevent;

        if (!this.disabled && !clientValid) {
            return false;
        }
        
        if (this.rvConfig.validating) {
            orgPrevent = this.preventMark;
            this.preventMark = true;
            this.markInvalid(this.remoteValidatingMessage);
            this.preventMark = orgPrevent;
            return false;            
        }

        if (this.disabled || (clientValid && (!this.rvConfig.remoteValidated || this.rvConfig.remoteValid))) {
            if (this.rvConfig.lastValue === this.getValue() && this.rvConfig.remoteValid === false) {
                this.markInvalid(this.rv_response.message || "Invalid");
            }
            else{
                this.clearInvalid();
            }
            return this.rvConfig.remoteValid;
        }

        if (this.rvConfig.remoteValidated && !this.rvConfig.remoteValid) {
            orgPrevent = this.preventMark;
            this.preventMark = this.rvConfig.validating;
            this.markInvalid(this.rv_response.message || "Invalid");
            this.preventMark = orgPrevent;
            return false;
        }

        return false;
    },   
    
    performRemoteValidation : function (e) {        
        if (this.rvConfig.lastValue === this.getValue() || !this.originalIsValid(true)) {
            this.rvTask.cancel();
            return;
        }
        
        if (!e || !e.isNavKeyPress || (e && e.isNavKeyPress && !e.isNavKeyPress())) {
            if (e && e.normalizeKey) {
                var k = e.normalizeKey(e.keyCode); 
                 
			    if (k >= 16 && k <= 20) {
                    return;
                }
            }
			
            this.rvTask.delay(this.rvConfig.validationBuffer);
        }
    },
    
    remoteValidate : function () {
        this.rvConfig.remoteValid = false;
	    this.rvConfig.remoteValidated = false;
			
        var dc = Ext.apply({}, this.remoteValidationOptions),
		    options = {params : {}};
		
		if (this.fireEvent("beforeremotevalidation", this, options) !== false) {		    
		    dc.userSuccess = this.remoteValidationSuccess.createDelegate(this);
            dc.userFailure = this.remoteValidationFailure.createDelegate(this);
            dc.extraParams = Ext.apply(dc.extraParams || {}, options.params);
            dc.control = this;
            dc.eventType = "postback";
            dc.action = "remotevalidation";
            
            var o = {
                id : this.id,
                name : this.name,
                value : this.getValue()
            };
            
            dc.serviceParams = Ext.encode(o);
            
            if (dc.url) {
		        dc.cleanRequest = true;

		        if (dc.json && Ext.isEmpty(dc.method, false)) {
	                dc.method = "POST";
	            }

	            dc.extraParams = Ext.apply(dc.extraParams, o);
                dc.type = "load";
		    }
		    
		    if (this.rvConfig.showBusy) {
		        this.setIndicatorIconCls(this.rvConfig.busyIconCls);
		        
				if (this.rvConfig.busyTip) {
		            this.setIndicatorTip(this.rvConfig.busyTip);
		        }

		        this.alignIndicator();		        
		    }
		    
            this.rvConfig.remoteValidated = false;
            this.rvConfig.validating = true;
            this.rvConfig.lastValue = o.value;

            if (this.validationId) {
                Ext.net.DirectEvent.abort(this.validationId);
            }

            this.validationId = Ext.net.DirectEvent.request(dc);
        }        
    },
    
    remoteValidationSuccess : function (response, result, context, type, action, extraParams, o) {
        var isException = false,
            responseObj;
        
        this.rvConfig.validating = false;
        this.validationId = null;
        
        if (this.rvConfig.showBusy) {
	        this.clearIndicator();
	    }
        
        try {
		    responseObj = result.serviceResponse || result.d || result;
		    
            result = { 
                success : responseObj[this.rvConfig.responseFields.success], 
                message : responseObj[this.rvConfig.responseFields.message],
                value   : responseObj[this.rvConfig.responseFields.returnValue]
            };            
	    } catch (ex) {
		    result = {
		        success : false,
		        message : ex.message
		    };
		    
		    isException = true;
		    
		    this.rvConfig.remoteValidated = true;
            this.rvConfig.remoteValid = false;
		    
		    this.fireEvent("remotevalidationinvalid", this, response, responseObj, ex, o);
			
		    if (o.cancelWarningFailure !== true && (this.remoteValidationOptions || {}).showWarningFailure !== false && !this.hasListener("remotevalidationinvalid")) {
	            Ext.net.DirectEvent.showFailure(response, response.responseText);
	        }
			
            return;
	    }
	    
	    if (!isException && result.success !== true) {
		    this.fireEvent("remotevalidationinvalid", this, response, responseObj, result, o);
	    }
	    
	    if (result.success === true) {
	        this.fireEvent("remotevalidationvalid", this, response, responseObj, result, o);
	    }
	    
	    if (result.value !== null && Ext.isDefined(result.value)) {
	        this.setValue(result.value);
	    }
	
        this.rvConfig.remoteValidated = true;
        this.rvConfig.remoteValid = result.success;
        this.rv_response = result;
        this.validate();
    }, 
    
    remoteValidationFailure : function (response, result, context, type, action, extraParams, o) {
        this.validationId = null;
        
        if (this.rvConfig.showBusy) {
	        this.clearIndicator();
	    }
        
        this.fireEvent("remotevalidationfailure", this, response, {message: response.statusText}, o);
        
        this.rvConfig.validating = false;
        this.rvConfig.remoteValidated = true;
        this.rvConfig.remoteValid = false;
        this.rv_response = {
			success : false, 
			message : response.responseText
		};
		
		if (o.cancelWarningFailure !== true && (this.remoteValidationOptions || {}).showWarningFailure !== false && !this.hasListener("remotevalidationfailure")) {
		    Ext.net.DirectEvent.showFailure(response, response.responseText);
		}    
    },
    
    /***End of Remote validation***/
    
    setReadOnly : function (readOnly) {
        if (this.rendered) {
            this.el.dom.setAttribute("readOnly", readOnly);
            this.el.dom.readOnly = readOnly;
        } else {
            this.readOnly = readOnly;
        }
    },
    
    getReadOnly : function () {
        return this.rendered ? this.el.dom.readOnly : this.readOnly;
    },
    
    adjustWidth : function (tag, w) {
	    if (typeof w === "number" && (Ext.isIE6 || !Ext.isStrict) && /input|textarea/i.test(tag) && !this.inEditor) {
		    return w - 3;
	    }
	    
	    return w;
    },
    
    hideNote : function () {
        if (!Ext.isEmpty(this.note, false) && this.noteEl) {
            this.noteEl.addClass("x-hide-" + this.hideMode);
        }
        
        if (this.noteAlign === "top" && this.label) {
            this.label.removeClass("x-top-note-label");
        }
    },
    
    showNote : function () {
        if (!Ext.isEmpty(this.note, false) && this.noteEl) {
            this.noteEl.removeClass("x-hide-" + this.hideMode);
        }
        
        if (this.noteAlign === "top" && this.label) {
            this.label.addClass("x-top-note-label");
        }
    },
    
    setNote : function (t, encode) {
        this.note = t;
        
        if (this.rendered) {
            this.noteEl.dom.innerHTML = encode !== false ? Ext.util.Format.htmlEncode(t) : t;
        }
    },
    
    setNoteCls : function (cls) {
        if (this.rendered) {
            this.noteEl.removeClass(this.noteCls);
            this.noteEl.addClass(cls);
        }
        
        this.noteCls = cls;
    },
    
    clear : function () {
        this.setValue("");
    },
    
    hideFieldLabel : function () {
        if (this.label && this.hideWithLabel) {

            var parent = this.getActionEl().parent(".x-form-item");
            
            if (!Ext.isEmpty(parent)) {
                parent.addClass("x-hide-" + this.hideMode);
            }                
        }
    },
    
    showFieldLabel : function () {
        if (this.label && this.hideWithLabel) {

            var parent = this.getActionEl().parent(".x-form-item");
            
            if (!Ext.isEmpty(parent)) {
                parent.removeClass("x-hide-" + this.hideMode);
            }                 
        }
    },
    
    clearIndicator : function () {
        this.setIndicator("");
        this.setIndicatorCls("");
        this.setIndicatorIconCls("");
        this.setIndicatorTip("");
    },
    
    setIndicator : function (t, encode) {
        this.indicatorText = t;
        
        if (this.rendered && this.indicatorEl) {
            this.indicatorEl.dom.innerHTML = encode !== false ? Ext.util.Format.htmlEncode(t) : t;
        }
        
        this.initIndicator();
    },
    
    setIndicatorCls : function (cls) {
        if (this.rendered && this.indicatorEl) {
            this.indicatorEl.removeClass(this.indicatorCls);
            this.indicatorEl.addClass(cls);
        }
        
        this.indicatorCls = cls;
        this.initIndicator();
    },
    
    setIndicatorIconCls : function (cls) {
        if (this.rendered && this.indicatorEl) {
            this.indicatorEl.removeClass(this.indicatorIconCls);
            this.indicatorEl.addClass(cls);
        }
        
        this.indicatorIconCls = cls;
        this.initIndicator();
    },
    
    setIndicatorTip : function (tip) {
        if (this.rendered && this.indicatorEl) {
            this.indicatorEl.dom.qtip = tip;
        }
        
        this.indicatorTip = tip;
        this.initIndicator();
    },
    
    showIndicator : function () {
        if (this.indicatorEl && !this.indicatorElIsVisible) {
            this.indicatorEl.removeClass("x-hide-display");
            this.indicatorElIsVisible = true;
            this.alignIndicator.defer(10, this);
        }
        
        if (!this.indicatorEl) {
            this.initIndicator(); 
        }       
    },
    
    hideIndicator : function () {
        if (this.indicatorEl && this.indicatorElIsVisible) {
            this.indicatorEl.addClass("x-hide-display");
            this.indicatorElIsVisible = false;
        }    
    },
    
    getAlignIndicatorEl : function () {
        if (this.getTriggerWidth) {
            return this.wrap;
        }
        
        if ((!Ext.isEmpty(this.boxLabel, false) && this.boxLabel !== "&#160;") && this.labelEl) {
            return this.labelEl;
        }
        
        return this.getResizeEl();
    },
    
    getAlignIndicatorOffset : function () {
        var yShift = (this.noteAlign !== "top" && this.childrenHasTopNote()) ? 14 : 0,
            xShift = 2;
        
        if (this instanceof Ext.form.Checkbox) {
            yShift = -3;
        }
        
        return [xShift, yShift];
    },
    
    alignIndicator : function () {
        this.indicatorEl.alignTo(this.getAlignIndicatorEl(), "tl-tr", this.getAlignIndicatorOffset());
    },
    
    initIndicator : function () {
        if (this.indicatorEl) {
            this.alignIndicator();
            return;        
        }        
        
        var f = function () {            
            if (!Ext.isEmpty(this.indicatorText, false) || 
                    !Ext.isEmpty(this.indicatorIconCls, false)) {
                
                if (!this.indicatorEl) {
                    var elp = this.getErrorCt();
                                        
                    if (!elp) {
                        return;
                    }
                    
                    this.on("hide", function () {
                        this.hideIndicator();
                    });
                    
                    this.on("invalid", function () {
                        if (this.msgTarget === "side" && this.errorIcon && this.errorIcon.isVisible()) {
                            this.hideIndicator();
                        }
                    });

                    this.on("show", function () {
                        this.showIndicator();
                    });
                    
                    this.on("valid", function () {
                        if (this.msgTarget === "side") {
                            this.showIndicator();
                        }
                    });
                    
                    this.indicatorEl = elp.createChild({
                        cls : "x-form-indicator " + (this.indicatorCls || "") + (this.indicatorCls ? " " : "") + (this.indicatorIconCls || ""), 
                        html : this.indicatorText || "",
                        style : this.indicatorIconCls ? "padding-left: 18px;" : ""
                    });
                    
                    if (this.ownerCt) {
                        this.ownerCt.on("afterlayout", this.alignIndicator, this);
                        this.ownerCt.on("expand", this.alignIndicator, this);
                    }

                    this.on("resize", this.alignIndicator, this);
                    this.on("autosize", this.alignIndicator, this);
                    this.on("destroy", function () {
                        Ext.destroy(this.indicatorEl);
                    }, this);
                }

                this.alignIndicator();

                if (this.indicatorTip) {
                    this.indicatorEl.dom.qtip = this.indicatorTip;
                }

                this.showIndicator();

                this.indicatorElIsVisible = true;

                if (this.hidden) {
                    this.hideIndicator();
                }
            }
        };
        
        if (this.rendered) {
            f.call(this);
        } else {
            this.on("render", f, this);
        }
    },
    
    childrenHasTopNote : function () {
        if (this.items && this.items.each) {
            var r = false;

            this.items.each(function (item) {
                if (item.noteAlign === "top" && item.hidden !== true && (!item.isVisible || item.isVisible())) {
                    r = true;
                    
                    return false;
                }
            });
            
            return r;
        }
        
        return false;
    },
    
    initNote : function () {
        this.on("hide", function () {
            if (!Ext.isEmpty(this.note, false)) {
                this.hideNote();
            }
        });

        this.on("show", function () {
            if (!Ext.isEmpty(this.note, false)) {
                this.showNote();
            }
        });
        
        this.on("render", function () {
            if (this.hidden) {
                this.hideFieldLabel();
            }   
            
            if (!Ext.isEmpty(this.note, false)) {
                var noteWrap = false;
                if (!this.wrap) {
                    this.wrap = this.wrap || this.el.wrap();
                    if (!this.labeler) {
                        this.positionEl = this.wrap;
                        this.resizeEl = this.wrap;
                        this.actionMode = "wrap";
                        noteWrap = true;
                    }
                }
                
                if (this.noteAlign === "top") {
                    this.wrap.addClass("x-top-note");
                }
                
                this.note = this.noteEncode ? Ext.util.Format.htmlEncode(this.note) : this.note;
                
                this.noteEl =  this.wrap[this.noteAlign === "top" ? "insertFirst" : "createChild"]({ 
                    cls  : "x-field-note " + (this.noteCls || ""), 
                    html : this.note 
                }, undefined);
                
                this.noteEl.noteWrap = noteWrap;
                
                if ((this.noteAlign === "top" || this.childrenHasTopNote()) && this.label) {
                    this.label.addClass("x-top-note-label");
                }
                
                if (this.hidden) {
                    this.hideNote();
                }
            } else {
                if (this.label && this.childrenHasTopNote()) {
                    this.label.addClass("x-top-note-label");
                }
            }
        });
    },
    
    getNoteWidthAjustment : function () {
        return 0;
    },
    
    onResize : function (w, h, rawWidth, rawHeight) {
        Ext.form.Field.superclass.onResize.call(this, w, h, rawWidth, rawHeight);
        
        if (this.noteEl && this.noteEl.noteWrap) {
            if (w && h && w !== "auto" && h !== "auto") {
                this.el.setSize(w - this.getNoteWidthAjustment(), h - this.noteEl.getHeight() - this.el.getMargins("tb"));
            } else {
                if (w && w !== "auto") {
                    this.el.setWidth(w - this.getNoteWidthAjustment());
                }
                
                if (h && h !== "auto") {
                    this.el.setHeight(h - this.noteEl.getHeight() - this.el.getMargins("tb"));
                }
            }
        }
    }
});

Ext.form.Field.prototype.initComponent = Ext.form.Field.prototype.initComponent.createSequence(function () {
    this.initNote();
    this.initIndicator();
    
    this.addEvents({        
        "remotevalidationfailure"   : true,
        "remotevalidationinvalid"   : true,
        "remotevalidationvalid"     : true,
        "beforeremotevalidation"    : true
    });
    
    if (this.isRemoteValidation) {
        this.activateRemoteValidation();
    }
});