const GUEST_CP_NAME = require( '../util.js' ).randomStr(),
	guest = require( '../guest.js' ),
	{ Cc, Ci } = require( 'chrome' );

Cc[ '@mozilla.org/categorymanager;1' ]
	.getService( Ci.nsICategoryManager )
	.addCategoryEntry( 'JavaScript-global-property', GUEST_CP_NAME, '@slimerjs.org/callphantom;1', false, false );

guest.registerModule( 'callPhantom', function () {
	module.exports = window[ GUEST_CP_NAME ];
}, {
	GUEST_CP_NAME: JSON.stringify( GUEST_CP_NAME )
}, false );
