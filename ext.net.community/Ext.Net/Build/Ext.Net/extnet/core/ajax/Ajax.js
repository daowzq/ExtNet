
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