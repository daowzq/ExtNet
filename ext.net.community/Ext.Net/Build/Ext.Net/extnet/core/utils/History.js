
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
        /**
         * The id of the hidden field required for storing the current history token.
         * @type String
         * @property
         */
        fieldId : "x-history-field",
        /**
         * The id of the iframe required by IE to manage the history stack.
         * @type String
         * @property
         */
        iframeId : "x-history-frame",
        
        events : {},

        /**
         * Initialize the global History instance.
         * @param {Boolean} onReady (optional) A callback function that will be called once the history
         * component is fully initialized.
         * @param {Object} scope (optional) The callback scope
         */
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

        /**
         * Add a new token to the history stack. This can be any arbitrary value, although it would
         * commonly be the concatenation of a component id and another id marking the specifc history
         * state of that component.  Example usage:
         * <pre><code>
// Handle tab changes on a TabPanel
tabPanel.on('tabchange', function (tabPanel, tab) {
    Ext.History.add(tabPanel.id + ':' + tab.id);
});
</code></pre>
         * @param {String} token The value that defines a particular application-specific history state
         * @param {Boolean} preventDuplicates When true, if the passed token matches the current token
         * it will not save a new history step. Set to false if the same state can be saved more than once
         * at the same history stack location (defaults to true).
         */
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

        /**
         * Programmatically steps back one step in browser history (equivalent to the user pressing the Back button).
         */
        back : function () {
            history.go(-1);
        },

        /**
         * Programmatically steps forward one step in browser history (equivalent to the user pressing the Forward button).
         */
        forward: function () {
            history.go(1);
        },

        /**
         * Retrieves the currently-active history token.
         * @return {String} The token
         */
        getToken: function () {
            return ready ? currentToken : getHash();
        }
    };
})();

Ext.apply(Ext.History, new Ext.util.Observable());