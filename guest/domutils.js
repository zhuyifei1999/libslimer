const scrollTo = require( './scrollTo.js' ),
	statistics = require( './statistics.js' );

module.exports = {
	cloneDOMRect( rect ) {
		return {
			top: rect.top,
			right: rect.right,
			bottom: rect.bottom,
			left: rect.left,
			width: rect.width,
			height: rect.height,
			x: rect.x,
			y: rect.y
		};
	},
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
	randomCoords( e, m = 0.5, s = 0.25, check = true, scroll = true ) {
		if ( typeof m === 'number' ) { m = [ m, m ]; }
		if ( typeof s === 'number' ) { s = [ s, s ]; }

		let [ mx, my ] = m,
			[ sx, sy ] = s,
			// We must consider the scrollbar size of around 20 pixels
			scrollbarSize = 20,
			rect = this.cloneDOMRect( e.getBoundingClientRect() );

		if ( !scroll ) {
			rect.left = Math.max( 0, rect.left );
			rect.top = Math.max( 0, rect.top );
			rect.right = Math.min( window.innerWidth - scrollbarSize, rect.right );
			rect.bottom = Math.min( window.innerHeight - scrollbarSize, rect.bottom );

			if ( rect.right <= rect.left || rect.bottom <= rect.top ) {
				throw new Error( 'Unable to find coords for the element' );
			}
		}

		rect.width = rect.right - rect.left;
		rect.height = rect.bottom - rect.top;
		rect.x = rect.left;
		rect.y = rect.top;

		for ( let i = 0; i < 16; i++ ) {
			let [ vx, vy ] = statistics.randomBoxMuller(),
				x = rect.left + mx * rect.width + sx * vx * rect.width,
				y = rect.top + my * rect.height + sy * vy * rect.height,
				found;

			if ( scroll ) {
				if ( y <= 0 || y >= window.innerHeight - scrollbarSize ) {
					y -= scrollTo( undefined, y + window.scrollY, true )[ 1 ];
				}
				if ( x <= 0 || x >= window.innerWidth - scrollbarSize ) {
					x -= scrollTo( x + window.scrollX, undefined, true )[ 0 ];
				}
			} else {
				if (
					y <= 0 || y >= window.innerHeight - scrollbarSize ||
					x <= 0 || x >= window.innerWidth - scrollbarSize
				) {
					throw new Error( 'Assertion' );
				}
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
