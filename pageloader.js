const events = require( './events.js' ),
	logging = require( './logging.js' ).getLogger( 'pageloader' ),
	util = require( './util.js' );
var loadPromise,
	deferredLoad = {
		resolve: util.noop,
		reject: util.noop
	},
	deferredWait = {
		resolve: util.noop,
		reject: util.noop
	};

events.onLoadFinished( function ( status, url, isFrame ) {
	if ( isFrame ) { return; }
	if ( status !== 'success' ) {
		logging.info( `Loading '${url}' failed` );
		setTimeout( () => deferredLoad.reject( new Error( 'Unable to load the address' ) ), 1000 );
	} else {
		logging.info( `Loading '${url}' succeeded` );
		deferredLoad.resolve( url );
	}
} );

events.onLoadStarted( function ( url, isFrame ) {
	if ( isFrame ) { return; }
	logging.debug( `Loading '${url}' started` );
	deferredWait.resolve();
} );

loadPromise = function ( loader, requireload ) {
	return new Promise( ( resolve, reject ) => {
		new Promise( ( waitresolve, waitreject ) => {
			deferredWait.resolve = waitresolve;
			deferredWait.reject = waitreject;
		} ).catch( function ( e ) {
			if ( requireload ) {
				reject( e );
			} else if ( requireload !== null ) {
				resolve( e );
			}
		} );
		deferredLoad.resolve = resolve;
		deferredLoad.reject = reject;

		Promise.resolve( loader() ).then( function () {
			if ( requireload !== null ) {
				setTimeout( () => deferredWait.reject( new Error( 'Timeout waiting for loading to start' ) ), 500 );
			}
		}, function ( e ) {
			reject( e );
		} );
	} );
};

exports.load = async function ( loader, checker = util.noop, requireload = true ) {
	deferredLoad.reject( new Error( 'Superseded' ) );
	while ( true ) {
		let data = await loadPromise( loader, requireload );
		loader = util.noop;
		requireload = null;
		try {
			await checker();
		} catch ( e ) {
			logging.warn( e );
			await util.wait( 500 );
			continue;
		}
		return data;
	}
};
