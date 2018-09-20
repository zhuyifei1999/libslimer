const logging = require( './logging.js' ).getLogger( 'inputs' ),
	statistics = require( './statistics.js' ),
	util = require( './util.js' );

function rand( v ) {
	return v + statistics.randomBoxMuller()[ 0 ] * 0.25 * v;
}

module.exports = {
	async mouseclick( page, x, y, type = 'click' ) {
		logging.debug( `Mouse ${type} {x:${x}, y:${y}}` );
		await util.wait( rand( 500 ) );
		page.sendEvent( 'mousemove', x, y );
		await util.wait( rand( 50 ) );
		page.sendEvent( type, x, y );
	},
	async mousedrag( page, ix, iy, fx, fy, movespeed = 1 ) {
		[ ix, iy, fx, fy ] = [ ix, iy, fx, fy ].map( Math.round );
		function rtheta( x, y ) {
			return [
				Math.sqrt( Math.pow( fx - x, 2 ) + Math.pow( fy - y, 2 ) ),
				Math.atan2( fy - y, fx - x )
			];
		}
		function angleAvg( t1, w1, t2, w2 ) {
			let y = w1 * Math.sin( t1 ) + w2 * Math.sin( t2 ),
				x = w1 * Math.cos( t1 ) + w2 * Math.cos( t2 );
			return Math.atan2( y, x );
		}

		logging.debug( `Mouse drag {i:{x:${ix}, y:${iy}, f:{x:${fx}, y:${fy}}}` );
		await util.wait( rand( 500 ) );
		let [ fd, randtheta ] = rtheta( ix, iy ),
			[ x, y ] = [ ix, iy ];
		randtheta += statistics.randomBoxMuller()[ 0 ] / 16;

		page.sendEvent( 'mousedown', x, y );
		await util.wait( rand( 100 ) );

		while ( Math.round( x ) !== fx || Math.round( y ) !== fy ) {
			await util.wait( 10 );

			let [ ox, oy ] = [ x, y ],
				[ d, theta ] = rtheta( x, y ),
				// proportionLeft = Math.max( 1.05 * ( d / fd ) - 0.05, 0 ),
				proportionLeft = d / fd,
				gtheta = angleAvg( randtheta, Math.pow( proportionLeft, 2 ), theta, 1 - Math.pow( proportionLeft, 2 ) ),
				speed = Math.max( 0.25, ( 1 - Math.pow( 2 * proportionLeft - 1, 2 ) ) * movespeed * Math.pow( Math.log( fd ), 2 ) );

			// logging.error( [ randtheta, Math.pow( proportionLeft, 2 ), theta, 1 - Math.pow( proportionLeft, 2 ) ] );
			[ x, y ] = [ x + speed * Math.cos( gtheta ), y + speed * Math.sin( gtheta ) ];
			randtheta += statistics.randomBoxMuller()[ 0 ] / 16 / Math.log( fd );

			// if ( proportionLeft < 0.5 ) {
			// 	x = Math.abs( x - fx ) < speed / 2 ? fx : x;
			// 	y = Math.abs( y - fy ) < speed / 2 ? fy : y;
			// }

			if ( Math.round( x ) !== Math.round( ox ) || Math.round( y ) !== Math.round( oy ) ) {
				// logging.warn( [ Math.round( x ), Math.round( y ), gtheta, speed ] );
				page.sendEvent( 'mousemove', Math.round( x ), Math.round( y ) );
			}
		}

		await util.wait( rand( 100 ) );
		page.sendEvent( 'mouseup', fx, fy );
	},
	async typetext( page, text ) {
		if ( typeof text[ Symbol.iterator ] === 'function' ) {
			logging.debug( `Type '${text}'` );
		} else {
			logging.debug( `Type ${text}` );
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
