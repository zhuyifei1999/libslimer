const scrollTo = require( './scrollTo.js' ),
	statistics = require( './statistics.js' );

module.exports = {
	closest( e, selector ) {
		while ( true ) {
			e = e.parentNode;
			if ( e === null ) {
				return;
			}
			if ( e.matches( selector ) ) {
				return e;
			}
		}
	},
	randomCoords( e, m = 0.5, s = 0.25, check = true ) {
		if ( typeof m === 'number' ) { m = [ m, m ]; }
		if ( typeof s === 'number' ) { s = [ s, s ]; }

		let [ mx, my ] = m,
			[ sx, sy ] = s;
		for ( let i = 0; i < 16; i++ ) {
			let rect = e.getBoundingClientRect(),
				[ vx, vy ] = statistics.randomBoxMuller(),
				x = rect.x + mx * rect.width + sx * vx * rect.width,
				y = rect.y + my * rect.height + sy * vy * rect.height,
				found;

			// We must consider the scrollbar size of around 20 pixels
			if ( y <= 0 || y >= window.innerHeight - 20 ) {
				y -= scrollTo( undefined, y + window.scrollY, true )[ 1 ];
			}
			if ( x <= 0 || x >= window.innerWidth - 20 ) {
				x -= scrollTo( x + window.scrollX, undefined, true )[ 0 ];
			}

			found = document.elementFromPoint( x, y );
			while ( found !== null ) {
				if ( found === e || !check ) {
					return [ x, y ];
				}
				found = found.parentNode;
			}
		}
		throw new Error( 'Unable to find coords for the element' );
	}
};
