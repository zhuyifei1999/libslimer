const { Cc, Ci, Cu } = require( 'chrome' ),
	events = require( './events.js' ),
	systemSandbox = Cu.Sandbox(
		Cc[ '@mozilla.org/systemprincipal;1' ].createInstance( Ci.nsIPrincipal ),
		{ wantGlobalProperties: [ 'fetch' ] } ),
	captureReg = new Map(),
	allCaptures = new Map();

events.onResourceReceived( function ( response ) {
	if ( !response.bodySize ) { return; }

	for ( let [ regex, handler ] of captureReg ) {
		if ( response.url.match( regex ) ) { handler( response ); }
	}

	allCaptures.set(
		response.url,
		URL.createObjectURL( new Blob( [ response.body ], { type: response.contentType } ) )
	);
} );

module.exports = {
	init( page ) {
		page.captureContent = [ /.*/ ];
	},
	register( regex, handler ) {
		captureReg.set( regex, handler );
	},
	async get( page, uri ) {
		const url = new URL( uri, page.url );
		switch ( url.protocol ) {
			case 'data:':
			case 'blob:': {
				// TODO: Use URL.isValidURL('blob:...')?
				// let req = await fetch( url.href );
				let req = await Cu.evalInSandbox( `fetch( ${JSON.stringify( url.href )} )`, systemSandbox );
				return await req.blob();
			}
			default: {
				let blob = allCaptures.get( url );
				if ( url === undefined ) {
					throw new Error( `URL '${url}' not captured` );
				}
				return await this.get( page, blob );
			}
		}
	},
	blob2text( blob ) {
		return new Promise( ( resolve, reject ) => {
			var reader = new FileReader();
			reader.onloadend = function () {
				resolve( reader.result );
			};
			reader.onerror = function ( e ) {
				reject( e || new Error( 'blob2text failed' ) );
			};
			reader.readAsBinaryString( blob );
		} );
	}
};
