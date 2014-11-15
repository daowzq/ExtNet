
// @source core/layout/ContainerLayout.js

Ext.layout.ContainerLayout.prototype.layout = Ext.layout.ContainerLayout.prototype.layout.createInterceptor(function () {
    if (this.activeItem) {
        this.activeItem = this.container.getComponent(this.activeItem);
    }
});