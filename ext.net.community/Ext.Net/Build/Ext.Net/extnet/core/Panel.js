
// @source core/Panel.js

Ext.Panel.override({
    addButton : function (config, handler, scope) {
        var bc = {
            handler: handler,
            scope: scope,
            minWidth: this.minButtonWidth,
            hideParent: true
        };
        
        if (Ext.isString(config)) {
            bc.text = config;
        } else {
            Ext.apply(bc, config);
        }

        var btn = Ext.ComponentMgr.create(bc, "button");

        if (!this.buttons) {
            this.buttons = [];
        }

        this.buttons.push(btn);
        
        return btn;
    },

    getCollapsedField : function () {
        if (!this.collapsedField) {
            this.collapsedField = new Ext.form.Hidden({
                id    : this.id + "_Collapsed",
                name  : this.id + "_Collapsed",
                value : this.collapsed || false
            });
			
			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.collapsedField);	

            this.collapsedField.render(this.el.parent() || this.el);
        }

        return this.collapsedField.el;
    },

    getBody : function (focus) {
        if (this.iframe) {
            var self = this.iframe.dom.contentWindow;            
            
            if (focus !== false) {
                try {
                    self.focus();
                } catch (e) { }
            }

            return self;
        }

        return Ext.get(this.id + "_Content") || this.body;
    },

    setAutoScroll : function () {
        if (this.rendered && this.autoScroll) {
            var el = this.body || this.el;

            if (el) {
                el.setOverflow("auto");
                // Following line required to fix autoScroll
                el.dom.style.position = "relative";
            }
        }
        
        return this;
    },

    // private
    isIFrame : function (cfg) {
        var frame = false;

        if (typeof cfg === "string" && cfg.indexOf("://") >= 0) {
            frame = true;
        } else if (cfg.mode) {
            if (cfg.mode === "iframe") {
                frame = true;
            }
        } else if (cfg.url && cfg.url.indexOf("://") >= 0) {
            frame = true;
        } else if ((this.getAutoLoad().url && this.autoLoad.url.indexOf("://") >= 0) || (this.getAutoLoad().mode && this.autoLoad.mode === "iframe")) {
            frame = true;
        }

        return frame;
    },

    load : function (config) {
        if (!Ext.isEmpty(config) && !Ext.isEmptyObj(config)) {
            if (config.passParentSize) {
                config.params = config.params || {};
                config.params.width = this.body.getWidth(true);
                config.params.height = this.body.getHeight(true);
            }

            var al = this.getAutoLoad(), url;

            if (typeof config === "string") {
                al.url = config;
            } else if (typeof config === "object") {
                Ext.apply(al, config);
            }

            if (Ext.isEmpty(al.url)) {
                return;
            }

            if (this.isIFrame(config)) {
                return this.loadIFrame(al);
            }

            url = al.url;
            
            if (al.params) {
                var params = {},
                    key;
                
                for (key in al.params) {
                    var ov = al.params[key];

                    if (typeof ov === "function") {
                        params[key] = ov.call(this);
                    } else {
                        params[key] = ov;
                    }
                }

                params = Ext.urlEncode(params);
                url = url + ((url.indexOf("?") > -1) ? "&" : "?") + params;
            }

            var um = this.body.getUpdater();
            loadCfg = Ext.applyIf({ url : url }, al);

            if (loadCfg.params) {
                delete loadCfg.params;
            }

            um.update.call(um, loadCfg);
        }
        return this;
    },

    //do not remove and uncomment body
    doAutoLoad : function () {
        //this.load(this.getAutoLoad());
    },

    reload : function (nocache) {
        this.getAutoLoad().nocache = nocache || this.autoLoad.nocache;
        this.load(this.getAutoLoad());
    },

    getAutoLoad : function () {
        this.autoLoad = this.autoLoad || {};
        return this.autoLoad;
    },

    loadContent : function (config) {
        this.load(config);
    },

    clearContent : function () {
        if (this.iframe) {
            this.iframe.un("load", this.afterLoad, this);

            if (Ext.isIE) {
                this.iframe.dom.src = String.format("java{0}", "script:false");
            }

            this.removeAll(true);
            delete this.iframe;

            if (this.body.isMasked()) {
                this.body.unmask();
            }
        } else if (this.rendered) {
            this.body.dom.innerHTML = "";
        }
    },

    // private
    loadIFrame : function (config) {
        var url = config.url;

        if (config.nocache === true) {
            url = url + ((url.indexOf("?") > -1) ? "&" : "?") + new Date().getTime();
        }

        if (config.params) {
            var params = {},
                key;
            for (key in config.params) {
                var ov = config.params[key];

                if (typeof ov === "function") {
                    params[key] = ov.call(this);
                } else {
                    params[key] = ov;
                }
            }

            params = Ext.urlEncode(params);
            url = url + ((url.indexOf("?") > -1) ? "&" : "?") + params;
        }

        if (Ext.isEmpty(this.iframe)) {
            var iframeObj = {
                    tag  : "iframe",
                    id   : this.id + "_IFrame",
                    name : this.id + "_IFrame",
                    cls  : config.cls || "",
                    src  : url,
                    frameborder : 0
                }, 
                layout = this.getLayout();
            
            if (layout && layout.resizeTask && layout.resizeTask.cancel) {
                layout.resizeTask.cancel();
            }
            
            if (!this.layout || this.layout.type !== "fit") {
                layout = new Ext.Container.LAYOUTS.fit({});
                this.setLayout(layout);
            }

            this.removeAll(true);

            var p = this,
                iframeCt = new Ext.Container({
                    autoEl: iframeObj,
                    listeners : {
                        render : function () {
                            p.iframe = this.el;
                            
                            if (config.monitorComplete) {
                                p.startIframeMonitoring();
                            } else {
                                this.el.on("load", p.afterLoad, p);
                            }
                            
                            p.fireEvent("beforeupdate", p, {
                                url    : url,
                                iframe : this.el
                            });
                            
                            p.beforeIFrameLoad(config);
                        }
                    }
                });

            this.add(iframeCt);
            this.doLayout();
        } else {
            this.iframe.dom.src = String.format("java{0}", "script:false");
            this.fireEvent("beforeupdate", this, { url: this.iframe.dom.src, iframe: this.iframe });
            this.iframe.dom.src = url;
            this.beforeIFrameLoad(config);
        }
        
        if (Ext.isIE6 && !this.destroyIframeOnUnload) {
            this.destroyIframeOnUnload = true;            
            
            if (window.addEventListener) {
                window.addEventListener("unload", this.destroy.createDelegate(this), false);
            } else if (window.attachEvent) {
                window.attachEvent("onunload", this.destroy.createDelegate(this));
            }
        }

        return this;
    },
    
    iframeCompleteCheck : function () {
        if (this.iframe.dom.readyState === "complete") {
            this.stopIframeMonitoring();
            this.afterLoad();
        }
    },
    
    startIframeMonitoring : function () {
        if (this.iframeTask) {
            this.iframeTask.stopAll();
            this.iframeTask = null;
        }
        
        this.iframeTask = new Ext.util.TaskRunner();
        this.iframeTask.start({
            run : this.iframeCompleteCheck,
            interval : 200,
            scope: this
        });
    },
    
    stopIframeMonitoring : function () {
        if (this.iframeTask) {
            this.iframeTask.stopAll();
            this.iframeTask = null;
        }
    },

    beforeIFrameLoad : function (al) {
        try {
            this.iframe.dom.contentWindow.parentAutoLoadControl = this;
        } catch (e) { }

        if (al.showMask) {
            this.body.mask(al.maskMsg || Ext.LoadMask.prototype.msg, al.maskCls || "x-mask-loading");
        }

        this.autoLoad = al;
    },

    afterLoad : function () {
        if (this.autoLoad.showMask) {
            this.body.unmask();
        }
        
        try {
            this.iframe.dom.contentWindow.parentAutoLoadControl = this;
        } catch (e) { }

        var loadCfg = this.getAutoLoad();
        if (loadCfg.callback) {
            loadCfg.callback.call(loadCfg.scope || this, this, true, { iframe: this.iframe, url: this.iframe.dom.src }, loadCfg);
            delete loadCfg.callback;
        }

        this.fireEvent("update", this, { iframe: this.iframe, url: this.iframe.dom.src });
    },

    autoLoadBeforeUpdate : function (el, url, params) {
        this.fireEvent("beforeupdate", this, {
            url    : url,
            params : params
        });

        if (this.autoLoad.showMask) {
            /*LOCALIZE*/
            this.body.mask(this.autoLoad.maskMsg || "Loading...", this.autoLoad.maskCls || "x-mask-loading");
        }
    },

    autoLoadUpdate : function (el, response) {
        if (this.autoLoad.showMask) {
            this.body.unmask();
        }

        this.fireEvent("update", this, { response: response });
    },

    autoLoadFailure : function (el, response) {
        if (this.autoLoad.showMask) {
            this.body.unmask();
        }

        this.fireEvent("failure", this, { response: response });
    },

    show : function () {
        Ext.Panel.superclass.show.call(this);

        if (Ext.isIE && this.hideMode === "offsets" && this.el) {
            this.el.repaint();
        }

        return this;
    }
});

Ext.Panel.prototype.beforeDestroy = Ext.Panel.prototype.beforeDestroy.createInterceptor(function () {
    if (this.iframe) {
        try {
            this.clearContent();
        } catch (e) { }
    }
    
    if (this.collapsedField) {
        this.collapsedField.destroy();
    }
});

Ext.Panel.prototype.initComponent = Ext.Panel.prototype.initComponent.createSequence(function () {
    this.addEvents("beforeupdate", "update", "failure");

    if (this.autoLoad) {
        if (this.isIFrame(this.autoLoad)) {
            this.layout = "fit";
        }

        this.on("render", function () {
            var udr = this.getUpdater();
            
            udr.showLoadIndicator = false;
            udr.on("beforeupdate", this.autoLoadBeforeUpdate, this);
            udr.on("update", this.autoLoadUpdate, this);
            udr.on("failure", this.autoLoadFailure, this);
        }, this);

        var loadConfig = { 
                delay  : 10, 
                single : true 
            },
            triggerCmp,
            triggerControl = this.autoLoad.triggerControl || this,
            triggerEvent = this.autoLoad.triggerEvent || "render";
            
        if (Ext.isFunction(triggerControl)) {
            triggerControl = triggerControl.call(window);
        } else if (Ext.isString(triggerControl)) {
            triggerCmp = Ext.getCmp(triggerControl);
            
            if (triggerCmp) {
                triggerControl = triggerCmp;
            } else {
                triggerControl = Ext.net.getEl(triggerControl);   
            }            
        }
            
        loadConfig.single = !(this.autoLoad.reloadOnEvent || false);

        if (Ext.isEmpty(this.autoLoad.manuallyTriggered) || this.autoLoad.manuallyTriggered !== true) {
            triggerControl.on(triggerEvent, function () {
                this.load(this.getAutoLoad());
            }, this, loadConfig);
        }
    }
    
    var refreshBars = function () {
        var bar = this.getBottomToolbar();
        
        if (bar && bar.el) {
            bar.el.repaint();
        }

        bar = this.getTopToolbar();
        
        if (bar && bar.el) {
            bar.el.repaint();
        }  
        
        if (this.header && this.header.repaint) {
            this.header.repaint();
        } 
        
        if (this.footer && this.footer.repaint) {
            this.footer.repaint();
        } else if (this.ft) {
            this.ft.repaint();
        }    
    };
    
    if (Ext.isIE6 || Ext.isIE7) {
        this.on("show", refreshBars, this, { buffer : 100 });
        this.on("resize", refreshBars, this, { buffer : 100 });
    }
});

Ext.Panel.prototype.onCollapse = Ext.Panel.prototype.onCollapse.createSequence(function (doAnim, animArg) {
    var f = this.getCollapsedField();
    
    if (!Ext.isEmpty(f)) {
        f.dom.value = "true";
    }
});

Ext.Panel.prototype.onExpand = Ext.Panel.prototype.onExpand.createSequence(function (doAnim, animArg) {
    var f = this.getCollapsedField();
    
    if (!Ext.isEmpty(f)) {
        f.dom.value = "false";
    }
});

Ext.Panel.prototype.initComponent = Ext.Panel.prototype.initComponent.createInterceptor(function () {
    if (this.tbar && (this.tbar.xtype === "paging" || this.tbar.xtype === "ux.paging") && !Ext.isDefined(this.tbar.store) && this.store) {
        this.tbar.store = this.store;
    }
    
    if (this.bbar && (this.bbar.xtype === "paging" || this.bbar.xtype === "ux.paging") && !Ext.isDefined(this.bbar.store) && this.store) {
        this.bbar.store = this.store;
    }
});