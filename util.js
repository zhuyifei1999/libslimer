module.exports = {
	async asyncfy( f ) {
		f();
	},
	wait( delay ) {
		return new Promise( ( resolve /* , reject */ ) => {
			setTimeout( resolve, delay );
		} );
	},
	regexEscape( s ) {
		// Source: https://stackoverflow.com/a/2593661
		return String( s ).replace( /[.?*+^$[\]\\(){}|-]/g, '\\$&' );
	},
	noop() {}
};
