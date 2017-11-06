const events = require( './events.js' ),
	logging = require( './logging.js' ).getLogger( 'spoof' ),
	util = require( './util.js' ),
	{ Cc, Ci, Cu } = require( 'chrome' ),
	Services = Cu.import( 'resource://gre/modules/Services.jsm', {} ).Services;

function syncWaitPromise( promise ) {
	var v, r, result = null;
	promise.then(
		function ( r ) { result = [ true, r ]; },
		function ( r ) { result = [ false, r ]; }
	);

	// eslint-disable-next-line no-unmodified-loop-condition
	while ( result === null ) {
		// processNextEvent is evil
		Services.tm.currentThread.processNextEvent( true );
	}

	[ v, r ] = result;
	if ( v ) {
		return r;
	} else {
		throw r;
	}
}

exports.init = function ( page ) {
	var ua = page.settings.userAgent,
		firefoxVersion = ua.match( /rv:([0-9.]+)/ )[ 1 ];
	page.settings.userAgent = ua.replace( /SlimerJS\/.+/, 'Firefox/' + firefoxVersion );
	Services.prefs.setCharPref( 'general.useragent.override', page.settings.userAgent );
	logging.info( `User agent changed from '${ua}' to '${page.settings.userAgent}'` );

	Cc[ '@mozilla.org/categorymanager;1' ]
		.getService( Ci.nsICategoryManager )
		.deleteCategoryEntry( 'JavaScript-global-property', 'callPhantom', true );
	logging.info( 'Ensured global callPhantom is not defined' );

	for ( let cb of [ 'onAlert', 'onAuthPrompt', 'onConfirm', 'onFilePicker', 'onPrompt' ] ) {
		events[ cb ]( function () {
			var length = 1000;
			logging.info( `Synchronous wait ${length} ms`, cb );
			syncWaitPromise( util.wait( length ) );
		} );
	}

	events.onInitialized( function () {
		if ( page.url ) { // Only second call
			let uaGuest = page.evaluate( function () {
				return window.navigator.userAgent;
			} );
			if ( uaGuest !== page.settings.userAgent ) {
				logging.warn( `Unexpected user agent: ${uaGuest}` );
			}
			if ( page.evaluate( function () {
				return Boolean( window.callPhantom ) || window.hasOwnProperty( 'callPhantom' );
			} ) ) {
				logging.warn( 'window.callPhantom() found unexpectedly' );
			}
		}
	} );
};
