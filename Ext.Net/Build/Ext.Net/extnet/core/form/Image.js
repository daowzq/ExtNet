
// @source core/form/Image.js

Ext.net.Image = Ext.extend(Ext.form.Label, {
    cls             : "",
    lazyLoad        : false,
    monitorComplete : true,
    monitorPoll     : 200,
    allowPan        : false,
    
    initComponent : function () {
        Ext.net.Image.superclass.initComponent.call(this);
        
        this.addEvents("resizerbeforeresize", "resizerresize", "pan", "click", "dblclick", "complete", "beforeload");
        
        this.imageProxy = new Image();
        
        if (this.monitorComplete) {
            if (this.loadMask) {
                
                this.loadMask = Ext.apply({msg: "Loading...", msgCls : "x-mask-loading"}, this.loadMask);
                
                this.on("beforeload", function () {
                    if (this.rendered) {
                        this.getMaskEl().mask(this.loadMask.msg, this.loadMask.msgCls);
                    } else {
                        this.loadMask.deferredMask = true;
                    }
                });
                
                this.on("complete", function () {
                    if (this.rendered) {
                        this.getMaskEl().unmask(this.loadMask.removeMask);
                    } else {
                        this.loadMask.deferredMask = false;
                    }
                }, this);
            }
        
            this.checkTask = new Ext.util.DelayedTask(function () {            
                if (this.imageProxy.complete) {
                    this.checkTask.cancel();
                    this.complete = true;
                    
                    if (this.allowPan && this.rendered) {
                        if (this.xDelta || this.yDelta) {
                            this.wrap.dom.scrollLeft -= this.xDelta || 0;
	                        this.wrap.dom.scrollTop -= this.yDelta || 0;
                        }
                    }
                    
                    this.fireEvent("complete", this);
                } else {
                    this.checkTask.delay(this.monitorPoll);
                }
            }, this);
            
            if (!this.lazyLoad) {                
                this.imageProxy.src = this.imageUrl;
                this.fireEvent("beforeload", this);
                this.checkTask.delay(this.monitorPoll);
            }            
        }
    },
    
    getMaskEl : function () {
        if (this.ownerCt) {
            return this.ownerCt.body ? this.ownerCt.body : this.ownerCt.el;
        }
        
        return this.wrap || this.el.parent() || Ext.getBody();
    },    
    
    getOriginalSize : function () {
        return {
            width  : this.imageProxy.width, 
            height : this.imageProxy.height
        };
    },
    
    setSize : function (w, h) {
        Ext.net.Image.superclass.setSize.call(this, w, h);
        
        if (this.wrap && !this.allowPan) {
            this.el.setSize(w, h);
        }
    },
    
    onRender : function (ct, position) {
        if (this.lazyLoad) {
            this.imageProxy.src = this.imageUrl;
            
            if (this.monitorComplete) {
                this.fireEvent("beforeload", this);
                this.checkTask.delay(this.monitorPoll);
            }
        }
        
        if (!this.el) {
            this.el = document.createElement("img");
            this.el.id = this.getId();
            this.el.src = this.imageUrl;
            this.el.style.border = "none";

            if (this.altText) {
                this.el.setAttribute("alt", this.altText);
            }

            if (this.align && this.align !== "notset") {
                this.el.setAttribute("align", this.align);
            }

            if (!Ext.isEmpty(this.cls, false)) {
                this.el.className = this.cls;
            }
            
            this.el = Ext.get(this.el);
            this.el.setOverflow = Ext.emptyFn;
        }
        
        Ext.net.Image.superclass.onRender.call(this, ct, position);
        
        this.lastSize = {w: this.el.getWidth(), h: this.el.getHeight()};
        
        this.el.on("resize", function () {
            var w = this.el.getWidth(),
                h = this.el.getHeight();
                
            this.fireEvent("resize", this, w, h, this.lastSize.w, this.lastSize.h);
            
            this.lastSize = {w: w, h: h};
        }, this);
        
        var w, h;
        
        if (this.allowPan || this.resizable) {
            this.wrap = this.el.wrap();
            this.positionEl = this.resizeEl = this.wrap;
            this.actionMode = "wrap";
            
            w = this.width || this.el.getWidth();
            h = this.height || this.el.getHeight();
            
            this.wrap.setSize(w, h);
            
            if (!this.allowPan) {
                this.el.setSize(w, h);
            }
        }        
        
        this.el.on("click", this.onClick, this);
        this.el.on("dblclick", this.onDblClick, this);
        
        if (this.allowPan) {
            this.wrap.setOverflow("hidden"); 
            this.el.on("mousedown", this.onMouseDown, this);
            this.el.setStyle("cursor", "move");
            
            if (this.xDelta || this.yDelta) {
                this.wrap.dom.scrollLeft -= this.xDelta || 0;
	            this.wrap.dom.scrollTop -= this.yDelta || 0;
            }
        }     
        
        if (this.resizable) {
            this.resizer = new Ext.Resizable(this.wrap, Ext.applyIf(this.resizeConfig || {}, {
                handles : "all",
                wrap    : this.allowPan
            }));
            
            this.resizer.on("beforeresize", function (r, e) {
                return this.fireEvent("resizerbeforeresize", this, e);                
            }, this);    
            
            this.resizer.on("resize", function (r, width, height, e) {
                if (!this.allowPan) {
                    this.el.setSize(width, height);
                }
                
                this.fireEvent("resizerresize", this, width, height, e);                
            }, this);            
        }   
        
        if (this.loadMask && this.loadMask.deferredMask) {
            this.getMaskEl().mask(this.loadMask.msg, this.loadMask.msgCls);
        }
    },
    
    onClick : function (e, t) {
        this.fireEvent("click", this, e, t);
    },
    
    onDblClick : function (e, t) {
        this.fireEvent("dblclick", this, e, t);
    },
    
    onMouseDown : function (e) {
        e.stopEvent();
        this.mouseX = e.getPageX();
        this.mouseY = e.getPageY();
        Ext.getBody().on("mousemove", this.onMouseMove, this);
        Ext.getDoc().on("mouseup", this.onMouseUp, this);
    },

    onMouseMove : function (e) {
        e.stopEvent();
        
        var x = e.getPageX(),
            y = e.getPageY();
        
        if (e.within(this.wrap)) {
	        var xDelta = x - this.mouseX;
	        var yDelta = y - this.mouseY;
	        this.wrap.dom.scrollLeft -= xDelta;
	        this.wrap.dom.scrollTop -= yDelta;
	        this.fireEvent("pan", this, this.wrap.dom.scrollLeft, this.wrap.dom.scrollTop, xDelta, yDelta);
	    }
        
        this.mouseX = x;
        this.mouseY = y;
    },

    onMouseUp: function (e) {
        Ext.getBody().un("mousemove", this.onMouseMove, this);
        Ext.getDoc().un("mouseup", this.onMouseUp, this);
    },
    
    getContentTarget : function () {
        return this.el;
    },

    setImageUrl : function (imageUrl) {
        this.imageUrl = imageUrl;
        
        if (this.rendered) {
            this.el.dom.removeAttribute("width");
            this.el.dom.removeAttribute("height");
            this.el.dom.src = this.imageUrl;
            
            if (this.monitorComplete) {                
                delete this.imageProxy;
                this.imageProxy = new Image();
                this.imageProxy.src = this.imageUrl;
                this.fireEvent("beforeload", this);
                this.checkTask.cancel();
                this.checkTask.delay(this.monitorPoll);
            }
        } else {
            if (!this.lazyLoad) {                
                delete this.imageProxy;
                this.imageProxy = new Image();                
                this.imageProxy.src = this.imageUrl;
                
                if (this.monitorComplete) {
                    this.fireEvent("beforeload", this);
                    this.checkTask.cancel();
                    this.checkTask.delay(this.monitorPoll);
                }
            }
        }
    },

    setAlign : function (align) {
        this.align = align;
        
        if (this.rendered) {
            this.el.dom.setAttribute("align", this.align);
        }
    },

    setAltText : function (altText) {
        this.altText = altText;
        
        if (this.rendered) {
            this.el.dom.setAttribute("altText", this.altText);
        }
    },
    
    scroll : function (x, y) {
        if (x) {
            this.wrap.dom.scrollLeft -= x;
        }
        
        if (y) {
	        this.wrap.dom.scrollTop -= y;
	    }
    },
    
    scrollTo : function (x, y) {
        if (x || x === 0) {
            this.wrap.dom.scrollLeft = x;
        }
        
        if (y || y === 0) {
	        this.wrap.dom.scrollTop = y;
	    }
    },
    
    getCurrentScroll : function () {
        return {
            x : this.wrap.dom.scrollLef, 
            y : this.wrap.dom.scrollTop
        };
    }
});

Ext.reg("netimage", Ext.net.Image);