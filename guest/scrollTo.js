const events = require( '../events.js' ),
	guest = require( '../guest.js' ),
	logging = require( '../logging.js' ).getLogger( 'guest.scrollTo' ),
	statistics = require( '../statistics.js' );

guest.registerModule( 'scrollTo', function () {
	module.exports = function ( x, y, center = false ) {
		return JSON.parse( require( 'callPhantom.js' )( [ 'scrollTo', [ x, y, center ] ] ) );
	};
}, undefined, false );

events.onCallback( function ( val ) {
	var type, msg;
	try {
		[ type, msg ] = val;
	} catch ( e ) {
		return;
	}
	if ( type === 'scrollTo' ) {
		this.continuing = false;
		let [ x, y, center ] = msg, offset,
			origScroll = this.page.scrollPosition;
		if ( center ) {
			let [ vx, vy ] = statistics.randomBoxMuller();
			if ( x !== undefined ) { x -= this.page.viewportSize.width / 2 * ( 1 + 0.25 * vx ); }
			if ( y !== undefined ) { y -= this.page.viewportSize.height / 2 * ( 1 + 0.25 * vy ); }
		}
		x = x === undefined ? origScroll.left : x;
		y = y === undefined ? origScroll.top : y;
		this.page.scrollPosition = { left: x, top: y };
		offset = [
			this.page.scrollPosition.left - origScroll.left,
			this.page.scrollPosition.top - origScroll.top
		];
		this.setReturnVal( JSON.stringify( offset ) );
		logging.info( `Scroll offset x=${offset[ 0 ]}, y=${offset[ 1 ]}` );
	}
} );
