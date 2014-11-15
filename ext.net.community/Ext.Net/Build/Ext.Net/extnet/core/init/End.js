
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