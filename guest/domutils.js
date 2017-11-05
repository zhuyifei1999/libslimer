exports.closest = function ( e, selector ) {
	while ( true ) {
		e = e.parentNode;
		if ( e === null ) {
			return;
		}
		if ( e.matches( selector ) ) {
			return e;
		}
	}
};
