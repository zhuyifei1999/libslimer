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
	}
};
