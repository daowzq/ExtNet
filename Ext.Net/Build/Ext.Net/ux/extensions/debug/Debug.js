
// @source core/Debug.js

Ext.net.Debug = function () {
    return {
        isExt : function () {
            return !Ext.isEmpty(Ext.debug) && !Ext.isEmpty(Ext.debug.log);
        },
        
        isFirebug : function () {
            return !Ext.isEmpty(window.Firebug);
        },
        
        log : function (text) {
            if (this.isExt()) {
                Ext.debug.log(text);
                return;
            }
            
            if (this.isFirebug()) {
                window.Firebug.Console.log(text);
            }
        },
        
        show : function () {
            if (this.isExt()) {
                Ext.debug.showConsole();
                return;
            }
            
            if (this.isFirebug()) {
                window.Firebug.chrome.toggle(true, false);
            }
        },
        
        hide : function () {
            if (this.isExt()) {
                Ext.debug.hideConsole();
                return;
            }
            
            if (this.isFirebug()) {
                window.Firebug.chrome.toggle(false, false);
            }
        },
        
        getConsole : function () {
            if (this.isExt()) {
                return Ext.debug;
            }
            
            if (this.isFirebug()) {
                return window.Firebug;
            }
        },
        
        activate : function (config, callback) {
            if (Ext.isEmpty(config) || 
                Ext.isEmpty(config.type, false) || 
                Ext.isEmpty(config.css, false) || 
                Ext.isEmpty(config.script, false)) {
                return;
            }
           
            switch (config.type.toLowerCase()) {
            case "ext":
                if (Ext.debug && Ext.debug.log) {
                    return;
                }
                
                break;
            case "firebug":
                if (window.Firebug) {
                    return;
                }
                
                break;
            }
            
            var consoleCss = document.createElement("style");
            consoleCss.setAttribute("src", config.css);
            document.body.appendChild(consoleCss);
            
            var consoleScript = document.createElement("script");
            consoleScript.setAttribute("src", config.script);
            document.body.appendChild(consoleScript);
            
            (function () {
                switch (config.type.toLowerCase()) {
                case "ext":
                    if (Ext.debug && Ext.debug.log) {
                        if (callback) {
                            callback();                                        
                        }
                    } else if (callback) {
                        setTimeout(arguments.callee);
                    }
                    
                    break;
                case "firebug":
                    if (window.Firebug && window.Firebug.chrome) {                        
                        if (callback) {
                            callback();                                        
                        }
                    } else {
                        setTimeout(arguments.callee);
                    }
                    
                    break;
                }                        
            })();
        }
    };
}();