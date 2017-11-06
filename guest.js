const GUEST_REGISTRY_NAME = require( './util.js' ).randomStr(),
	fs = require( 'fs' ),
	events = require( './events.js' ),
	logging = require( './logging.js' ).getLogger( 'guest' ),
	util = require( './util.js' ),
	dependencies = new Map(),
	modules = new Map(),
	loadedModules = [],
	loader = {
		normalizeFunction( f, inject = {} ) {
			// Many different function definition syntaxes:
			// ( function () {
			// 	console.log( { a( /* av */ ) { /* a */ } }.a.toString() );
			// 	console.log( function ( /* bv */ ) { /* b */ }.toString() );
			// 	console.log( ( ( /* cv */ ) => { /* c */ } ).toString() );
			// 	console.log( ( ( /* dv */ ) => null/* d */ ).toString() );
			// 	function e( /* ev */ ) { /* ev */ }
			// 	console.log( e.toString() );
			//
			// 	// a( /* av */ ) { /* a */ }
			// 	// function ( /* bv */ ) { /* b */ }
			// 	// ( /* cv */ ) => { /* c */ }
			// 	// ( /* dv */ ) => null
			// 	// function e( /* ev */ ) { /* ev */ }
			// }() );
			var src = f.toString(),
				match = src.match( /^\s*(?:function\b)?\s*([A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?:=>)?\s*\{((?:.|\s)*)\}\s*$/ );
			if ( match ) {
				let [ , name, params, code ] = match;
				src = `( function ${name}(${params}) {${code}} )`;
			} else {
				src = `( ${f} )`;
			}
			for ( let [ key, val ] of Object.entries( inject ) ) {
				src = src.replace( new RegExp( util.regexEscape( key ), 'g' ), val );
			}
			return src;
		},
		require() {
			return this.normalizeFunction( /* GUEST_REGISTRY_NAME */ function require( moduleName ) {
				var module;
				moduleName = moduleName.replace( /^.+\//, '' ).replace( /\.js$/, '' );
				module = window[ GUEST_REGISTRY_NAME ][ moduleName ];
				if ( module === undefined ) {
					throw new Error( `Module '${moduleName}' is not loaded yet` );
				} else {
					return module;
				}
			}, {
				GUEST_REGISTRY_NAME: JSON.stringify( GUEST_REGISTRY_NAME )
			} );
		},
		buildLoader( name, src ) {
			var require = this.require(),
				module = JSON.stringify( {
					id: name,
					exports: {}
				} ),
				loaderFunc = this.normalizeFunction( /* GUEST_REGISTRY_NAME, MODULE_NAME, MODULE_OBJ, MODULE_SRC, REQUIRE */ function () {
					// eslint-disable-next-line no-undef
					var module = MODULE_OBJ;
					// eslint-disable-next-line no-unused-vars
					( function ( require, exports, module ) {
						// eslint-disable-next-line no-undef, no-unused-expressions, semi
						MODULE_SRC
					} )
						// eslint-disable-next-line no-undef
						.call( {}, REQUIRE, module.exports, module );
					// eslint-disable-next-line no-undef
					window[ GUEST_REGISTRY_NAME ][ MODULE_NAME ] = module.exports;
				}, {
					GUEST_REGISTRY_NAME: JSON.stringify( GUEST_REGISTRY_NAME ),
					MODULE_NAME: JSON.stringify( name ),
					MODULE_OBJ: module,
					MODULE_SRC: src,
					REQUIRE: require
				} );
			return loaderFunc;
		},
		getDependencies( src ) {
			return Array.from( function* () {
				var regex = /require\s*\(\s*['"](?:[^'"]+\/)?([^'"]+?)(?:\.js)?['"]\s*\)/g;
				while ( true ) {
					let match = regex.exec( src );
					if ( !match ) {	break; }
					yield match[ 1 ];
				}
			}() );
		},
		registerModule( name, src ) {
			dependencies.set( name, Array.from( this.getDependencies( src ) ) );
			modules.set( name, this.buildLoader( name, src ) );
		},
		prepEval( src ) {
			var require = this.require(),
				evalFunc = this.normalizeFunction( /* FUNC_SRC, REQUIRE */ function ( ...args ) {
					/* eslint-disable no-undef, no-unused-vars */
					return ( function ( require, args ) {
						( FUNC_SRC )( ...args );
					}( REQUIRE, args ) );
					/* eslint-enable no-undef, no-unused-vars */
				}, {
					FUNC_SRC: src,
					REQUIRE: require
				} );
			return evalFunc;
		}
	};

events.onInitialized( function () {
	this.page.evaluate( function ( GUEST_REGISTRY_NAME ) {
		window[ GUEST_REGISTRY_NAME ] = {};
	}, GUEST_REGISTRY_NAME );
	for ( let name of loadedModules ) {
		let src = modules.get( name );
		this.page.evaluate( src );
		logging.debug( `Module '${name}' injected` );
	}
} );

module.exports = {
	registerModule( name, f, d = {}, load = true ) {
		if ( modules.has( name ) ) {
			throw new Error( `Duplicate definition for module '${name}'` );
		}
		loader.registerModule( name, loader.normalizeFunction( f, d ) + '()' );
		if ( load ) {
			this.loadModule( name );
		}
		return this;
	},
	loadModule( name ) {
		if ( loadedModules.includes( name ) ) { return; }
		if ( !modules.has( name ) ) {
			let uri = fs.join( fs.directory( module.id ), 'guest', `${name}.js` );
			if ( fs.exists( uri ) ) {
				let src = fs.read( uri );
				if ( loader.getDependencies( src ).includes( 'guest' ) ) {
					require( `./guest/${name}.js` );
				} else {
					loader.registerModule( name, src );
				}
			} else {
				throw new Error( `Unknown module '${name}'` );
			}
		}
		for ( let dependency of dependencies.get( name ) ) {
			this.loadModule( dependency );
		}
		loadedModules.push( name );

		return this;
	},
	prepEval( f, d = {} ) {
		f = typeof f === 'string' ? f : loader.normalizeFunction( f, d );
		return loader.prepEval( f );
	}
};
