
// @source core/layout/AccordionLayout.js

Ext.layout.AccordionLayout.prototype.renderItem = Ext.layout.AccordionLayout.prototype.renderItem.createSequence(function (c) {
    if (this.originalHeader) {
        c.header.removeClass('x-accordion-hd');
    }
});
