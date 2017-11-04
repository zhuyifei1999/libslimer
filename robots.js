const events = require( './events.js' ),
	logging = require( './logging.js' ).getLogger( 'robots' ),
	util = require( './util.js' ),
	XMLHttpRequest = require( 'sdk/net/xhr' ).XMLHttpRequest,
	robotsCache = new Map();

events.onResourceRequested( function ( requestData, networkRequest ) {
	var mapkey, [ , scheme, host, path ] = requestData.url.match( /^([^:]+):\/*([^/]+)\/?(.+)$/ ),
		userAgent = this.page.settings.userAgent;
	if ( path === 'robots.txt' ) { return; }
	mapkey = scheme + '/' + host;

	if ( !robotsCache.has( mapkey ) ) {
		let request = new XMLHttpRequest(),
			robotsurl = requestData.url.replace( new RegExp( '/?' + util.regexEscape( path ) + '$' ), '/robots.txt' );

		logging.debug( `Loading robots.txt on '${robotsurl}'` );

		request.open( 'GET', robotsurl, false ); // `synchronous
		request.send( null );
		if ( request.status < 300 ) { // 2xx
			let ua = [ false, '' ],
				rules = [];
			for ( let line of request.responseText.split( /[\n\r]+/ ) ) {
				let d, k, v;
				line = line.trim();
				if ( !line.length || line.startsWith( '#' ) ) {
					continue;
				} else if ( d = line.match( /^\s*(user-agent|disallow|allow)\s*:\s*(.+?)\s*$/i ) ) { // eslint-disable-line no-cond-assign
					[ , k, v ] = d;
					switch ( k.toLowerCase() ) {
						case 'user-agent':
							if ( v !== '*' ) {
								v = userAgent.match( new RegExp( util.regexEscape( v ), 'i' ) );
								if ( v && v.length ) {
									v = v[ 0 ];
								}
							}
							if ( v && v.length >= ua[ 1 ].length ) { // TODO
								rules.length = 0;
								ua = [ true, v ];
							} else {
								ua[ 0 ] = false;
							}
							break;
						case 'allow':
						case 'disallow':
							if ( ua[ 0 ] ) {
								v = new RegExp( '^' + util.regexEscape( v ).replace( /\\[$*]/g, ( match ) => {
									return {
										'\\$': '$',
										'\\*': '.*'
									}[ match ];
								} ) );
								rules.push( [ v, k.toLowerCase() === 'allow' ] );
							}
							break;
					}
				}
			}
			robotsCache.set( mapkey, rules );
		} else if ( request.status < 500 ) { // 4xx
			// 3xx should be handled by XHR itself
			robotsCache.set( mapkey, [] );
		} else { // 5xx
			robotsCache.set( mapkey, [ [ '/', false ] ] );
		}
		logging.info( `Requested '${robotsurl}', ${robotsCache.get( mapkey ).length} rules added` );
	}

	let status = [ true, '/' ];
	for ( let [ urlRegex, allowed ] of robotsCache.get( mapkey ) ) {
		let match = ( '/' + path ).match( urlRegex );
		if ( match && match[ 0 ].length >= status[ 1 ].length ) {
			status = [ allowed, match[ 0 ] ];
		}
	}
	if ( !status[ 0 ] ) {
		networkRequest.abort();
		logging.info( `Request to '${requestData.url}' aborted due to robots.txt match` );
	}
} );
