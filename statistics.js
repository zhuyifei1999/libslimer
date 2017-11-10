module.exports = {
	sum( l ) {
		return l.reduce( ( x, y ) => x + y, 0 );
	},
	mean( l ) {
		return this.sum( l ) / l.length;
	},
	variance( l ) {
		var mean = this.mean( l );
		return this.mean( l.map( ( x ) => Math.pow( x - mean, 2 ) ) );
	},
	stddev( l ) {
		return Math.sqrt( this.variance( l ) );
	},
	randomBoxMuller() {
		// https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
		var u = 0, v = 0, r, theta;
		while ( u === 0 ) { u = Math.random(); }
		while ( v === 0 ) { v = Math.random(); }
		r = Math.sqrt( -2.0 * Math.log( u ) );
		theta = 2.0 * Math.PI * v;
		return [ r * Math.cos( theta ), r * Math.sin( theta ) ];
	}
};
