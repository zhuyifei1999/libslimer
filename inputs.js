const logging = require( './logging.js' ).getLogger( 'inputs' ),
	statistics = require( './statistics.js' ),
	util = require( './util.js' );

function rand( v ) {
	return v + statistics.randomBoxMuller()[ 0 ] * 0.25 * v;
}

module.exports = {
	async mouseclick( page, x, y ) {
		logging.info( `Mouse click x=${x}, y=${y}` );
		util.wait( rand( 500 ) );
		page.sendEvent( 'mousemove', x, y );
		util.wait( rand( 50 ) );
		page.sendEvent( 'click', x, y );
	},
	async typetext( page, text ) {
		if ( typeof text[ Symbol.iterator ] === 'function' ) {
			logging.info( `Type '${text}'` );
		} else {
			logging.info( `Type ${text}` );
			text = [ text ];
		}
		await util.wait( rand( 500 ) );
		for ( let char of text ) {
			await util.wait( rand( 40 ) );
			page.sendEvent( 'keydown', char );
			await util.wait( rand( 10 ) );
			page.sendEvent( 'keyup', char );
			page.sendEvent( 'keypress', char );
		}
	}
};
