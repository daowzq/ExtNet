/*
 * @version   : 1.2.0 - Ext.NET Pro License
 * @author    : Ext.NET, Inc. http://www.ext.net/
 * @date      : 2011-09-12
 * @copyright : Copyright (c) 2006-2011, Ext.NET, Inc. (http://www.ext.net/). All rights reserved.
 * @license   : See license.txt and http://www.ext.net/license/. 
 * @website   : http://www.ext.net/
 */

Ext.ns("Ext.net", "Ext.net.DirectMethods", "Ext.ux", "Ext.ux.plugins", "Ext.ux.layout");

Ext.net.Version = "1.0.0";

// @source core/net/ResourceMgr.js

Ext.net.ResourceMgr = function () {
    return {
        id  : "",
        url : "",
        quickTips       : true,
        cssClasses      : {},
        submitDisabled  : true,
        BLANK_IMAGE_URL : "",

        hasCssClass : function (id) {
            return !!this.cssClasses[id];
        },

        registerCssClass : function (id, cssClass, registerId) {
            if (!this.hasCssClass(id)) {
                var ss = Ext.fly("extnet-resources"),
                    old = "";

                if (ss) {
                    if (Ext.isIE) {
                        old = ss.dom.styleSheet.cssText;
                    } else {
                        old = ss.dom.innerHTML;
                    }

                    ss.remove();
                }

                Ext.util.CSS.createStyleSheet(old + " " + cssClass, "extnet-resources");

                if (registerId !== false) {
                    this.cssClasses[id] = true;
                }
            }
        },

        // private
        toCharacterSeparatedFileName : function (name, separator) {
            if (Ext.isEmpty(name, false)) {
                return;
            }

            var matches = name.match(/([A-Z]+)[a-z]*|\d{1,}[a-z]{0,}/g);

            var temp = "",
                i = 0;

            for (i; i < matches.length; i++) {
                if (i !== 0) {
                    temp += separator;
                }

                temp += matches[i].toLowerCase();
            }

            return temp;
        },

        getIconUrl : function (icon) {
            var iconName = this.toCharacterSeparatedFileName(icon, "_"),                
                template = "/{0}icons/{1}-png/ext.axd",
                appName = Ext.isEmpty(this.appName, false) ? "" : (this.appName + "/");

            return String.format(template, appName, iconName);
        },

        registerIcon : function (name, init) {
            var buffer = [];
            Ext.each(name, function (icon) {
                if (!Ext.isObject(icon)) {
                    icon = { name: icon };
                }

                var iconName = this.toCharacterSeparatedFileName(icon.name, "_"),
                    iconRule = icon.name.toLowerCase(),
                    id = !Ext.net.StringUtils.startsWith(iconRule, "icon-") ? ("icon-" + iconRule) : iconRule;

                if (!this.hasCssClass(id)) {
                    if (icon.url) {
                        buffer.push(String.format(".{0}{background-image:url(\"{1}\") !important;}", id, icon.url));
                    } else {
                        var template = ".{0}{background-image:url(\"/{1}icons/{2}-png/ext.axd\") !important;}",
                            appName = Ext.isEmpty(this.appName, false) ? "" : (this.appName + "/");

                        buffer.push(String.format(template, id, appName, iconName));
                    }

                    this.cssClasses[id] = true;
                }
            }, this);

            if (buffer.length > 0) {
                this.registerCssClass("", buffer.join(" "), false);
            }
        },
        
        getCmp : function (id) {
            var d = id.split("."),
                o = window[d[0]];

            Ext.each(d.slice(1), function (v) {
                if (!o) {
                    return null;
                }

                o = o[v];
            });
            
            return o ? Ext.getCmp(o.id) : null;
        },

        destroyCmp : function (id) {
            var obj = Ext.getCmp(id) || window[id];
            
            if (!Ext.isObject(obj) || !obj.destroy) {
                obj = Ext.net.ResourceMgr.getCmp(id);
            } 

            if (Ext.isObject(obj) && obj.destroy) {
                try {
                    obj.destroy();
                } catch (e) { }
            }
        },

        init : function (config) {
            Ext.apply(this, config || {});

            if (this.quickTips === true) {
                Ext.QuickTips.init();
            }

            if ((Ext.isIE6 || Ext.isIE7 || Ext.isAir) && !Ext.isEmpty(this.BLANK_IMAGE_URL)) {
                Ext.BLANK_IMAGE_URL = this.BLANK_IMAGE_URL;
            }

            this.registerPageResources();

            if (this.theme) {
                Ext.getBody().addClass("x-theme-" + this.theme);
            }

            if (this.icons) {
                this.registerIcon(this.icons, true);
            }

            if (this.ns) {
                Ext.ns(this.ns);
            }
        },

        registerPageResources : function () {
            Ext.select("script").each(function (el) {
                var url = el.dom.getAttribute("src");

                if (!Ext.isEmpty(url) && !this.queue.contains(url)) {
                    this.queue.buffer.push({
                        url: url,
                        loading: false
                    });
                }
            }, this);

            Ext.select("link[type=text/css]").each(function (el) {
                var url = el.dom.getAttribute("href");

                if (!Ext.isEmpty(url) && !this.queue.contains(url)) {
                    this.queue.buffer.push({
                        url: url,
                        loading: false
                    });
                }
            }, this);
        },

        getAspForm : function () {
            if (this.aspForm) {
                return Ext.get(this.aspForm);
            }
        },

        load : function (config, groupCallback) {
            this.queue.clear();

            if (groupCallback) {
                groupCallback = {
                    fn: groupCallback,
                    counter: config.length || 1,
                    config: config,
                    step : function () {
                        this.counter--;

                        if (this.counter === 0) {
                            this.fn.apply(window, [this.config]);
                        }
                    }
                };
            }

            Ext.each(Ext.isArray(config) ? config : [config], function (config) {
                if (Ext.isString(config)) {
                    var url = config;

                    config = { url: url };

                    if (url.substring(url.length - 4) === ".css") {
                        config.mode = "css";
                    }
                }

                config.options = Ext.applyIf(config.options || {}, {
                    mode: config.mode || "js"
                });

                if (config.callback) {
                    config.loadCallback = config.callback;
                    delete config.callback;
                }

                if (groupCallback) {
                    config.groupCallback = groupCallback;
                }

                if (!Ext.isEmpty(config.url)) {
                    this.queue.enqueue(config);
                }
            }, this);

            this.doLoad();
        },

        // private
        doLoad : function () {
            var config = this.queue.peek();

            if (config === undefined) {
                return;
            }

            var url = config.url,
                item,
                contains = this.queue.contains(url);

            if (config.force === true || contains !== true) {
                if (contains !== true) {
                    this.queue.buffer.push({
                        url: url,
                        loading: true
                    });
                }

                Ext.Ajax.request(Ext.apply({
                    scope: this,
                    method: "GET",
                    callback: this.onResult,
                    disableCaching: false
                }, config));
            } else {
                item = this.queue.getItem(url);

                if (item && item.loading) {
                    this.queue.waitingList.push(config);
                    return;
                }

                if (config.loadCallback) {
                    config.loadCallback.apply(window, [config]);
                }

                if (config.groupCallback) {
                    config.groupCallback.step();
                }

                this.queue.dequeue(config);
                this.doLoad();
            }
        },

        // private
        onResult : function (options, success, response) {
            if (success === true) {
                if (options.mode === "css") {
                    Ext.util.CSS.createStyleSheet(response.responseText);
                } else {
                    var head = document.getElementsByTagName("head")[0],
                        el = document.createElement("script");

                    el.setAttribute("type", "text/javascript");
                    el.text = response.responseText;

                    head.appendChild(el);
                }

                var i = 0,
                    item = this.queue.getItem(options.url);

                if (item !== null) {
                    item.loading = false;
                }

                if (options.loadCallback) {
                    options.loadCallback.apply(window, [options]);
                }

                if (options.groupCallback) {
                    options.groupCallback.step();
                }

                while (this.queue.waitingList.length > i) {
                    item = this.queue.waitingList[i];

                    if (item.url === options.url) {
                        if (item.loadCallback) {
                            item.loadCallback.apply(window, [item]);
                        }

                        if (item.groupCallback) {
                            item.groupCallback.step();
                        }

                        this.queue.waitingList.remove(item);
                    } else {
                        i++;
                    }
                }
            }

            this.queue.dequeue(options);

            this.doLoad();
        },

        // private
        queue : function () {
            // first-in-first-out
            return {
                // private
                js: [],

                // private
                css: [],

                // private
                buffer: [],

                waitingList: [],

                enqueue : function (item) {
                    this[item.options.mode].push(item);
                },

                dequeue : function (item) {
                    var mode = item.options.mode,
                        temp = this[mode][0];

                    this[mode] = this[mode].slice(1);

                    return temp;
                },

                clear : function () {
                    this.js = [];
                    this.css = [];
                },

                contains : function (url) {
                    var i = 0;

                    // workaround, need more universal fix
                    url = url.replace("&amp;", "&");
                    for (i; i < this.buffer.length; i++) {
                        if (this.buffer[i].url.replace("&amp;", "&") === url) {
                            return true;
                        }
                    }

                    return false;
                },

                getItem : function (url) {
                    var i = 0;
                    for (i; i < this.buffer.length; i++) {
                        if (this.buffer[i].url === url) {
                            return this.buffer[i];
                        }
                    }

                    return null;
                },

                peek : function () {
                    return this.css.length > 0 ? this.css[0] : this.js[0];
                }
            };
        }(),

        setTheme : function (url, name) {
            var html = Ext.get(document.getElementsByTagName("html")[0]);

            if (this.theme) {
                html.removeClass("x-theme-" + this.theme);
            }

            if (name) {
                this.theme = name;
                html.addClass("x-theme-" + this.theme);
            }

            Ext.util.CSS.swapStyleSheet("ext-theme", url);
        }
    };
}();

// @source core/net/StringUtils.js

Ext.net.StringUtils = function () {
    return {
        startsWith : function (str, value) {
            return str.match("^" + value) !== null;
        },

        endsWith : function (str, value) {
            return str.match(value + "$") !== null;
        }
    };
}();

// @source core/utils/Observable.js

(function () {
    Ext.util.Observable.prototype.constructor = Ext.util.Observable.prototype.constructor.createInterceptor(function () {
        if (this.initialConfig) {
            var id = this.initialConfig.proxyId || this.initialConfig.id;
            
            if (this.forbidIdScoping !== true && !Ext.isEmpty(id, false) && id.indexOf("ext-comp-") !== 0) {
                var ns = this.ns || Ext.net.ResourceMgr.ns;
                
                if (ns) {                    
                    (Ext.isObject(ns) ? ns : Ext.ns(ns))[this.initialConfig.itemId || id] = this;
                } else {
                    window[id] = this;
                }
            }
        }
    });

    Ext.util.Observable.prototype.constructor.prototype = Ext.util.Observable.prototype;

    var fns = {}, 
        v,
        i;

    for (i in Ext.util.Observable) {
        v = Ext.util.Observable[i];
        
        if (typeof v === "function") {
            fns[i] = v;
        }
    }

    Ext.util.Observable = Ext.util.Observable.prototype.constructor;
    Ext.applyIf(Ext.util.Observable, fns);
})();

Ext.util.Observable.prototype.purgeListeners = Ext.util.Observable.prototype.purgeListeners.createSequence(function () {
    this.cleanId();
});

Ext.override(Ext.util.Observable, {
    cleanId : function () {        
        if (this.forbidIdScoping !== true) {
            var ns = this.ns || Ext.net.ResourceMgr.ns,
                id = this.itemId || this.proxyId || this.storeId || this.id,
                nsObj;
            
            if (ns && id) {                
                if (Ext.isObject(ns) && ns[id]) {
                    try {
                        delete ns[id];
                    } catch (e) {
                        ns[id] = undefined;
                    }
                } else if (Ext.net.ResourceMgr.getCmp(ns + "." + id)) {
                    try {
                        delete Ext.ns(ns)[id];
                    } catch (f) {
                        Ext.ns(ns)[id] = undefined;
                    }
                }
            } else if (window[this.proxyId || this.storeId || this.id]) {
                window[this.proxyId || this.storeId || this.id] = null;
            }
        }
    },

    destroy : function () {
        this.cleanId();
    },
    
	fireEvent : function () {
		if (!(this.isAjaxInit || false)) {
            this.isAjaxInit = true;
            this.ajaxListeners = {};
            
            if (this.directEvents) {
                this.addAjaxListener(this.directEvents);
            }
        }
		
		var a = Ext.toArray(arguments),
			ename = a[0].toLowerCase(),
			me = this,
			ret = true,
			ce = me.events[ename],
			ace = me.ajaxListeners[ename],
			q,
			c;
			
		if (me.eventsSuspended === true) {
            if (me.eventQueue) {
                q = me.eventQueue;
                q.push(a);
            }
		} else if (Ext.isObject(ce) && ce.bubble) {
			if (ce.fire.apply(ce, a.slice(1)) === false) {
				return false;
			}
			
			if (Ext.isObject(ace) && ace.fire.apply(ace, a.slice(1)) === false) {
				return false;
			}
			
			c = me.getBubbleTarget && me.getBubbleTarget();
			
			if (c && c.enableBubble) {
				if (!c.events[ename] || !Ext.isObject(c.events[ename]) || !c.events[ename].bubble) {
                    c.enableBubble(ename);
                }
                return c.fireEvent.apply(c, a);
			}
		} else {			
			if (Ext.isObject(ce) || Ext.isObject(ace)) {
			    a.shift();
			}
			
			if (Ext.isObject(ce)) {	
				ret = ce.fire.apply(ce, a);
			}
			
			if (ret !== false && Ext.isObject(ace)) {				
				ret = ace.fire.apply(ace, a);
			}
		}
		
		return ret;
	},
	
	addAjaxListener : function (eventName, fn, scope, o) {
		var me = this,
			e,
			oe,
			filterOptRe = /^(?:scope|delay|buffer|single)$/,
			ce;
			
		if (Ext.isObject(eventName)) {
			o = eventName;
			
			for (e in o) {
				oe = o[e];
				
				if (!filterOptRe.test(e)) {
					me.addAjaxListener(e, oe.fn || oe, oe.scope || o.scope, oe.fn ? oe : o);
				}
			}
		} else {
			eventName = eventName.toLowerCase();
			ce = me.ajaxListeners[eventName] || true;
			
			if (Ext.isBoolean(ce)) {
				me.ajaxListeners[eventName] = ce = new Ext.util.Event(me, eventName);
			}
			
			o = Ext.isObject(o) ? o : {};
			
			if (Ext.isEmpty(o.delay)) {
                o.delay = 20;
            }
            
			ce.addListener(fn, scope, o);
		}
	}
});

// @source core/utils/Utils.js


Ext.isEmptyObj = function (obj) {
    if (typeof obj === "undefined" || obj === null) {
        return true;
    }

    if (!(!Ext.isEmpty(obj) && typeof obj === "object")) {
        return false;
    }

    var p;

    for (p in obj) {
        return false;
    }
    
    return true;
};

Ext.net.clone = function (o) {
    if (!o || "object" !== typeof o) {
        return o;
    }
    
    var c = "[object Array]" === Object.prototype.toString.call(o) ? [] : {},
        p, 
        v;
    
    for (p in o) {
        if (o.hasOwnProperty(p)) {
            v = o[p];
            c[p] = (v && "object" === typeof v) ? Ext.net.clone(v) : v;
        }
    }
    
    return c;
};

Ext.net.on = function (target, eventName, handler, scope, mode, cfg) {
    var el = target;
    
    if (typeof target === "string") {
        el = Ext.get(target);
    }

    if (!Ext.isEmpty(el)) {
        if (mode && mode === "client") {
            el.on(eventName, handler.fn, scope, handler);
        } else {
            el.on(eventName, handler, scope, cfg);
        }
    }
};

Ext.net.lazyInit = function (controls) {
    if (!Ext.isArray(controls)) { 
        return; 
    }
    
    var cmp, i;
    
    for (i = 0; i < controls.length; i++) {
        cmp = Ext.getCmp(controls[i]);
        
        if (!Ext.isEmpty(cmp)) {
            window[controls[i]] = cmp;
        }
    }
};

Ext.net.getEl = function (el, skipDeep) {
    if (Ext.isEmpty(el, false)) {
        return null;
    }
    
    if (el.isComposite) {
        return el;
    }
    
    if (el.getEl) {
        return el.getEl();
    }

    if (el.el) {
        return el.el;
    }

    var cmp = Ext.getCmp(el);
    
    if (!Ext.isEmpty(cmp)) {
        return cmp.getEl();
    }

    var tEl = Ext.get(el);
    
    if (Ext.isEmpty(tEl) && skipDeep !== true) {
        try {
            return Ext.net.getEl(eval("(" + el + ")"), true);
        } catch (e) {}
    }
    
    return tEl;
};

Ext.net.replaceContent = function (cmp, contentEl, html) {
    contentEl = Ext.net.getEl(contentEl);
    
    if (!Ext.isEmpty(contentEl)) {
        contentEl.remove();
    }
    
    var el = Ext.net.append(Ext.getBody(), html);
    
    el.removeClass(["x-hidden", "x-hide-display"]);
    cmp.getContentTarget().dom.appendChild(el.dom);        
};

Ext.net.replaceWith = function (config) {
    var id = String.format("el_{0}_container", config.id || ""),
        el = Ext.fly(id) || Ext.fly(config.id);
    
    if (!Ext.isEmpty(el)) {
        el.replaceWith({ 
            id  : id, 
            tag : "span" 
        }).update(config.html, true);
    }
};

Ext.net.append = function (elTo, html) {
    html = html || "";

    var id = Ext.id(),
        dom = Ext.getDom(elTo);

    html += '<span id="' + id + '"></span>';

    Ext.lib.Event.onAvailable(id, function () {
        var DOC = document,
            hd = DOC.getElementsByTagName("head")[0],
            re = /(?:<script([^>]*)?>)((\n|\r|.)*?)(?:<\/script>)/ig,
            reStyle = /(?:<style([^>]*)?>)((\n|\r|.)*?)(?:<\/style>)/ig,
            reLink = /(?:<link([^>]*)?\/>)/ig,
            srcRe = /\ssrc=([\'\"])(.*?)\1/i,
            typeRe = /\stype=([\'\"])(.*?)\1/i,
            hrefRe = /\shref=([\'\"])(.*?)\1/i,
            match,
            attrs,
            hrefMatch,
            srcMatch,
            typeMatch,
            el,
            s;
            
        while ((match = reLink.exec(html))) {
            attrs = match[1];
            hrefMatch = attrs ? attrs.match(hrefRe) : false;
            
            if (hrefMatch && hrefMatch[2]) {
                s = DOC.createElement("link");
                s.href = hrefMatch[2];
                s.rel = "stylesheet";
                typeMatch = attrs.match(typeRe);
                
                if (typeMatch && typeMatch[2]) {
                    s.type = typeMatch[2];
                }
                
                hd.appendChild(s);
            }
        }
            
        while ((match = reStyle.exec(html))) {
            if (match[2] && match[2].length > 0) {
				Ext.net.ResourceMgr.registerCssClass("", match[2], false);        
            }
        }

        while ((match = re.exec(html))) {
            attrs = match[1];
            srcMatch = attrs ? attrs.match(srcRe) : false;
            
            if (srcMatch && srcMatch[2]) {
                s = DOC.createElement("script");
                s.src = srcMatch[2];
                typeMatch = attrs.match(typeRe);
               
                if (typeMatch && typeMatch[2]) {
                    s.type = typeMatch[2];
                }
               
                hd.appendChild(s);
            } else if (match[2] && match[2].length > 0) {
                if (window.execScript) {
                    window.execScript(match[2]);
                } else {
                    window.eval.call(window, match[2]);
                }
            }
        }
        el = DOC.getElementById(id);
        
        if (el) {
            Ext.removeNode(el);
        }
    });

    var createdEl = Ext.DomHelper.append(elTo, html.replace(/(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/ig, "")
                                                   .replace(/(?:<style.*?>)((\n|\r|.)*?)(?:<\/style>)/ig, "")
                                                   .replace(/(?:<link([^>]*)?\/>)/ig, ""), true);
    if (createdEl.id === id) {
        createdEl = createdEl.prev();
    }
    
    return createdEl;
};

if (typeof RegExp.escape !== "function") {
    RegExp.escape = function (s) {
        if ("string" !== typeof s) {
            return s;
        }
        
        return s.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, "\\$1");
    };
}

// @source core/utils/Format.js

Ext.util.Format.usMoneyTemp = Ext.util.Format.usMoney;

Ext.util.Format.usMoney = function (v) {
    return Ext.util.Format.usMoneyTemp(String(v).replace(/[^0-9.\-]/g, ""));
};

Ext.util.Format.euroMoney = function (v) {
    v = String(v).replace(/[^0-9.\-]/g, "");
    v = (Math.round((v - 0) * 100)) / 100;
    v = (v === Math.floor(v)) ? v + ".00" : ((v * 10 === Math.floor(v * 10)) ? v + "0" : v);
    v = String(v);

    var ps = v.split("."),
        whole = ps[0],
        sub = ps[1] ? "," + ps[1] : ",00",
        r = /(\d+)(\d{3})/;

    while (r.test(whole)) {
        whole = whole.replace(r, "$1" + "." + "$2");
    }

    return whole + sub + " &euro;";
};

// @source core/utils/Mask.js

Ext.net.Mask = function () {
    var instance, 
        bmask, 
        init = function () {
            bmask = Ext.getBody().createChild({ 
                cls   : "x-page-mask",
                style : "top:0;left:0;z-index:20000;position:absolute;background-color:transparent,width:100%,height:100%,zoom:1;"
            })
                .enableDisplayMode("block")
                .hide();
                    
            Ext.EventManager.onWindowResize(function () { 
                bmask.setSize(Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true)); 
            });
        };

    return {
        show : function (cfg) {
            this.hide();

            cfg = Ext.apply({
                msg    : Ext.LoadMask.prototype.msg,
                msgCls : "x-mask-loading",
                el     : Ext.getBody()
            }, cfg || {});

            if (cfg.el === Ext.getBody()) {
                if (Ext.isEmpty(bmask)) {
                    init();
                }
                
                bmask.setSize(Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true)).show();
                cfg.el = bmask;
            } else {
                cfg.el = Ext.net.getEl(cfg.el);
            }
            
            cfg.el.mask(cfg.msg, cfg.msgCls);

            instance = cfg.el;
        },
        
        hide : function () {
            if (instance) {
                instance.unmask();
            }
            
            if (bmask) {
                bmask.hide();
            }

            if (Ext.getBody().isMasked() === true) {
                Ext.getBody().unmask();
            }
        }
    };
}();
// @source core/utils/VTypes.js

Ext.apply(Ext.form.VTypes, {
    daterange : function (val, field) {
        var date = field.parseDate(val);

        if (date) {
            if (field.startDateField && (!field.dateRangeMax || (date.getTime() !== field.dateRangeMax.getTime()))) {
                var start = Ext.getCmp(field.startDateField);

                if (start) {
                    start.setMaxValue(date);
                    field.dateRangeMax = date;
                    start.validate();
                }
            } else if (field.endDateField && (!field.dateRangeMin || (date.getTime() !== field.dateRangeMin.getTime()))) {
                var end = Ext.getCmp(field.endDateField);

                if (end) {
                    end.setMinValue(date);
                    field.dateRangeMin = date;
                    end.validate();
                }
            }
        }

        
        return true;
    },

    password : function (val, field) {
        if (field.initialPassField) {
            var pwd = Ext.getCmp(field.initialPassField);

            return pwd ? (val === pwd.getValue()) : false;
        }

        return true;
    },

    passwordText : "Passwords do not match",

    ipRegExp : /^([1-9][0-9]{0,1}|1[013-9][0-9]|12[0-689]|2[01][0-9]|22[0-3])([.]([1-9]{0,1}[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])) {2}[.]([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-4])$/,

    ip : function (val, field) {
        return Ext.form.VTypes.ipRegExp.test(val);
    },

    ipText : "Invalid IP Address format"
});

// @source core/Component.js

Ext.Component.prototype.destroy = Ext.Component.prototype.destroy.createInterceptor(function () {
    this.destroyBin();
	this.cleanId();
});

Ext.Component.prototype.initComponent = Ext.Component.prototype.initComponent.createSequence(function () {
    if (!Ext.isEmpty(this.contextMenuId, false)) {
        this.on("render", function () {
            this.el.on("contextmenu", function (e, t) {
                var menu = Ext.menu.MenuMgr.get(this.contextMenuId);
                menu.trg = t;
                e.stopEvent();
                e.preventDefault();
                menu.showAt(e.getPoint());
            }, this);            
        }, this, { single : true });    
    }
    
    this.initFieldLabel();
    
    if (!Ext.isEmpty(this.defaultAnchor, true)) {
        if (Ext.isEmpty(this.defaults)) {
            this.defaults = {};
        }
        
        Ext.apply(this.defaults, { anchor : this.defaultAnchor });
    }
    
    if (this.selectable === false) {
        this.on("afterrender", function () { 
            this.setSelectable(false); 
        });
    }
    
    if (this.autoFocus) {
        if (this.ownerCt) {
            this.ownerCt.on("afterlayout", function () { 
                this.focus(this.selectOnFocus || false, this.autoFocusDelay);
            }, this);
        } else {
            this.on("afterrender", function () { 
                this.focus(this.selectOnFocus || false, this.autoFocusDelay);
            });
        }
    }
    
    if (this.postback) {
        this.on(this.postback.eventName, this.postback.fn, this, { delay : 30 });
    }
});

Ext.override(Ext.Component, {
    selectable      : true,    
    autoFocusDelay  : 10,
	
	destroyBin : function () {
		if(this.bin){
		    Ext.destroy(this.bin);
		}
		delete this.bin;
	},
    
    setSelectable : function (selectable) {
        if (selectable === false) {
            this.setDisabled(true).el.removeClass("x-item-disabled").applyStyles("color:black;");
        } else if (selectable === true) {
            this.setDisabled(false);
        }
        
        this.selectable = false;
        
        return this;
    },
    
    initFieldLabel : function () {
        if (this.fieldLabel) {
            this.plugins = this.plugins || [];
            
            if (!Ext.isArray(this.plugins)) {
                this.plugins = [this.plugins];
            }
            
            this.plugins.push(Ext.ux.FieldLabeler);
        }
    },
    
    addPlugins : function (plugins) {
        if (Ext.isEmpty(this.plugins)) {
            this.plugins = [];
        } else if (!Ext.isArray(this.plugins)) {
            this.plugins = [ this.plugins ];
        }
        
        if (Ext.isArray(plugins)) {
            var i = 0;
            for (i; i < plugins.length; i++) {
                this.plugins.push(this.initPlugin(plugins[i]));
            }
        } else {
            this.plugins.push(this.initPlugin(plugins));
        }
    },
    
    getForm : function (id) {
        var form = Ext.isEmpty(id) ? this.el.up("form") : Ext.get(id);
        
        if (!Ext.isEmpty(form)) {
            Ext.apply(form, form.dom);
            
            form.submit = function () {
                form.dom.submit();
            };
        }
        
        return form;
    },
    
    setFieldLabel : function (text) {
        this.fieldLabel = text;
        
        if (this.label) {
            this.label.update(text);
        }
    },
    
    setAnchor : function (anchor, doLayout) {
        this.anchor = anchor;
        delete this.anchorSpec;
        
        if (doLayout && this.ownerCt) {
            this.ownerCt.doLayout();
        }
    }
});

// @source core/Container.js

Ext.override(Ext.Container, {
    addAndDoLayout : function (comp) {
        var c = this.add(comp);
        this.doLayout();
        
        return c;
    },
    
    insertAndDoLayout : function (index, comp) {
        var c = this.insert(index, comp);
        this.doLayout();
        
        return c;
    }
});

Ext.Container.prototype.initComponent = Ext.Container.prototype.initComponent.createSequence(function () {
    if (this.autoDoLayout === true) {
        this.on("afterrender", this.doLayout, this, { delay : 10 });
    }
});

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

// @source core/layout/FitLayout.js

Ext.override(Ext.layout.FitLayout, {
    onLayout : function (ct, target) {
        Ext.layout.FitLayout.superclass.onLayout.call(this, ct, target);
        
        if (!ct.collapsed) {            
            var sz;
            
            if (Ext.isIE6 && Ext.isStrict && target.dom == (Ext.net.ResourceMgr.getAspForm() || {}).dom) {
                sz = Ext.getBody().getViewSize();
            } else {
                sz = ((Ext.isIE6 && Ext.isStrict && target.dom == document.body) || target.dom == (Ext.net.ResourceMgr.getAspForm() || {}).dom) ? target.getViewSize() : target.getStyleSize();
            }
            
            this.setItemSize(this.activeItem || ct.items.itemAt(0), sz);
        }
    }
});


// @source core/layout/BorderLayoutRegion.js

Ext.layout.BorderLayout.SplitRegion.prototype.render = Ext.layout.BorderLayout.SplitRegion.prototype.render.createInterceptor(function (ct, p) {
    var pos = this.position,
        dir = "westeast".indexOf(pos) > -1 ? "Width" : "Height";
    this.splitSettings[pos].maxProp = (Ext.isDefined(p["boxMax" + dir]) ? "boxMax" : "max") + dir;
    this.splitSettings[pos].minProp = (Ext.isDefined(p["boxMin" + dir]) ? "boxMin" : "min") + dir;
});

Ext.layout.BorderLayout.SplitRegion.prototype.getCollapsedEl = Ext.layout.BorderLayout.SplitRegion.prototype.getCollapsedEl.createSequence(function () {
    if (this.useSplitTips) {
        this.collapsedEl.dom.title = this.collapsible ? this.expandableSplitTip : this.splitTip;
    }
});

Ext.layout.BorderLayout.Region.prototype.destroy = Ext.layout.BorderLayout.Region.prototype.destroy.createInterceptor(function () {
    this.clearMonitor();
});

Ext.layout.BorderLayout.SplitRegion.override({
    expandableSplitTip : "Double click to show."
});

// @source core/layout/BoxLayout.js

Ext.layout.BoxLayout.override({
    getVisibleItems: function (ct) {
        ct  = ct || this.container;

        var t   = ct.getLayoutTarget(),
            cti = ct.items.items,
            len = cti.length,
            i, 
            c, 
            items = [];

        for (i = 0; i < len; i++) {
            if ((c = cti[i]).rendered && this.isValidParent(c, t) && c.hidden !== true) {
                 
                items.push(c);
            }
        }

        return items;
    }
});

Ext.layout.VBoxLayout.override({
    renderItem : function (c) {
        c.on("collapse", function (item) {
            item.oldHeight = item.height; 
            item.height = item.getHeight();
            this.layout();
        }, this);

        c.on("beforeexpand", function (item) {
            item.height = item.oldHeight;
            this.layout();
        }, this);
        
        Ext.layout.VBoxLayout.superclass.renderItem.apply(this, arguments);
    }
});

// @source core/layout/AnchorLayout.js


Ext.layout.AnchorLayout.override({
    monitorResize : true,    
    
    getLayoutTargetSize : function () {
        var target = this.container.getLayoutTarget(), 
            ret = {},
            isViewSize;
            
        if (target) {
            isViewSize = ((target.dom == Ext.getBody().dom) || (target.dom == (Ext.net.ResourceMgr.getAspForm() || {}).dom));
            ret =  isViewSize ? target.getViewSize() : target.getStyleSize();
            
            if (Ext.isIE && Ext.isStrict && ret.width === 0) {
                ret =  target.getStyleSize();
            }
            
            if (isViewSize) {
                ret.width -= target.getPadding("lr");
                ret.height -= target.getPadding("tb");
            }
        }
        
        return ret;
    }
});

// @source core/layout/CenterLayout.js

Ext.ux.layout.CenterLayout = Ext.extend(Ext.layout.FitLayout, {    
    setItemSize : function (item, size) {        
        this.container.addClass("ux-layout-center");        
        
        if (item && size.height > 0) {
			item.addClass("ux-layout-center-item");

            if (item.width) {
                size.width = item.width;
            }
            
            item.setSize(size);
        }
    }
});

Ext.Container.LAYOUTS["ux.center"] = Ext.ux.layout.CenterLayout;

// @source core/layout/ColumnLayout.js


Ext.net.ColumnLayout = Ext.extend(Ext.layout.ContainerLayout, {
    monitorResize : true,
    extraCls      : "x-column",
    scrollOffset  : 0,
    margin        : 0,
    split         : false,
    fitHeight     : true,
    background    : false,

    // private
    isValidParent : function (c, target) {
        return this.innerCt && (c.getPositionEl ? c.getPositionEl() : c.getEl()).dom.parentNode == this.innerCt.dom;
    },

    renderAll : function (ct, target) {
        if (this.split && !this.splitBars) {
            this.splitBars = [];
            this.margin = this.margin || 5;
        }

        Ext.net.ColumnLayout.superclass.renderAll.apply(this, arguments);
    },
    
    getLayoutTargetSize : function () {
        var target = this.container.getLayoutTarget(), 
            ret;

        if (target) {
            ret = target.getViewSize();

            // IE in strict mode will return a width of 0 on the 1st pass of getViewSize.
            // Use getStyleSize to verify the 0 width, the adjustment pass will then work properly
            // with getViewSize
            if (Ext.isIE && Ext.isStrict && ret.width === 0) {
                ret =  target.getStyleSize();
            }

            ret.width -= (target.getPadding("lr") +  this.scrollOffset);
            ret.height -= target.getPadding("tb");
        }

        return ret;
    },

    // private
    onLayout : function (ct, target) {
        var cs = ct.items.items, len = cs.length, c, cel, i;       
                
        if (!this.innerCt) {
            target.addClass("x-column-layout-ct");
            
            if (this.background) {
                target.addClass("x-column-layout-bg-ct");
            }
            
            this.innerCt = target.createChild({ cls : "x-column-inner" });
            this.innerCt.createChild({ cls : "x-clear" });
        }
        
        this.renderAll(ct, this.innerCt);

        //var size = Ext.isIE && ((target.dom != Ext.getBody().dom) && (target.dom != (Ext.net.ResourceMgr.getAspForm() || {}).dom)) ? target.getStyleSize() : target.getViewSize();
        var size = this.getLayoutTargetSize();

        if (size.width < 1 && size.height < 1) { // display none?
            return;
        }

        var w = size.width,
            h = size.height;
        
        this.availableWidth = w;
        
        var pw = this.availableWidth, 
            lastProportionedColumn;

        if (this.split) {
            this.maxWidth = pw - ((this.minWidth + 5) * (len ? (len - 1) : 1));
        }

        if (this.fitHeight) {
            this.innerCt.setSize(w, h);
        } else {
            this.innerCt.setWidth(w);
        }

        for (i = 0; i < len; i++) {
            c = cs[i];
            cel = c.getPositionEl();

            if (this.margin && (i < (len - 1))) {
                cel.setStyle("margin-right", this.margin + "px");
            }
            
            if (c.columnWidth) {
                lastProportionedColumn = i;
            } else {
                pw -= c.getSize().width;
            }
            
            if (i < (len - 1)) {
                pw -= (cel.getMargins("lr") || this.margin);
            }
        }

        var remaining = (pw = pw < 0 ? 0 : pw),
            splitterPos = 0, 
            cw, 
            cmargin;
        
        for (i = 0; i < len; i++) {
            c = cs[i];
            cel = c.getPositionEl();
            
            if (c.columnWidth) {
                cw = (i === lastProportionedColumn) ? remaining : Math.floor(c.columnWidth * pw);
                
                cmargin = cel.getMargins("lr");

                if (!cmargin && (i < (len - 1))) {
                    cmargin = this.margin;
                }
                
                cmargin = 0;
                
                if (this.fitHeight) {
                    c.setSize(cw - cmargin, h);
                } else {
                    c.setSize(cw - cmargin);
                }
                
                remaining -= cw;
            } else if (this.fitHeight) {
                c.setHeight(h);
            }

            if (this.split) {
                cw = cel.getWidth();

                if (i < (len - 1)) {
                    splitterPos += cw;
                    
                    if (this.splitBars[i]) {
                        this.splitBars[i].el.setHeight(h);
                    } else {
                        this.splitBars[i] = new Ext.SplitBar(this.innerCt.createChild({
                            cls   : "x-layout-split x-layout-split-west",
                            style : {
                                top    : "0px",
                                left   : splitterPos + "px",
                                height : h + "px"
                            }
                        }), cel);
                        this.splitBars[i].index = i;
                        this.splitBars[i].leftComponent = c;
                        this.splitBars[i].addListener("resize", this.onColumnResize, this);
                        this.splitBars[i].minSize = Math.max(c.boxMinWidth || 5, 5);
                    }

                    splitterPos += this.splitBars[i].el.getWidth();
                }

                delete c.columnWidth;
            }
        }

        if (this.split) {
            this.setMaxWidths();
        }
        
        if (Ext.isIE) {
            if (i = target.getStyle("overflow") && i !== "hidden" && !this.adjustmentPass) {
                var ts = this.getLayoutTargetSize();

                if (ts.width !== size.width) {
                    this.adjustmentPass = true;
                    this.onLayout(ct, target);
                }
            }
        }

        delete this.adjustmentPass;
    },

    //  On column resize, explicitly size the Components to the left and right of the SplitBar
    onColumnResize : function (sb, newWidth) {
        if (sb.dragSpecs.startSize) {
            sb.leftComponent.setWidth(newWidth);
            
            var items = this.container.items.items,
                expansion = newWidth - sb.dragSpecs.startSize,
                i, 
                c, 
                w,
                len;
            
            for (i = sb.index + 1, len = items.length; expansion && i < len; i++) {
                c = items[i];
                w = c.el.getWidth();
                    
                newWidth = w - expansion;
                
                if (newWidth < this.minWidth) {
                    c.setWidth(this.minWidth);
                } else if (newWidth > this.maxWidth) {
                    expansion -= (newWidth - this.maxWidth);
                    c.setWidth(this.maxWidth);
                } else {
                    c.setWidth(c.el.getWidth() - expansion);
                    break;
                }
            }
            this.setMaxWidths();
        }
    },

    setMaxWidths : function () {
        var items = this.container.items.items,
            spare = items[items.length - 1].el.dom.offsetWidth - 100,
            i = items.length - 2;

        for (i; i > -1; i--) {
            var sb = this.splitBars[i], 
                sbel = sb.el, 
                c = items[i], 
                cel = c.el,
                itemWidth = cel.dom.offsetWidth;

            sbel.setStyle("left", (cel.getX() - Ext.fly(cel.dom.parentNode).getX() + itemWidth) + "px");
            sb.maxSize = itemWidth + spare;
            sb.setCurrentSize(itemWidth);
            spare = itemWidth - 100;
        }
    },

    onResize : function () {
        if (this.split) {
            var items = this.container.items.items, tw = 0, c, i;

            if (items[0].rendered) {
                for (i = 0; i < items.length; i++) {
                    c = items[i];
                    tw += c.el.getWidth() + c.el.getMargins("lr");
                }
                for (i = 0; i < items.length; i++) {
                    c = items[i];
                    c.columnWidth = (c.el.getWidth() + c.el.getMargins("lr")) / tw;
                }
            }
        }
        Ext.net.ColumnLayout.superclass.onResize.apply(this, arguments);
    }
});

Ext.reg("netcolumn", Ext.net.ColumnLayout);

Ext.Container.LAYOUTS.netcolumn = Ext.net.ColumnLayout;

// @source core/layout/ContainerLayout.js

Ext.layout.ContainerLayout.prototype.layout = Ext.layout.ContainerLayout.prototype.layout.createInterceptor(function () {
    if (this.activeItem) {
        this.activeItem = this.container.getComponent(this.activeItem);
    }
});

// @source core/layout/FormLayout.js

Ext.layout.FormLayout.override({
    trackLabels : true
});

// @source core/layout/RowLayout.js

Ext.ux.RowLayout = Ext.extend(Ext.layout.ContainerLayout, {
    monitorResize : true,
    scrollOffset  : 0,
    margin        : 0,
    split         : false,
    background    : false,

    // private
    isValidParent : function (c, target) {
        return (c.getPositionEl ? c.getPositionEl() : c.getEl()).dom.parentNode == this.innerCt.dom;
    },

    renderAll : function (ct, target) {
        if (this.split && !this.splitBars) {
            this.splitBars = [];
            this.margin = this.margin || 5;
        }

        Ext.ux.RowLayout.superclass.renderAll.apply(this, arguments);
    },

    // private
    onLayout : function (ct, target) {
        var cs = ct.items.items, len = cs.length, c, cel, i;

        if (!this.innerCt) {
            target.addClass("x-column-layout-ct");
            
            if (this.background) {
                target.addClass("x-column-layout-bg-ct");
            }
            
            this.innerCt = target.createChild({ cls : "x-column-inner" });
            this.innerCt.createChild({ cls : "x-clear" });
        }
        
        this.renderAll(ct, this.innerCt);

        //var size = Ext.isIE && ((target.dom != Ext.getBody().dom) && (target.dom != document.forms[0])) ? target.getStyleSize() : target.getViewSize();
        var size = target.getViewSize();

        if (size.width < 1 && size.height < 1) { // display none?
            return;
        }

        var w = size.height - target.getPadding("tb");
        
        this.availableHeight = w;
        
        var pw = this.availableHeight, 
            lastProportionedColumn;

        if (this.split) {
            this.maxHeight = pw - ((this.minHeight + 5) * (len ? (len - 1) : 1));
        }

        this.innerCt.setHeight(w);

        for (i = 0; i < len; i++) {            
            c = cs[i];
            cel = c.getEl();
            
            if (!c.isVisible()) {
                continue;            
            }

            if (this.margin && (i < (len - 1)) && c.split !== false) {
                cel.setStyle("margin-bottom", this.margin + "px");
            }
            
            if (c.rowHeight) {
                lastProportionedColumn = i;
            } else {
                pw -= (c.getSize().height + cel.getMargins("tb"));
            }
        }

        var remaining = (pw = pw < 0 ? 0 : pw),
            splitterPos = 0, 
            cw;
        
        for (i = 0; i < len; i++) {
            c = cs[i];
            cel = c.getEl();
            
            if (!c.isVisible()) {
                continue;            
            }
            
            if (c.rowHeight) {
                cw = (i === lastProportionedColumn) ? remaining : Math.floor(c.rowHeight * pw);
                c.setHeight(cw - cel.getMargins("tb"));
                
                if (Ext.isEmpty(c.width)) {
                    var elWidth = size.width - target.getPadding("lr") - this.scrollOffset;
                    c.setWidth(elWidth);
                }
                //c.setSize(cw - cel.getMargins("tb"), this.fitHeight ? h : null);
                remaining -= cw;
            } else if (Ext.isEmpty(c.width)) {
                c.setWidth(size.width - target.getPadding("lr") - this.scrollOffset);                
            }

            if (this.split) {
                cw = cel.getHeight();

                if (i < (len - 1) && c.split !== false) {
                    splitterPos += cw;
                    
                    this.splitBars[i] = new Ext.SplitBar(this.innerCt.createChild({
                        cls   : "x-layout-split x-layout-split-north",
                        style : {
                            left   : "0px",
                            top    : splitterPos + "px",
                            width  : "100%",
                            height : this.margin + "px"
                        }
                    }), cel, Ext.SplitBar.VERTICAL, Ext.SplitBar.TOP);
                   
                    this.splitBars[i].index = i;
                    this.splitBars[i].topComponent = c;
                    this.splitBars[i].addListener("resize", this.onColumnResize, this);
                    this.splitBars[i].minSize = Math.max(c.boxMinHeight || 5, 5);

                    splitterPos += this.splitBars[i].el.getHeight();
                }                
            }
        }

        if (this.split && this.splitBars.length > 0) {
            this.setMaxHeights();
        }
    },

    //  On column resize, explicitly size the Components to the left and right of the SplitBar
    onColumnResize : function (sb, newHeight) {
        if (sb.dragSpecs.startSize) {
            sb.topComponent.el.setStyle("height", "");
            sb.topComponent.setHeight(newHeight);
            
            var items = this.container.items.items,
                expansion = newHeight - sb.dragSpecs.startSize,
                i = sb.index + 1,
                len;
            
            for (i, len = items.length; expansion && i < len; i++) {
                var c = items[i],
                    w = c.el.getHeight();
                    
                newHeight = w - expansion;
                
                if (newHeight < this.minHeight) {
                    c.setHeight(this.minHeight);
                } else if (newHeight > this.maxHeight) {
                    expansion -= (newHeight - this.maxHeight);
                    c.setHeight(this.maxHeight);
                } else {
                    c.setHeight(c.el.getHeight() - expansion);
                    break;
                }
                
                delete c.rowHeight;
            }
            this.setMaxHeights();
        }
    },

    setMaxHeights : function () {
        var items = this.container.items.items,
            spare = items[items.length - 1].el.dom.offsetHeight - 100, 
            i;

        for (i = items.length - 2; i > -1; i--) {
            var sb = this.splitBars[i];
            
            if (sb) {
                var sbel = sb.el, c = items[i], cel = c.el,
                    itemHeight = cel.dom.offsetHeight;
                
                sbel.setStyle("top", (cel.getY() - Ext.fly(cel.dom.parentNode).getY() + itemHeight) + "px");
                sb.maxSize = itemHeight + spare;
                spare = itemHeight - 100;
            }
        }
    },

    onResize : function () {
        Ext.ux.RowLayout.superclass.onResize.apply(this, arguments);
    }
});

Ext.Container.LAYOUTS["ux.row"] = Ext.ux.RowLayout;

// @source core/layout/AccordionLayout.js

Ext.layout.AccordionLayout.prototype.renderItem = Ext.layout.AccordionLayout.prototype.renderItem.createSequence(function (c) {
    if (this.originalHeader) {
        c.header.removeClass('x-accordion-hd');
    }
});


// @source core/ajax/Ajax.js

Ext.apply(Ext.lib.Ajax, {
    serializeForm : function (form, parentEl) {
	    var fElements = form.elements || (document.forms[form] || Ext.getDom(form)).elements,
	        hasSubmit = false,
		    encoder = encodeURIComponent,
		    element,
		    name,
		    data = [],
		    type,
		    submitDisabled = Ext.net && Ext.net.ResourceMgr && Ext.net.ResourceMgr.submitDisabled,
            i = 0;

		hasSubmit = form.ignoreAllSubmitFields || false;

	    for (i; i < fElements.length; i++) {
		    element = fElements[i];
		    name = element.name;
		    type = element.type;
		    
		    if (!Ext.isEmpty(parentEl) && Ext.isEmpty(Ext.fly(element).parent("#" + parentEl.id))) {
                continue;
            }

		    if ((!element.disabled || submitDisabled) && name) {
			    if (/select-(one|multiple)/i.test(type)) {
				    Ext.each(element.options, function (opt) {
					    if (opt.selected) {
						    data.push(encoder(name));
						    data.push("=");
						    data.push((opt.hasAttribute ? opt.hasAttribute("value") : opt.getAttribute("value") !== null) ? opt.value : opt.text);
						    data.push("&");
					    }
				    });
			    } else if (!/file|undefined|reset|button/i.test(type)) {
				    if (!(/radio|checkbox/i.test(type) && !element.checked) && !(type === "submit" && hasSubmit)) {
					    data.push(encoder(name));
					    data.push("=");
					    data.push(encoder(element.value));
					    data.push("&");    
					    if (type === "submit") {
					        hasSubmit = /submit/i.test(type);
                        }
                    }
                }
            }
        }

	    data = data.join("");
        data = data.substr(0, data.length - 1);
        return data;
    }
});

// @source core/direct/DirectEvent.js

Ext.net.DirectEvent = new Ext.data.Connection({
    autoAbort : false,
    
    confirmTitle : "Confirmation",
    
    confirmMessage : "Are you sure?",

    confirmRequest : function (directEventConfig) {
        directEventConfig = directEventConfig || {};
        if (directEventConfig.confirmation && directEventConfig.confirmation.confirmRequest) {
            if (directEventConfig.confirmation.beforeConfirm && directEventConfig.confirmation.beforeConfirm(directEventConfig) === false) {
                Ext.net.DirectEvent.request(directEventConfig);
                return;
            }

            Ext.Msg.confirm(directEventConfig.confirmation.title || this.confirmTitle, directEventConfig.confirmation.message || this.confirmMessage, this.confirmAnswer.createDelegate(this, [directEventConfig], true), this);
        } else {
            Ext.net.DirectEvent.request(directEventConfig);
        }
    },

    confirmAnswer : function (btn, text, buttonConfig, directEventConfig) {
        if (btn === "yes") {
            Ext.net.DirectEvent.request(directEventConfig);
        }
        if (btn === "no" && directEventConfig.confirmation.cancel) {
            directEventConfig.confirmation.cancel(directEventConfig);
        }
    },

    serializeForm : function (form) {
        return Ext.lib.Ajax.serializeForm(form);
    },

    setValue : function (form, name, value) {
        var input = null, pe;
        
        var els = Ext.fly(form).select("input[name=" + name + "]");

        if (els.getCount() > 0) {
            input = els.elements[0];
        } else {
            input = document.createElement("input");
            input.setAttribute("name", name);
            input.setAttribute("type", "hidden");
        }

        input.setAttribute("value", value);

        pe = input.parentElement ? input.parentElement : input.parentNode;

        if (Ext.isEmpty(pe)) {
            form.appendChild(input);
        }
    },

    delayedF : function (el, remove) {
        if (!Ext.isEmpty(el)) {
            el.unmask();

            if (remove === true) {
                el.remove();
            }
        }
    },

    showFailure : function (response, errorMsg) {
        var bodySize = Ext.getBody().getViewSize(),
            width = (bodySize.width < 500) ? bodySize.width - 50 : 500,
            height = (bodySize.height < 300) ? bodySize.height - 50 : 300,
            win;

        if (Ext.isEmpty(errorMsg)) {
            errorMsg = response.responseText;
        }

        win = new Ext.Window({ 
            modal  : true, 
            width  : width, 
            height : height, 
            title  : "Request Failure", 
            layout : "fit", 
            maximizable : true,
            listeners : {
                "maximize" : {
                    fn : function (el) {
                        var v = Ext.getBody().getViewSize();
                        el.setSize(v.width, v.height);
                    },
                    scope : this
                },

                "resize" : {
                    fn : function (wnd) {
                        var editor = wnd.getComponent(0).getComponent("__ErrorMessageEditor");
                        var sz = wnd.body.getViewSize();
                        editor.setSize(sz.width, sz.height - 42);
                    }
                }
            },
            items : new Ext.Container({
                layout  : "absolute",
                defaultType : "label",
                items : [
                    {
                        x    : 5,
                        y    : 5,
                        html : '<div class="x-window-dlg"><div class="ext-mb-error" style="width:32px;height:32px"></div></div>'
                    }, {
                        x    : 42,
                        y    : 6,
                        html : "<b>Status Code: </b>"
                    }, {
                        x    : 125,
                        y    : 6,
                        text : response.status
                    }, {
                        x    : 42,
                        y    : 25,
                        html : "<b>Status Text: </b>"
                    }, {
                        x    : 125,
                        y    : 25,
                        text : response.statusText
                    }, {
                        x  : 0,
                        y  : 42,
                        itemId   : "__ErrorMessageEditor",
                        xtype    : "htmleditor",
                        value    : errorMsg,
                        readOnly : true,
                        submitValue      : false,
                        enableAlignments : false,
                        enableColors     : false,
                        enableFont       : false,
                        enableFontSize   : false,
                        enableFormat     : false,
                        enableLinks      : false,
                        enableLists      : false,
                        enableSourceEdit : false
                    }]
            })
        });
        
        win.show();
    },

    parseResponse : function (response, options) {
        var text = response.responseText,
            result = {},
            exception = false;

        result.success = true;

        try {            
            if (/^<\?xml/.test(text)) {
                //xml parsing      
                var xmlData = response.responseXML,
                    root = xmlData.documentElement || xmlData,
                    q = Ext.DomQuery;

                if (root && root.nodeName === "DirectResponse") {
                    //root = q.select("DirectResponse", root);
                    //success
                    var sv = q.selectValue("Success", root, true),
                        pSuccess = sv !== false && sv !== "false",
                        pErrorMessage = q.selectValue("ErrorMessage", root, ""),
                        pScript = q.selectValue("Script", root, ""),
                        pViewState = q.selectValue("ViewState", root, ""),
                        pViewStateEncrypted = q.selectValue("ViewStateEncrypted", root, ""),
                        pEventValidation = q.selectValue("EventValidation", root, ""),
                        pServiceResponse = q.selectValue("ServiceResponse", root, ""),
                        pUserParamsResponse = q.selectValue("ExtraParamsResponse", root, ""),
                        pResult = q.selectValue("Result", root, "");

                    if (!Ext.isEmpty(pSuccess)) {
                        Ext.apply(result, { success: pSuccess });
                    }

                    if (!Ext.isEmpty(pErrorMessage)) {
                        Ext.apply(result, { errorMessage: pErrorMessage });
                    }

                    if (!Ext.isEmpty(pScript)) {
                        Ext.apply(result, { script: pScript });
                    }

                    if (!Ext.isEmpty(pViewState)) {
                        Ext.apply(result, { viewState: pViewState });
                    }

                    if (!Ext.isEmpty(pViewStateEncrypted)) {
                        Ext.apply(result, { viewStateEncrypted: pViewStateEncrypted });
                    }

                    if (!Ext.isEmpty(pEventValidation)) {
                        Ext.apply(result, { eventValidation: pEventValidation });
                    }

                    if (!Ext.isEmpty(pServiceResponse)) {
                        Ext.apply(result, { serviceResponse: eval("(" + pServiceResponse + ")") });
                    }

                    if (!Ext.isEmpty(pUserParamsResponse)) {
                        Ext.apply(result, { extraParamsResponse: eval("(" + pUserParamsResponse + ")") });
                    }

                    if (!Ext.isEmpty(pResult)) {
                        Ext.apply(result, { result: eval("(" + pResult + ")") });
                    }

                    return { 
                        result    : result, 
                        exception : false 
                    };
                } else {
                    return { 
                        result    : response.responseXML, 
                        exception : false 
                    }; 
                    // root.text || root.textContent;
                }
            }

            //json parsing
            result = eval("(" + text + ")");

        } catch (e) {
            result.success = false;
            exception = true;

            if (response.responseText.length === 0) {
                result.errorMessage = "NORESPONSE";
            } else {
                result.errorMessage = "BADRESPONSE: " + e.message;
                result.responseText = response.responseText;
            }

            response.statusText = result.errorMessage;
        }
        
        if (result && result.d) {
            result = result.d;

            if (Ext.isString(result) && options.isDirectMethod !== true) {
                result = Ext.decode(result);
            }
        }

        return { 
            result    : result, 
            exception : exception 
        };
    },
    
    cacheBusterCheck : function (o) {
        var method = o.method || this.method || ((o.params || o.xmlData || o.jsonData || o.form) ? "POST" : "GET"),
            url = o.url || this.url,
            form = Ext.getDom(o.form);
            
        if (form) {
            url = url || form.action;            
        }
        
        if (method === "POST" && (this.disableCaching && o.disableCaching !== false)) {
            if (Ext.isFunction(url)) {
                url = url.call(o.scope || "window", o);
            }

            var dcp = o.disableCachingParam || this.disableCachingParam;
            o.url = Ext.urlAppend(url, dcp + '=' + (new Date().getTime()));
        }
    },

    listeners : {
        beforerequest : {
            fn : function (conn, options) {
                var o = options || {};

                o.eventType = o.eventType || "event";

                var isInstance = (o.eventType === "public"),
                    submitConfig = {},
                    forms,
                    aspForm;

                o.extraParams = o.extraParams || {};

                switch (o.eventType) {
                case "event":
                case "custom":
                case "proxy":
                case "postback":
                case "public":
                    if (isInstance) {
                        o.action = o.name;
                    }

                    o.control = o.control || {};
                    o.type = o.type || "submit";
                    o.viewStateMode = o.viewStateMode || "default";
                    o.action = o.action || "Click";
                    o.headers = Ext.apply(o.headers || {}, { "X-Ext.Net" : "delta=true" });

                    if (o.type === "submit") {
                        o.form = Ext.get(o.formProxyArg);

                        if (!Ext.isEmpty(o.form) && !Ext.isEmpty(o.form.id)) {
                            var cmp = Ext.getCmp(o.form.id);

                            if (!Ext.isEmpty(cmp) && cmp.getForm && cmp.startMonitoring) {
                                if (cmp.form && cmp.form.el.dom.elements) {
                                    o.form = cmp.form.el;
                                } else {
                                    o.form = undefined;
                                }
                            }
                        }

                        if (Ext.isEmpty(o.form) && !Ext.isEmpty(o.control.el)) {
                            if (Ext.isEmpty(o.control.isComposite) || o.control.isComposite === false) {
                                o.form = o.control.el.up("form");
                                
                                if (Ext.isEmpty(o.form) && o.control.findParentByType) {
                                    var formPanel = o.control.findParentByType("form");

                                    if (formPanel && formPanel.renderFormElement !== false) {
                                        o.form = formPanel.getForm().el;                                            
                                    }
                                }
                            } else {
                                o.form = Ext.get(o.control.elements[0]).up("form");
                            }
                        } 
                        
                        if (Ext.isEmpty(o.form) && Ext.isEmpty(o.url) && !Ext.isEmpty(Ext.net.ResourceMgr.aspForm)) {
                            o.form = Ext.get(Ext.net.ResourceMgr.aspForm);
                        }                       
                    } else if (o.type === "load" && Ext.isEmpty(o.method)) {
                        o.method = "GET";
                    }                    
                    
                    if (Ext.isEmpty(o.form) && Ext.isEmpty(o.url)) {
                        if (!Ext.isEmpty(Ext.net.ResourceMgr.aspForm)) {
                            aspForm = Ext.getDom(Ext.net.ResourceMgr.aspForm);
                        }                     

                        if (aspForm) {
                            if (o.type === "submit") {
                                o.form = aspForm;
                            } else {
                                o.url = aspForm.action;
                            }
                        }
                    }

                    var argument = String.format("{0}|{1}|{2}", o.proxyId || o.control.storeId || o.control.proxyId || o.control.id || "-", o.eventType, o.action);

                    if (!Ext.isEmpty(o.form)) {
                        this.setValue(o.form.dom, "__EVENTTARGET", Ext.net.ResourceMgr.id);
                        this.setValue(o.form.dom, "__EVENTARGUMENT", argument);
                        Ext.getDom(o.form).ignoreAllSubmitFields = true;
                    } else {
                        o.url = o.url || Ext.net.ResourceMgr.url || window.location.href;
                        Ext.apply(submitConfig, { 
                            __EVENTTARGET   : Ext.net.ResourceMgr.id, 
                            __EVENTARGUMENT : argument 
                        });
                    }

                    if (o.viewStateMode !== "default") {
                        Ext.apply(submitConfig, { 
                            viewStateMode : o.viewStateMode                             
                        });
                    }
                    
                    if (o.rethrowException) {
                        submitConfig.rethrowException = true;
                    }

                    if (o.before) {
                        if (o.before.call(o.control || window, o.control, o.eventType, o.action, o.extraParams, o) === false) {
                            return false;
                        }
                    }

                    if (this.fireEvent("beforeajaxrequest", o.control, o.eventType, o.action, o.extraParams, o) === false) {
                        return false;
                    }

                    if (!Ext.isEmpty(o.extraParams) && !Ext.isEmptyObj(o.extraParams)) {
                        Ext.apply(submitConfig, { 
                            extraParams : o.extraParams 
                        });
                    }

                    if (!Ext.isEmpty(o.serviceParams)) {
                        Ext.apply(submitConfig, { serviceParams: o.serviceParams });
                    }

                    if (!Ext.isEmpty(submitConfig) && !Ext.isEmptyObj(submitConfig)) {
                        o.params = { submitDirectEventConfig: Ext.encode({ config : submitConfig }) };
                    } else {
                        o.params = {};
                    }

                    if (!Ext.isEmpty(o.form)) {
                        var enctype = Ext.getDom(o.form).getAttribute("enctype");

                        if ((enctype && enctype.toLowerCase() === "multipart/form-data") || o.isUpload) {
                            Ext.apply(o.params, { "__ExtNetDirectEventMarker" : "delta=true" });
                        }
                    }

                    if (o.cleanRequest) {
                        o.params = Ext.apply({}, o.extraParams || {});                        

                        if (o.json) {
                            o.jsonData = o.params;

                            if ((o.method || this.method) !== "GET") {
                                o.params = "";
                            }
                        } else {
							var ov,
                                key;

                            for (key in o.params) {
                                ov = o.params[key];

                                if (typeof ov === "object") {
                                    o.params[key] = Ext.encode(ov);
                                }
                            }
                        }
                    }

                    if (!Ext.isEmpty(o.form)) {
                        o.form.dom.action = o.form.dom.action || o.form.action || o.url || Ext.net.ResourceMgr.url || window.location.href;
                    }

                    break;
                case "static":
                    o.headers = { 
                        "X-Ext.Net" : "delta=true,staticmethod=true" 
                    };

                    if (Ext.isEmpty(o.form) && Ext.isEmpty(o.url)) {
                        forms = Ext.select("form").elements;
                        o.url = (forms.length === 1 && !Ext.isEmpty(forms[0].action)) ? forms[0].action : Ext.net.ResourceMgr.url || window.location.href;
                    }

                    if (o.before) {
                        if (o.before(o.control, o.eventType, o.action, o.extraParams) === false) {
                            return false;
                        }
                    }

                    if (this.fireEvent("beforeajaxrequest", o.control, o.eventType, o.action, o.extraParams, o) === false) {
                        return false;
                    }

                    o.params = Ext.apply(o.extraParams, { "_methodName_": o.name });
                    if (o.rethrowException) {
                        o.params._rethrowException_ = true;                   
                    }
                    break;
                }

                o.scope = this;

                //--Common part----------------------------------------------------------

                var el, em = o.eventMask || {};

                if ((em.showMask === true)) {
                    if (!Ext.isEmpty(em.customTarget, false) && Ext.isEmpty(em.target, false)) {
                        em.target = "customtarget";
                    }
                    switch (em.target || "page") {
                    case "this":
                        if (o.control.getEl) {
                            el = o.control.getEl();
                        } else if (o.control.dom) {
                            el = o.control;
                        }
                        
                        break;
                    case "parent":
                        if (o.control.getEl) {
                            el = o.control.getEl().parent();
                        } else if (o.control.parent) {
                            el = o.control.parent();
                        }
                        
                        break;
                    case "page":
                        var theHeight = "100%";

                        if (window.innerHeight) {
                            theHeight = window.innerHeight + "px";
                        } else if (document.documentElement && document.documentElement.clientHeight) {
                            theHeight = document.documentElement.clientHeight + "px";
                        } else if (document.body) {
                            theHeight = document.body.clientHeight + "px";
                        }

                        el = Ext.getBody().createChild({ 
                            cls : "x-page-mask",
                            style : "position:absolute;left:0;top:0;width:100%;height:" + theHeight + ";z-index:20000;background-color:Transparent;" 
                        });

                        var scroll = Ext.getBody().getScroll();
                        el.setLeftTop(scroll.left, scroll.top);
                        break;
                    case "customtarget":
                        var trg = em.customTarget || "";
                        el = Ext.net.getEl(trg);

                        if (Ext.isEmpty(el)) {
                            el = trg.getEl ? trg.getEl() : null;
                        }

                        break;
                    }

                    if (!Ext.isEmpty(el)) {
                        el.mask(em.msg || Ext.LoadMask.prototype.msg, em.msgCls || Ext.LoadMask.prototype.msgCls);
                        o.maskEl = el;
                    }
                }

                var removeMask = function (o) {
                    if (o.maskEl !== undefined && o.maskEl !== null) {
                        var delay = 0,
                            em = o.eventMask || {},
                            task;

                        if (em && em.minDelay) {
                            delay = em.minDelay;
                        }

                        var remove = (em.target || "page") === "page";

                        task = new Ext.util.DelayedTask(function (o, remove) {
                            o.scope.delayedF(o.maskEl, remove);
                        }, o.scope, [o, remove]).delay(delay);
                    }
                };

                var executeScript = function (o, result, response) {
                    var delay = 0,
                        em = o.eventMask || {};

                    if (em.minDelay) {
                        delay = em.minDelay;
                    }
                    
                    var task = new Ext.util.DelayedTask(
                        function (o, result, response) {
                            if (result.script && result.script.length > 0) {
                                (function (o, result, response) { 
                                    eval(result.script); 
                                }).call(window, o, result, response);
                            }

                            this.fireEvent("ajaxrequestcomplete", response, result, o.control, o.eventType, o.action, o.extraParams, o);

                            if (o.userSuccess) {
                                o.userSuccess.call(o.control || window, response, result, o.control, o.eventType, o.action, o.extraParams, o);
                            }
                            
                            if (o.userComplete) {
                                o.userComplete.call(o.control || window, true, response, result, o.control, o.eventType, o.action, o.extraParams, o);
                            }
                        },
                        o.scope, 
                        [o, result, response]
                    ).delay(delay);
                };


                o.failure = function (response, options) {
                    var o = options;
                    removeMask(o);
                    
                    if (this.fireEvent("ajaxrequestexception", response, { "errorMessage": response.statusText }, o.control, o.eventType, o.action, o.extraParams, o) === false) {
                        o.cancelFailureWarning = true;
                    }
                    
                    if (o.userFailure) {
                        o.userFailure.call(o.control || window, response, { "errorMessage": response.responseText }, o.control, o.eventType, o.action, o.extraParams, o);
                    } else if (o.showWarningOnFailure !== false && !o.cancelFailureWarning) {
                        o.scope.showFailure(response, "");
                    }
                    
                    if (o.userComplete) {
                        o.userComplete.call(o.control || window, false, response, { "errorMessage": response.statusText }, o.control, o.eventType, o.action, o.extraParams, o);
                    }
                };

                o.success = function (response, options) {
                    var o = options;

                    removeMask(o);

                    var parsedResponse = o.scope.parseResponse(response, options);

                    if (!Ext.isEmpty(parsedResponse.result.documentElement)) {
                        executeScript(o, parsedResponse.result, response);
                        return;
                    }

                    var result = parsedResponse.result,
                        exception = parsedResponse.exception;

                    if (result.success === false) {
                        if (this.fireEvent("ajaxrequestexception", response, result, o.control, o.eventType, o.action, o.extraParams, o) === false) {
                            o.cancelFailureWarning = true;
                        }

                        if (o.userFailure) {
                            o.userFailure.call(o.control || window, response, result, o.control, o.eventType, o.action, o.extraParams, o);
                        } else {
                            if (o.showWarningOnFailure !== false && !o.cancelFailureWarning) {
                                var errorMsg = "";
                                if (!exception && result.errorMessage && result.errorMessage.length > 0) {
                                    errorMsg = result.errorMessage;
                                }
                                o.scope.showFailure(response, errorMsg);
                            }
                        }
                        
                        if (o.userComplete) {
                            o.userComplete.call(o.control || window, false, response, result, o.control, o.eventType, o.action, o.extraParams, o);
                        } 

                        return;
                    }

                    if (!Ext.isEmpty(result.viewState) && o.form !== null) {
                        o.scope.setValue(o.form.dom, "__VIEWSTATE", result.viewState);
                        delete result.viewState;

                        if (!Ext.isEmpty(result.viewStateEncrypted) && o.form !== null) {
                            o.scope.setValue(o.form.dom, "__VIEWSTATEENCRYPTED", result.viewStateEncrypted);
                            delete result.viewStateEncrypted;
                        }

                        if (!Ext.isEmpty(result.eventValidation) && o.form !== null) {
                            o.scope.setValue(o.form.dom, "__EVENTVALIDATION", result.eventValidation);
                            delete result.eventValidation;
                        }
                    }

                    executeScript(o, result, response);
                };
                
                this.cacheBusterCheck(o);
            }
        }
    }
});

Ext.net.DirectEvent.addEvents("beforeajaxrequest", "ajaxrequestcomplete", "ajaxrequestexception");
                    
Ext.net.DirectEvent.request = Ext.net.DirectEvent.request.createSequence(function (o) {
    if (!Ext.isEmpty(o.form)) {
        this.setValue(o.form.dom, "__EVENTTARGET", "");
        this.setValue(o.form.dom, "__EVENTARGUMENT", "");
    } 
    
    if (o.after) {
        o.after(o.control, o.extraParams);
    }
});

// @source core/direct/DirectMethod.js

Ext.net.DirectMethod = {
    request : function (name, options) {
        options = options || {};

        if (typeof options !== "object") {
            
            throw { message : "The DirectMethod options object is an invalid type: typeof " + typeof options };
        }

        var obj;

        if (!Ext.isEmpty(name) && typeof name === "object" && Ext.isEmptyObj(options)) {
            options = name;
        }
        
        if (options.params && options.json !== true) {
            var key;

            for (key in options.params) {
                obj = options.params[key];
                
                if (obj === undefined) {
                    delete options.params[key];
                } else if (obj && typeof obj === "object") {
                    options.params[key] = Ext.encode(obj);
                }
            }
        }

        obj = {
            name                : options.cleanRequest ? undefined : (options.name || name),
            cleanRequest        : options.cleanRequest,
            url                 : options.url,
            control             : Ext.isEmpty(options.control) ? null : { id : options.control },
            eventType           : options.specifier || "public",
            type                : options.type || "submit",
            method              : options.method || "POST",
            eventMask           : options.eventMask,
            extraParams         : options.params,
            directMethodSuccess : options.success,
            directMethodFailure : options.failure,
            directMethodComplete : options.complete,
            viewStateMode       : options.viewStateMode,
            isDirectMethod      : true,
            userSuccess         : function (response, result, control, eventType, action, extraParams, o) {
                result = Ext.isEmpty(result.result, true) ? (result.d || result) : result.result;
                
                if (!Ext.isEmpty(o.directMethodSuccess)) {                    
                    o.directMethodSuccess(result, response, extraParams, o);
                }
                
                if (!Ext.isEmpty(o.directMethodComplete)) {
                    o.directMethodComplete(true, result, response, extraParams, o);
                }
            },
            userFailure         : function (response, result, control, eventType, action, extraParams, o) {
                if (!Ext.isEmpty(o.directMethodFailure)) {
                    o.directMethodFailure(result.errorMessage, response, extraParams, o);
                } else if (o.showFailureWarning !== false) {
                    Ext.net.DirectEvent.showFailure(response, result.errorMessage);
                }
                
                if (!Ext.isEmpty(o.directMethodComplete)) {
                    o.directMethodComplete(false, result.errorMessage, response, extraParams, o);
                }
            }
        };

        Ext.net.DirectEvent.request(Ext.apply(options, obj));
    }
};

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

// @source core/buttons/CycleButton.js

Ext.CycleButton.prototype.setActiveItem = Ext.CycleButton.prototype.setActiveItem.createSequence(function (item, suppressEvent) {
    if (!this.forceIcon) {
        if (item.icon) {
            this.setIcon(item.icon);
        }
    }
});

Ext.override(Ext.CycleButton, {
    initComponent : function () {
        this.addEvents("change");

        if (this.changeHandler) {
            this.on("change", this.changeHandler, this.scope || this);
            delete this.changeHandler;
        }

        this.itemCount = this.menu.items.length;

        this.menu.cls = "x-cycle-menu";
        
        var checked = 0, 
            item,
            i = 0,
            len;
        
        for (i, len = this.itemCount; i < len; i++) {
            item = this.menu.items[i];

            item.group = item.group || this.id;

            item.itemIndex = i;
            item.checkHandler = this.checkHandler;
            item.scope = this;
            item.checked = item.checked || false;

            if (item.checked) {
                checked = i;
            }
        }
        
        Ext.CycleButton.superclass.initComponent.call(this);

        this.on("click", this.toggleSelected, this);
        this.setActiveItem(checked, true);
    },
    
    showMenuArrow : function () {
        var el = this.el.child("td.x-btn-mc em");
        
        if (!Ext.isEmpty(el)) {
            el.addClass("x-btn-split" + (this.arrowAlign === "bottom" ? "-bottom" : ""));
        }
    },
    
    hideMenuArrow : function () {
        var bottom = this.arrowAlign === "bottom" ? "-bottom" : "",
            el = this.el.child("td.x-btn-mc em.x-btn-split" + bottom);
        
        if (!Ext.isEmpty(el)) {
            el.removeClass("x-btn-split" + bottom);
        }
    }
});

// @source core/buttons/ImageButton.js

Ext.net.ImageButton = Ext.extend(Ext.Button, {
    buttonSelector : "img",
    cls            : "",
    iconAlign      : "left",

    initComponent : function () {
        Ext.net.ImageButton.superclass.initComponent.call(this);        
        
        var i;
        
        if (this.imageUrl) {
            i = new Image().src = this.imageUrl;
        }

        if (this.overImageUrl) {
            i = new Image().src = this.overImageUrl;
        }

        if (this.disabledImageUrl) {
            i = new Image().src = this.disabledImageUrl;
        }

        if (this.pressedImageUrl) {
            i = new Image().src = this.pressedImageUrl;
        }
    },

    onRender : function (ct, position) {
        if (!this.el) {
            var img = document.createElement("img");
            img.id = this.getId();
            img.src = this.imageUrl;
            img.style.border = "none";
            img.style.cursor = "pointer";

            this.imgEl = Ext.get(img);
            this.el = this.imgEl;

            if (!Ext.isEmpty(this.imgEl.getAttributeNS("", "width"), false) || !Ext.isEmpty(this.imgEl.getAttributeNS("", "height"), false)) {
                img.removeAttribute("width");
                img.removeAttribute("height");
            }

            if (this.altText) {
                img.setAttribute("alt", this.altText);
            }

            if (this.align && this.align !== "notset") {
                img.setAttribute("align", this.align);
            }

            if (this.pressed && this.pressedImageUrl) {
                img.src = this.pressedImageUrl;
            }

            if (this.disabled && this.disabledImageUrl) {
                img.src = this.disabledImageUrl;
            }

            if (this.tabIndex !== undefined) {
                img.tabIndex = this.tabIndex;
            }

            if (this.menu) {
                this.menu.on("show", this.onMenuShow, this);
                this.menu.on("hide", this.onMenuHide, this);
            }

            if (this.repeat) {
                var repeater = new Ext.util.ClickRepeater(this.imgEl, typeof this.repeat === "object" ? this.repeat : {});
                repeater.on("click", this.onClick, this);
            }

            this.imgEl.on(this.clickEvent, this.onClick, this);

            if (this.handleMouseEvents) {
                this.imgEl.on("mouseover", this.onMouseOver, this);
                this.imgEl.on("mousedown", this.onMouseDown, this);
            }

            if (!Ext.isEmpty(this.cls, false)) {
                this.el.dom.className = this.cls;
            }
            
            this.setNavigateUrl();

            Ext.BoxComponent.superclass.onRender.call(this, ct, position);
        }

        if (this.tooltip) {
            if (typeof this.tooltip === "object") {
                Ext.QuickTips.register(Ext.apply({
                    target : this.imgEl.id
                }, this.tooltip));
            } else {
                this.imgEl.dom[this.tooltipType] = this.tooltip;
            }
        }


        Ext.ButtonToggleMgr.register(this);
    },

    afterRender : function () {
        Ext.Button.superclass.afterRender.call(this);
        this.doc = Ext.getDoc();
    },

    // private
    onMenuShow : function (e) {
        this.ignoreNextClick = 0;
        this.fireEvent("menushow", this, this.menu);
    },
    
    // private
    onMenuHide : function (e) {
        this.ignoreNextClick = this.restoreClick.defer(250, this);
        this.fireEvent("menuhide", this, this.menu);
    },

    toggle : function (state) {
        state = state === undefined ? !this.pressed : state;
        
        if (state !== this.pressed) {
            if (state) {
                if (this.pressedImageUrl) {
                    this.imgEl.dom.src = this.pressedImageUrl;
                }
                
                this.pressed = true;
                this.fireEvent("toggle", this, true);
            } else {
                this.imgEl.dom.src = (this.monitoringMouseOver) ? this.overImageUrl : this.imageUrl;
                this.pressed = false;
                this.fireEvent("toggle", this, false);
            }
            
            if (this.toggleHandler) {
                this.toggleHandler.call(this.scope || this, this, state);
            }
        }
    },

    setText : function (t, encode) { },

    setDisabled : function (disabled) {
        this.disabled = disabled;
        
        if (this.imgEl && this.imgEl.dom) {
            this.imgEl.dom.disabled = disabled;
        }
        
        if (disabled) {
            if (this.disabledImageUrl) {
                this.imgEl.dom.src = this.disabledImageUrl;
            } else {
                this.imgEl.addClass(this.disabledClass);
            }
        } else {
            this.imgEl.dom.src = this.imageUrl;
            this.imgEl.removeClass(this.disabledClass);
        }
    },

    // private
    onMouseOver : function (e) {
        if (!this.disabled) {
            var internal = e.within(this.el.dom, true);

            if (!internal) {
                if (this.overImageUrl && !this.pressed) {
                    this.imgEl.dom.src = this.overImageUrl;
                }

                if (!this.monitoringMouseOver) {
                    Ext.getDoc().on("mouseover", this.monitorMouseOver, this);
                    this.monitoringMouseOver = true;
                }
            }
        }

        this.fireEvent("mouseover", this, e);
    },

    // private
    onMouseOut : function (e) {
        if (!this.disabled && !this.pressed) {
            this.imgEl.dom.src = this.imageUrl;
        }
        
        this.fireEvent("mouseout", this, e);
    },

    onMouseDown : function (e) {
        if (!this.disabled && e.button === 0) {
            if (this.pressedImageUrl) {
                this.imgEl.dom.src = this.pressedImageUrl;
            }
            
            Ext.getDoc().on("mouseup", this.onMouseUp, this);
        }
    },
    
    // private
    onMouseUp : function (e) {
        if (e.button === 0) {
            this.imgEl.dom.src = (this.overImageUrl && this.monitoringMouseOver) ? this.overImageUrl : this.imageUrl;
            Ext.getDoc().un("mouseup", this.onMouseUp, this);
        }
    },
    
    setImageUrl : function (image) {
        this.imageUrl = image;
        
        if ((!this.disabled || Ext.isEmpty(this.disabledImageUrl, false)) && (!this.pressed || Ext.isEmpty(this.pressedImageUrl, false))) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setDisabledImageUrl : function (image) {
        this.disabledImageUrl = image;
        
        if (this.disabled) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setOverImageUrl : function (image) {
        this.overImageUrl = image;
        
        if ((!this.disabled || Ext.isEmpty(this.disabledImageUrl, false)) && this.monitoringMouseOver && (!this.pressed || Ext.isEmpty(this.pressedImageUrl, false))) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setPressedImageUrl : function (image) {
        this.pressedImageUrl = image;
        
        if ((!this.disabled || Ext.isEmpty(this.disabledImageUrl, false)) && this.pressed) {
            this.imgEl.dom.src = image;
        } else {
            new Image().src = image;
        }
    },
    
    setAlign : function (align) {
        this.align = align;
        
        if (this.rendered) {
            this.imgEl.dom.setAttribute("align", this.align);
        }
    },

    setAltText : function (altText) {
        this.altText = altText;
        
        if (this.rendered) {
            this.imgEl.dom.setAttribute("altText", this.altText);
        }
    }
});

Ext.reg("netimagebutton", Ext.net.ImageButton);

// @source core/buttons/LinkButton.js

Ext.net.LinkButton = Ext.extend(Ext.Button, {
    buttonSelector : "a:first",
    cls            : "",
    iconAlign      : "left",

    valueElement : function () {
        var textEl = document.createElement("a");
        
        textEl.style.verticalAlign = "middle";
        textEl.id = Ext.id();
        
        if (!Ext.isEmpty(this.cls, false)) {
            textEl.className = this.cls;
        }

        textEl.setAttribute("href", "#");

        if (this.disabled || this.pressed) {
            textEl.setAttribute("disabled", "1");
            textEl.removeAttribute("href");

            if (this.pressed && this.allowDepress !== false) {
                textEl.style.cursor = "pointer";
            }
        }

        if (this.tabIndex !== undefined) {
            textEl.tabIndex = this.tabIndex;
        }
        
        if (this.tooltip) {
            if (typeof this.tooltip === "object") {
                Ext.QuickTips.register(Ext.apply({
                    target : textEl.id
                }, this.tooltip));
            } else {
                textEl[this.tooltipType] = this.tooltip;
            }
        }

        textEl.innerHTML = this.text;
        
        var txt = Ext.get(textEl);

        if (this.menu) {
            this.menu.on("show", this.onMenuShow, this);
            this.menu.on("hide", this.onMenuHide, this);
        }

        if (this.repeat) {
            var repeater = new Ext.util.ClickRepeater(txt, typeof this.repeat === "object" ? this.repeat : {});
            repeater.on("click", this.onClick, this);
        }

        txt.on(this.clickEvent, this.onClick, this);

        this.textEl = textEl;
        return this.textEl;
    },

    // private
    onMenuShow : function (e) {
        this.ignoreNextClick = 0;
        this.fireEvent("menushow", this, this.menu);
    },
    
    // private
    onMenuHide : function (e) {
        this.ignoreNextClick = this.restoreClick.defer(250, this);
        this.fireEvent("menuhide", this, this.menu);
    },

    toggle : function (state) {
        state = state === undefined ? !this.pressed : state;
        if (state !== this.pressed) {
            if (state) {
                this.setDisabled(true);
                this.disabled = false;
                this.pressed = true;
                
                if (this.allowDepress !== false) {
                    this.textEl.style.cursor = "pointer";
                    this.el.dom.style.cursor = "pointer";
                }
                this.fireEvent("toggle", this, true);
            } else {
                this.setDisabled(false);
                this.pressed = false;
                this.fireEvent("toggle", this, false);
            }
            
            if (this.toggleHandler) {
                this.toggleHandler.call(this.scope || this, this, state);
            }
        }
    },

    onRender : function (ct, position) {
        if (!this.el) {
            var el = document.createElement("span");
            el.id = this.getId();

            var img = document.createElement("img");
            img.src = Ext.BLANK_IMAGE_URL;
            img.className = "x-label-icon " + (this.iconCls || "");

            if (Ext.isEmpty(this.iconCls)) {
                img.style.display = "none";
            }

            if (this.iconAlign === "left") {
                el.appendChild(img);
            }

            el.appendChild(this.valueElement());

            if (this.iconAlign === "right") {
                el.appendChild(img);
            }

            this.el = el;
            Ext.BoxComponent.superclass.onRender.call(this, ct, position);
        }

        if (this.pressed && this.allowDepress !== false) {
            this.setDisabled(true);
            this.disabled = false;
            this.el.dom.style.cursor = "pointer";
        }
        
        this.setNavigateUrl();

        Ext.ButtonToggleMgr.register(this);
    },
    
    setText : function (t, encode) {
        this.text = t;
        
        if (this.rendered) {
            this.textEl.innerHTML = encode !== false ? Ext.util.Format.htmlEncode(t) : t;
        }
        
        return this;
    },
    
    setIconClass : function (cls) {
        var oldCls = this.iconCls;
        
        this.iconCls = cls;
        
        if (this.rendered) {
            var img = this.el.child("img.x-label-icon");
            img.replaceClass(oldCls, this.iconCls);
            img.dom.style.display = (cls === "") ? "none" : "inline";
        }
    },

    onDisable : function () {
        Ext.net.LinkButton.superclass.onDisable.apply(this);
        this.textEl.setAttribute("disabled", "1");
        this.textEl.removeAttribute("href");
    },
    
    onEnable : function () {
        Ext.net.LinkButton.superclass.onEnable.apply(this);
        this.textEl.removeAttribute("disabled");
        this.textEl.setAttribute("href", "#");
    }
});

Ext.reg("netlinkbutton", Ext.net.LinkButton);

// @source core/buttons/SplitButton.js

Ext.override(Ext.SplitButton, {
    isClickOnArrow : function (e) {
	    if (this.arrowAlign !== "bottom") {
	        var visBtn = this.el.child("em.x-btn-split");

	        if (!visBtn) {
	            return false;
	        }
	        
            return e.getPageX() > (visBtn.getRegion().right - visBtn.getPadding("r"));
	    } else {
	        return e.getPageY() > this.btnEl.getRegion().bottom;
	    }
    },
    
    showMenuArrow : function () {
        var el = this.el.child("em.x-btn-split" + (this.arrowAlign === "bottom" ? "-bottom" : ""));

        if (!Ext.isEmpty(el)) {
            el.removeClass("x-btn-no-arrow");
        }
    },
    
    hideMenuArrow : function () {
        var el = this.el.child("em.x-btn-split" + (this.arrowAlign === "bottom" ? "-bottom" : ""));
        
		if (!Ext.isEmpty(el)) {
            el.addClass("x-btn-no-arrow");
        }
    }
});

// @source core/form/Field.js

Ext.form.Field.override({
    hideWithLabel      : true,
    dataIndexAsName    : true,    
    isRemoteValidation : false,
    remoteValidatingMessage : "Validating...",
    
    
    
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

// @source core/form/FormPanel.js

Ext.form.FormPanel.override({
    initComponent : function () {
        this.form = this.createForm();

        this.bodyCfg = {
            tag    : "form",
            cls    : this.baseCls + "-body",
            method : this.method || "POST",
            id     : this.formId || Ext.id()
        };
        
        if (this.fileUpload) {
            this.bodyCfg.enctype = "multipart/form-data";
        }

        if (this.renderFormElement === false) {
            this.bodyCfg.tag = "div";
        }

        Ext.FormPanel.superclass.initComponent.call(this);

        this.initItems();

        this.addEvents(
            
            "clientvalidation"
        );

        this.relayEvents(this.form, ["beforeaction", "actionfailed", "actioncomplete"]);
    },
    
    createElement : function (name, pnode) {
        if ((name === "body" || this.elements.indexOf(name) !== -1) && this[name + "Cfg"]) {
            if (this[name + "Cfg"].tag === "form" && Ext.fly(pnode).up("form")) {
                this[name + "Cfg"].tag = "div";
            }
        }
        
        Ext.FormPanel.superclass.createElement.apply(this, arguments);
    },
    
    /// TODO: override default functionality to check if each item 
    /// has a .isValid function before calling. 
    bindHandler : function () {
        var valid = true;

        this.form.items.each(function (f) {
             /// TODO: OLD 
            //if (!f.isValid(true)) {
            
            /// TODO: NEW
            if (f.isValid && !f.isValid(true)) {
                valid = false;
                return false;
            }
        });

        if (this.fbar) {
            var fitems = this.fbar.items.items,
                i = 0,
                len;
            
            for (i, len = fitems.length; i < len; i++) {
                var btn = fitems[i];

                if (btn.formBind === true && btn.disabled === valid) {
                    btn.setDisabled(!valid);
                }
            }
        }

        this.fireEvent("clientvalidation", this, valid);
    },
    
    isValid : function () {
        return this.getForm().isValid();
    },
    
    validate : function () {
        return this.getForm().isValid();
    },
    
    isDirty : function () {
        return this.getForm().isDirty();
    },
    
    getName : function () {
        return this.id || '';
    },
    
    clearInvalid : function () {
        return this.getForm().clearInvalid();
    },
    
    markInvalid : function (msg) {
        return this.getForm().markInvalid(msg);
    },
    
    getValue : function () {
        return this.getForm().getValues();
    },
    
    setValue : function (value) {
        return this.getForm().setValues(value);
    },
    
    reset : function () {
        return this.getForm().reset();
    }
});

// @source core/form/TriggerField.js

Ext.form.TriggerField.override({
    standardTrigger : true,

    checkTab : function (e, me) {
        if (!e.getKey) {
            var t = e;
            e = me;
            me = t;
        }

        if (e.getKey() === e.TAB && !this.inEditor) {
            this.triggerBlur();
        }
    },

    getTriggerWidth : function () {
        var tw = this.trigger.getWidth(),
            noTrigger = true;

        if (tw < 1) {
            tw = 0;

            Ext.each(this.triggers, function (t) {
                if (t.dom.style.display !== "none") {
                    noTrigger = false;
                    tw += this.defaultTriggerWidth;
                }
            }, this);

            if (this.trigger && noTrigger) {
                if (this.trigger.dom.style.display !== "none") {
                    noTrigger = false;
                    tw += this.defaultTriggerWidth;
                }
            }

            if (noTrigger) {
                return 0;
            }
        }

        return tw;
    },

    getNoteWidthAjustment : function () {
        return this.getTriggerWidth();
    },

    initComponent : function () {
        Ext.form.TriggerField.superclass.initComponent.call(this);

        this.addEvents("triggerclick");

        if (this.triggersConfig) {

            var cn = [], triggerCfg, 
                isSimple,
                i = 0;

            for (i; i < this.triggersConfig.length; i++) {
                var trigger = this.triggersConfig[i],
                    triggerIcon = trigger.iconCls || this.triggerClass;  

                triggerCfg = {
                    "ext:tid": trigger.tag || "",
                    tag: "img",
                    "ext:qtip": trigger.qtip || "",
                    src: Ext.BLANK_IMAGE_URL,
                    cls: "x-form-trigger" + (trigger.triggerCls || "") + " " + triggerIcon
                };

                if (Ext.net.StringUtils.startsWith(triggerIcon || "", "x-form-simple")) {
                    if (i !== 0 || this.shiftLastSimpleIcon) {
                        triggerCfg.cls += " shift-trigger";
                    }

                    isSimple = true;
                }

                if (trigger.hideTrigger) {
                    Ext.apply(triggerCfg, { style: "display:none", hidden: true });

                }

                cn.push(triggerCfg);
            }

            if (this.standardTrigger) {
                triggerCfg = {
                    tag: "img",
                    src: Ext.BLANK_IMAGE_URL,
                    cls: "x-form-trigger"
                };

                if (!Ext.isEmpty(this.triggerClass, false)) {
                    triggerCfg.cls += " " + this.triggerClass;
                }

                if (Ext.net.StringUtils.startsWith(this.triggerClass || "", "x-form-simple")) {
                    triggerCfg.cls += " shift-trigger";
                    isSimple = true;
                }

                if (this.hideTrigger) {
                    Ext.apply(triggerCfg, { style: "display:none", hidden: true });
                    this.hideTrigger = false;
                }

                if (this.firstBaseTrigger) {
                    cn.splice(0, 0, triggerCfg);
                } else {
                    cn.push(triggerCfg);
                }
            }

            if (isSimple) {
                this.addClass("clear-right");
            }

            this.triggerConfig = {
                tag: "span",
                cls: "x-form-twin-triggers",
                cn: cn
            };
        }

        if (Ext.isEmpty(this.triggersConfig) && Ext.net.StringUtils.startsWith(this.triggerClass || "", "x-form-simple")) {
            this.addClass("clear-right");
        }
    },

    getTrigger : function (index) {
        return this.triggers[index];
    },

    initTrigger : function () {
        if (!this.triggersConfig) {
            this.mon(this.trigger, "click", this.onTriggerClick, this, { preventDefault: true });
            this.trigger.addClassOnOver("x-form-trigger-over");
            this.trigger.addClassOnClick("x-form-trigger-click");

            return;
        }

        var ts = this.trigger.select(".x-form-trigger", true), triggerField = this;

        this.wrap.setStyle("overflow", "hidden");

        ts.each(function (t, all, index, length) {
            t.hide = function () {
                var w = triggerField.wrap.getWidth();

                if (w === 0) {
                    w = triggerField.wrap.getStyleSize().width;
                }

                this.hidden = true;
                this.dom.style.display = "none";
                triggerField.el.setWidth(w - triggerField.getTriggerWidth());
            };

            t.show = function () {
                var w = triggerField.wrap.getWidth();

                if (w === 0) {
                    w = triggerField.wrap.getStyleSize().width || 0;
                }

                this.dom.style.display = "";
                this.dom.removeAttribute("hidden");
                this.hidden = false;
                triggerField.el.setWidth(w - triggerField.getTriggerWidth());
            };

            if ((this.firstBaseTrigger && index === 0) || (!this.firstBaseTrigger && index === (all.getCount() - 1))) {
                t.on("click", this.onTriggerClick, this);
            } else {
                t.on("click", this.onCustomTriggerClick, this, {
                    index   : index,
                    t       : t,
                    tag     : t.getAttributeNS("ext", "tid"),
                    preventDefault : true
                });
            }

            t.addClassOnOver("x-form-trigger-over");
            t.addClassOnClick("x-form-trigger-click");
        }, this);

        this.triggers = ts.elements;
    },

    onCustomTriggerClick : function (evt, el, o) {
        if (!this.disabled) {
            this.fireEvent("triggerclick", this, o.t, o.index, o.tag, evt);
        }
    },

    initDefaultWidth : function () {
        if (!this.width) {
            var w = this.el.getWidth(),
                tw = this.getTriggerWidth();

            if (w < 1) {
                w = 90 - tw;
                this.el.setWidth(w);
            }

            this.wrap.setWidth(w + tw);
        }
    },

    onRender : function (ct, position) {
        this.doc = Ext.isIE ? Ext.getBody() : Ext.getDoc();
        Ext.form.TriggerField.superclass.onRender.call(this, ct, position);

        this.wrap = this.el.wrap({
            cls: "x-form-field-wrap x-form-field-trigger-wrap"
        });

        this.trigger = this.wrap.createChild(this.triggerConfig || {
            tag: "img",
            src: Ext.BLANK_IMAGE_URL,
            cls: "x-form-trigger " + this.triggerClass
        });

        this.initTrigger();
        this.initDefaultWidth();

        this.resizeEl = this.positionEl = this.wrap;
        
        
        if (this.trigger && this.trigger.setStyle && Ext.isWebKit && this.note) {
            this.trigger.setStyle("position", "inherit");
            this.trigger.setStyle.defer(10, this.trigger, ["position", "absolute"]);
        }
    },

    removeTriggersWidth : function (w) {
        if (!Ext.isNumber(w) || w === 0) {
            return;
        }

        var tw = this.getTriggerWidth();

        if (Ext.isNumber(w)) {
            this.el.setWidth(w - tw);
        }

        this.wrap.setWidth((this.el.getWidth() || (w - tw)) + tw);
    },

    onResize : function (w, h) {
        Ext.form.TriggerField.superclass.onResize.call(this, w, h);
        this.removeTriggersWidth(w);
    },

    autoSize : function () {
        if (!this.grow || !this.rendered) {
            return;
        }

        if (!this.metrics) {
            this.metrics = Ext.util.TextMetrics.createInstance(this.el);
        }

        var el = this.el,
            v = el.dom.value,
            d = document.createElement("div");

        d.appendChild(document.createTextNode(v));
        v = d.innerHTML;
        Ext.removeNode(d);
        d = null;
        v += "&#160;";

        var w = Math.min(this.growMax, Math.max(this.metrics.getWidth(v) + 10, this.growMin)),
            tw = this.getTriggerWidth();

        this.el.setWidth(w);
        this.wrap.setWidth(w + tw);
        this.fireEvent("autosize", this, w + tw);
    }
});

// @source core/form/Checkbox.js

Ext.form.Checkbox.prototype.onRender = Ext.form.Checkbox.prototype.onRender.createSequence(function (ct, position) {
    if (!Ext.isEmpty(this.cls)) {
        this.wrap.addClass(this.cls);
    }
    
    if (!this.checked && (this.value === true || this.value === "true")) {
        this.setValue(true);
    }
    
    this.labelEl = this.wrap.child(".x-form-cb-label");
    this.applyBoxLabelCss();
});

Ext.form.Checkbox.prototype.initComponent = Ext.form.Checkbox.prototype.initComponent.createInterceptor(function () {
    if (this.value) {
        this.checked = this.value;
    }
});

Ext.form.Checkbox.override({
    applyBoxLabelCss : function () {
        if (this.boxLabelCls) {
            this.setBoxLabelCls(this.boxLabelCls);
        }
        
        if (this.boxLabelStyle) {
            this.setBoxLabelStyle(this.boxLabelStyle);
        }
    },
    
    setBoxLabelStyle : function (style) {
        this.boxLabelStyle = style;

        if (this.labelEl) {
            this.labelEl.applyStyles(style);
        }
    },
    
    setBoxLabelCls : function (cls) {
        if (this.labeEl && this.boxLabelCls) {
            this.labelEl.removeClass(this.boxLabelCls);
        }
        
        this.boxLabelCls = cls;
        
        if (this.labelEl) {
            this.labelEl.addClass(this.boxLabelCls);
        }
    },
    
    setBoxLabel : function (label) {
        this.boxLabel = label;        
        
        if (this.rendered) {
            if (this.labelEl) {
                this.labelEl.update(label);
            } else {            
                this.labelEl = this.wrap.createChild({
                    tag     : "label",
                    htmlFor : this.el.id,
                    cls     : "x-form-cb-label",
                    html    : this.boxLabel
                });

                this.applyBoxLabelCss();
            }
        }
    },
    
    setValue : function (v) {
        var checked = this.checked,
            inputVal = this.inputValue;
            
        this.checked = (v === true || v === "true" || v === "1" || v === 1 || (inputVal ? v === inputVal : String(v).toLowerCase() === "on"));
        
		if (this.rendered) {
            this.el.dom.checked = this.checked;
            this.el.dom.defaultChecked = this.checked;
        }

        if (checked !== this.checked) {
            this.fireEvent("check", this, this.checked);

            if (this.handler) {
                this.handler.call(this.scope || this, this, this.checked);
            }
        }
        return this;
    }
});

// @source core/form/CheckboxGroup.js

Ext.form.CheckboxGroup.prototype.onRender = Ext.form.CheckboxGroup.prototype.onRender.createSequence(function (ct, position) {
    if (this.fireChangeOnLoad) {
        var checked = false;
        this.eachItem(function (item) {
            if (item.checked) {
                checked = true;
                return false;
            }
        });
        if (checked) {
            this.fireChecked();
        }
    }
});

Ext.form.CheckboxGroup.override({
    getBox : function (id) {
        var box = null;
        
        this.eachItem(function (f) {
            if (id === f || f.dataIndex === id || f.tag === id || f.id === id || f.getName() === id) {
                box = f;
                return false;
            }
        });
        
        return box;
    }
});

// @source core/form/ComboBox.js

Ext.form.ComboBox.prototype.initComponent = Ext.form.ComboBox.prototype.initComponent.createSequence(function () {
    this.initMerge();
    
    if (!Ext.isEmpty(this.initSelectedIndex) && this.store) {
        this.setInitValueByIndex(this.initSelectedIndex);
    } else if (!Ext.isEmpty(this.value) && this.store) {
        this.setInitValue(this.value);
    }   
});

Ext.form.ComboBox.prototype.onRender = Ext.form.ComboBox.prototype.onRender.createSequence(function (el) {
    if (this.submitValue !== false) {
        this.getEl().dom.setAttribute("name", this.uniqueName || this.id);
        this.getSelectionField().render(this.el.parent() || this.el);
    }
    
    this.on("focus", function (el) {
        this.oldValue = this.getValue();        
        var t = this.getEl().dom.value ? this.getEl().dom.value.trim() : "";        
        this.oldText = (t === this.emptyText) ? "" : t;
    });
});

Ext.form.ComboBox.prototype.initEvents = Ext.form.ComboBox.prototype.initEvents.createSequence(function () {
    this.keyNav.tab = function () {
        if (this.isExpanded() || this.inEditor) {
            this.onViewClick(false); 
        }
    };
});

Ext.form.ComboBox.prototype.clearValue = Ext.form.ComboBox.prototype.clearValue.createSequence(function () {
    this.oldValue = null;   
    this.oldText = null;
});

Ext.form.ComboBox.prototype.setValue = Ext.form.ComboBox.prototype.setValue.createSequence(function () {
    this.getSelectionField().setValue(this.getSelectedIndex());
});

Ext.form.ComboBox.override({
    alwaysMergeItems : true,
    forceSelection   : true,
    
    checkTab : function (e, me) {
        if (!e.getKey) {
            var t = e;
            e = me;
            me = t;
        }
        
        if (e.getKey() === e.TAB) {
            
            if (this.isExpanded()) {
                this.onViewClick(false); 
            }
            
            if (!this.inEditor) {
                this.triggerBlur();
            }
        }
    },

    initMerge : function () {
        if (this.mergeItems) {
            if (this.store.getCount() > 0) {
                this.doMerge();
            }

            if (this.store.getCount() === 0 || this.alwaysMergeItems) {
                this.store.on("load", this.doMerge, this, { single : !this.alwaysMergeItems });
            }
        }
    },

    doMerge : function () {
        var mi;

        for (mi = this.mergeItems.getCount() - 1; mi > -1; mi--) {
            var f = this.store.recordType.prototype.fields, 
                dv = [],
                i = 0;
            
            for (i; i < f.length; i++) {
                dv[f.items[i].name] = f.items[i].defaultValue;
            }
            
            if (!Ext.isEmpty(this.displayField, false)) {
                dv[this.displayField] = this.mergeItems.getAt(mi).data.text;
            }
            
            if (!Ext.isEmpty(this.valueField, false) && this.displayField !== this.valueField) {
                dv[this.valueField] = this.mergeItems.getAt(mi).data.value;
            }
            
            this.store.insert(0, new this.store.recordType(dv));
        }
    },

    addRecord : function (values) {
        var rowIndex = this.store.data.length,
            record = this.insertRecord(rowIndex, values);
            
        return { index : rowIndex, record : record };
    },

    addItem : function (text, value) {
        var rowIndex = this.store.data.length,
            record = this.insertItem(rowIndex, text, value);
            
        return { index : rowIndex, record : record };
    },

    insertRecord : function (rowIndex, values) {
        this.store.clearFilter(true);
        values = values || {};
        
        var f = this.store.recordType.prototype.fields, 
            dv = {},
            i = 0;
        
        for (i; i < f.length; i++) {
            dv[f.items[i].name] = f.items[i].defaultValue;
        }
        
        var record = new this.store.recordType(dv, values[this.store.metaId()]),
            v;
        
        this.store.insert(rowIndex, record);        
        
        for (v in values) {
            record.set(v, values[v]);
        }
        
        if (!Ext.isEmpty(this.store.metaId())) {
            record.set(this.store.metaId(), record.id);
        }

        return record;
    },

    insertItem : function (rowIndex, text, value) {
        var f = this.store.recordType.prototype.fields, 
            dv = {},
            i = 0;
        
        for (i; i < f.length; i++) {
            dv[f.items[i].name] = f.items[i].defaultValue;
        }

        if (!Ext.isEmpty(this.displayField, false)) {
            dv[this.displayField] = text;
        }

        if (!Ext.isEmpty(this.valueField, false) && this.displayField !== this.valueField) {
            dv[this.valueField] = value;
        }

        var record = new this.store.recordType(dv);
        
        this.store.insert(rowIndex, record);

        return record;
    },

    removeByField : function (field, value) {
        var index = this.store.find(field, value);
        
        if (index < 0) {
            return;
        }
        
        this.store.remove(this.store.getAt(index));
    },

    removeByIndex : function (index) {
        if (index < 0 || index >= this.store.getCount()) {
            return;
        }
        
        this.store.remove(this.store.getAt(index));
    },

    removeByValue : function (value) {
        this.removeByField(this.valueField, value);
    },

    removeByText : function (text) {
        this.removeByField(this.displayField, text);
    },

    getSelectionField : function () {
        if (!this.selectedIndexField) {
            this.selectedIndexField = new Ext.form.Hidden({ id : this.id + "_SelIndex", name : this.id + "_SelIndex" });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.selectedIndexField);
        }
        
        return this.selectedIndexField;
    },

    getText : function () {
        return this.el.getValue();
    },
    
    getSelectedItem : function () {
        return { text : this.getText(), value : this.getValue() };
    },
    
    initSelect : false,
    
    setValueAndFireSelect : function (v) {
        this.setValue(v);

        var r = this.findRecord(this.valueField, v);

        if (!Ext.isEmpty(r)) {
            var index = this.store.indexOf(r);

            this.getSelectionField().setValue(this.getSelectedIndex());

            this.initSelect = true;
            this.fireEvent("select", this, r, index);
            this.initSelect = false;
        }
    },
    
    findRecordByText : function (prop, text) {
        var record;
        
        if (this.store.getCount() > 0) {
            this.store.each(function (r) {
                // do not replace == by ===
                if (r.data[prop] == text) {
                    record = r;
                    return false;
                }
            });
        }
        return record;
    },
    
    origFindRecord : Ext.form.ComboBox.prototype.findRecord,
    
    findRecord : function (prop, value) {
        if (this.store.snapshot && this.store.snapshot.getCount() > 0) {
            var record;
            
            if (this.store.snapshot.getCount() > 0) {
                this.store.snapshot.each(function (r) {
                    // do not replace == by ===
                    if (r.data[prop] == value) {
                        record = r;
                        return false;
                    }
                });
            }

            return record;
        }

        return this.origFindRecord(prop, value);
    },
    
    indexOfEx : function (record) {
        if (this.store.snapshot && this.store.snapshot.getCount() > 0) {
            return this.store.snapshot.indexOf(record);
        }

        return this.store.data.indexOf(record);
    },
    
    getSelectedIndex : function () {
        var r = this.findRecord(this.forceSelection ? this.valueField : this.displayField, this.getValue());
        
        return (!Ext.isEmpty(r)) ? this.indexOfEx(r) : -1;
    },
    
    onSelect : function (record, index) {
        if (this.fireEvent("beforeselect", this, record, index) !== false) {
            this.setValue(record.data[this.valueField || this.displayField]);
            this.collapse();

            this.getSelectionField().setValue(this.getSelectedIndex());

            this.fireEvent("select", this, record, index);

            this.oldValue = this.getValue();
            var t = this.getEl().dom.value ? this.getEl().dom.value.trim() : "";
            this.oldText = (t === this.emptyText) ? "" : t;
        }
    },

    setInitValue : function (value) {
        if (this.store.getCount() > 0) {
            this.setLoadedValue(value);
        } else {
            this.setValue(value);
            this.store.on("load", this.setLoadedValue.createDelegate(this, [value]), this, { single : true });
        }
    },

    setLoadedValue : function (value) {
        this[this.fireSelectOnLoad ? "setValueAndFireSelect" : "setValue"](value);
        this.clearInvalid();
    },
    
    checkOnBlur : function () {
        var t = this.getEl().dom.value ? this.getEl().dom.value.trim() : "", v = this.getValue();

        if (this.oldValue !== v || (t !== this.oldText && t !== this.emptyText)) {
            if (!Ext.isEmpty(this.selValue) && this.selText !== t && this.selValue === this.getValue()) {
                this.hiddenField.value = "";
            }

            var val = this.el.dom.value,
                r = this.findRecordByText(this.displayField, val);

            if (!Ext.isEmpty(r)) {
                this.onSelect(r, this.store.indexOf(r), false, true);
            } else {
                if (this.forceSelection) {
                    if (Ext.isEmpty(this.findRecord(this.valueField, this.oldValue))) {
                        this.clearValue();
                    } else {
                        this.setValue(this.oldValue);
                    }
                } else {
                    this.setValue(val);
                }
            }

            this.getSelectionField().setValue(this.getSelectedIndex());
        }
    },

    triggerBlur : function () {
        this.mimicing = false;
        //Ext.getDoc().un("mousewheel", this.mimicBlur, this);
        Ext.getDoc().un("mousedown", this.mimicBlur, this);
        
        if (this.monitorTab && this.el) {
            this.el.un("keydown", this.checkTab, this);
        }
        
        this.checkOnBlur();

        Ext.form.TriggerField.superclass.onBlur.call(this);
		
		if (this.wrap) {
            this.wrap.removeClass(this.wrapFocusClass);
        }
    },

    onFocus : function () {
        Ext.form.TriggerField.superclass.onFocus.call(this);
        
        if (!this.mimicing) {
            this.wrap.addClass(this.wrapFocusClass);
            this.mimicing = true;
            //Ext.getDoc().on("mousewheel", this.mimicBlur, this, { delay: 10 });
            Ext.getDoc().on("mousedown", this.mimicBlur, this, { delay: 10 });

            if (this.monitorTab) {
                this.el.on("keydown", this.checkTab, this);
            }
        }
    },
    
    selectByIndex : function (index, fireSelect) {
        if (index >= 0) {
            this[this.fireSelect ? "setValueAndFireSelect" : "setValue"](this.store.getAt(index).get(this.valueField || this.displayField));
        }
    },
    
    setInitValueByIndex : function (index) {
        if (this.store.getCount() > 0) {
            this.setLoadedIndex(index);
        } else {
            this.store.on("load", this.setLoadedIndex.createDelegate(this, [index]), this, { single : true });
        }
    },

    setLoadedIndex : function (index) {
        this.selectByIndex(index, this.fireSelectOnLoad);
        this.clearInvalid();
    },
    
    onLoad : Ext.form.ComboBox.prototype.onLoad.createInterceptor(function () {
        if (this.mode === "single") {
            this.mode = "local";
        }
    }),
    
    initList : Ext.form.ComboBox.prototype.initList.createSequence(function () {
        if (this.mode === "single" && this.store.isLoaded) {
            this.mode = "local";
        }
    }),
    
    doForce : Ext.emptyFn
});

// @source core/form/DateField.js

Date.prototype.extadd = Date.prototype.add;


Ext.DatePicker.prototype.initComponent = Ext.DatePicker.prototype.initComponent.createInterceptor(function () {
    if (!this.msadd) {
        Date.prototype.msadd = Date.prototype.add;
        
        Date.prototype.add = function () {
            return this[typeof arguments[0] === "string" ? "extadd" : "msadd"].apply(this, arguments);
        };
    }
});

Ext.form.DateField.override({
    setDisabledDates : function (dd) {
        this.disabledDates = dd;
        this.disabledDatesRE = null;
        this.initDisabledDays();
        if (this.menu) {
            this.menu.picker.setDisabledDates(this.disabledDatesRE);
        }
    },
    
    onTriggerClick : function () {
        if (this.disabled) {
            return;
        }
        
        if (Ext.isEmpty(this.menu)) {
            this.menu = new Ext.menu.DateMenu({
                hideOnClick   : false,
                focusOnSelect : false 
            });
        }
        this.onFocus();

        Ext.apply(this.menu.picker, {
            minDate           : this.minValue,
            maxDate           : this.maxValue,
            disabledDatesRE   : this.disabledDatesRE,
            disabledDatesText : this.disabledDatesText,
            disabledDays      : this.disabledDays,
            disabledDaysText  : this.disabledDaysText,
            format            : this.format,
            showToday         : this.showToday,
            minText           : String.format(this.minText, this.formatDate(this.minValue)),
            maxText           : String.format(this.maxText, this.formatDate(this.maxValue))
        });

        if (this.cancelText) {
            Ext.apply(this.menu.picker, { cancelText : this.cancelText });
        }
        
        if (this.dayNames) {
            Ext.apply(this.menu.picker, { dayNames : this.dayNames });
        }
        
        if (this.monthNames) {
            Ext.apply(this.menu.picker, { monthNames : this.monthNames });
        }
        
        if (this.monthYearText) {
            Ext.apply(this.menu.picker, { monthYearText : this.monthYearText });
        }
        
        if (this.nextText) {
            Ext.apply(this.menu.picker, { nextText : this.nextText });
        }
        
        if (this.okText) {
            Ext.apply(this.menu.picker, { okText : this.okText });
        }
        
        if (this.prevText) {
            Ext.apply(this.menu.picker, { prevText : this.prevText });
        }
        
        if (this.startDay) {
            Ext.apply(this.menu.picker, { startDay : this.startDay });
        }
        
        if (this.todayText) {
            Ext.apply(this.menu.picker, { todayText : this.todayText });
        }
        
        if (this.todayTip) {
            Ext.apply(this.menu.picker, { todayTip : this.todayTip });
        }

        this.menu.on(Ext.apply({}, this.menuListeners, {
            scope : this
        }));
        
        this.menu.picker.setValue(this.getValue() || new Date());
        this.menu.show(this.el, "tl-bl?");
        this.menuEvents("on");
    }
});

// @source core/form/FileUploadField.js

Ext.form.FileUploadField = Ext.extend(Ext.form.TextField, {
    buttonText   : "Browse...",
    buttonOnly   : false,
    buttonOffset : 3,
    // private
    readOnly     : true,
    autoSize     : Ext.emptyFn,
    actionMode   : "wrap",
    
    // private
    initComponent : function () {
        Ext.form.FileUploadField.superclass.initComponent.call(this);

        this.addEvents("fileselected");
    },
    
    isIconIgnore : function () {
        return true;
    },
    
    syncSize : function () {
        Ext.form.FileUploadField.superclass.syncSize.apply(this, arguments);
        this.fileInput.setWidth(this.button.getEl().getWidth() + (Ext.isIE ? 4 : 0));
    },

    // private
    onRender : function (ct, position) {
        Ext.form.FileUploadField.superclass.onRender.call(this, ct, position);

        this.wrap = this.el.wrap({ 
            cls   : "x-form-field-wrap x-form-file-wrap", 
            style : "overflow:hidden;" + (Ext.isIE ? "height:22px;" : "") 
        });
        
        this.el.addClass("x-form-file-text");
        this.el.dom.removeAttribute("name");

        this.createFileInput();

        var btnCfg = Ext.applyIf(this.buttonCfg || {}, {
            text     : this.buttonText,
            disabled : this.disabled,
            iconCls  : this.iconCls
        });
        
        this.button = new Ext.Button(Ext.apply(btnCfg, {
            renderTo : this.wrap,
            cls      : "x-form-file-btn" + (btnCfg.iconCls ? (btnCfg.text ? " x-btn-text-icon" : " x-btn-icon") : "")
        }));
        
        var fiWidth = this.button.getEl().getWidth() + (Ext.isIE ? 4 : 0);
        
        if (fiWidth > (Ext.isIE ? 4 : 0)) {
            this.fileInput.setWidth(fiWidth);
        }

        if (this.buttonOnly) {
            this.el.setVisibilityMode(Ext.Element.DISPLAY);
            this.el.hide();
            
            this.wrap.setWidth(this.button.getEl().getWidth());            
        }
		
        this.bindListeners();
        this.resizeEl = this.positionEl = this.wrap;
    },
	
	bindListeners: function () {
        this.fileInput.on({
            scope      : this,
            mouseenter : function () {
                this.button.addClass([ "x-btn-over", "x-btn-focus" ]);
            },
            mouseleave : function () {
                this.button.removeClass([ "x-btn-over", "x-btn-focus", "x-btn-click" ]);
            },
            mousedown  : function () {
                this.button.addClass("x-btn-click");
            },
            mouseup    : function () {
                this.button.removeClass([ "x-btn-over", "x-btn-focus", "x-btn-click" ]);
            },
            change     : function () {
                var v = this.fileInput.dom.value,                
                    fileNameRegex = /[^\\]*$/im,
                    match = fileNameRegex.exec(v);
                    
                if (match !== null) {
	                v = match[0];
                }
                
                this.setValue(v);
                this.fireEvent("fileselected", this, v);    
            }
        }); 
    },

    createFileInput : function () {
        if (this.fileInput) {
            this.fileInput.remove();
        }

        this.fileInput = this.wrap.createChild({
            id    : this.getFileInputId(),
            name  : this.name || this.getFileInputId(),
            cls   : "x-form-file",
            tag   : "input",
            type  : "file",
            size  : 1
        });
        
        if (this.buttonOnly && this.button) {
            var fiWidth = this.button.getEl().getWidth() + (Ext.isIE ? 4 : 0);
            if (fiWidth > (Ext.isIE ? 4 : 0)) {
                this.fileInput.setWidth(fiWidth);
            }
        }
        
        if (this.disabled) {
            this.fileInput.dom.disabled = true;
        }
    },

    // private
    getFileInputId : function () {
        return this.id + "-file";
    },

    // private
    onResize : function (w, h) {
        Ext.form.FileUploadField.superclass.onResize.call(this, w, h);

        this.wrap.setWidth(w);        

        if (!this.buttonOnly) {
            w = this.wrap.getWidth() - this.button.getEl().getWidth() - this.buttonOffset;
            
            if (w > 0) {
                this.el.setWidth(w);
            }
        }
    },

    // private
    onDestroy: function () {
        Ext.form.FileUploadField.superclass.onDestroy.call(this);
        Ext.destroy(this.fileInput, this.button, this.wrap);
    },

	onDisable: function () {
        Ext.form.FileUploadField.superclass.onDisable.call(this);
        this.doDisable(true);
    },
    
    onEnable: function () {
        Ext.form.FileUploadField.superclass.onEnable.call(this);
        this.doDisable(false);
    },
    
    // private
    doDisable: function (disabled) {
        this.fileInput.dom.disabled = disabled;
        this.button.setDisabled(disabled);
    },

    // private
    preFocus : Ext.emptyFn,

    // private
    alignErrorIcon : function () {
        this.errorIcon.alignTo(this.wrap, "tl-tr", [2, 0]);
    },

    reset : function () {
        this.createFileInput();
        this.bindListeners();
        Ext.form.FileUploadField.superclass.reset.call(this);
    }
});

Ext.reg("fileuploadfield", Ext.form.FileUploadField);

// @source core/form/Hidden.js

Ext.form.Hidden.override({
    setValue : function (v) {
        var temp = this.rendered ? this.el.dom.value : this.value;
        
        this.value = v;
        
        if (this.rendered) {
            this.el.dom.value = (v === null || v === undefined ? "" : v);
            this.validate();
        }
        
        // do not replace != by !==
        if (v != temp) {
            this.fireEvent("change");
        }
    }
});

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

// @source core/form/Label.js

Ext.form.Label.override({
    iconAlign   : "left",
    isFormField : true,

    // for correct FormPanel reset
    reset    : Ext.emptyFn,
    getName  : Ext.emptyFn,
    
    validate : function () {
        return true;
    },
    
    isValid  : function () {
        return true;
    },

    valueElement : function () {
        var textEl = document.createElement("span");
        
        textEl.className = "x-label-value";
        textEl.innerHTML = this.text ? Ext.util.Format.htmlEncode(this.text) : (this.html || "");
        this.textEl = Ext.get(textEl);
		this.textEl.setOverflow = Ext.emptyFn;
        
        if (this.editor) {
            if (Ext.isEmpty(this.editor.field)) {
                this.editor.field = {
                    xtype : "textfield"
                };
            }
            
            this.editor.target = textEl;
            this.editor = new Ext.Editor({}, this.editor);
        }

        return textEl;
    },

    onRender : function (ct, position) {
        if (!this.el) {
            this.el = document.createElement(this.forId ? "label" : "span");
            this.el.className = "x-label";
            this.el.id = this.getId();

            var img = document.createElement("img");
            img.src = Ext.BLANK_IMAGE_URL;
            img.className = "x-label-icon " + (this.iconCls || "");

            if (Ext.isEmpty(this.iconCls)) {
                img.style.display = "none";
            }

            if (this.iconAlign === "left") {
                this.el.appendChild(img);
            }

            this.el.appendChild(this.valueElement());

            if (this.iconAlign === "right") {
                this.el.appendChild(img);
            }

            if (this.forId) {
                this.el.setAttribute("for", this.forId);
            }

            if (ct.hasClass("x-form-element")) {
                ct.setStyle("padding-top", "3px");
            }
        }

        Ext.form.Label.superclass.onRender.call(this, ct, position);
    },
    
    getContentTarget : function () {
        return this.textEl;
    },
    
    getText : function (encode) {
        return this.rendered ? encode === true ? Ext.util.Format.htmlEncode(this.textEl.dom.innerHTML) : this.textEl.dom.innerHTML : this.text;
    },

    setText : function (t, encode) {
        this.text = t;
        
        if (this.rendered) {
            var x = encode !== false ? Ext.util.Format.htmlEncode(t) : t;
            this.textEl.dom.innerHTML = (Ext.isEmpty(t) && !Ext.isEmpty(this.emptyText)) ? this.emptyText : !Ext.isEmpty(this.format) ? String.format(this.format, x) : x;
        }
        
        return this;
    },

    setIconClass : function (cls) {
        var oldCls = this.iconCls;
        this.iconCls = cls;
        
        if (this.rendered) {
            var img = this.el.child("img.x-label-icon");
            img.replaceClass(oldCls, this.iconCls);
            img.dom.style.display = (cls === "") ? "none" : "inline";
        }
    } 
});

// @source core/form/MultiField.js

Ext.net.MultiField = Ext.extend(Ext.form.Field, {
    defaultAutoCreate : { 
        tag : "div"
    },
    
    initValue  : Ext.emptyFn,
    setValue   : Ext.emptyFn,
    getValue   : Ext.emptyFn,
    
    initComponent : function () {
        Ext.net.MultiField.superclass.initComponent.call(this);
        this.on("afterrender", function () {
            var h = 0, fh, i;
        
            if (this.fields.length > 0) {            
                for (i = 0; i < this.fields.length; i++) {                             
                    fh = (this.fields[i].positionEl || this.fields[i].getEl()).getHeight();
                    if (fh > h) {
                        h = fh;
                    }
                }
            }
            
            if (h !== 0) {
                this.setHeight(h);
            }
        }, this);
    },
    
    onRender : function (ct, position) {
        Ext.net.MultiField.superclass.onRender.call(this, ct, position);
        
        if (this.ownerCt) {
            this.ownerCt.bubble(function (c) {
                if (c.form) {
                    this.form = c.form;
                    return false;
                }
            }, this);
        }

        this.fields = this.fields || [];
        
        if (!Ext.isArray(this.fields)) {
            this.fields = [this.fields];
        }
        
        this.el.setStyle("border", "none");
        
        var h = 0, fh;
        
        if (this.fields.length > 0) {            
            var fields = [], 
                i;            
            
            for (i = 0; i < this.fields.length; i++) {
                var fieldCt = this.el.createChild({ cls : "x-field-multi" }),
                    field = new Ext.ComponentMgr.create(this.fields[i]);
                    
                if ((i + 1) === this.fields.length) {
                    fieldCt.setStyle("paddingRight", "0px");
                }

                field.render(fieldCt);
                fields.push(field);
                               
                if (this.form && field.isFormField) {
                    this.form.items.add(field);
                }
                
                fh = (field.positionEl || field.getEl()).getHeight();
                if (fh > h) {
                    h = fh;
                }
            }

            this.fields = fields;
        }
        
        if (h !== 0) {
            this.setHeight(h);
        }
    },
    
    onResize : function (w, h) {
        if (!Ext.isNumber(w) || w === 0) {
            return;
        }
        
        if (!this.rendered) {
            this.width = w;
            return;
        }
        
        if (this.fields && this.fields.length > 0) {
            var i,
                f,
                pw,
                aw,
                el,
                percentWidth = 0,
                sum = 0,
                ratio;   
            
            if (w < 1) {
                return;
            }
            
            pw = w;
            
            for (i = 0; i < this.fields.length; i++) {
                f = this.fields[i];
                
                if (!f.anchor) {
                    el = f.positionEl || f.getEl();
                    pw -= (el.getSize().width + el.getMargins("lr") + el.parent().getPadding("lr"));
                }
            }

            pw = pw < 0 ? 0 : pw;
            
            for (i = 0; i < this.fields.length; i++) {
                f = this.fields[i];
                
                if (f.anchor) {
                    if (f.anchor.indexOf("%") !== -1) {
                        aw = parseFloat(f.anchor.replace("%", ""));
                        ratio = aw * 0.01;
                        percentWidth += aw;
                    } else {
                        ratio = parseFloat(f.anchor);
                    }
                    
                    w = Math.floor(ratio * pw);
                    sum += w;
                    
                    if (percentWidth === 100 && i === (this.fields.length - 1)) {
                        w += (pw - sum);
                    }
                    
                    el = f.positionEl || f.getEl();
                    w = w - el.getMargins("lr") - el.parent().getPadding("lr");
                    f.setWidth(w);
                }
            }
        }
    },
    
    beforeDestroy : function () {
        Ext.Panel.superclass.beforeDestroy.call(this);
        
        var i = this.fields.length - 1;

        for (i; i >= 0; i--) {
            Ext.destroy(this.fields[i]);
        }
    },
    
    addClass : function (cls) {
        Ext.net.MultiField.superclass.addClass.call(this, cls);
        
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].addClass) {
                this.fields[i].addClass(cls);
            }
        }
    },
    
    removeClass : function (cls) {
        Ext.net.MultiField.superclass.removeClass.call(this, cls);
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].removeClass) {
                this.fields[i].removeClass(cls);
            }
        }
    },
    
    disable : function () {
        Ext.net.MultiField.superclass.disable.call(this);
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].disable) {
                this.fields[i].disable();
            }
        }
    },
    
    enable : function () {
        Ext.net.MultiField.superclass.enable.call(this);
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].enable) {
                this.fields[i].enable();
            }
        }
    },
    
    setDisabled : function (disabled) {
        Ext.net.MultiField.superclass.setDisabled.call(this, disabled);
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].setDisabled) {
                this.fields[i].setDisabled(disabled);
            }
        }
    },
    
    clearInvalid : function () {
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].clearInvalid) {
                this.fields[i].clearInvalid();
            }
        }
    },
    
    isDirty : function () {
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].isDirty && this.fields[i].isDirty()) {
                return true;
            }
        }
        
        return false;
    },
    
    isValid : function (preventMark) {
        var isValid = true;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].isValid && !this.fields[i].isValid(preventMark)) {
                isValid = false;
            }
        }
        
        return isValid;
    },
    
    markInvalid : function (msg) {
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].markInvalid) {
                this.fields[i].markInvalid(msg);
            }
        }
    },
    
    reset : function () {
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].reset) {
                this.fields[i].reset();
            }
        }
    },
    
    setReadOnly : function (readOnly) {
        var i;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].setReadOnly) {
                this.fields[i].setReadOnly(readOnly);
            }
        }
    },
    
    validate : function () {
        var isValid = true;
        
        for (i = 0; i < this.fields.length; i++) {
            if (this.fields[i].validate && !this.fields[i].validate()) {
                isValid = false;
            }
        }
        
        return isValid;
    }
});

Ext.reg("netmultifield", Ext.net.MultiField);

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

// @source core/form/TextField.js

Ext.form.TextField.prototype.initComponent = Ext.form.TextField.prototype.initComponent.createSequence(function () {
    this.addEvents("iconclick");
    this.setIconClass = this.setIconCls;
});

Ext.override(Ext.form.TextField, {
    truncate : true,

    afterRender : function () {
        Ext.form.TextField.superclass.afterRender.call(this);

        if (this.maxLength !== Number.MAX_VALUE && this.truncate === true) {
            this.setMaxLength(this.maxLength);
        }

        if (this.iconCls) {
            var iconCls = this.iconCls;
            delete this.iconCls;
            this.setIconCls(iconCls);
        }
    },
    
    setMaxLength : function (val) {
        this.el.dom.setAttribute("maxlength", val);
        this.maxLength = val;
    },
    
    isIconIgnore : function () {
        return !!this.el.up(".x-menu-list-item");
    },

    //private
    renderIconEl : function () {
        if (!this.wrap) {
            this.wrap = this.el.wrap();
            this.positionEl = this.wrap;
        }
        
        this.wrap.addClass("x-form-field-wrap");
        this.wrap.applyStyles({ position : "relative" });
        this.el.addClass("x-textfield-icon-input");

        this.icon = Ext.DomHelper.append(this.el.up("div.x-form-field-wrap") || this.wrap, {
            tag   : "div", 
            style : "position:absolute"
        }, true);
        
        if (this.initialConfig.width) {
            delete this.lastSize;
            this.setWidth(this.initialConfig.width);
        }        
        
        this.icon.on("click", function (e, t) {
            this.fireEvent("iconclick", this, e, t);
        }, this);
    },

    setIconCls : function (iconCls) {
        if (this.isIconIgnore()) {
            return;
        }
        
        if (!this.iconCls) {
            this.renderIconEl();
        }

        this.iconCls = iconCls;
        this.icon.dom.className = "x-textfield-icon " + iconCls;
        this.syncSize();
    },
    
    filterKeys : function (e) {
        if (e.ctrlKey) {
            return;
        }
        
        var k = e.getKey();
        
        if ((Ext.isGecko || Ext.isOpera) && (e.isNavKeyPress() || k === e.BACKSPACE || (k === e.DELETE && e.button === -1))) {
            return;
        }
        
        var cc = String.fromCharCode(e.getCharCode());
        
        if (!Ext.isGecko && !Ext.isOpera && e.isSpecialKey() && !cc) {
            return;
        }
        
        if (!this.maskRe.test(cc)) {
            e.stopEvent();
        }
    }
});

// @source core/form/TextArea.js

Ext.override(Ext.form.TextArea, {
    initComponent : function () {
        Ext.form.TextArea.superclass.initComponent.call(this);
        
        if (this.maxLength !== Number.MAX_VALUE && this.truncate === true) {
            this.on("invalid", function () {
                if (this.getValue().length > this.maxLength) {
                    this.setValue(this.getValue().substr(0, this.maxLength));
                }
            });
        }
    }
});

// @source core/form/TriggerField.js

Ext.net.TriggerField = Ext.extend(Ext.form.TriggerField, {
    standardTrigger : false,

    initTrigger : function () {
        var ts = this.trigger.select(".x-form-trigger", true), triggerField = this;
        
        this.wrap.setStyle("overflow", "hidden");
        
        ts.each(function (t, all, index) {
            t.hide = function () {
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = "none";
                triggerField.el.setWidth(w - triggerField.trigger.getWidth());
            };
            
            t.show = function () {
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = "";
                this.dom.removeAttribute("hidden");
                triggerField.el.setWidth(w - triggerField.trigger.getWidth());
            };

            t.on("click", this.onCustomTriggerClick, this, { index : index, t : t, tag: t.getAttributeNS("ext", "tid"), preventDefault : true });
            t.addClassOnOver("x-form-trigger-over");
            t.addClassOnClick("x-form-trigger-click");
        }, this);
        
        this.triggers = ts.elements;
    }
});

Ext.reg("nettrigger", Ext.net.TriggerField);

// @source core/form/MultiCombo.js

Ext.net.MultiCombo = Ext.extend(Ext.form.ComboBox, {
    delimiter     : ",",
    wrapBySquareBrackets : false,
    valueField    : "value",
    selectionMode : "checkbox",

    normalizeStringValues : function (s) {
	    if (!Ext.isEmpty(s, false)) {
	        var values = [],	        
	            re = /^\[{1}|\]{1}$/g;

            s =  s.toString().replace(re, "");

	        Ext.each(s.split(this.delimiter), function (item) {
	            values.push(item.trim());
	        });
	        s = values.join(this.delimiter);
	    }
	    
	    return s;
	},
	
	initSelection : function (selection) {
	    if (Ext.isEmpty(selection)) {
	        return;
	    }
	    
	    if (!this.view) {
	        this.selectionPredefined = selection;
	    }
	    
	    var getValuesFromSelection = (function (selection) {
	            var values = [];
	            Ext.each(selection, function (item) {
	            
	                if (!Ext.isEmpty(item.value, false)) {
	                    values.push(item.value);
	                }
	            }, this);
	            
	            return values.join(this.delimiter);
	        }).createDelegate(this, undefined, true),
	    
	        getAllValuesFromSelection = (function (selection) {
	            var values = [];
	            
	            Ext.each(selection, function (item) {
	                
	                if (!Ext.isEmpty(item.value, false)) {
	                    values.push(item.value);
	                } else if (!Ext.isEmpty(item.index)) {
	                    var r = this.store.getAt(item.index);

	                    if (!Ext.isEmpty(r)) {
	                        values.push(r.get(this.valueField));
	                    }
	                }

	            }, this);
	            return values.join(this.delimiter);
	        }).createDelegate(this, undefined, true),

	        setInitValues = (function  (selection) {            
                var values = getAllValuesFromSelection(selection);                
                if (!Ext.isEmpty(values, false)) {
                    this.setValue(values);
                }

                if (this.fireSelectOnLoad) {            
                    this.fireEvent("select", this, this.getSelectedRecords());
                }

                this.clearInvalid();
            }).createDelegate(this, undefined, true);

	    if (this.store.getCount() > 0) {
            setInitValues(selection);
        } else {
            var values = getValuesFromSelection(selection);

            if (!Ext.isEmpty(values, false)) {
                this.setValue(values);
            }

            this.store.on("load", setInitValues.createDelegate(this, [selection]), this, { single : true });
        }
	},	

    initComponent : function () {
		this.editable = false;

		if (!this.tpl) {
			this.tpl = '<tpl for="."><div class="x-combo-list-item {[this.getItemClass()]}">' +
				'<img src="' + Ext.BLANK_IMAGE_URL + '" class="{[this.getImgClass(values)]}" />' +
			    '<div class="x-mcombo-text">{' + this.displayField + '}</div></div></tpl>';

	        this.tpl = new Ext.XTemplate(this.tpl, {
	            getItemClass : (function () {
	                if (this.selectionMode === "selection") {
	                    return "x-mcombo-nimg-item";
	                }

	                return "x-mcombo-img-item";

	            }).createDelegate(this),

	            getImgClass : (function (values) {
	                if (this.selectionMode === "selection") {
	                    return "";
	                }

	                var found = false;

	                Ext.each(this.checkedRecords, function (record) {
	                    // do not replace == by ===
	                    if (values[this.valueField] == record.get(this.valueField)) {
	                        found = true;
	                        return false;
	                    }
	                }, this);

	                return found ? "x-grid3-check-col-on" : "x-grid3-check-col";
	            }).createDelegate(this, [], true)
	        });
		} 

		this.checkedRecords = [];

        Ext.net.MultiCombo.superclass.initComponent.apply(this, arguments);
        
        if (this.selectionPredefined) {
	        this.initSelection(this.selectionPredefined);
	    }

        this.on("beforequery", this.onBeforeQuery);
    }, 

    clearValue : function () {
		Ext.net.MultiCombo.superclass.clearValue.call(this);
		this.checkedRecords = [];
		delete this.selectionPredefined;
		this.store.clearFilter();
		this.store.fireEvent("datachanged", this.store);
		this.saveSelection();
	}, 

	getText : function () {
		var s = this.getValue(this.displayField).replace(new RegExp(RegExp.escape(this.delimiter), "g"), this.delimiter + " ");

		if (this.wrapBySquareBrackets) {
		    s = "[" + s + "]";
		}

		return s;
	},	

	getValue : function (field) {
		var value = [];

		Ext.each(this.checkedRecords, function (record) {
			value.push(record.get(field || this.valueField));
		}, this);

		return value.join(this.delimiter);
	},

	setValue : function (v) {
		if (v) {
			v = this.normalizeStringValues(v);

			this.store.clearFilter();		
			var values = v.split(this.delimiter),
			    unselected = [];	

			Ext.each(this.checkedRecords, function (r) {
			    var found = false;

			    Ext.each(values, function (value) {
				    // do not replace == by ===
				    if (r.get(this.valueField) == value) {
				        found = true;
				        return false;
				    }
				}, this);
		
				if (!found) {
				    unselected.push(r);
				}
			}, this);

			this.checkedRecords = [];

		    Ext.each(unselected, function (r) {
		        this.deselectRecord(r);			    
		    }, this);

		    this.store.each(function (r) {
			    Ext.each(values, function (value) {
			        // do not replace == by ===
			        if (r.get(this.valueField) == value) {
			            this.checkedRecords.push(r);    
			            this.selectRecord(r);
			            return false;
			        }
			    }, this);					
		    }, this);

			this.value = this.getValue();
			this.setRawValue(this.getText());

			if (this.hiddenField) {
				this.hiddenField.value = this.value;
			}

			if (this.el) {
				this.el.removeClass(this.emptyClass);
			}

			this.saveSelection();
		} else {
			this.clearValue();
		}		
	},	

	onBeforeQuery : function (qe) {
		qe.query = this.normalizeStringValues(qe.query);
	},

	checkOnBlur : Ext.emptyFn,
	beforeBlur : Ext.emptyFn,

	triggerBlur : function () {		
		this.store.clearFilter();
		Ext.net.MultiCombo.superclass.triggerBlur.call(this);
	},

	initList : function () {
	    Ext.net.MultiCombo.superclass.initList.call(this);	    
	    
	    if (this.selectionPredefined) {
	        this.initSelection(this.selectionPredefined);
	        delete this.selectionPredefined;
	    }

	    if (this.selectionMode !== "checkbox") {
	        this.view.overClass = "x-multi-selected";
	        this.view.mon(this.view.getTemplateTarget(), {
                "mouseover": this.view.onMouseOver,
                "mouseout": this.view.onMouseOut,
                scope: this.view
            });
        }
	},

	onSelect : function (record, index) {
        if (this.fireEvent("beforeselect", this, record, index) !== false) {
			if (this.checkedRecords.indexOf(record) === -1) {
			    this.checkedRecords.push(record);
			} else {
			    this.checkedRecords.remove(record);
			    this.deselectRecord(record);
			}

			if (this.store.isFiltered()) {
				this.doQuery(this.allQuery);
			}

			this.setValue(this.getValue());
            this.fireEvent("select", this, record, index);
        }
	},	

	isSelected : function (record) {
	    if (Ext.isNumber(record)) {
            record = this.store.getAt(record);
        }

        if (Ext.isString(record)) {
            Ext.each(this.store.getRange(), function (r) {
				// do not replace == by ===
				if (r.get(this.valueField) == record) {
					record = r;
					return false;
				}
			}, this);
        }

        return this.checkedRecords.indexOf(record) !== -1;
	},

	//private
	select : function (index, scrollIntoView) {  
	    if (this.selectionMode === "checkbox") {
	        Ext.net.MultiCombo.superclass.select.call(this, index, scrollIntoView);
	    }
    },

    //private
    deselectRecord : function (record) {        
        if (!this.view) {
            return;
        }

        switch (this.selectionMode) {
        case "checkbox":
            this.view.refreshNode(this.store.indexOf(record));
            break;
        case "selection":
            if (this.view.isSelected(this.store.indexOf(record))) {
                this.view.deselect(this.store.indexOf(record));
            }

            break;
        case "all":
            if (this.view.isSelected(this.store.indexOf(record))) {
                this.view.deselect(this.store.indexOf(record));
            }

            this.view.refreshNode(this.store.indexOf(record));
            break;
	    }
    },

    //private
    selectRecord : function (record) {        
        if (!this.view) {
            return;
        }

        switch (this.selectionMode) {
        case "checkbox":
            this.view.refreshNode(this.store.indexOf(record));
            break;
        case "selection":
            if (!this.view.isSelected(this.store.indexOf(record))) {
                this.view.select(this.store.indexOf(record), true);
            }

            break;
        case "all":
            if (!this.view.isSelected(this.store.indexOf(record))) {
                this.view.select(this.store.indexOf(record), true);
            }

            this.view.refreshNode(this.store.indexOf(record));	            
            break;
	    }
    },

	selectAll : function () {
        this.checkedRecords = [];
        this.store.each(function (record) {
            this.checkedRecords.push(record);    
        }, this);

        this.doQuery(this.allQuery);
        this.setValue(this.getValue());
    },    

    clearSelections : function () {
        this.clearValue();
    },

    deselectItem : function (record) {
        if (Ext.isNumber(record)) {
            record = this.store.getAt(record);
        }

        if (Ext.isString(record)) {
            Ext.each(this.store.getRange(), function (r) {
				// do not replace == by ===
				if (r.get(this.valueField) == record) {
					record = r;
					return false;
				}
			}, this);
        }

        if (this.checkedRecords.indexOf(record) !== -1) {
            this.checkedRecords.remove(record);
		    this.deselectRecord(record);

		    if (this.store.isFiltered()) {
			    this.doQuery(this.allQuery);
		    }

		    this.setValue(this.getValue());
		}
    },

    selectItem : function (record) {
        if (Ext.isNumber(record)) {
            record = this.store.getAt(record);
        }

        if (Ext.isString(record)) {
            Ext.each(this.store.getRange(), function (r) {
				// do not replace == by ===
				if (r.get(this.valueField) == record) {
					record = r;
					return false;
				}
			}, this);
        }

        if (this.checkedRecords.indexOf(record) === -1) {
            this.checkedRecords.push(record);
		    this.selectRecord(record);

		    if (this.store.isFiltered()) {
			    this.doQuery(this.allQuery);
		    }

		    this.setValue(this.getValue());
        }
    },
    
    getSelectedRecords : function () {
        return this.checkedRecords;
    },

    getSelectedIndexes : function () {
        var indexes = [];

		Ext.each(this.checkedRecords, function (record) {
			indexes.push(this.store.indexOf(record));
		}, this);

		return indexes;
    },

    getSelectedValues : function () {
	    var values = [];

		Ext.each(this.checkedRecords, function (record) {
			values.push(record.get(this.valueField));
		}, this);

		return values;
	},

	getSelectedText : function () {
	    var text = [];

		Ext.each(this.checkedRecords, function (record) {
			text.push(record.get(this.displayField));
		}, this);

		return text;
	},

	getSelection : function () {
	    var selection = [];

		Ext.each(this.checkedRecords, function (record) {
			selection.push({
			    text  : record.get(this.displayField),
			    value : record.get(this.valueField),
			    index : this.store.indexOf(record)
			});
		}, this);
		
		return selection;
	},
	
	saveSelection: function () {
	    this.getSelectionField().setValue(Ext.encode(this.getSelection()));
	},
    
    getSelectionField : function () {
        if (!this.selectionField) {
            this.selectionField = new Ext.form.Hidden({ id : this.id + "_Selection", name : this.id + "_Selection" });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.selectionField);		
        }

        return this.selectionField;
    }
});
 
Ext.reg("netmulticombo", Ext.net.MultiCombo); 

// @source core/form/NumberField.js

Ext.form.NumberField.prototype.setValue = Ext.form.NumberField.prototype.setValue.createSequence(function (v) {
    if (this.trimTrailedZeros === false) {
        var value = this.getValue(),
            strValue;
        
        if (!Ext.isEmpty(value, false)) {
            strValue = value.toFixed(this.decimalPrecision).replace(".", this.decimalSeparator);    
            this.setRawValue(strValue);
        }
    }
});

Ext.form.NumberField.override({
    negativeText : "Negative numbers are not allowed (you entered '{0}')",
    
    getErrors : function (value) {
        var errors = Ext.form.NumberField.superclass.getErrors.apply(this, arguments);
        
        value = value || this.processValue(this.getRawValue());
        
        if (value.length < 1) { // if it's blank and textfield didn't flag it then it's valid
            return errors;
        }
        
        value = String(value).replace(this.decimalSeparator, ".");
        
        if (isNaN(value)) {
            errors.push(String.format(this.nanText, value));
        }
        
        var num = this.parseValue(value);
        
        if (num < this.minValue) {
            errors.push(String.format(this.minText, this.minValue));
        }
        
        if (num > this.maxValue) {
            errors.push(String.format(this.maxText, this.maxValue));
        }
        
        if (!this.allowNegative && num < 0) {
            errors.push(String.format(this.negativeText, value));
        }
        
        return errors;
    }
});

// @source core/form/DropDownField.js

Ext.net.DropDownField = Ext.extend(Ext.net.TriggerField, {
    lazyInit       : true,
    componentAlign : "tl-bl?",
    allowBlur      : false,
    mode           : "text",
    
    syncValue : Ext.emptyFn,
    
    initComponent : function () {
        Ext.net.DropDownField.superclass.initComponent.call(this);        
        this.addEvents("expand", "collapse");
        
        var cn = [], triggerCfg, isSimple;
        
        triggerCfg = {
            tag : "img",
            src : Ext.BLANK_IMAGE_URL,
            cls : "x-form-trigger"
        };
        
        if (!Ext.isEmpty(this.triggerClass, false)) {
            triggerCfg.cls += " " + this.triggerClass;
        }
        
        if (Ext.net.StringUtils.startsWith(this.triggerClass || "", "x-form-simple")) {            
            if (this.triggersConfig && this.triggersConfig.length > 0) {
                triggerCfg.cls += " shift-trigger";
            }
                                
            isSimple = true;
        }

        if (this.hideTrigger) {
            Ext.apply(triggerCfg, { style : "display:none", hidden : true });
            this.hideTrigger = false;
        }
        
        if (isSimple) {
            this.addClass("clear-right");
        }
        
        if (this.triggersConfig) {           
            this.triggerConfig.cn.push(triggerCfg);
        } else {
            cn.push(triggerCfg);   
            this.triggerConfig = { 
                tag : "span", 
                cls : "x-form-twin-triggers", 
                cn  : cn 
            };
        }
    },
    
    initTrigger : function () {
        Ext.net.DropDownField.superclass.initTrigger.call(this);        
        this.triggers[this.triggers.length - 1].removeListener("click", this.onCustomTriggerClick, this);
        this.triggers[this.triggers.length - 1].on("click", this.onTriggerClick, this);
    },
    
    initDropDownComponent : function () {
        if (this.component && !this.component.render) {
            this.component.floating = true;
            this.component = new Ext.ComponentMgr.create(this.component, "panel");
        }
        
        var renderTo = this.componentRenderTo || Ext.net.ResourceMgr.getAspForm() || document.body,
            zindex = parseInt(Ext.fly(renderTo).getStyle("z-index"), 10);
            
        if (this.ownerCt && !zindex) {
            this.findParentBy(function (ct) {
                zindex = parseInt(ct.getPositionEl().getStyle("z-index"), 10);
                return !!zindex;
            });
        }
        
        this.component.setWidth(this.component.initialConfig.width || this.getWidth());
        this.component.dropDownField = this;
        this.component.render(renderTo);
        this.component.hide();
        this.first = true;
        
        this.component.getPositionEl().position("absolute", (zindex || 12000) + 5);
        
        if (this.component.initialConfig.height) {
            this.component.setHeight(this.component.initialConfig.height);
        }
        
        this.syncValue(this.getValue(), this.getText());
    },
    
    onRender   : function (ct, position) {
        Ext.net.DropDownField.superclass.onRender.call(this, ct, position);
        
        if (Ext.isGecko) {
            this.el.dom.setAttribute("autocomplete", "off");
        }
        
        if (!this.lazyInit) {
            this.initDropDownComponent();
        } else {
            this.on("focus", this.initDropDownComponent, this, {single: true});
        }
        
        if (this.mode !== "text") {
            this.getUnderlyingValueField().render(ct);
        }
    },
    
    isExpanded : function () {
        return this.component && this.component.isVisible && this.component.isVisible();
    },
    
    collapse : function () {
        if (!this.isExpanded()) {
            return;
        }
        
        this.component.hide();
        
        if (this.allowBlur === false) {
            Ext.getDoc().un("mousewheel", this.collapseIf, this);
            Ext.getDoc().un("mousedown", this.collapseIf, this);
        }
        
        this.fireEvent("collapse", this);
    },
    
    collapseIf : function (e) {
        if (!e.within(this.wrap) && !e.within(this.component.el)) {
            this.collapse();
        }
    },
    
    expand : function () {
        if (this.isExpanded() || !this.hasFocus) {
            return;
        }
        
        if (this.first) {
            this.doResize(this.el.getWidth() + this.getTriggerWidth());
            delete this.first;
        } else if (this.bufferSize) {
            this.doResize(this.bufferSize);
            delete this.bufferSize;
        }
        
        var el = this.component.getPositionEl();
        el.setLeft(0);
        el.setTop(0);
        if(Ext.isIE6 || Ext.isIE7){
            this.component.show();
        }
        
        el.alignTo(this.wrap, this.componentAlign);
        
        if(!(Ext.isIE6 || Ext.isIE7)){
            this.component.show();
        }
        
        if (this.allowBlur === false) {
            this.mon(Ext.getDoc(), { 
                scope: this,
                mousewheel: this.collapseIf,
                mousedown: this.collapseIf
            });
        }
        
        this.fireEvent("expand", this);
    },
    
    onTriggerClick : function () {
        if (this.readOnly || this.disabled) {
            return;
        }
        
        if (this.isExpanded()) {
            this.collapse();
        } else {
            this.onFocus({});
            this.expand();
        }
        
        this.el.focus();  
    },
    
    validateBlur : function () {
        return !this.component || !this.component.isVisible();
    },
    
    onResize : function (w, h) {
        Ext.net.DropDownField.superclass.onResize.apply(this, arguments);
        
        if (this.isVisible() && this.component && this.componentAlign.render) {
            this.doResize(w);
        } else {
            this.bufferSize = w;
        }
    },
    
    doResize: function (w) {
        if (!Ext.isDefined(this.component.initialConfig.width)) {
            this.component.setWidth(w);
        }    
    },
    
    checkTab : function (me, e) {
        if (!this.isExpanded() && e.getKey() === e.TAB) {
            this.triggerBlur();
        }
    },
    
    onDestroy : function () {
        if (this.component && this.component.rendered) {
            this.component.destroy();
        }
        
        if (this.underlyingValueField && this.underlyingValueField.rendered) {
            this.underlyingValueField.destroy();
        }
        
        Ext.net.DropDownField.superclass.onDestroy.call(this);
    },
    
    setValue : function (value, text, collapse) {              
        if (this.mode === "text") {
            collapse = text;
            text = value;
        }
        
        Ext.net.DropDownField.superclass.setValue.apply(this, [text]);
        this.getUnderlyingValueField().setValue(value);
        
        if (!this.isExpanded()) {
            this.syncValue(value, text);
        }
        
        if (collapse !== false) {
            this.collapse();
        }
        
        return this;
    },
    
    setRawValue : function (value, text) {        
        Ext.net.DropDownField.superclass.setRawValue.call(this, value);
        this.getUnderlyingValueField().setValue(value);
        
        if (!this.isExpanded()) {
            this.syncValue(value, text);
        }
        
        return this;
    },
    
    initEvents : function () {
        Ext.net.DropDownField.superclass.initEvents.call(this);

        this.keyNav = new Ext.KeyNav(this.el, {
            "down"  : function (e) {
                if (!this.isExpanded()) {
                    this.onTriggerClick();
                }
            },
            "esc"   : function (e) {
                this.collapse();
            },
            "tab"   : function (e) {
                this.collapse();
                return true;
            },
            scope   : this,
            doRelay : function (e, h, hname) {
                if (hname === "down" || this.scope.isExpanded()) {
                    var relay = Ext.KeyNav.prototype.doRelay.apply(this, arguments);
                    
                    if (!Ext.isIE && Ext.EventManager.useKeydown) {
                        this.scope.fireKey(e);
                    }
                    
                    return relay;
                }
                return true;
            },

            forceKeyDown : true,
            defaultEventAction : "stopEvent"
        });
    },
    
    getUnderlyingValueField : function () {
        if (!this.underlyingValueField) {
            this.underlyingValueField = new Ext.form.Hidden({
                id    : this.id + "_Value",
                name  : this.id + "_Value",
                value : this.underlyingValue || ""
            });
 
			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.underlyingValueField);			
        }

        return this.underlyingValueField;
    },
    
    getText : function () {
        return Ext.net.DropDownField.superclass.getValue.call(this);
    },
    
    getValue : function () {
        return this.getUnderlyingValueField().getValue();
    },
    
    getRawValue : function () {
        return this.getValue();
    },
    
    reset : function () {        
        if (this.isTextMode()) {
            this.setValue(this.originalText, false);
        } else {
            this.setValue(this.originalValue, this.originalText, false);
        }

        this.clearInvalid();
        this.applyEmptyText();
    },
    
    isTextMode : function () {
        return this.mode === "text";
    },
    
    initValue : function () {
        Ext.net.DropDownField.superclass.initValue.call(this);   
        
        if (this.text !== undefined) {
            if (this.isTextMode()) {
                this.setValue(this.text, false);
            } else {
                this.setValue(this.getValue(), this.text, false);
            }            
        }
     
        this.originalText = this.getText();
    },
    
    clearValue : function () {
        this.setRawValue("", "");
        this.applyEmptyText();
    }
});

Ext.reg("netdropdown", Ext.net.DropDownField);

// @source core/form/FieldLabeler.js

Ext.ns("Ext.ux");


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
                style : (isToolbar ? "margin-bottom:0px;" : "") + (Ext.isIE && isToolbar ? "margin-top:1px;" : "") 
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

// @source core/form/TimeField.js


// @source core/menu/Menu.js

Ext.override(Ext.menu.Menu, {
    enableScrolling : false,
    
    lastTargetIn : function (cmp) {
        return Ext.fly(cmp.getEl ? cmp.getEl() : cmp).contains(this.trg);
    },
    
    render : function (ct, position) {        
        if (!ct && this.floating && this.renderToForm === true) {
            ct = Ext.net.ResourceMgr.getAspForm() || Ext.getBody();
        }
        
        Ext.menu.Menu.superclass.render.call(this, ct, position);
    }
});

Ext.override(Ext.layout.MenuLayout, {
    doAutoSize : function () {
        var ct = this.container, 
            w = ct.width;

        if (ct.floating) {
            if (w) {
                ct.setWidth(w);
            } else if (Ext.isIE) {
                ct.setWidth(Ext.isStrict && (!Ext.isIE6) ? 'auto' : ct.minWidth);

                var el = ct.getEl(), t = el.dom.offsetWidth; // force recalc
                
                ct.setWidth(ct.getLayoutTarget().getWidth() + el.getFrameWidth('lr'));
            }
        }
    }
});

// @source core/menu/CheckItem.js

Ext.menu.CheckItem.prototype.onRender = Ext.menu.CheckItem.prototype.onRender.createSequence(function (el) {
    this.getCheckedField().render(Ext.net.ResourceMgr.getAspForm() || this.el.parent() || this.el);
});

Ext.menu.CheckItem.override({
    getCheckedField : function () {
        if (!this.checkedField) {
            this.checkedField = new Ext.form.Hidden({ 
                id   : this.id + "_Checked", 
                name : this.id + "_Checked" 
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.checkedField);	
        }
        
        return this.checkedField;
    }
});
// @source core/menu/ColorMenu.js

Ext.override(Ext.menu.ColorMenu, {
    initComponent : function () {
        Ext.apply(this, {
            plain         : true,
            showSeparator : false,
            items         : this.palette = new Ext.ColorPalette(this.initialConfig.palette || {})
        });
        var restoreWindowProp = !Ext.isEmpty(window[this.palette.id]);
        this.palette.purgeListeners();
        
        if (restoreWindowProp) {
            window[this.palette.id] = this.palette;
        }
        
        Ext.menu.ColorMenu.superclass.initComponent.call(this);
        this.relayEvents(this.palette, ["select"]);
        this.on("select", this.menuHide, this);
        
        if (this.handler) {
            this.on("select", this.handler, this.scope || this);
        }
    }
});

// @source core/menu/DateMenu.js

Ext.override(Ext.menu.DateMenu, {
    initComponent : function () {
        this.on("beforeshow", this.onBeforeShow, this);
        
        this.strict = (Ext.isIE7 && Ext.isStrict);

        if (this.strict) {
            this.on("show", this.onShow, this, { single : true, delay : 20 });
        }
        
        Ext.apply(this, {
            plain         : true,
            showSeparator : false,
            items         : this.picker = new Ext.DatePicker(Ext.apply({
                internalRender : this.strict || !Ext.isIE,
                ctCls          : "x-menu-date-item"
            }, this.initialConfig.picker))
        });
        var restoreWindowProp = !Ext.isEmpty(window[this.picker.id]);
        this.picker.purgeListeners();
        
        if (restoreWindowProp) {
            window[this.picker.id] = this.picker;
        }
        
        Ext.menu.DateMenu.superclass.initComponent.call(this);
        this.relayEvents(this.picker, ["select"]);
        this.on("show", this.picker.focus, this.picker);
        this.on("select", this.menuHide, this);
        
        if (this.handler) {
            this.on("select", this.handler, this.scope || this);
        }
    }
});

// @source core/menu/HtmlElement.js

Ext.Toolbar.HtmlElement = function (config) {
    Ext.Toolbar.HtmlElement.superclass.constructor.call(this, config.target);
};

Ext.extend(Ext.Toolbar.HtmlElement, Ext.Toolbar.Item, {});

Ext.reg("nettbhtml", Ext.Toolbar.HtmlElement);

// @source core/menu/MenuPanel.js

Ext.net.MenuPanel = function (config) {
    Ext.net.MenuPanel.superclass.constructor.call(this, config);
};

Ext.extend(Ext.net.MenuPanel, Ext.Panel, {
    saveSelection : true,
    selectedIndex : -1,
    fitHeight     : true,

    initComponent : function () {
        Ext.net.MenuPanel.superclass.initComponent.call(this);
        
        this.menu = this.menu.render ? this.menu : Ext.ComponentMgr.create(this.menu, "menu");

        if (this.selectedIndex > -1) {
            this.menu.items.get(this.selectedIndex).ctCls = "x-menu-item-active";
            this.getSelIndexField().setValue(this.selectedIndex);
        }

        this.menu.on("itemclick", this.setSelection, this);
        this.menu.on("mouseout", this.onMenuMouseOut, this);
    },

    onMenuMouseOut : function (menu, e, t) {
        if (!this.saveSelection) {
            return;
        }
        
        var index = this.menu.items.indexOf(t),
            selIndex = this.getSelIndexField().getValue();
            
        // do not replace == by ===
        if (selIndex.length > 0 && index == selIndex) {
            t.container.addClass("x-menu-item-active");
        }
    },

    setSelectedIndex : function (index) {
        this.setSelection(this.menu.items.get(index));
    },

    getSelIndexField : function () {
        if (!this.selIndexField) {
            this.selIndexField = new Ext.form.Hidden({ id : this.id + "_SelIndex", name : this.id + "_SelIndex" });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.selIndexField);	
        }
        
        return this.selIndexField;
    },

    setSelection : function (item, e) {
        if (this.saveSelection) {
            this.menu.items.each(function (item) {
                item.container.removeClass("x-menu-item-active");
            }, this.menu);

            item.container.addClass("x-menu-item-active");
        }

        this.getSelIndexField().setValue(this.menu.items.indexOf(item));
    },
    
    clearSelection : function () {
        this.menu.items.each(function (item) {
            item.container.removeClass("x-menu-item-active");
        }, this.menu);
        
        this.getSelIndexField().setValue(null);
    },

    afterRender : function () {
        Ext.net.MenuPanel.superclass.afterRender.call(this);
        
        if (this.collapsed) {
            this.on("expand", this.initMenu, this, { single : true });
        } else {
            this.initMenu();
        }

        this.getSelIndexField().render(this.el.parent() || this.el);
    },
    
    initMenu : function () {
        this.menu.render(this.body);
        var lay = this.menu.getEl();
        
        if (Ext.isIE) {
            lay.shadow = false;
        }

        lay.clearPositioning("auto");
        
        if (this.fitHeight) {
            lay.setSize("100%", "100%");
        } else {
            lay.setWidth("100%");
        }
        
        lay.applyStyles({ border : "0px" });
        lay.show();   
        this.collapse(false);  
        this.expand(false);
    }
});

Ext.reg("netmenupanel", Ext.net.MenuPanel);

// @source core/menu/ComboMenuItem.js

Ext.net.ComboMenuItem = function (config) {
    Ext.net.ComboMenuItem.superclass.constructor.call(this, config);
    this.component = Ext.ComponentMgr.create(Ext.apply(config.component || config.combobox || {}, { lazyInit : false }), "combo");
    
    this.component.getZIndex = function () { 
        return 99999; 
    };
    
    this.combo = this.component;
    this.addEvents("select");
    
    if (this.iconCls) {
        this.iconCls += " x-menu-field-icon";
    }
    
    this.combo.on("afterrender", function (combo) {
        combo.getEl().swallowEvent("click");
        
        if (combo.list) {
            combo.list.on("mousedown", function (e) {
                Ext.lib.Event.stopPropagation(e);
            });
        }
    }, this);
};

Ext.extend(Ext.net.ComboMenuItem, Ext.menu.BaseItem, {
    hideOnClick : false,
    shift       : true,
    
    onSelect    : function (combo, record) {
        this.fireEvent("select", this, record);
        Ext.net.ComboMenuItem.superclass.handleClick.call(this);
    },
    
    onRender : function (container) {
        this.component.render(container);
        this.el = this.component.getEl();

        if (Ext.isIE && this.combo.list) {
            this.combo.list.shadow = false;
        }

        this.el.swallowEvent(["keydown", "keypress"]);
        
        Ext.each(["keydown", "keypress"], function (eventName) {
            this.el.on(eventName, function (e) {
                if (e.isNavKeyPress()) {
                    e.stopPropagation();
                }
            }, this);
        }, this);
        
        if (this.shift) {
            this.component.container.applyStyles({ "padding-left" : "24px" });
        }
    }
});

Ext.reg("combomenuitem", Ext.net.ComboMenuItem);

// @source core/menu/DatFieldMenuItem.js

Ext.net.DateFieldMenuItem = function (config) {
    Ext.net.DateFieldMenuItem.superclass.constructor.call(this, config);
    this.component = Ext.ComponentMgr.create(config.component || config.dateField, "datefield");
    this.dateField = this.component;
    
    if (this.iconCls) {
        this.iconCls += " x-menu-field-icon";
    }
    
    this.dateField.menu = new Ext.menu.DateMenu({
        allowOtherMenus : true
    });

    this.dateField.on("render", function (dateField) {
        dateField.getEl().swallowEvent("click");
    });
};

Ext.extend(Ext.net.DateFieldMenuItem, Ext.menu.BaseItem, {
    hideOnClick : false,
    canActivate : false,
    shift       : true,
    
    onRender    : function (container) {
               
        this.component.render(container);
        this.el = this.component.getEl();

        this.el.swallowEvent(["keydown", "keypress"]);
        
        Ext.each(["keydown", "keypress"], function (eventName) {
            this.el.on(eventName, function (e) {
                if (e.isNavKeyPress()) {
                    e.stopPropagation();
                }
            }, this);
        }, this);
        
        if (this.shift) {
            this.component.container.applyStyles({ "padding-left": "24px" });
        }
    }
});

Ext.reg("datefieldmenuitem", Ext.net.DateFieldMenuItem);

// @source core/menu/ComponentMenuItem.js

Ext.net.ComponentMenuItem = function (cfg) {
    this.target = cfg.target;    
    
    if (cfg.iconCls) {
        cfg.iconCls += " x-menu-field-icon";
        cfg.shift = false;
    }
      
    Ext.net.ComponentMenuItem.superclass.constructor.call(this, cfg);
    
    if (cfg.component) {
        this.component = cfg.component.rendered ? cfg.component : Ext.ComponentMgr.create(cfg.component, "panel");
    }
};

Ext.extend(Ext.net.ComponentMenuItem, Ext.menu.BaseItem, {
    hideOnClick : false,
    itemCls     : "x-menu-item",
    shift       : true,
    componentElement : "auto",

    // private
    onRender : function (container) {
        if (this.iconCls) {
            this.iconCls += " x-menu-field-icon";
        }
        
        if (this.component) {
                       
            this.component = this.component.rendered ? this.component : Ext.ComponentMgr.create(this.component, "panel");
            
            if (!this.component.rendered) {
                this.component.render(container);
                this.el = this.component.getEl();
            }
        } else {
            this.el = (this.target.getEl) ? this.target.getEl() : Ext.get(this.target);
            this.component = Ext.getCmp(this.el.id);
        }   
        
        this.el.swallowEvent(["keydown", "keypress"]);
        
        Ext.each(["keydown", "keypress"], function (eventName) {
            this.el.on(eventName, function (e) {
                if (e.isNavKeyPress()) {
                    e.stopPropagation();
                }
            }, this);
        }, this);        
        
        if (this.componentElement === "auto") {
            this.componentElement = this.component.wrap ? "wrap" : "element";
        }
        
        if (this.componentElement === "wrap" && !Ext.isEmpty(this.component)) {            
            this.el = this.component.wrap;
        }   
        
        if (this.shift) {
            if (this.componentElement === "wrap") {
                container.applyStyles({ "padding-left": "25px" });
            } else {
                this.el.applyStyles({ "margin-left": "23px" });
            }
        }     

        Ext.net.ComponentMenuItem.superclass.onRender.apply(this, arguments);
        
        if (!Ext.isEmpty(this.component)) {
            if (this.component.doLayout) {
                this.component.doLayout();
            }

            if (this.component.syncSize) {
                this.component.syncSize();
            }
        }

        if (Ext.isIE) {
            if (this.parentMenu) {
                this.parentMenu.shadow = false;
                this.parentMenu.el.shadow = false;
            }

            if (!Ext.isEmpty(this.component)) {
                this.component.shadow = false;
                this.component.el.shadow = false;
            }
        }
        
        this.component.parentMenu = this.parentMenu;
    },

    activate : function () {
        if (this.disabled) {
            return false;
        }
        
        if (Ext.isEmpty(this.component)) {
            return false;
        }

        this.component.focus();
        this.fireEvent("activate", this);
        return true;
    },

    // private
    deactivate : function () {
        this.fireEvent("deactivate", this);
    },

    // private
    disable : function () {        
        if (Ext.isEmpty(this.component)) {
            return;
        }
        
        this.component.disable();
        
        Ext.net.ComponentMenuItem.superclass.disable.call(this);
    },

    // private
    enable : function () {
        if (Ext.isEmpty(this.component)) {
            return;
        }
        
        this.component.enable();
        Ext.net.ComponentMenuItem.superclass.enable.call(this);
    }
});

Ext.reg("componentmenuitem", Ext.net.ComponentMenuItem);


// @source core/menu/MenuTextItem.js

Ext.override(Ext.menu.TextItem, {
    setText : function (text) {
        if (this.rendered) {
            this.el.dom.innerHTML = text;
        } else {
            this.text = text;
        }
    }
});

Ext.override(Ext.menu.Separator, {
    disabled : true
});

// @source core/tips/ToolTip.js

Ext.ToolTip.override({
    initTarget : function (target) {
        var targetEl = Ext.net.getEl(target);

        if (!Ext.isEmpty(targetEl)) {
            this.initTargetEvents(targetEl);
        } else {
            var getTargetTask = new Ext.util.DelayedTask(function (task) {
                targetEl = Ext.net.getEl(target);

                if (!Ext.isEmpty(targetEl)) {
                    this.initTargetEvents(targetEl);
                    task.cancel();
                } else {
                    task.delay(500, undefined, this, [ task ]);
                }
            }, this);
            
            getTargetTask.delay(1, undefined, this, [ getTargetTask ]);
        }
    },

    initTargetEvents : function (targetEl) {
        this.target = targetEl;
        var t;
        
        if ((t = Ext.get(this.target))) {
            if (this.target) {
                this.target = Ext.get(this.target);
                this.target.un("mouseover", this.onTargetOver, this);
                this.target.un("mouseout", this.onTargetOut, this);
                this.target.un("mousemove", this.onMouseMove, this);
            }
        
            this.mon(t, {
                mouseover : this.onTargetOver,
                mouseout  : this.onTargetOut,
                mousemove : this.onMouseMove,
                scope     : this
            });
            this.target = t;
        }
        
        if (this.anchor) {
            this.anchorTarget = this.target;
        }
    }
});

Ext.QuickTips.init = Ext.QuickTips.init.createSequence(function () {
    var fn = function () {
            var tip = Ext.QuickTips.getQuickTip();
            if (tip) {
                tip.disabled = true;
            }
        };
        
    if (window.addEventListener) {
        window.addEventListener("unload", fn, false);
    } else if (window.attachEvent) {
        window.attachEvent("onunload", fn);
    } 
});

// @source core/toolbar/Toolbar.js

Ext.Toolbar.prototype.initComponent = Ext.Toolbar.prototype.initComponent.createSequence(function () {
    if (this.classicButtonStyle) {
        this.setClassicButtonStyle(this.classicButtonStyle);
    }
});

Ext.override(Ext.Component, {
    setClassicButtonStyle : function (classic) {
        this[classic ? "addClass" : "removeClass"]("x-toolbar-classic");
    }
});

// @source core/toolbar/ToolbarItem.js

// HACK: monkey-patch Toolbar.Item .getEl() to return a typeof Element
Ext.Toolbar.Item.prototype.getEl = function () {
    return Ext.get(this.el);
};

// @source core/toolbar/ToolbarSpacer.js

Ext.net.ToolbarSpacer = function (config) {
    Ext.net.ToolbarSpacer.superclass.constructor.call(this);
    config = config || {};
    this.width = config.width;

    this.render = function (td) {
        Ext.net.ToolbarSpacer.superclass.render.call(this, td);
        if (!Ext.isEmpty(this.width)) {
            Ext.fly(this.el).removeClass("ytb-spacer").setWidth(this.width);
        }
    };
};

Ext.extend(Ext.net.ToolbarSpacer, Ext.Toolbar.Spacer);

Ext.reg("nettbspacer", Ext.net.ToolbarSpacer);

// @source core/toolbar/ToolbarTextItem.js

Ext.Toolbar.TextItem.override({
    getText : function () {
        return this.rendered ? this.el.dom.innerHTML : this.autoEl.html;
    }
});

// @source core/tree/TreeSorter.js

Ext.tree.TreeSorter.override({
    _sortFn : function (n1, n2) {
        var desc = this.dir && this.dir.toLowerCase() === "desc",
            prop = this.property || "text",
            sortType = this.sortType,
            folderSort = this.folderSort,
            caseSensitive = this.caseSensitive === true,
            leafAttr = this.leafAttr || "leaf",
            attr1 = n1.attributes,
            attr2 = n2.attributes;

        if (Ext.isString(sortType)) {
            sortType = Ext.data.SortTypes[sortType];
        }
            
        if (folderSort) {
            if (attr1[leafAttr] && !attr2[leafAttr]) {
                return 1;
            }
            
            if (!attr1[leafAttr] && attr2[leafAttr]) {
                return -1;
            }
        }
        var prop1 = attr1[prop],
            prop2 = attr2[prop],
            v1 = sortType ? sortType(prop1, n1) : (caseSensitive ? prop1 : (prop1.toUpperCase ? prop1.toUpperCase() : prop1)),
            v2 = sortType ? sortType(prop2, n2) : (caseSensitive ? prop2 : (prop2.toUpperCase ? prop2.toUpperCase() : prop2));
            
        if (v1 < v2) {
            return desc ? 1 : -1;
        } else if (v1 > v2) {
            return desc ? -1 : 1;
        }
        
        return 0;
    },
    
    doSort : function (node) {
        if (this.fnDelegated !== true) {
            this._sortFn = this._sortFn.createDelegate(this);
            this.fnDelegated = true;        
        }
        
        node.sort(this._sortFn);
    }
});

// @source core/tree/TreePanel.js

Ext.net.TreePanel = function (config) {
    Ext.net.TreePanel.superclass.constructor.call(this, config);
};

Ext.extend(Ext.net.TreePanel, Ext.tree.TreePanel, {
    mode : "local",
    
    initNoLeafIcon : function () {
        if (this.noLeafIcon) {
            var css = "#" + this.id + " .x-tree-node-leaf .x-tree-node-icon{background-image: none;width:0px;}";
			Ext.net.ResourceMgr.registerCssClass("treepanel_css_" + this.id, css);        
        }
    },
    
    initComponent : function () {
        Ext.net.TreePanel.superclass.initComponent.call(this);
        this.initEditors();
        this.initChildren(this.nodes);
        this.initNoLeafIcon();
        
        if (Ext.isEmpty(this.selectionSubmitConfig) || this.selectionSubmitConfig.disableAutomaticSubmit !== true) {
            this.getSelectionModel().on("selectionchange", this.updateSelection, this);
            this.on("checkchange", this.updateCheckSelection, this, {buffer : 10});
            this.on("append", this.updateCheckSelection, this, {buffer : 10});
            this.on("insert", this.updateCheckSelection, this, {buffer : 10});
        }
        
        if (!this.loader.hasListener("loadexception")) {
            this.loader.on("loadexception", function (loader, node, response) {
                if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", response, { "errorMessage": response.responseText }, null, null, null, null, null) !== false) {
                    if ((this.directEventConfig || {}).showWarningFailure !== false) {
                        Ext.net.DirectEvent.showFailure(response, response.responseText);
                    }
                }            
            }, this);
        }
        
        this.addEvents({
            "submit"                : true, 
            "submitexception"       : true,
            "beforeremoteaction"    : true,            
            "remoteactionexception" : true,
            "remoteactionrefusal"   : true,
            "remoteactionsuccess"   : true,
            "beforeremotemove"      : true,
            "beforeremoterename"    : true,
            "beforeremoteremove"    : true,
            "beforeremoteinsert"    : true,
            "beforeremoteappend"    : true            
        });
        
        if (this.sorter && !this.sorter.doSort) {
            this.sorter = new Ext.tree.TreeSorter(this, this.sorter);
        }        
		
		if (this.mode === "remote") {
		    this.mode = "local";
		    this.setMode("remote");
		}
		
		this.on("nodedragover", this.onNodeDragOver, this);
    },
    
    //---remote mode section------
    
    setMode : function (mode) {
        if (mode === "remote" && this.mode === "local") {            
            this.localActions = this.localActions || [];
            
            if (this.loader.preloadChildren) {
			    this.loader.on("load", this.onRemoteDoPreload);
		    }
		    
		    if (this.editors) {
			    Ext.each(this.editors, function (editor) {
			        editor.on("complete", this.onRemoteNodeEditComplete, this);
			        editor.on("canceledit", this.onRemoteNodeCancelEdit, this);
			    }, this);			    
		    }
		    
		    if (this.enableDD) {
			    this.on("beforenodedrop", this.onRemoteBeforeNodeDrop, this);			        
		    }
        } else if (mode === "local" && this.mode === "remote") {
            if (this.loader.preloadChildren) {
			    this.loader.un("load", this.onRemoteDoPreload);
		    }
		    
		    if (this.editors) {
			    Ext.each(this.editors, function (editor) {
			        editor.un("complete", this.onRemoteNodeEditComplete, this);
			        editor.un("canceledit", this.onRemoteNodeCancelEdit, this);
			    }, this);			    
		    }
		    
		    if (this.enableDD) {
			    this.un("beforenodedrop", this.onRemoteBeforeNodeDrop, this);
		    }
        }
        
        this.mode = mode;
    },
    
    onRemoteBeforeNodeDrop : function (e) {
		if (this.mode === "local" || this.localActions.indexOf("move") !== -1) {
		    return true;
		}
		
		this.moveNodeRequest(e);
		e.dropStatus = true;
		return false;
	},	
    
    remoteOptions : function (action, node) {
		var dc = this.directEventConfig || {},
		    options = {action : action, node : node, params : {}};
		
		if (this.fireEvent("beforeremoteaction", this, node, options, action) !== false) {
		    dc.userSuccess = this.remoteActionSuccess.createDelegate(this);
            dc.userFailure = this.remoteActionFailure.createDelegate(this);
            dc.extraParams = options.params;
            dc.node = node;
            dc.control = this;
            dc.eventType = "postback";
            dc.action = action;
            
            if (!Ext.isEmpty(this[action + "Url"], false)) {
                dc.url = this[action + "Url"];
                dc.cleanRequest = true;
            }
            
            return dc;
        }
        
        return false;
	},
	
	remoteActionSuccess : function (response, result, context, type, action, extraParams, o) {
		if (o.node) {
			o.node.getUI().afterLoad();
		}
        
        var rParams;
		
		try {
			rParams = result.extraParamsResponse || result.response || (result.d ? result.d.response : {}) || {};
			var responseObj = result.serviceResponse || result.d || result;
            result = { success: responseObj.success, msg: responseObj.message };            
		} catch (ex) {
			this.fireEvent("remoteactionexception", this, response, ex, o);
			
			if (o.cancelWarningFailure !== true && 
                    (this.directEventConfig || {}).showWarningFailure !== false &&
		            !this.hasListener("remoteactionexception")) {
		        Ext.net.DirectEvent.showFailure(response, result.msg);
		    }
			
			return;
		}
		
		if (result.success !== true) {
			this.fireEvent("remoteactionrefusal", this, response, {message: result.msg}, o);
			
			if (o.action === "raAppend" || o.action === "reInsert") {
			    o.node.parentNode.removeChild(o.node);
			}
			
			return;
		}

		switch (o.action) {
		case "raRename":
			o.node.setText(rParams.ra_newText || rParams.text || Ext.util.Format.htmlDecode(o.raConfig.newText));
		    break;
		case "raRemove":
			o.node.parentNode.removeChild(o.node);
		    break;
		case "raMove":
			if (o.e.point === "append") {
			    o.e.target.expand();
			}
            
            if (!o.e.target.isLoaded || o.loaded) {
			    this.dropZone.completeDrop(o.e);
			} else {
			    o.e.dropNode.remove();
			}
		    break;
		case "raAppend":
		case "raInsert":
		    var id = rParams.ra_id || rParams.id;
		    if (id) {
			    o.node.setId(id);
			}
		
			if (rParams.ra_text || rParams.text) {
			    o.node.setText(rParams.ra_text || rParams.text);
			}
		
			o.node.select();
		    break;
		}
		
		this.fireEvent("remoteactionsuccess", this, o.node, action, o);
	},
	
	remoteActionFailure : function (response, result, context, type, action, extraParams, o) {
        if (o.node) {
			o.node.getUI().afterLoad();
		}
		
		this.fireEvent("remoteactionexception", this, response, {message: response.statusText}, o);
		
		if (o.cancelWarningFailure !== true && 
                (this.directEventConfig || {}).showWarningFailure !== false &&
	            !this.hasListener("remoteactionexception")) {
	        Ext.net.DirectEvent.showFailure(response, response.responseText);
		}
    },
    
    onRemoteDoPreload : function (loader, node) {
		node.cascade(function (n) {
			loader.doPreload(n);
		});
	},
	
	onRemoteNodeEditComplete : function (editor, value, startValue) {
		if (editor.editNode.isNew) {
		    var insert = editor.editNode.insertAction;

			delete editor.editNode.isNew;
			delete editor.editNode.insertAction;
			
            editor.editNode.setText(value);
			this.appendChildRequest(editor.editNode, insert);

			return;
		}

		this.renameNode(editor.editNode, value);
		return false;
	},
	
	onRemoteNodeCancelEdit : function (editor, value, startValue) {
	    if (editor.editNode.isNew) {		
	        editor.editNode.parentNode.removeChild(editor.editNode);
	    }
	},
	
	performRemoteAction : function (config) {	    
	    if (config.cleanRequest) {
	        if (this.remoteJson) {
	            config.json = true;
	            config.method = "POST";
	        }

	        config.extraParams = Ext.apply(config.extraParams, config.raConfig);
	        config.type = "load";	        
	    } else {
	        config.serviceParams = Ext.encode(config.raConfig);
	    }

        config.node.getUI().beforeLoad();
        Ext.net.DirectEvent.request(config);
	},
	
	moveNodeRequest : function (e) {	
	    if (this.mode === "local" || this.localActions.indexOf("move") !== -1) {
		    return;
		}
		
		var dc = this.remoteOptions("raMove", e.dropNode);
		
		if (dc !== false && this.fireEvent("beforeremotemove", this, e.dropNode, e.target, e, dc.extraParams) !== false) {
		    dc.e = e;
		    dc.loaded = e.target.loaded || e.target.loading;
		    dc.raConfig = {
	            id       : e.dropNode.id,
	            targetId : e.target.id,
	            point    : e.point
	        };
	        
	        this.performRemoteAction(dc); 
		}
	},
	
	convertText : function (text) {
	    if (text === "&#160;") {
	        return "";
	    }
	    
	    return Ext.util.Format.htmlEncode(text);
	},
	
	renameNode : function (node, newText) {
		if (this.mode === "local" || this.localActions.indexOf("rename") !== -1) {
		    node.setText(newText);
		    return;
		}
		
		var dc = this.remoteOptions("raRename", node);
		
		if (dc !== false && this.fireEvent("beforeremoterename", this, node, dc.extraParams) !== false) {
		    dc.raConfig = {
	            id      : node.id,
	            newText : this.convertText(newText),
	            oldText : this.convertText(node.text)
	        };
	        
	        this.performRemoteAction(dc); 
		}
	},
	
	removeNode : function (node) {
		if (node.isRoot) {
			return;
		}
		
		if (this.mode === "local" || this.localActions.indexOf("remove") !== -1) {
		    node.parentNode.removeChild(node);
		    return;
		}
		
		var dc = this.remoteOptions("raRemove", node);
		
		if (dc !== false && this.fireEvent("beforeremoteremove", this, node, dc.extraParams) !== false) {
		    dc.raConfig = {
	            id : node.id
	        };
	        
	        this.performRemoteAction(dc);
		}
	},
	
	appendChildRequest : function (node, insert) {
        if (this.mode === "local" || this.localActions.indexOf(insert ? "insert" : "append") !== -1) {
		    return;
		}
		
		var dc = this.remoteOptions("ra" + (insert ? "Insert" : "Append"), node);
		
		if (dc !== false && this.fireEvent("beforeremote" + (insert ? "insert" : "append"), this, node, dc.extraParams, insert) !== false) {
		    dc.raConfig = {
	            id       : node.id,
	            parentId : node.parentNode.id,
	            text     : this.convertText(node.text)
	        };
	        
	        this.performRemoteAction(dc);
		}
	},
	
	//---end remote mode section
	
	onNodeDragOver : function (e) {
		if (this.allowLeafDrop) {
			e.target.leaf = false;
		}
	},
	
	appendChild : function (parentNode, defaultText, insert, index) {
		var node = parentNode,
		    nodeAttr = {},
		    child;
		    
		node.leaf = false;
		node.expand(false, false);
		
		if (Ext.isString(defaultText)) {
		    nodeAttr = {text: defaultText || "", loaded: true};
		} else {
		    nodeAttr = Ext.applyIf(defaultText, {text: "", loaded: true});
		}
		
		if (insert) {
			var beforeNode = index ? node.childNodes[index] : node.firstChild;
			child = node.insertBefore(this.loader.createNode(nodeAttr), beforeNode);
		} else {
			child = node.appendChild(this.loader.createNode(nodeAttr));
		}

		child.isNew = true;
		child.insertAction = insert;
		
		this.startEdit(child);
	},
	
	insertBefore : function (node, defaultText) {
		var nodeAttr = {},
		    child;	
		    
		if (Ext.isString(defaultText)) {
		    nodeAttr = {text: defaultText || "", loaded: true};
		} else {
		    nodeAttr = Ext.applyIf(defaultText, {text: "", loaded: true});
		}	    
		    
		child = node.parentNode.insertBefore(this.loader.createNode(nodeAttr), node);

		child.isNew = true;
		child.insertAction = true;
		
		this.startEdit(child);
	},
    
    startEdit : function (node, defer) {
        if (typeof node === "string") {
            node = this.getNodeById(node);
        }
        
        node.select();
        
        if (this.editors) {
            Ext.each(this.editors, function (ed) {
                ed.beforeNodeClick(node, undefined, defer);
            }, this);            
        }
    },
    
    completeEdit : function () {
        if (this.editors) {
            Ext.each(this.editors, function (ed) {
                ed.completeEdit();
            }, this);            
        }
    },
    
    cancelEdit : function () {
        if (this.editors) {
            Ext.each(this.editors, function (ed) {
                ed.cancelEdit();
            }, this);            
        }
    },
    
    onRender : function (ct, position) {
        Ext.net.TreePanel.superclass.onRender.call(this, ct, position);
        
        if (Ext.isEmpty(this.selectionSubmitConfig) || this.selectionSubmitConfig.disableAutomaticSubmit !== true) {
            this.getSelectionModelField().render(this.el.parent() || this.el);
            this.getCheckNodesField().render(this.el.parent() || this.el);
        }
    },
    
    initEditors : function () {
        if (this.editors) {
            if (!Ext.isArray(this.editors)) {
                this.editors = [this.editors];
            }            
                
            Ext.each(this.editors, function (editor, index) {
                editor.tree = this;
                this.editors[index] = new Ext.net.TreeEditor(editor);
            }, this);
        }
    },

    initChildren : function (nodes) {
        if (!Ext.isEmpty(nodes) && nodes.length > 0) {
            var root = nodes[0],
                rootNode = this.createNode(root);
                
            this.setRootNode(rootNode);

            if (root.children) {
                rootNode.beginUpdate();
                this.setChildren(root, rootNode);
                rootNode.endUpdate();
            }
        }
    },

    setChildren : function (parent, node) {
        var i = 0;

        for (i; i < parent.children.length; i++) {

            var child = parent.children[i],
                childNode = this.createNode(child);

            node.appendChild(childNode);

            if (child.children) {
                this.setChildren(child, childNode);
            }
        }
    },

    createNode : function (config) {
        var type = config.nodeType || "node";
        
        if (this.loader.baseAttrs) {
            Ext.applyIf(config, this.loader.baseAttrs);
        }

        if (Ext.isString(config.uiProvider)) {
            config.uiProvider = this.loader.uiProviders[config.uiProvider] || eval(config.uiProvider);
        }
        
        if (config.nodeType) {
            return new Ext.tree.TreePanel.nodeTypes[config.nodeType](config);
        } else {
            if (type === "node" || config.leaf) {
                return new Ext.tree.TreeNode(config);
            }
        }

        return new Ext.tree.AsyncTreeNode(config);
    },
    
    getSelectionModelField : function () {
        if (!this.selectionModelField) {
            this.selectionModelField = new Ext.form.Hidden({ id : this.id + "_SM", name : this.id + "_SM" });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.selectionModelField);
        }
        
        return this.selectionModelField;
    },
    
    getCheckNodesField : function () {
        if (!this.checkNodesField) {
            this.checkNodesField = new Ext.form.Hidden({ id : this.id + "_CheckNodes", name : this.id + "_CheckNodes" });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.checkNodesField);
        }
        
        return this.checkNodesField;
    },
    
    excludeAttributes : [
        "expanded", 
        "allowDrag", 
        "allowDrop", 
        "disabled", 
        "icon",
        "cls", 
        "loader",
        "children",
        "iconCls", 
        "href", 
        "hrefTarget", 
        "qtip", 
        "singleClickExpand", 
        "uiProvider"
    ],
    
    defaultAttributeFilter : function (attrName, attrValue) {
        return typeof attrValue !== "function" && this.excludeAttributes.indexOf(attrName) === -1;
    },
    
    defaultNodeFilter : function (node) {
        return true;
    },
    
    serializeTree : function (config) {    
	    config = config || {};
        if (Ext.isEmpty(config.withChildren)) {
            config.withChildren = true;
        }
        
	    return Ext.encode(this.convertToSubmitNode(this.getRootNode(), config));	    
    },
    
    convertToSubmitNode : function (node, config) {
        config = config || {};
        
        if (!config.prepared) {
	        config.attributeFilter = config.attributeFilter || this.defaultAttributeFilter.createDelegate(this);
	        config.nodeFilter = config.nodeFilter || this.defaultNodeFilter.createDelegate(this);
	        config.prepared = true;
	    }
        
        if (!config.nodeFilter(node)) {
	        return;
	    }
        
        var sNode = {}, 
            path = node.getPath(config.pathAttribute || "id"), 
            deleteAttrs = true;
        
        if (config.attributeFilter("id", node.id)) {
            sNode.nodeID = node.id;
        }
        
        if (config.attributeFilter("text", node.text)) {
            sNode.text = config.encode ? Ext.util.Format.htmlEncode(node.text) : node.text;
        }
        
        if (config.attributeFilter("path", path)) {
            sNode.path = path;
        }
        
        sNode.attributes = {};
        
        var attr;

        for (attr in node.attributes) {
            if (attr === "id" || attr === "text") {
                continue;
            }
        
            var attrValue = node.attributes[attr];
        
            if (config.attributeFilter(attr, attrValue)) {
                sNode.attributes[attr] = attrValue;
                deleteAttrs = false;
            }
        }
        
        if (deleteAttrs) {
            delete sNode.attributes;
        }
        
        if (config.withChildren) {
            var children = node.childNodes,
                i = 0;
            
	        if (children.length !== 0) {
	            sNode.children = [];
	            
	            for (i; i < children.length; i++) {
	                var cNode = this.convertToSubmitNode(children[i], config);
	               
	                if (!Ext.isEmpty(cNode)) {
	                    sNode.children.push(cNode);
	                }
	            }
	            
	            if (sNode.children.length === 0) {
	                delete sNode.children;
	            }
	        }
	    }
        
        return sNode;
    },
    
    getSelectedNodes : function (config) {
        var sm = this.getSelectionModel();
        if (!sm.selMap) {
            if (sm.selNode) {
                return this.convertToSubmitNode(sm.selNode, config);
            }
            return;
        }
        
        if (Ext.isEmpty(sm.selNodes)) {
            return [];
        }
        
        var selNodes = [];
        
        Ext.each(sm.selNodes, function (node) {
            selNodes.push(this.convertToSubmitNode(node, config));
        }, this);
        
        return selNodes;
    },
    
    getCheckedNodes : function (config) {
        var checkedNodes = this.getChecked();
        
        if (Ext.isEmpty(checkedNodes)) {
            return [];
        }
        
        var nodes = [];
        
        Ext.each(checkedNodes, function (node) {
            nodes.push(this.convertToSubmitNode(node, config));
        }, this);
        
        return nodes;
    },
    
    updateSelection : function () {      
        this.selectionSubmitConfig = this.selectionSubmitConfig || {};
        
        if (Ext.isEmpty(this.selectionSubmitConfig.withChildren)) {
            this.selectionSubmitConfig.withChildren = false;
        }
        
        var selection = this.getSelectedNodes(this.selectionSubmitConfig);  
        
        if (!Ext.isEmpty(selection)) {
            this.getSelectionModelField().setValue(Ext.encode(selection));
        } else {
            this.getSelectionModelField().setValue("");
        }
    },
    
    updateCheckSelection : function () {      
        this.selectionSubmitConfig = this.selectionSubmitConfig || {};
        
        if (Ext.isEmpty(this.selectionSubmitConfig.withChildren)) {
            this.selectionSubmitConfig.withChildren = false;
        }
        
        var selection = this.getCheckedNodes(this.selectionSubmitConfig);  
        
        if (!Ext.isEmpty(selection)) {
            this.getCheckNodesField().setValue(Ext.encode(selection));
        } else {
            this.getCheckNodesField().setValue("");
        }
    },
    
    submitNodes : function (config) {
        var nodes = this.serializeTree(config),
            ac = Ext.apply(this.directEventConfig || {}, config);

        if (ac.params) {
            ac.extraParams = ac.params;
            delete ac.params;
        }
        
        if (ac.callback) {
            ac.userCallback = ac.callback;
            delete ac.callback;
        }
        
        if (ac.scope) {
            ac.userScope = ac.scope;
            delete ac.scope;
        }
        
        Ext.apply(ac, {
            control       : this,
            eventType     : "postback",
            action        : "submit",
            serviceParams : nodes,
            userSuccess   : this.submitSuccess,
            userFailure   : this.submitFailure
        });

        Ext.net.DirectEvent.request(ac);
    },
    
    submitFailure : function (response, result, context, type, action, extraParams, o) {
        var msg = { message : result.errorMessage || response.statusText };
        
        if (o && o.userCallback) {
            o.userCallback.call(o.userScope || context, o, false, response);
        }
        
        if (!context.hasListener("submitexception")) {
            if (o.showWarningOnFailure !== false && o.cancelFailureWarning !== true) {
                Ext.net.DirectEvent.showFailure(response, msg.message);
            }
        }
        
        context.fireEvent("submitexception", context, o, response, msg);
    },

    submitSuccess : function (response, result, context, type, action, extraParams, o) {
        try {
            var responseObj = result.serviceResponse;
            result = { success: responseObj.success, msg: responseObj.message };
        } catch (e) {
            if (o && o.userCallback) {
                o.userCallback.call(o.userScope || context, o, false, response);
            }
            
            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", {}, { "errorMessage" : e.message }, null, null, null, null, o) !== false) {
                if (!context.hasListener("submitexception")) {
                    if (o.showWarningOnFailure !== false) {
                        Ext.net.DirectEvent.showFailure(response, e.message);
                    }
                }
            }             
            
            context.fireEvent("submitexception", context, o, response, e);
            
            return;
        }

        if (!result.success) {
            if (o && o.userCallback) {
                o.userCallback.call(o.userScope || context, o, false, response);
            }
            
            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", {}, { "errorMessage" : result.msg }, null, null, null, null, o) !== false) {
                if (!context.hasListener("submitexception")) {
                    if (o.showWarningOnFailure !== false) {
                        Ext.net.DirectEvent.showFailure(response, result.msg);
                    }
                }
            }           
            
            context.fireEvent("submitexception", context, o, response, { message : result.msg });
            
            return;
        }

        if (o && o.userCallback) {
            o.userCallback.call(o.userScope || context, o, true, response);
        }
        
        context.fireEvent("submit", context, o);
    },
    
    filterBy : function (fn, config) {
		config = config || {};
		var startNode = config.startNode || this.root;
		
		if (config.autoClear) {
			this.clearFilter();
		}
		
		var af = this.filtered;

		var f = function (n) {
			if (n === startNode) {
				return true;
			}
			
			if (af[n.id]) {
				return false;
			}
			
			var m = fn.call(config.scope || n, n);
			
			if (!m) {
				af[n.id] = n;
				n.ui.hide();
			} else {
				n.ui.show();
				
				n.bubble(function (p) {
				    if (p.id === this.root.id) {
				        return false;
				    }
				    
				    p.ui.show();
				}, this);
			}
			
			return true;
		};
		
		startNode.cascade(f, this);	
		
		if (config.expandNodes !== false) {
		    startNode.expand(true, false);
		}
		
        if (config.remove) {
            var id;

            for (id in af) {
                if (typeof id !== "function") {
                    var n = af[id];

                    if (n && n.parentNode) {
                        n.parentNode.removeChild(n);
                    }
                }
            } 
        }
	},
	
    clearFilter : function () {
        var af = this.filtered || {},
            id;
        
        for (id in af) {
            if (typeof id !== "function") {
                var n = af[id];
                
                if (n) {
                    n.ui.show();
                }
            }
        }
        
        this.filtered = {};
    },
    
    toggleChecked: function (startNode, value) {
        startNode = startNode || this.root;
 
        var f = function () {
            if (this.getUI().rendered) {
                this.getUI().toggleCheck(Ext.isDefined(value) ? value : !this.attributes.checked);
            } else {
                if (Ext.isDefined(this.attributes.checked)) {
                    this.attributes.checked = Ext.isDefined(value) ? value : !this.attributes.checked;
                }
            }
        };
        startNode.cascade(f);
    },
    
    clearChecked : function (startNode) {
        this.toggleChecked(startNode, false);
    },
    
    setAllChecked : function (startNode) {
        this.toggleChecked(startNode, true);
    },
    
    // cfg : (required)ids, (optional)value, (optional)keepExisting, (optional)silent
    setChecked : function (cfg) {
        cfg = cfg || {};
        
        if (cfg.silent) {
            this.suspendEvents();
        }
        
        if (cfg.keepExisting !== true) {
            this.clearChecked();
        }      
        
        cfg.value = Ext.isDefined(cfg.value) ? cfg.value : true;
        
        var i = 0,
            l;

        for (i, l = cfg.ids.length; i < l; i++) {
            var node = this.getNodeById(cfg.ids[i]);
            
            if (node.getUI().rendered) {
                node.getUI().toggleCheck(cfg.value);
            } else {
                node.attributes.checked = cfg.value;
            }
        } 
        
        if (cfg.silent) {
            this.resumeEvents();
        }
    }        
});

Ext.reg("nettreepanel", Ext.net.TreePanel);

// @source core/tree/TreeNode.js

Ext.override(Ext.tree.TreeNode, {
    removeChildren : function () {
        while (this.childNodes.length > 0) {
            this.removeChild(this.childNodes[0]);
        }
    },
    
    clone : function (newId) {
        var atts = this.attributes;
        
        atts.id = (newId !== false) ? Ext.id() : this.id;
        
        var clonedNode = new Ext.tree.TreeNode(Ext.apply({}, atts)),
            i = 0;

        clonedNode.text = this.text;

        for (i; i < this.childNodes.length; i++) {
            clonedNode.appendChild(this.childNodes[i].clone(newId));
        }
        
        return clonedNode;
    }
});

// @source core/tree/TreeNodeUI.js

Ext.tree.TreeNodeUI.prototype.renderElements = Ext.tree.TreeNodeUI.prototype.renderElements.createSequence(function (n, a, targetNode, bulkRender) {
    if (n.hidden) {
        this.hide();
    }
});

Ext.tree.TreeNodeUI.override({
    collapse : function () {
        this.updateExpandIcon();

        if (this.rendered) {
            this.ctNode.style.display = "none";
        }
    }
});

// @source core/tree/AsyncTreeNode.js

Ext.tree.AsyncTreeNode.override({
    loadNodes : function (nodes) {
        this.beginUpdate();

        var i = 0,
            len;

        for (i, len = nodes.length; i < len; i++) {
            var n = this.getOwnerTree().getLoader().createNode(nodes[i]);

            if (!Ext.isEmpty(n)) {
                if (this.getOwnerTree().getLoader().preloadChildren) {
                    this.getOwnerTree().getLoader().doPreload(n);
                }

                this.appendChild(n);
            }
        }

        this.endUpdate();
        this.loadComplete();
    }
});

// @source core/tree/TreeLoader.js

Ext.tree.TreeLoader.override({
    requestData : function (node, callback, scope) {
        if (this.fireEvent("beforeload", this, node, callback) !== false) {
            var o = {
                method   : this.requestMethod,
                url      : this.dataUrl || this.url,
                success  : this.handleResponse,
                failure  : this.handleFailure,
                scope    : this,
                timeout  : this.timeout || 30000,
                argument : { 
                    callback : callback, 
                    node     : node, 
                    scope    : scope 
                }
            };
            
            if (this.json) {            
                o.jsonData =  this.getParams(node);
            } else {
                o.params =  this.getParams(node);
            }
            
            this.transId = Ext.Ajax.request(o);
        } else {
            // if the load is cancelled, make sure we notify
            // the node that we are done
            this.runCallback(callback, scope || node, []);
        }
    },
    
    createNode : function (attr) {
        if (this.baseAttrs) {
            Ext.applyIf(attr, this.baseAttrs);
        }
        
        if (this.applyLoader !== false && !attr.loader) {
            attr.loader = this;
        }
        
        if (typeof attr.uiProvider === "string") {
            attr.uiProvider = this.uiProviders[attr.uiProvider] || eval(attr.uiProvider);
        }

        var node;
        
        if (attr.nodeType) {
            node = new Ext.tree.TreePanel.nodeTypes[attr.nodeType](attr);
        } else {
            node = attr.leaf ?
                new Ext.tree.TreeNode(attr) :
                new Ext.tree.AsyncTreeNode(attr);
        }

        if (this.preloadChildren) {
            this.doPreload(node);
        }

        return node;
    }
});

// @source core/tree/WebServiceTreeLoader.js

Ext.NetServiceTreeLoader = Ext.extend(Ext.tree.TreeLoader, {
    // private override
    processResponse : function (response, node, callback) {
        var json,
            root;
        
        if (this.json) {        
            root = Ext.decode(response.responseText);
            json = root.d || root;
        } else {
            var xmlData = response.responseXML;
            
            root = xmlData.documentElement || xmlData;                
            json = Ext.DomQuery.selectValue("json", root, "");        
        }
        

        try {
            var o = Ext.isString(json) ? eval("(" + json + ")") : json,
                i = 0,
                len;
            
            node.beginUpdate();
            
            for (i, len = o.length; i < len; i++) {
                var n = this.createNode(o[i]);

                if (n) {
                    node.appendChild(n);
                }
            }
            
            node.endUpdate();
            
            if (typeof callback === "function") {
                callback(this, node);
            }
        } catch (e) {
            this.handleFailure(response);
        }
    }
});

// @source core/tree/PageTreeLoader.js

Ext.net.PageTreeLoader = Ext.extend(Ext.tree.TreeLoader, {
    load : function (node, callback) {
        if (this.clearOnLoad) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        }
        
        if (this.doPreload(node)) {
            if (typeof callback === "function") {
                callback();
            }
        } else {
            this.requestData(node, callback);
        }
    },

    requestData : function (node, callback) {
        if (this.fireEvent("beforeload", this, node, callback) !== false) {
            var config = {};

            Ext.apply(config, {
                control       : node.getOwnerTree(),
                eventType     : "postback",
                action        : "nodeload",
                userSuccess   : this.handleSuccess,
                userFailure   : this.handleFailure,
                argument      : { callback : callback, node : node },
                extraParams   : this.getParams(node),
                method        : this.method,
                timeout       : this.timeout || 30000,
                isUpload      : this.isUpload,
                viewStateMode : this.viewStateMode,
                type          : this.type,
                url           : this.url,
                formProxyArg  : this.formProxyArg,
                eventMask     : this.eventMask
            });
            
            Ext.net.DirectEvent.request(config);

        } else {
            if (typeof callback === "function") {
                callback();
            }
        }
    },

    handleFailure : function (response, result, context, type, action, extraParams) {
        var loader = context.getLoader(),
            a;
            
        loader.transId = false;
        
        a = response.argument;
        
        loader.fireEvent("loadexception", loader, a.node, response, result.errorMessage || response.statusText);
        
        if (typeof a.callback === "function") {
            a.callback(loader, a.node);
        }
    },

    handleSuccess : function (response, result, context, type, action, extraParams) {
        var loader = context.getLoader(),
            serviceResponse = result.serviceResponse || {},
            a;

        loader.transId = false;
        
        a = response.argument;
        
        loader.processResponse(response, serviceResponse.data || [], a.node, a.callback);
        loader.fireEvent("load", loader, a.node, response);
    },

    getParams : function (node) {
        var buf = {}, 
            bp = this.baseParams,
            key;
        
        for (key in bp) {
            if (typeof bp[key] !== "function") {
                buf[key] = bp[key];
            }
        }
        
        buf.node = node.id;
        return buf;
    },

    processResponse : function (response, data, node, callback) {
        try {
            var o = data,
                i = 0,
                len;

            node.beginUpdate();
            
            for (i, len = o.length; i < len; i++) {
                var n = this.createNode(o[i]);

                if (n) {
                    node.appendChild(n);
                }
            }
            
            node.endUpdate();
            
            if (typeof callback === "function") {
                callback(this, node);
            }
        } catch (e) {
            this.handleFailure(response);
        }
    }
});

// @source core/tree/TreeSelectionModel.js

Ext.override(Ext.tree.MultiSelectionModel, {
    onNodeClick : function (node, e) {
        var keep = e.ctrlKey || this.keepSelectionOnClick === "always";
        
        if (keep && this.isSelected(node)) {
            this.unselect(node);
        } else {
            this.select(node, e, keep);
        }
    }
});

// @source core/tree/TreeEditor.js

Ext.net.TreeEditor = function (config) {
    Ext.net.TreeEditor.superclass.constructor.call(this, config.tree, {}, config);
};

Ext.extend(Ext.net.TreeEditor, Ext.tree.TreeEditor, {
    autoEdit : true,
    
    initEditor : function (tree) {
        if (this.autoEdit) {
            this.autoEdit = false;
            this.setAutoEdit(true);
        }
        this.on("complete", this.updateNode, this);
        this.on("beforestartedit", this.fitToTree, this);
        this.on("startedit", this.bindScroll, this, { delay : 10 });
        this.on("specialkey", this.onSpecialKey, this);
    },
    
    setAutoEdit : function (autoEdit) {
        if (autoEdit && !this.autoEdit) {
            this.tree.on("beforeclick", this.beforeNodeClick, this);
            this.tree.on("dblclick", this.onNodeDblClick, this);
            this.autoEdit = autoEdit;
            return;
        }
        
        if (!autoEdit && this.autoEdit) {
            this.tree.un("beforeclick", this.beforeNodeClick, this);
            this.tree.un("dblclick", this.onNodeDblClick, this);
            this.autoEdit = autoEdit;
            return;
        }
    },
    
    beforeNodeClick : function (node, e, defer) {
        clearTimeout(this.autoEditTimer);
        
        if (this.tree.getSelectionModel().isSelected(node)) {
            if (this.filter) {
                if (((this.filter.attribute === "text" || this.filter.attribute === "id") ? node[this.filter.attribute] : node.attributes[this.filter.attribute]) !== this.filter.value) {
                    return;
                }                
            }
            
            if (!Ext.isEmpty(this.tree.activeEditor, false) && this.tree.activeEditor !== this.id) {
                return;
            }
        
            Ext.each(this.tree.editors, function (editor) {
                editor.completeEdit();
            }, this);
        
            return this.triggerEdit(node, defer);
        }
    }
});

Ext.reg("treeeditor", Ext.net.TreeEditor);

// @source core/Viewport.js


Ext.net.Viewport = Ext.extend(Ext.Container, {
    initComponent : function () {
        Ext.net.Viewport.superclass.initComponent.call(this);
        var html = document.getElementsByTagName("html")[0];
        html.className += " x-viewport";
        html.style.height = "100%";
        this.el = Ext.get(Ext.getBody());
        var el = Ext.get(this.renderTo || Ext.net.ResourceMgr.getAspForm());
        this.el.setHeight = this.el.setWidth = this.el.setSize = Ext.emptyFn;        
        this.el.dom.scroll = "no";

        if (el) {
            el.setHeight = el.setWidth = el.setSize = Ext.emptyFn;
            el.dom.scroll = "no";
        }

        this.allowDomMove = false;
        this.autoWidth = this.autoHeight = true;
        this.autoHeight = true;
        Ext.EventManager.onWindowResize(this.fireResize, this);
        //this.renderTo = this.el;
        
        Ext.getBody().applyStyles({
            overflow : "hidden",
            margin   : "0",
            padding  : "0",
            border   : "0px none",
            height   : "100%"
        });
        
        this.el.applyStyles({ height : "100%", width : "100%" });

        if (el) {
            el.applyStyles({ height : "100%", width : "100%" });
        }
        
        this.el = Ext.get(this.renderTo || Ext.net.ResourceMgr.getAspForm() || Ext.getBody());
        this.renderTo = this.el;
    },

    fireResize : function (w, h) {
        this.fireEvent("resize", this, w, h, w, h);
    }
});

Ext.reg("netviewport", Ext.net.Viewport);

// @source core/Window.js

Ext.Window.override({
    closeAction : "hide",
    
    initCenter  : true,
    
    defaultRenderTo : "body",
    
    showModal : function () {
        this.initMask();
        this.modal = true;
        Ext.getBody().addClass("x-body-masked");
        this.mask.setSize(Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true));
        this.mask.show();
    },
    
    hideModal : function () {
        this.initMask();
        this.modal = false;
        this.mask.hide();
        Ext.getBody().removeClass("x-body-masked");
    },
    
    initMask : function () {
        if (!this.mask) {
            this.mask = this.container.createChild({ cls : "ext-el-mask" }, this.el.dom);
            this.mask.enableDisplayMode("block");
            this.mask.hide();
            this.mask.on("click", this.focus, this);
        }
    },
    
    isModal : function () {
        return this.modal || false;
    },
    
    toggleModal : function () {
        var show = this.modal = !this.isModal();
        this[show ? "showModal" : "hideModal"]();
    },
    
    center : function () {
        var xy = this.el.getAlignToXY(Ext.getBody(), "c-c?");
        this.setPagePosition(xy[0], xy[1]);
        
        return this;
    },
    
    fitContainer : function () {
        var isForm = this.container.dom == (Ext.net.ResourceMgr.getAspForm() || {}).dom,
            vs = isForm ? Ext.getBody().getViewSize() : this.container.getViewSize(false);

        this.setSize(vs.width, vs.height);
    }
});

Ext.Window.prototype.initComponent = Ext.Window.prototype.initComponent.createInterceptor(function () {
    if (this.initCenter === true && Ext.isEmpty(this.pageX) && Ext.isEmpty(this.pageY)) {
        if (!this.maximized) {
            this.mon(this, "beforeshow", this.center, this, { single : true });
        } else {
            this.mon(this, "restore", this.center, this, { single : true });
        }
    }
});

Ext.Window.prototype.show = Ext.Window.prototype.show.createInterceptor(function () {
    if (!this.rendered) {
        this.render(this.renderTo || (this.defaultRenderTo === "body" ? Ext.getBody() : Ext.net.ResourceMgr.getAspForm()));
    }
});

Ext.MessageBox.show = Ext.MessageBox.show.createInterceptor(function () {
    var dlg = this.getDialog("&#160;");

    if (dlg.closeAction === "hide") {
        dlg.closeAction = "close";
        dlg.mon(dlg.tools.close, "click", dlg.close.createDelegate(dlg, []));
    }
});

// @source core/TabPanel.js

Ext.TabPanel.prototype.initComponent = Ext.TabPanel.prototype.initComponent.createSequence(function () {
    this.addEvents("beforetabclose", "beforetabhide", "tabclose");
    
    this.on("beforetabchange", function (el, newTab) {
        newTab = newTab || {};
        this.getActiveTabField().setValue(this.getTabId(newTab) + ':' + el.items.indexOf(newTab));
    }, this);
    
    if (this.tabPostback) {
        this.on("afterrender", function () {
            this.on("beforetabchange", function (el, newTab) {
                this.tabPostback.call(this);
                return false;                
            }, this);
        }, this);
    }
    
    this.on("render", function () {
        this.getActiveTabField().render(this.el.parent() || this.el);
    }, this);
});

Ext.TabPanel.override({
    getTabId : function (tab) {
        return tab.id;
    },
    
    getActiveTabField : function () {
        if (!this.activeTabField) {
            this.activeTabField = new Ext.form.Hidden({ 
                id    : this.id + "_ActiveTab", 
                name  : this.id + "_ActiveTab", 
                value : this.id + ":" + (this.activeTab || 0)
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.activeTabField);	
        }

        return this.activeTabField;
    },

    onStripMouseDown : function (e) {
        if (e.button !== 0) {
            return;
        }
        
        if (!Ext.isIE9) {
            e.preventDefault();
        }

        this.focus();
        
        var t = this.findTargets(e);
        
        if (t.close) {
            this.closeTab(t.item);

            return;
        }
        
        if (t.item && t.item != this.activeTab) {
            if (Ext.isIE9) {
               this.setActiveTab.defer(100, this, [t.item]);
            } else {
                this.setActiveTab(t.item);
            }
        }
    },

    closeTab : function (tab, closeAction) {
        if (typeof tab === "string") {
            tab = this.getItem(tab);
        } else if (typeof tab === "number") {
            tab = this.items.get(tab);
        }

        if (Ext.isEmpty(tab)) {
            return;
        }

        var eventName = tab.closeAction || closeAction || "close",
            destroy = (eventName === "close");

        if (this.fireEvent("beforetab" + eventName, this, tab) === false) {
            return;
        }

        if (tab.fireEvent("before" + eventName, tab) === false) {
            return;
        }

        if (destroy) {
            tab.fireEvent("close", tab);
        }       
        
        if (!destroy) {
            this.hideTabStripItem(tab);        
            tab.addClass("x-hide-display");
        }
                
        this.fireEvent("tabclose", this, tab);
        
        this.remove(tab, destroy);
        
        if (!destroy) {
            tab.fireEvent("close", tab);
        }
    },

    addTab : function (tab, index, activate) {
        var config = {};

        if (!Ext.isEmpty(index)) {
            if (typeof index === "object") {
                config = index;
            } else if (typeof index === "number") {
                config.index = index;
            } else {
                config.activate = index;
            }
        }

        if (!Ext.isEmpty(activate)) {
            config.activate = activate;
        }

        if (this.items.getCount() === 0) {
            this.activeTab = null;
        }

        if (!Ext.isEmpty(config.index) && config.index >= 0) {
            tab = this.insert(config.index, tab);
        } else {
            tab = this.add(tab);
        }

        if (config.activate !== false) {
            this.setActiveTab(tab);
        }
    }
});

// @source core/ColorPalette.js

Ext.override(Ext.ColorPalette, {
    silentSelect : function (color) {
        color = color.replace("#", "");
        
        if (color !== this.value || this.allowReselect) {
            var el = this.el;
            
            if (this.value) {
                el.child("a.color-" + this.value).removeClass("x-color-palette-sel");
            }
            
            if (!Ext.isEmpty(color, false)) {
                el.child("a.color-" + color).addClass("x-color-palette-sel");
            } else {
                color = null;
            }
            
            this.value = color;
        }
    },
	
	getColorField : function () {
        if (!this.colorField) {
            this.colorField = new Ext.form.Hidden({ id : this.id + "_Color", name : this.id + "_Color" });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.colorField);
        }
        
        return this.colorField;
    }
});

Ext.ColorPalette.prototype.onRender = Ext.ColorPalette.prototype.onRender.createSequence(function (el) {
    this.on("select", function (cp, color) {
        this.getColorField().setValue(color);
    });
    this.getColorField().render(this.el.parent() || this.el);
});

// @source core/DatePicker.js

Ext.DatePicker.prototype.initComponent = Ext.DatePicker.prototype.initComponent.createSequence(function () {
    var fn = function () { 
        this.getInputField().setValue(this.getValue().dateFormat("Y-m-d\\Th:i:s")); 
    };
    
    this.on("render", fn, this);
    this.on("select", fn, this);
});

Ext.DatePicker.prototype.onRender = Ext.DatePicker.prototype.onRender.createSequence(function (el) {
    this.getInputField().render(this.el.parent() || this.el);    
    this.initValue();    
    this.setReadOnly(this.readOnly);
});

//Ext.DatePicker.prototype.update = Ext.DatePicker.prototype.update.createSequence(function (date, forceRefresh) {
//    if (date.getTime() != (this.value ? this.value.clearTime(true) : new Date().clearTime()).getTime()) {
//        this.cells.removeClass("x-date-selected");    
//    }
//});

Ext.DatePicker.override({
    readOnly       : false,
    hideWithLabel  : true,
    isFormField    : true,
    
    getName        : Ext.form.Field.prototype.getName,
    initValue      : Ext.form.Field.prototype.initValue,
    isDirty        : Ext.form.Field.prototype.isDirty,
    reset          : Ext.form.Field.prototype.reset,
    isValid        : Ext.form.Field.prototype.isValid,
    validate       : Ext.form.Field.prototype.validate,
    processValue   : Ext.form.Field.prototype.processValue,
    validateValue  : Ext.form.Field.prototype.validateValue,
    getErrors      : Ext.form.Field.prototype.getErrors,
    clearInvalid   : Ext.emptyFn,
    markInvalid    : Ext.emptyFn,
    getRawValue    : Ext.form.Field.prototype.getValue,
    setRawValue    : Ext.form.Field.prototype.setValue,    
    getReadOnly    : Ext.form.Field.prototype.getReadOnly,
    adjustWidth    : Ext.form.Field.prototype.adjustWidth,
    hideNote       : Ext.form.Field.prototype.hideNote,
    showNote       : Ext.form.Field.prototype.showNote,
    hideFieldLabel : Ext.form.Field.prototype.hideFieldLabel,
    showFieldLabel : Ext.form.Field.prototype.showFieldLabel,
    initNote       : Ext.form.Field.prototype.initNote,
    
    getInputField : function () {
        if (!this.inputField) {
            this.inputField = new Ext.form.Hidden({ 
                id   : this.id + "_Input", 
                name : this.id + "_Input" 
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.inputField);
        }
        
        return this.inputField;
    },
    
    setReadOnly : function (readOnly) {
        if (this.rendered) {
            this.el.dom.readOnly = readOnly;
        }
        
        this.readOnly = readOnly;
        this.doDisabled(readOnly);
    },
    
    setDisabledDates : function (dd) {
        if (Ext.isArray(dd)) {
            this.disabledDates = dd;
            this.disabledDatesRE = null;
        } else {
            this.disabledDatesRE = dd;
            this.disabledDates = null;
        }
        this.initDisabledDays();
        this.update(this.value, true);
    },
    
    update : function(date, forceRefresh){
        if(this.rendered){
            var vd = this.activeDate, vis = this.isVisible();
            this.activeDate = date;
            if(!forceRefresh && vd && this.el){
                var t = date.getTime();
                if(vd.getMonth() == date.getMonth() && vd.getFullYear() == date.getFullYear()){
                    this.cells.removeClass('x-date-selected');
                    this.cells.each(function(c){
                       if(c.dom.firstChild.dateValue == t){
                           c.addClass('x-date-selected');
                           if(vis && !this.cancelFocus){
                               Ext.fly(c.dom.firstChild).focus(50);
                           }
                           return false;
                       }
                    }, this);
                    return;
                }
            }
            var days = date.getDaysInMonth(),
                firstOfMonth = date.getFirstDateOfMonth(),
                startingPos = firstOfMonth.getDay()-this.startDay;

            if(startingPos < 0){
                startingPos += 7;
            }
            days += startingPos;
            date = date.clone();
            date.setHours(1);

            var pm = date.add('mo', -1),
                prevStart = pm.getDaysInMonth()-startingPos,
                cells = this.cells.elements,
                textEls = this.textNodes,
                // convert everything to numbers so it's fast
                d = (new Date(pm.getFullYear(), pm.getMonth(), prevStart, this.initHour)),
                today = new Date(),
                sel = date.clearTime(true).getTime(),
                min = this.minDate ? this.minDate.clearTime(true) : Number.NEGATIVE_INFINITY,
                max = this.maxDate ? this.maxDate.clearTime(true) : Number.POSITIVE_INFINITY,
                ddMatch = this.disabledDatesRE,
                ddText = this.disabledDatesText,
                ddays = this.disabledDays ? this.disabledDays.join('') : false,
                ddaysText = this.disabledDaysText,
                format = this.format;
                
            if(this.showToday){
                var td = new Date().clearTime(),
                    disable = (td < min || td > max ||
                    (ddMatch && format && ddMatch.test(td.dateFormat(format))) ||
                    (ddays && ddays.indexOf(td.getDay()) != -1));

                if(!this.disabled){
                    this.todayBtn.setDisabled(disable);
                    this.todayKeyListener[disable ? 'disable' : 'enable']();
                }
            }

            var setCellClass = function(cal, cell){
                cell.title = '';
                var t = d.clearTime(true).getTime();
                cell.firstChild.dateValue = t;
                if(t == today){
                    cell.className += ' x-date-today';
                    cell.title = cal.todayText;
                }
                if(t == sel){
                    cell.className += ' x-date-selected';
                    if(vis){
                        Ext.fly(cell.firstChild).focus(50);
                    }
                }
                // disabling
                if(t < min) {
                    cell.className = ' x-date-disabled';
                    cell.title = cal.minText;
                    return;
                }
                if(t > max) {
                    cell.className = ' x-date-disabled';
                    cell.title = cal.maxText;
                    return;
                }
                if(ddays){
                    if(ddays.indexOf(d.getDay()) != -1){
                        cell.title = ddaysText;
                        cell.className = ' x-date-disabled';
                    }
                }
                if(ddMatch && format){
                    var fvalue = d.dateFormat(format);
                    if(ddMatch.test(fvalue)){
                        cell.title = ddText.replace('%0', fvalue);
                        cell.className = ' x-date-disabled';
                    }
                }
            };

            var i = 0;
            for(; i < startingPos; i++) {
                textEls[i].innerHTML = (++prevStart);
                d.setDate(d.getDate()+1);
                cells[i].className = 'x-date-prevday';
                setCellClass(this, cells[i]);
            }
            for(; i < days; i++){
                var intDay = i - startingPos + 1;
                textEls[i].innerHTML = (intDay);
                d.setDate(d.getDate()+1);
                cells[i].className = 'x-date-active';
                setCellClass(this, cells[i]);
            }
            var extraDays = 0;
            for(; i < 42; i++) {
                 textEls[i].innerHTML = (++extraDays);
                 d.setDate(d.getDate()+1);
                 cells[i].className = 'x-date-nextday';
                 setCellClass(this, cells[i]);
            }

            this.mbtn.setText(this.monthNames[date.getMonth()] + ' ' + date.getFullYear());

            if(!this.internalRender){
                var main = this.el.dom.firstChild,
                    w = main.offsetWidth;
                this.el.setWidth(w + this.el.getBorderWidth('lr'));
                Ext.fly(main).setWidth(w);
                this.internalRender = true;
                // opera does not respect the auto grow header center column
                // then, after it gets a width opera refuses to recalculate
                // without a second pass
                if(Ext.isOpera && !this.secondPass){
                    main.rows[0].cells[1].style.width = (w - (main.rows[0].cells[0].offsetWidth+main.rows[0].cells[2].offsetWidth)) + 'px';
                    this.secondPass = true;
                    this.update.defer(10, this, [date]);
                }
            }
        }
    }	
});

// @source core/Editor.js

Ext.Editor.override({
    activateEvent : "click",
    
    initTarget : function () {
        if (this.isSeparate) {
            this.field = Ext.ComponentMgr.create(this.field, "textfield");
        }
        
        if (!Ext.isEmpty(this.target, false)) {            
            var targetEl = Ext.net.getEl(this.target);
            
            if (!Ext.isEmpty(targetEl)) {
                this.initTargetEvents(targetEl);
            } else {
                var getTargetTask = new Ext.util.DelayedTask(function (task) {
                    targetEl = Ext.get(this.target);
                    
                    if (!Ext.isEmpty(targetEl)) {                            
                        this.initTargetEvents(targetEl);
                        task.cancel();
                        delete this.getTargetTask;
                    } else {
                        task.delay(500, undefined, this, [task]);
                    }
                }, this);
                this.getTargetTask = getTargetTask;
                getTargetTask.delay(1, undefined, this, [getTargetTask]);
            }
        } 
    },
    
    retarget : function (target) {
        if (this.getTargetTask) {
            this.getTargetTask.cancel();
            delete this.getTargetTask;
        }
        
        this.target = Ext.net.getEl(target);
        
        if (this.target && this.target.un && !Ext.isEmpty(this.activateEvent, false)) {
            if (this.target.isComposite) {
                this.target.each(function (item) {
                    item.un(this.activateEvent, this.activateFn, item.dom);
                }, this);
            } else {
                this.target.un(this.activateEvent, this.activateFn, this.target.dom);            
            }
        }
        
        this.initTargetEvents(this.target);            
    },

    initTargetEvents : function (targetEl) {
        this.target = targetEl;
        
        var ed = this,
            activate = function () {
                if (!ed.disabled) {
                    ed.startEdit(this);
                }
            };
        
        this.activateFn = activate;
        
        if (!Ext.isEmpty(this.activateEvent, false)) {
            if (this.target.isComposite) {
                this.target.each(function (item) {
                    item.on(this.activateEvent, this.activateFn, item.dom);
                }, this);
            } else {
                this.target.on(this.activateEvent, this.activateFn, this.target.dom);            
            }
        }
    },
    
    onBlur : function () {
        if (this.editing && this.cancelOnBlur === true) {
            this.cancelEdit();
            return;
        }
        
        if (this.allowBlur === true && this.editing && this.selectSameEditor !== true) {
            this.completeEdit();
        }
    }
});

Ext.Editor.prototype.initComponent = Ext.Editor.prototype.initComponent.createSequence(function () {
    this.initTarget();
});

Ext.Editor.prototype.completeEdit = Ext.Editor.prototype.completeEdit.createInterceptor(function () {
    if (!this.editing) {
        return;
    }
    
    if (this.field.checkOnBlur) {
        this.field.checkOnBlur();
    }
});

// @source core/Slider.js

Ext.Slider.prototype.onRender = Ext.Slider.prototype.onRender.createSequence(function (el) {
    this.getValueField().render(this.el.parent() || this.el);
});

Ext.Slider.prototype.initComponent = Ext.Slider.prototype.initComponent.createSequence(function () {    
    this.valuesState = {};
    this.on("change", function (el, newValue, thumb) {
        var sb = [],
            i = 0;

        for (i; i < this.thumbs.length; i++) {
            sb.push(this.thumbs[i].value);
        }
        
        this.getValueField().setValue(sb.join(","));
    });
});

Ext.Slider.override({    
    getValueField : function () {
        if (!this.valueField) {
            this.valueField = new Ext.form.Hidden({ 
                id   : this.id + "_Value", 
                name : this.id + "_Value"
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.valueField);	
        }
        
        return this.valueField;
    }
});

Ext.form.SliderField.override({
    initComponent : function () {
        var cfg;

        if (this.initialConfig.slider) {
            cfg = this.initialConfig.slider;
        } else {        
            cfg = Ext.copyTo({
                id : this.id + "-slider"
            }, this.initialConfig, ["vertical", "minValue", "maxValue", "decimalPrecision", "keyIncrement", "increment", "clickToChange", "animate"]);
            
            // only can use it if it exists.
            if (this.useTips) {
                var plug = this.tipText ? {getText: this.tipText} : {};
                cfg.plugins = [new Ext.slider.Tip(plug)];
            }
        }
        
        this.slider = cfg.render ? cfg : new Ext.Slider(cfg);
        Ext.form.SliderField.superclass.initComponent.call(this);
    }
});

// @source core/XTemplate.js

Ext.net.XTemplate = function (config) {
    config = config || {};
    var html;
    
    this.proxyId = config.proxyId;
    
    if (config.el) {
        config.el = Ext.getDom(config.el);
        html = config.el.value || config.el.innerHTML;
    } else {
        html = config.html;
        
        if (Ext.isArray(html)) {
            html = html.join("");
        }
    }
    
    Ext.net.XTemplate.superclass.constructor.call(this, html, config.functions);
};

Ext.extend(Ext.net.XTemplate, Ext.XTemplate, {
    destroy : function () {
        var ns = this.ns || Ext.net.ResourceMgr.ns,
            id = this.itemId || this.proxyId;        
            
        if (ns && id) {                
            if (Ext.isObject(ns) && ns[id]) {
                try {
                    delete ns[id];
                } catch (e) {
                    ns[id] = undefined;
                }
            } else if (Ext.net.ResourceMgr.getCmp(ns + "." + id)) {
                try {
                    delete Ext.ns(ns)[id];
                } catch (f) {
                    Ext.ns(ns)[id] = undefined;
                }
            }
        } else if (window[this.proxyId]) {
            window[this.proxyId] = null;
        }
    }
});

// @source core/utils/History.js

// Unfortunatelly we need use whole Ext.History we need override private functions
// when IE8 fix will be included to the ExtJS repository we can remove it
Ext.History = (function () {
    var iframe, 
        hiddenField,
        ready = false,
        currentToken;

    function getHash() {
        var href = location.href, i = href.indexOf("#"),
            hash = i >= 0 ? href.substr(i + 1) : null;
             
        if (Ext.isGecko) {
            hash = decodeURIComponent(hash);
        }

        return hash;
    }

    var doSave = function () {
        hiddenField.value = currentToken;
    };

    var handleStateChange = function (token) {
        currentToken = token;
        Ext.History.fireEvent("change", token);
    };

    var updateIFrame = function (token) {
        var html = ['<html><body><div id="state">', Ext.util.Format.htmlEncode(token), "</div></body></html>"].join("");
        try {
            var doc = iframe.contentWindow.document;
            doc.open();
            doc.write(html);
            doc.close();
            return true;
        } catch (e) {
            return false;
        }
    };

    var checkIFrame = function () {
        if (!iframe.contentWindow || !iframe.contentWindow.document) {
            setTimeout(checkIFrame, 10);
            return;
        }

        var doc = iframe.contentWindow.document;
        var elem = doc.getElementById("state");
        var token = elem ? elem.innerText : null;

        var hash = getHash();

        setInterval(function () {

            doc = iframe.contentWindow.document;
            elem = doc.getElementById("state");

            var newtoken = elem ? elem.innerText : null;

            var newHash = getHash();

            if (newtoken !== token) {
                token = newtoken;
                handleStateChange(token);
                top.location.hash = token;
                hash = token;
                doSave();
            } else if (newHash !== hash) {
                hash = newHash;
                updateIFrame(newHash);
            }

        }, 50);

        ready = true;

        Ext.History.fireEvent("ready", Ext.History);
    };

    var startUp = function () {
        currentToken = hiddenField.value ? hiddenField.value : getHash();

        if (Ext.isIE6 || Ext.isIE7 || !Ext.isStrict && Ext.isIE8) {
            checkIFrame();
        } else {
            var hash = getHash();
            setInterval(function () {
                var newHash = getHash();
                
                if (newHash !== hash) {
                    hash = newHash;
                    handleStateChange(hash);
                    doSave();
                }
            }, 50);
            ready = true;
            Ext.History.fireEvent("ready", Ext.History);
        }
    };

    return {
        
        fieldId : "x-history-field",
        
        iframeId : "x-history-frame",
        
        events : {},

        
        init : function (onReady, scope) {
            if (this.listeners) {
                this.on(this.listeners);
                delete this.listeners;
            }
            
            if (ready) {
                Ext.callback(onReady, scope, [this]);
                return;
            }
            
            if (!Ext.isReady) {
                Ext.onReady(function () {
                    Ext.History.init(onReady, scope);
                });
                return;
            }
            
            hiddenField = Ext.getDom(Ext.History.fieldId);
            
            if (Ext.isIE6 || Ext.isIE7 || !Ext.isStrict && Ext.isIE8) {
                iframe = Ext.getDom(Ext.History.iframeId);
            }
            
            this.addEvents("ready", "change");
            
            if (onReady) {
                this.on("ready", onReady, scope, { single : true });
            }
            
            startUp();
        },

        
        add : function (token, preventDup) {
            if (preventDup !== false) {
                if (this.getToken() == token) {
                    return true;
                }
            }
            
            if (Ext.isIE6 || Ext.isIE7 || !Ext.isStrict && Ext.isIE8) {
                return updateIFrame(token);
            } else {
                top.location.hash = token;
                return true;
            }
        },

        
        back : function () {
            history.go(-1);
        },

        
        forward: function () {
            history.go(1);
        },

        
        getToken: function () {
            return ready ? currentToken : getHash();
        }
    };
})();

Ext.apply(Ext.History, new Ext.util.Observable());

// @source core/utils/Notification.js

Ext.net.Notification = function () {
    Ext.MessageBox.notify = function (title, msg) {
        if (Ext.isString(title)) {
            Ext.net.Notification.show({
                title: title,
                html: msg || ""
            });
        } else {
            Ext.net.Notification.show(title);
        }
    };

    var notifications = [];

    return {
        show: function (config) {
            config = Ext.applyIf(config || {}, {
                width: 200,
                height: 100,
                autoHide: true,
                plain: false,
                resizable: false,
                draggable: false,
                bodyStyle: "padding:3px;text-align:center",
                alignToCfg: {
                    el: document,
                    position: "br-br",
                    offset: [-20, -20]
                },
                showMode: "grid", 
                closeVisible: false,
                bringToFront: false,
                pinEvent: "none",
                hideDelay: 2500,
                shadow: false,
                showPin: false,
                pinned: false,
                showFx: {
                    fxName: "slideIn",
                    args: ["b", { duration: 1}]
                },
                hideFx: {
                    fxName: "ghost",
                    args: ["b", { duration: 1}]
                },

                
                focus: Ext.emptyFn,

                stopHiding: function () {
                    this.removeClass("x-notification-auto-hide");
                    this.pinned = true;

                    if (this.autoHide) {
                        this.hideTask.cancel();
                    }
                },

                isStandardAlign: function () {
                    return this.alignToCfg.el == document && this.alignToCfg.position === "br-br";
                },

                getStatndardAlign: function () {
                    var w = [],
                        i = 0;

                    for (i; i < notifications.length; i++) {
                        var window = notifications[i];

                        if (window.isStandardAlign()) {
                            w.push(window);
                        }
                    }

                    return w;
                },

                getOffset: function () {
                    var offset = [], predefinedOffset = this.alignToCfg.offset || [-20, -20];
                    //need clone
                    offset.push(predefinedOffset[0]);
                    offset.push(predefinedOffset[1]);

                    if (this.showMode === "grid" && this.isStandardAlign()) {
                        var saw = this.getStatndardAlign(),
                            height = this.getSize().height - offset[1],
                            width = this.getSize().width - offset[0],
                            yPos = Ext.fly(this.alignToCfg.el).getViewSize().height - height,
                            xPos = Ext.fly(this.alignToCfg.el).getViewSize().width - width,
                            found = false,
                            isIntersect = function (tBox, box) {
                                tBox.x2 = tBox.x + tBox.width;
                                tBox.y2 = tBox.y + tBox.height;

                                box.x2 = box.x + box.width;
                                box.y2 = box.y + box.height;

                                if ((tBox.x2 - box.x) <= 0 || (box.x2 - tBox.x) <= 0) {
                                    return false;
                                }

                                if ((tBox.y2 - box.y) <= 0 || (box.y2 - tBox.y) <= 0) {
                                    return false;
                                }

                                return true;
                            };

                        while (xPos >= 0 && !found) {
                            while (yPos >= 0 && !found) {
                                var intersect = false,
                                    i = 0;

                                for (i; i < saw.length; i++) {
                                    var window = saw[i];

                                    if (isIntersect({ x: xPos, y: yPos, width: width, height: height }, window.getBox())) {
                                        intersect = true;
                                        break;
                                    }
                                }

                                found = !intersect;

                                if (!found) {
                                    yPos -= height;
                                }
                            }

                            if (!found) {
                                yPos = Ext.fly(this.alignToCfg.el).getViewSize().height - height;
                                xPos -= width;
                            }
                        }

                        if (found) {
                            offset[0] = offset[0] + ((xPos + width) - Ext.fly(this.alignToCfg.el).getViewSize().width);
                            offset[1] = offset[1] + ((yPos + height) - Ext.fly(this.alignToCfg.el).getViewSize().height);
                        }
                    }

                    return offset;
                },
                animShow: function () {
                    var offset = this.getOffset();
                    notifications.push(this);
                    this.alignOffset = offset;
                    this.el.alignTo(this.alignToCfg.el || document, this.alignToCfg.position || "br-br", offset);

                    if (Ext.isArray(this.showFx.args) && this.showFx.args.length > 0) {
                        this.showFx.args[this.showFx.args.length - 1] = Ext.apply(this.showFx.args[this.showFx.args.length - 1], { callback: this.afterShow, scope: this });
                    } else {
                        this.showFx.args = [{ callback: this.afterShow, scope: this}];
                    }

                    this.el[this.showFx.fxName].apply(this.el, this.showFx.args);
                },
                animHide: function () {
                    if (Ext.isArray(this.hideFx.args) && this.hideFx.args.length > 0) {
                        this.hideFx.args[this.hideFx.args.length - 1] = Ext.apply(this.hideFx.args[this.hideFx.args.length - 1], { callback: this.doClose, scope: this });
                    } else {
                        this.showFx.args = [{ callback: this.doClose, scope: this}];
                    }

                    this.el[this.hideFx.fxName].apply(this.el, this.hideFx.args);
                }
            });

            config.cls = config.cls || "";
            config.cls += " x-notification" + (config.autoHide ? " x-notification-auto-hide" : "");

            var w = new Ext.Window(config),
                mOver = function (e, t) {
                    if (!this.pinned) {
                        this.hideTask.cancel();
                        this.delayed = true;
                    }
                },
                mOut = function (e, t) {
                    if (!this.pinned) {
                        this.hideTask.delay(this.hideDelay);
                        this.delayed = false;
                    }
                };

            w.on("render", function () {
                if (this.autoHide) {
                    this.body.on("mouseover", mOver, this);
                    this.body.on("mouseout", mOut, this);
                    this.header.on("mouseover", mOver, this);
                    this.header.on("mouseout", mOut, this);
                }

                if (this.contentEl) {
                    Ext.fly(this.contentEl).removeClass("x-hide-offsets");
                }
            }, w);

            w.afterRender = w.afterRender.createSequence(function () {
                if (this.showPin) {
                    this.pin = function (e, tool) {
                        tool.hide();
                        this.tools.pin.show();
                        this.hideTask.cancel();
                        this.pinned = true;
                    };

                    this.unpin = function (e, tool) {
                        tool.hide();
                        this.tools.unpin.show();
                        this.hide();
                        this.pinned = false;
                    };

                    this.addTool({
                        id: "unpin",
                        handler: this.pin,
                        hidden: this.pinned,
                        scope: this
                    });

                    this.addTool({
                        id: "pin",
                        handler: this.unpin,
                        hidden: !this.pinned,
                        scope: this
                    });
                }
            });

            w.toFront = function (e) {
                var aw = Ext.WindowMgr.getActive();

                this.manager.bringToFront(this);

                if (!Ext.isEmpty(aw) && aw !== this && !this.bringToFront && aw.manager) {
                    aw.manager.bringToFront(aw);
                    aw.manager.bringToFront.defer(10, aw.manager, [aw]);
                }

                return this;
            };

            w.focus = Ext.emptyFn;

            w.afterShow = w.afterShow.createSequence(function () {
                if (this.pinEvent !== "none") {
                    this.body.on(this.pinEvent, this.stopHiding, this);
                    this.on(this.pinEvent, this.stopHiding, this);
                }

                if (this.autoHide && !this.delayed && !this.pinned) {
                    this.hideTask.delay(this.hideDelay);
                }
            });

            w.on("beforedestroy", function () {
                var i = 0;

                for (i; i < notifications.length; i++) {
                    if (notifications[i].id == this.id) {
                        notifications.remove(this);
                        break;
                    }
                }

                if (this.contentEl) {
                    var ce = Ext.get(this.contentEl), el = Ext.net.ResourceMgr.getAspForm() || Ext.getBody();

                    ce.addClass("x-hidden");
                    el = el.dom;
                    el.appendChild(ce.dom);
                }

                if (this.initialConfig.id) {
                    window[this.initialConfig.id] = undefined;
                }
            }, w);

            if (config.autoHide) {
                w.hideTask = new Ext.util.DelayedTask(w.hide, w);
            }

            if (config.closeVisible) {
                var i = notifications.length - 1;

                for (i; i >= 0; i--) {
                    notifications[i].destroy();
                }
            }
            
            w.on("beforehide", function () {
                this.el.disableShadow();
            }, w);

            w.show(config.alignToCfg.el || document);

            return w;
        }
    };
}();

// @source core/utils/TaskManager.js

Ext.net.TaskResponse = { 
    stopTask : -1, 
    stopAjax : -2 
};

Ext.net.TaskManager = function (config) {
    Ext.apply(this, config || {});
    this.initManager.defer(this.autoRunDelay || 50, this);
};

Ext.extend(Ext.net.TaskManager, Ext.util.Observable, {
    tasksConfig: [],
    
    getTasks : function () {
        return this.tasks;
    },

    initManager : function () {
        this.runner = new Ext.util.TaskRunner(this.interval || 10);

        var task,
            i = 0;
                    
        this.tasks = [];

        for (i; i < this.tasksConfig.length; i++) {
            task = this.createTask(this.tasksConfig[i]);
            this.tasks.push(task);
            
            if (task.executing && task.autoRun) {
                this.startTask(task);
            }
        }
    },
    
    addTask : function (taskConfig) {
        var task = this.createTask(taskConfig);
        this.tasks.push(task);
        
        if (task.executing && task.autoRun) {
            this.startTask(task);
        }
    },
    
    removeTask : function (task) {
        task = this.getTask(task);
        if (!Ext.isEmpty(task)) {
            this.stopTask(task);
            this.tasks.remove(task);
        }
    },

    getTask : function (id) {
        if (typeof id === "object") {
            return id;
        } else if (typeof id === "string") {
            var i = 0;

            for (i; this.tasks.length; i++) {
                if (this.tasks[i].id === id) {
                    return this.tasks[i];
                }
            }
        } else if (typeof id === "number") {
            return this.tasks[id];
        }
        return null;
    },

    startTask : function (task) {
        if (this.executing) {
            return;
        }

        task = this.getTask(task);

        if (task.onstart) {
            task.onstart.apply(task.scope || task);
        }

        this.runner.start(task);
    },

    stopTask : function (task) { 
        this.runner.stop(this.getTask(task)); 
    },

    startAll : function () {
        var i = 0;

        for (i; i < this.tasks.length; i++) {
            this.startTask(this.tasks[i]);
        }
    },

    stopAll : function () { 
        this.runner.stopAll(); 
    },

    //private
    createTask : function (config) {
        return Ext.apply({}, config, {
            owner     : this,
            executing : true,
            interval  : 1000,
            autoRun   : true,
            onStop    : function (t) {
                this.executing = false;
                
                if (this.onstop) {
                    this.onstop();
                }
            },
            run : function () {
                if (this.clientRun) {
                    var rt = this.clientRun.apply(arguments);

                    if (rt === Ext.net.TaskResponse.stopAjax) {
                        return;
                    } else if (rt === Ext.net.TaskResponse.stopTask) {
                        return false;
                    }
                }
                
                if (this.serverRun) {
                    var o = this.serverRun();
                    o.control = this.owner;
                    Ext.net.DirectEvent.request(o);
                }
            }
        });
    },
    
    destroy : function () {
        var ns = this.ns || Ext.net.ResourceMgr.ns,
            id = this.itemId || this.proxyId;        
            
        if (ns && id) {                
            if (Ext.isObject(ns) && ns[id]) {
                try {
                    delete ns[id];
                } catch (e) {
                    ns[id] = undefined;
                }
            } else if (Ext.net.ResourceMgr.getCmp(ns + "." + id)) {
                try {
                    delete Ext.ns(ns)[id];
                } catch (f) {
                    Ext.ns(ns)[id] = undefined;
                }
            }
        } else if (window[this.proxyId]) {
            window[this.proxyId] = null;
        }
        
        this.stopAll();
        delete this.tasks;
        delete this.runner;
    }
});
// @source core/utils/ClickRepeater.js

Ext.net.ClickRepeater = function (config) {
    this.addEvents(
        "leftclick",
        "rightclick",
        "middleclick"
    );

    Ext.net.ClickRepeater.superclass.constructor.call(this, config.el, config);
};

Ext.extend(Ext.net.ClickRepeater, Ext.util.ClickRepeater, {
    ignoredButtons : [],
    btnEvents : {
        0 : "leftclick", 
        1 : "middleclick", 
        2 : "rightclick"
    },
    
    enable : function () {
        if (this.disabled) {
            this.el.on("mousedown", this.handleMouseDown, this);
            if ((this.preventDefault || this.stopDefault) && !this.isButtonIgnored(0)) {
                this.el.on("click", this.eventOptions, this);
            }
            if ((this.preventDefault || this.stopDefault) && !this.isButtonIgnored(2)) {
                this.el.on("contextmenu", this.eventOptions, this);
            }
        }
        this.disabled = false;
    },
    
    isButtonIgnored : function (e) {
        var ignored = false;

        Ext.each(this.ignoredButtons, function (b) {
            if (b == (e.button || e)) {
                ignored = true;
                return false;
            }
        }, this);
        
        return ignored;
    },
    
    handleMouseDown : function (e) {
        clearTimeout(this.timer);
        this.el.blur();

        if (this.pressClass) {
            this.el.addClass(this.pressClass);
        }
        
        this.mousedownTime = new Date();

        Ext.getDoc().on("mouseup", this.handleMouseUp, this);
        this.el.on("mouseout", this.handleMouseOut, this);

        if (!this.isButtonIgnored(e)) {
            this.fireEvent("mousedown", this, e);
            this.fireClick(e);
        }

        if (this.accelerate) {
            this.delay = 400;
	    }

        this.timer = this.click.defer(this.delay || this.interval, this, [e]);
    },
    
    click : function (e) {
        if (!this.isButtonIgnored(e)) {
            this.fireClick(e);
        }

        this.timer = this.click.defer(this.accelerate ?
            this.easeOutExpo(this.mousedownTime.getElapsed(),
                400,
                -390,
                12000) :
            this.interval, this, [e]);
    },
    
    fireClick : function (e) {        
        if (this.fireEvent("click", this, e) !== false) {
            this.fireEvent(this.btnEvents[e.button] || "click", this, e);
        }        
    },
    
    handleMouseReturn : function (e) {
        this.el.un("mouseover", this.handleMouseReturn, this);
        
        if (this.pressClass) {
            this.el.addClass(this.pressClass);
        }
        
        this.click(e);
    },
    
    handleMouseUp : function (e) {
        clearTimeout(this.timer);
        this.el.un("mouseover", this.handleMouseReturn, this);
        this.el.un("mouseout", this.handleMouseOut, this);
        Ext.getDoc().un("mouseup", this.handleMouseUp, this);
        this.el.removeClass(this.pressClass);
        
        if (!this.isButtonIgnored(e)) {
            this.fireEvent("mouseup", this, e);
        }
    }
});

// @source core/utils/Element.js

Ext.Element.addMethods({
    addKeyListenerEx : function (key, fn, scope) {
        this.addKeyListener(key, fn || key.fn, scope || key.scope);
        return this;
    },
    
    initDDEx : function (group, config, overrides) {
        this.initDD(group, config, overrides);
        return this;
    },
    
    initDDProxyEx : function (group, config, overrides) {
        this.initDDProxy(group, config, overrides);
        return this;
    },

    initDDTargetEx : function (group, config, overrides) {
        this.initDDTarget(group, config, overrides);
        return this;
    },
    
    positionEx : function (pos, zIndex, x, y) {
        this.position(pos, zIndex, x, y);
        return this;
    },
    
    relayEventEx : function (eventName, observable) { 
        this.relayEvent(eventName, observable);
        return this;
    },
    
    scrollEx : function (direction, distance, animate) {
        this.scroll(direction, distance, animate);
        return this;
    },
    
    unmaskEx : function () {
        this.unmask();
        return this;
    },
    
    singleSelect : function (selector, unique) {
        return Ext.get(Ext.select(selector, unique).elements[0]);
    },
    
    setValue : function (val) {
        if (Ext.isDefined(this.dom.value)) {
            this.dom.value = val;
        }
        
        return this;
    },
    
    getValue : function () {
        return Ext.isDefined(this.dom.value) ? this.dom.value : null;
    },
    
    mask : function (msg, msgCls) {
        var me  = this,
            dom = me.dom,
            dh  = Ext.DomHelper,
            EXTELMASKMSG = "ext-el-mask-msg",
            el,
            mask;

        if (!(/^body/i.test(dom.tagName) && me.getStyle("position") === "static") && !me.hasClass("x-page-mask")) {
            me.addClass("x-masked-relative");
        }
        
        el = Ext.Element.data(dom, "maskMsg");
        if (el) {
            el.remove();
        }
        
        el = Ext.Element.data(dom, "mask");
        if (el) {
            el.remove();
        }

        mask = dh.append(dom, {
            cls : "ext-el-mask"
        }, true);
        
        Ext.Element.data(dom, "mask", mask);

        me.addClass("x-masked");
        mask.setDisplayed(true);
        
        if (typeof msg === "string") {
            var mm = dh.append(dom, {
                cls : EXTELMASKMSG, 
                cn  : {
                    tag : "div"
                }
            }, true);
            
            Ext.Element.data(dom, "maskMsg", mm);
            mm.dom.className = msgCls ? EXTELMASKMSG + " " + msgCls : EXTELMASKMSG;
            mm.dom.firstChild.innerHTML = msg;
            mm.setDisplayed(true);
            mm.center(me);
        }
        
        // ie will not expand full height automatically
        if (Ext.isIE && !(Ext.isIE7 && Ext.isStrict) && me.getStyle("height") === "auto") {
            mask.setSize(undefined, me.getHeight());
        }
        
        return mask;
    } 
});

// @source core/dd/DragSource.js

Ext.dd.DragSource.override({
    getDropTarget : function (id) {
        var dd = null,
            i;
        
        for (i in Ext.dd.DragDropMgr.ids) {
            if (Ext.dd.DragDropMgr.ids[i][id]) {
                dd = Ext.dd.DragDropMgr.ids[i][id];
                
                if (dd.isNotifyTarget) {
                    return dd;
                }
            }
        }
        return dd;
    },
    
    onDragEnter : function (e, id) {
        var target = this.getDropTarget(id, true);
        this.cachedTarget = target;
        
        if (this.beforeDragEnter(target, e, id) !== false) {
            if (target.isNotifyTarget) {
                var status = target.notifyEnter(this, e, this.dragData);
                this.proxy.setStatus(status);
            } else {
                this.proxy.setStatus(this.dropAllowed);
            }
            
            if (this.afterDragEnter) {
                this.afterDragEnter(target, e, id);
            }
        }
    }
});

// in future, check that Window is dragable under Chrome, if true then remove the following code
Ext.dd.DragDropMgr.getLocation = function(oDD) {
	if (! this.isTypeOfDD(oDD)) {
		return null;
	}

	var el = oDD.getEl(), pos, x1, x2, y1, y2, t, r, b, l;

	try {
		pos= Ext.lib.Dom.getXY(el);
	} catch (e) { }

	if (!pos) {
		return null;
	}

	x1 = pos[0];
	x2 = x1 + el.offsetWidth;
	y1 = pos[1];
	y2 = y1 + el.offsetHeight;

	t = y1 - oDD.padding[0];
	r = x2 + oDD.padding[1];
	b = y2 + oDD.padding[2];
	l = x1 - oDD.padding[3];

	return new Ext.lib.Region( t, r, b, l );
};

// @source core/dd/ProxyDDCreator.js

Ext.net.ProxyDDCreator = function (config) {
    Ext.net.ProxyDDCreator.superclass.constructor.call(this, config);    
    this.config = config || {};
    
    if (!Ext.isEmpty(this.config.target, false)) {
        var targetEl = Ext.net.getEl(this.config.target);

        if (!Ext.isEmpty(targetEl)) {
            this.initDDControl(targetEl);
        } else {
            this.task = new Ext.util.DelayedTask(function () {
                targetEl = Ext.net.getEl(this.config.target);

                if (!Ext.isEmpty(targetEl)) {
                    this.task.cancel();
                    this.initDDControl(targetEl);                    
                } else {
                    this.task.delay(500);
                }
            }, this);
            
            this.task.delay(1);
        }
    }
};

Ext.extend(Ext.net.ProxyDDCreator, Ext.util.Observable, {
    initDDControl : function (target) {
        target = Ext.net.getEl(target);
        
        if (target.isComposite) {
            this.ddControl = [];
            target.each(function (targetEl) {
                this.ddControl.push(this.createControl(Ext.apply(Ext.net.clone(this.config), { id : Ext.id(targetEl) })));
            }, this);
        } else {
            this.ddControl = this.createControl(Ext.apply(Ext.net.clone(this.config), { id : Ext.id(target) }));
        }
    },
    
    createControl: function (config) {
        var ddControl;
        
        if (config.group) {
            ddControl = new config.type(config.id, config.group, config.config);
            Ext.apply(ddControl, config.config);
        } else {
            ddControl = new config.type(config.id, config.config);
        }        
        
        return ddControl;
    },
    
    lock : function () {
        Ext.each(this.ddControl, function (dd) {
            if (dd && dd.lock) {
                dd.lock();
            }
        });
    },
    
    unlock : function () {
        Ext.each(this.ddControl, function (dd) {
            if (dd && dd.unlock) {
                dd.unlock();
            }
        });
    },
    
    unreg : function () {
        Ext.each(this.ddControl, function (dd) {
            if (dd && dd.unreg) {
                dd.unreg();
            }
        });
    },
    
    destroy : function () {
        Ext.each(this.ddControl, function (dd) {
            if (dd && dd.unreg) {
                dd.unreg();
            }
        });
    }
});

// @source core/dd/DragTracker.js

Ext.dd.DragTracker.override({
    onMouseMove : function (e, target) {
        // HACK: IE hack to see if button was released outside of window. */
        if (this.active && Ext.isIE && !e.browserEvent.button && !Ext.isIE9) {
            e.preventDefault();
            this.onMouseUp(e);

            return;
        }

        e.preventDefault();
        var xy = e.getXY(), s = this.startXY;
        this.lastXY = xy;

        if (!this.active) {
            if (Math.abs(s[0]-xy[0]) > this.tolerance || Math.abs(s[1]-xy[1]) > this.tolerance) {
                this.triggerStart(e);
            } else {
                return;
            }
        }

        this.fireEvent('mousemove', this, e);
        this.onDrag(e);
        this.fireEvent('drag', this, e);
    }
});

Ext.net.DragTracker = function (config) {
    Ext.net.DragTracker.superclass.constructor.call(this, config);    
};

Ext.extend(Ext.net.DragTracker, Ext.dd.DragTracker, {
    proxyCls : "x-view-selector",
    
    onStart : function (xy) {
        if (!this.proxy) {
            this.proxy = this.el.createChild({ cls : this.proxyCls });
        } else {
            this.proxy.setDisplayed("block");
        }
    },

    onDrag : function (e) {
        var startXY = this.startXY,
            xy = this.getXY(),
            x = Math.min(startXY[0], xy[0]),
            y = Math.min(startXY[1], xy[1]),
            w = Math.abs(startXY[0] - xy[0]),
            h = Math.abs(startXY[1] - xy[1]);
        
        this.dragRegion.left = x;
        this.dragRegion.top = y;
        this.dragRegion.right = x + w;
        this.dragRegion.bottom = y + h;

        this.proxy.setRegion(this.dragRegion);	
    },

    onEnd : function (e) {
        if (this.proxy) {
            this.proxy.setDisplayed(false);
        }
    }
});

Ext.lib.Region.prototype.isIntersect = function (region) {
	var t = Math.max(this.top, region.top),
	    r = Math.min(this.right, region.right),
	    b = Math.min(this.bottom, region.bottom),
	    l = Math.max(this.left, region.left);

    return b >= t && r >= l;
};

// @source core/init/End.js

(function () {
    var buf = [];

    if (!Ext.isIE6) {
        buf.push(".x-form-radio-group .x-panel-body,.x-form-check-group .x-panel-body{background-color:transparent;} .x-form-cb-label-nowrap{white-space:nowrap;} .x-form-cb-label-nowrap .x-form-item-label{white-space:normal;}.x-label-icon{width:16px;height:16px;margin-left:3px;margin-right:3px;vertical-align:middle;border:0px !important;}.x-label-value{vertical-align:middle;}");
    }

    if (Ext.isIE6) {
        buf.push(".x-label-icon{width:16px;height:16px;vertical-align:middle;}");
        buf.push(".ext-ie6 .x-toolbar .x-tab-panel div{font-size:1px;}");
        buf.push(".ext-ie6 .x-grid-editor .x-form-text {top:0px !important;}");
        buf.push(".ext-ie6 .x-form-field-wrap.x-form-field-trigger-wrap{padding-bottom:1px;}");
        buf.push(".ext-ie6 .x-form-element .x-form-field-wrap.x-form-field-trigger-wrap{padding-bottom:0px;}");
        buf.push(".x-layout-split{background-color:transparent;} .ext-strict .ext-ie6 .x-layout-split{background-color:transparent!important;filter:none;}");
        buf.push(".ext-ie6 .x-form-group .x-form-group-header-text {margin-left:0px !important;left:5px;}");
    }

    if (Ext.isIE7) {
        buf.push(".ext-ie7 .x-tree-editor .x-form-text{margin: 0px 0px !important;}");
        buf.push(".ext-ie7 .x-toolbar .x-tab-panel div{font-size:1px;}");
        buf.push(".ext-ie7 .x-grid3 .x-grid-editor .x-form-text {top:0px !important;margin-top:0px !important;}");
    }

    if (Ext.isIE) {
        buf.push(".ext-ie .x-form-check-wrap.x-item-disabled{filter:none;}");
        buf.push(".ext-ie .x-item-disabled.x-box-item{filter: none;}");
        buf.push(".ext-ie .x-fieldset LEGEND{margin-bottom:0px;}");
    }

    buf.push(".ext-ie6 .x-form-field-trigger-wrap .x-form-text, .ext-ie7 .x-form-field-trigger-wrap .x-form-text{margin-bottom: -2px;}");
    // buf.push(".ext-ie6 .x-form-field-trigger-wrap, .ext-ie7 .x-form-field-trigger-wrap{padding-bottom: 1px;} ");
    buf.push(".ext-ie6 .x-form-item .x-form-field-trigger-wrap .x-form-text, .ext-ie7 .x-form-item .x-form-field-trigger-wrap .x-form-text{margin-bottom: -1px;} ");
    buf.push(".ext-ie8 .x-toolbar-cell .x-form-field-trigger-wrap .x-form-text{top:0px;}");
    buf.push(".x-textfield-icon{background-repeat:no-repeat;background-position:0 50%;width:16px;height:16px;margin-left:1px;}.x-textfield-icon-input{padding-left:20px;}.x-form-field-wrap .x-textfield-icon{top:3px;left:2px;}");
    buf.push("input.x-tree-node-cb{margin-left:1px;height:18px;vertical-align:bottom;}.x-tree-node .x-tree-node-inline-icon{background:transparent;height:16px !important;}.x-field-note{font-size:12px;color:gray;}.x-field-multi{float:left;padding-right:3px;position:relative;}div.x-inline-toolbar{padding:0px !important;border:0px !important;background-color:transparent !important;background-image:none !important;}");
    buf.push(".x-grid3 .x-row-expander-control TABLE{table-layout: auto;} .x-grid3 .x-row-expander-control TABLE.x-grid3-row-table, .x-grid3 .x-row-expander-control .x-grid3-header-offset table {table-layout:fixed;} .x-fieldset.x-form-invalid{border-color:#c30;}");
    buf.push(".ext-ie6 ul.x-menu-list li.x-menu-sep-li{height:5px !important;}");
    buf.push(".x-form-item.x-form-label-top label.x-form-item-label{width:auto;float:none;clear:none;display:inline;margin-bottom:4px;position:static;}");
    buf.push(".x-menu-field-icon{top:auto;margin-top:3px;margin-left:3px;}");
    buf.push(".x-toolbar-classic .x-btn-tl{background-position:0 0} .x-toolbar-classic .x-btn-tr{background-position:-3px 0} .x-toolbar-classic .x-btn-tc{background-position:0 -6px} .x-toolbar-classic .x-btn-ml{background-position:0 -24px} .x-toolbar-classic .x-btn-mr{background-position:-3px -24px} .x-toolbar-classic .x-btn-mc{background-position:0 -1096px} .x-toolbar-classic .x-btn-bl{background-position:0 -3px} .x-toolbar-classic .x-btn-br{background-position:-3px -3px} .x-toolbar-classic .x-btn-bc{background-position:0 -15px}");
    buf.push(".x-table-layout-cell{vertical-align:top;}");
    buf.push(".x-form-field-wrap.x-top-note .x-form-trigger{top:auto;}");
    buf.push(".x-btn-no-arrow{padding-right:0px !important;background:none !important;}");
    buf.push(".x-form-indicator{height:18px;position:absolute;left:0;top:0;display:block;background-color: transparent;background-repeat:no-repeat;background-position:0 3px;padding-top:3px;}");
    buf.push(".x-column-layout-ct {overflow:hidden;zoom:1;}");
    buf.push(".x-column-layout-bg-ct, .x-column-layout-bg-ct .x-column-inner {background-color:#f0f0f0;}");
    buf.push(".x-theme-blue .x-column-layout-bg-ct, .blue .x-column-layout-bg-ct .x-column-inner {background-color:#dfe8f6;}");
    buf.push(".x-fieldset.x-column{padding:10px;padding-top:0px;}");
    buf.push(".x-top-note-label{margin-top:14px;}");
    buf.push(".x-form-item .x-form-element .x-form-display-field{padding-top:3px;}");
    buf.push(".ux-layout-center-item{margin:0 auto;text-align:left;}");
    buf.push(".x-form-field-wrap .x-form-text.clear-right{border-right:0px !important} .x-form-field-wrap img.shift-trigger{margin-left:-1px !important}");
    buf.push(".x-combo-list-item{border: 1px dotted white;} .x-multi-selected{border: 1px dotted black;cursor:pointer;} .x-mcombo-nimg-item img {height:16px;width:0px;float:left;} .x-mcombo-img-item img {width:16px;height:16px;float:left;background-color: transparent; background-position: -1px -1px !important; background-repeat:no-repeat !important;}");
    buf.push(".ux-editable-grid{padding:0;}");
    buf.push(".x-notification-auto-hide .x-tool-close{display:none !important}");
    buf.push(".x-grid3-row-expanded .x-grid3-row-expander {background-position:-21px 2px;} .x-grid3-row-collapsed .x-grid3-row-expander {background-position:4px 2px;} .x-grid3-row-expanded .x-grid3-row-body {display:block !important;} .x-grid3-row-collapsed .x-grid3-row-body {display:none !important;}");
    buf.push(".x-form-invalid.x-form-composite{background-color:transparent !important;}");
    buf.push(".x-form-file-wrap.x-box-item{position:absolute;}");    
    buf.push(".x-fieldset{padding-top: 0px !important;}");       
    
    if (Ext.isIE9) {
        buf.push(".ext-ie input.x-tree-node-cb, .ext-strict .ext-ie9 .ext-ie input.x-tree-node-cb, .ext-ie9 .x-form-check-wrap input {width:auto;height:auto;}");
    } 

    if (Ext.isIE7 && (document.documentMode === 7 || document.documentMode === 5)) {
        buf.push(".ext-ie7 .x-form-text{margin-top: 0px;}");
    }

    // shim fix - http://forums.ext.net/showthread.php?7979
    buf.push(".ext-shim{background-color:#cccccc;}");

    // http://forums.ext.net/showthread.php?12628
    buf.push(".x-tab-strip-text{text-overflow:ellipsis;white-space:nowrap;overflow:hidden;}");

    Ext.net.ResourceMgr.registerCssClass("Ext.Net.CSS", buf.join(""));

    Ext._stringFormat = String.format;

    Ext.onReady(function () {
        String.format = Ext._stringFormat;
    });

    if (typeof Sys !== "undefined") {
        Sys.Application.notifyScriptLoaded();
    }
})();
