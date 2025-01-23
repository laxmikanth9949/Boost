sap.ui.define([], function() {
    "use strict"; 

    return jQuery.sap.resources({
        url: [jQuery.sap.getModulePath("sap.support.boost"), "i18n/i18n.properties"].join("/"),
        locale: sap.ui.getCore().getConfiguration().getLanguage()
    });
});
