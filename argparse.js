const args = require( 'system' ).args;

exports.parse = function ( argdef ) {
	// argdef = {
	// 	url: [ 'positional' ],
	// 	verbosity: [ 'optional', [ 'v', 'verbose' ], [ 'count' ] ]
	// 	extras: [ 'last' ]
	// };

	var parsed = {},
		indexedDef = {
			types: {
				positional: [],
				optional: [],
				last: []
			},
			optionalIndex: {
				shortarg: {},
				longarg: {}
			}
		},
		last = false;

	for ( let [ key, value ] of Object.entries( argdef ) ) {
		indexedDef.types[ value[ 0 ] ].push( key );

		switch ( value[ 0 ] ) {
			case 'positional':
				break;
			case 'optional':
				indexedDef.optionalIndex.shortarg[ value[ 1 ][ 0 ] ] = key;
				indexedDef.optionalIndex.longarg[ value[ 1 ][ 1 ] ] = key;
				break;
			case 'last':
				break;
		}
	}

	if ( indexedDef.types.last.length > 1 ) {
		throw new Error( 'Too many "last" args' );
	} else if ( indexedDef.types.last.length ) {
		parsed[ indexedDef.types.last[ 0 ] ] = [];
	}

	// Using bare for loop because of easy i-manipulation
	for ( let i = 1; i < args.length; i++ ) {
		let arg = args[ i ];
		if ( last ) {
			if ( indexedDef.types.last.length ) {
				parsed[ indexedDef.types.last[ 0 ] ].push( arg );
			} else {
				throw new Error( `Unexpected "last" arg: '${arg}'` );
			}
		} else if ( arg.startsWith( '-' ) ) {
			if ( arg.startsWith( '--' ) ) {
				if ( arg === '--' ) {
					last = true;
				} else {
					let name = arg.substr( 2 ),
						index = indexedDef.optionalIndex.longarg[ name ];
					if ( index ) {
						let action = argdef[ index ][ 2 ];
						switch ( action[ 0 ] ) {
							case 'store':
								parsed[ index ] = args[ ++i ];
								break;
							case 'count':
								parsed[ index ] = ( parsed[ index ] || 0 ) + 1;
								break;
							case 'store_true':
								parsed[ index ] = true;
								break;
							// TODO
						}
					} else {
						throw new Error( `Unexpected long arg: '${name}'` );
					}
				}
			} else {
				if ( arg === '-' ) {
					throw new Error( `Unexpected arg: '${arg}'` );
				} else {
					arg = arg.substr( 1 );
					while ( arg.length ) {
						let name = arg.charAt( 0 ),
							index = indexedDef.optionalIndex.shortarg[ name ];
						arg = arg.substr( 1 );
						if ( index ) {
							let action = argdef[ index ][ 2 ];
							switch ( action[ 0 ] ) {
								case 'store':
									if ( arg.length ) {
										parsed[ index ] = arg;
									} else {
										parsed[ index ] = args[ ++i ];
									}
									arg = '';
									break;
								case 'count':
									parsed[ index ] = ( parsed[ index ] || 0 ) + 1;
									break;
								case 'store_true':
									parsed[ index ] = true;
									break;
								// TODO
							}
						} else {
							throw new Error( `Unexpected short arg: '${name}'` );
						}
					}
				}
			}
		} else {
			if ( indexedDef.types.positional.length ) {
				let index = indexedDef.types.positional.shift();
				parsed[ index ] = arg;
			} else {
				last = true;
				i--;
				continue;
			}
		}
	}

	if ( indexedDef.types.positional.length ) {
		throw new Error( 'Missing one or more positional arguments' );
	}

	return parsed;
};
