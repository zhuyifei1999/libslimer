const logging = require( './logging.js' ).getLogger( 'inputs' ),
	util = require( './util.js' );

module.exports = {
	async mouseclick( page, x, y ) {
		logging.info( `Mouse click x=${x}, y=${y}` );
		// We must consider the scrollbar size of around 20 pixels
		while ( true ) {
			await util.wait( 50 );
			let cur = page.scrollPosition;
			if ( y < page.scrollPosition.top ) {
				cur.top -= 256;
			} else if ( y > page.scrollPosition.top + page.viewportSize.height - 20 ) {
				cur.top += 256;
			} else {
				break;
			}
			page.scrollPosition = cur;
		}
		while ( true ) {
			await util.wait( 50 );
			let cur = page.scrollPosition;
			if ( x < page.scrollPosition.left ) {
				cur.left -= 256;
			} else if ( x > page.scrollPosition.left + page.viewportSize.width - 20 ) {
				cur.left += 256;
			} else {
				break;
			}
			page.scrollPosition = cur;
		}
		util.wait( 100 );
		page.sendEvent( 'mousemove', x - page.scrollPosition.left, y - page.scrollPosition.top );
		util.wait( 50 );
		page.sendEvent( 'click', x - page.scrollPosition.left, y - page.scrollPosition.top );
	},
	async typetext( page, text ) {
		if ( typeof text[ Symbol.iterator ] === 'function' ) {
			logging.info( `Type '${text}'` );
		} else {
			logging.info( `Type ${text}` );
			text = [ text ];
		}
		await util.wait( 500 );
		for ( let char of text ) {
			await util.wait( 40 );
			page.sendEvent( 'keydown', char );
			await util.wait( 10 );
			page.sendEvent( 'keyup', char );
			page.sendEvent( 'keypress', char );
		}
	}
};
