( function () {
var fs = require( 'fs' ),
	path = require( 'path' ),
	colors = require( 'colors' ),
	http = require( 'http' ),
	jsDiff = require( 'diff' ),
	optimist = require( 'optimist' ),

	Util = require( '../lib/mediawiki.Util.js' ).Util,
	WikitextSerializer = require( '../lib/mediawiki.WikitextSerializer.js').WikitextSerializer,
	TemplateRequest = require( '../lib/mediawiki.ApiRequest.js' ).TemplateRequest,

callback, argv, title,

plainCallback = function ( page, err, results ) {
	var i, result, output = '',
		semanticDiffs = 0, syntacticDiffs = 0,
		testDivider = ( new Array( 70 ) ).join( '=' ) + '\n',
		diffDivider = ( new Array( 70 ) ).join( '-' ) + '\n';

	if ( err ) {
		output += 'Parser failure!\n\n';
		output += diffDivider;
		output += err;
	} else {
		for ( i = 0; i < results.length; i++ ) {
			result = results[i];

			output += testDivider;
			if ( result.type === 'fail' ) {
				output += 'Semantic difference:\n\n';
				output += result.wtDiff + '\n';
				output += diffDivider;
				output += 'HTML diff:\n\n';
				output += result.htmlDiff + '\n';
				semanticDiffs++;
			} else {
				output += 'Syntactic difference:\n\n';
				output += result.wtDiff + '\n';
				syntacticDiffs++;
			}
		}


		output += testDivider;
		output += testDivider;
		output += "SUMMARY:\n";
		output += "Semantic differences : " + semanticDiffs + "\n";
		output += "Syntactic differences: " + syntacticDiffs + "\n";
		output += diffDivider;
		output += "ALL differences      : " + (semanticDiffs + syntacticDiffs) + "\n";
		output += testDivider;
		output += testDivider;
	}

	return output;
},

xmlCallback = function ( page, err, results ) {
	var i, result,

	output = '<testsuite name="Roundtrip article ' + Util.encodeXml( page || '' ) + '">';

	if ( err ) {
		output += '<testcase name="entire article"><error type="parserFailedToFinish">';
		output += Util.encodeXml( err.stack || err.toString() );
		output += '</error></testcase>';
	} else {

		for ( i = 0; i < results.length; i++ ) {
			result = results[i];

			output += '<testcase name="' + Util.encodeXml( page ) + ' character ' + result.offset[0].start + '">';

			if ( result.type === 'fail' ) {
				output += '<failure type="significantHtmlDiff">\n';

				output += '<diff class="wt">\n';
				output += Util.encodeXml( result.wtDiff );
				output += '\n</diff>\n';

				output += '<diff class="html">\n';
				output += Util.encodeXml( result.htmlDiff );
				output += '\n</diff>\n';

				output += '</failure>\n';
			} else {
				output += '<skipped type="insignificantWikitextDiff">\n';
				output += Util.encodeXml( result.wtDiff );
				output += '\n</skipped>\n';
			}

			output += '</testcase>\n';
		}
	}

	output += '</testsuite>\n';

	return output;
},

findDsr = function () {
var currentOffset, wasWaiting = false, waitingForEndMatch = false;
return function ( element, targetRange, sourceLen, resetCurrentOffset ) {
	var j, childNode, childAttribs, attribs, elesOnOffset, currentPreText, start, end,
		elements = [], preText = [];

	if ( resetCurrentOffset ) {
		currentOffset = null;
		wasWaiting = false;
		waitingForEndMatch = false;
	}

	if ( element ) {
		attribs = element.getAttribute( 'data-parsoid' );
		if ( attribs ) {
			attribs = JSON.parse( attribs );
		}
	}

	if ( attribs && attribs.dsr && attribs.dsr.length ) {
		start = attribs.dsr[0] || 0;
		end = attribs.dsr[1] || sourceLen - 1;

		if ( waitingForEndMatch ) {
			if ( end >= targetRange.end ) {
				waitingForEndMatch = false;
			}
			return [ element ];
		}

		if ( attribs.dsr[0] && targetRange.start === start && end === targetRange.end ) {
			return [ element ];
		} else if ( targetRange.start === start ) {
			waitingForEndMatch = true;
		}

		if ( targetRange.end < start || targetRange.start > end ) {
			return null;
		}
	}

	var children = element.childNodes;
	for ( j = 0; j < children.length; j++ ) {
		var c = children[j];
		if (!c) {
			// FIXME: why would this be anyway?
			continue;
		}

		wasWaiting = waitingForEndMatch;
		if ( c.nodeType === c.ELEMENT_NODE ) {
			childNode = findDsr( c, targetRange, sourceLen );
			if ( childNode ) {
				elesOnOffset = [];

				if ( !currentOffset && attribs.dsr && attribs.dsr[0] ) {
					currentOffset = attribs.dsr[0];
					while ( preText.length > 0 && currentOffset >= targetRange.start ) {
						currentPreText = preText.pop();
						if ( currentPreText.nodeValue.length > currentOffset - targetRange.start ) {
							break;
						}
						currentOffset -= currentPreText.nodeValue.length;
						elesOnOffset.push( currentPreText );
					}
					elesOnOffset.reverse();
					childNode = elesOnOffset.concat( childNode );
				}

				// Check if there's only one child, and make sure it's a node with getAttribute
				if ( childNode.length === 1 && childNode[0].getAttribute ) {
					childAttribs = childNode[0].getAttribute( 'data-parsoid' );
					if ( childAttribs ) {
						childAttribs = JSON.parse( childAttribs );
						if ( childAttribs.dsr && childAttribs.dsr[1] >= targetRange.end ) {
							currentOffset = null;
							preText = [];
						} else if ( childAttribs.dsr ) {
							currentOffset = childAttribs.dsr[1] || currentOffset;
						}
					}
				}

				elements = elements.concat( childNode );
			}
		} else if ( c.nodeType === c.TEXT_NODE || c.nodeType === c.COMMENT_NODE ) {
			if ( currentOffset && ( currentOffset < targetRange.end ) ) {
				currentOffset += c.nodeValue.length;
				if ( c.nodeType === c.COMMENT_NODE ) {
					// Add the length of the '<!--' and '--> bits
					currentOffset += 7;
				}
				elements = elements.concat( [ c ] );
				if ( wasWaiting && currentOffset >= targetRange.end ) {
					waitingForEndMatch = false;
				}
			} else if ( !currentOffset ) {
				preText.push( c );
			}
		}

		if ( wasWaiting && !waitingForEndMatch ) {
			break;
		}
	}

	var numElements = elements.length;
	var numChildren = children.length;
	if ( numElements > 0 && numElements < numChildren ) {
		return elements;
/*	} else if ( attribs && attribs.dsr && attribs.dsr.length ) {
		return [ element ]; */
	} else if ( numChildren > 0 && numElements === numChildren ) {
		return [ element ];
	} else {
		return null;
	}
};
}(),


checkIfSignificant = function ( page, offsets, src, body, out, cb, document ) {

	// Work around JSDOM's borken outerHTML pretty-printing / indenting.
	// At least it does not indent innerHTML, so we get to fish out the
	// parent element tag(s) and combine them with innerHTML.
	//
	// See jsdom/lib/jsdom/browser/index.js for the broken call to
	// domToHtml.
	function myOuterHTML ( node ) {
		var jsOuterHTML = node.outerHTML || node.nodeValue,
			startTagMatch = jsOuterHTML.match(/^ *(<[^>]+>)/),
			endTagMatch = jsOuterHTML.match(/<[^>]+>$/);
		if ( startTagMatch ) {
			var tag = startTagMatch[1];
			if ( startTagMatch[0].length === jsOuterHTML.length ) {
				return tag;
			} else {
				if ( endTagMatch ) {
					return tag + node.innerHTML + endTagMatch[0];
				} else {
					return tag + node.innerHTML;
				}
			}
		} else {
			return jsOuterHTML;
		}
	}

	function normalizeWikitext(str) {
		var orig = str;
		// 1. Normalize multiple spaces to single space
		str = str.replace(/ +/g, " ");
		// 2. Eliminate spaces around wikitext chars
		// gwicke: disabled for now- too aggressive IMO
		//str = str.replace(/([<"'!#\*:;+-=|{}\[\]\/]) /g, "$1");
		// 3. Ignore capitalization of tags and void tag indications
		str = str.replace(/<(\/?)([^ >\/]+)((?:[^>/]|\/(?!>))*)\/?>/g, function(match, close, name, remaining) {
			return '<' + close + name.toLowerCase() + remaining.replace(/ $/, '') + '>';
		} );
		// 4. Ignore whitespace in table cell attributes
		str = str.replace(/(^|\n|\|(?=\|)|!(?=!))({\||\|[-+]*|!) *([^|\n]*?) *(?=[|\n]|$)/g, '$1$2$3');
		// 5. Ignore trailing semicolons and spaces in style attributes
		str = str.replace(/style\s*=\s*"[^"]+"/g, function(match) {
			return match.replace(/\s|;(?=")/g, '');
		});
		// 6. Strip double-quotes
		str = str.replace(/"([^"]*?)"/g, "$1");

		// 7. Ignore implicit </small> and </center> in table cells or the end
		// of the string for now
		str = str.replace(/(^|\n)<\/(?:small|center)>(?=\n[|!]|\n?$)/g, '');
		str = str.replace(/([|!].*?)<\/(?:small|center)>(?=\n[|!]|\n?$)/gi, '$1');

		return str;
	}

	var i, k, diff, offset, origOut, newOut, origHTML, newHTML, origOrigHTML, origNewHTML, thisResult, results = [];
	for ( i = 0; i < offsets.length; i++ ) {
		thisResult = {};
		origOrigHTML = '';
		origNewHTML = '';

		offset = offsets[i];

		thisResult.offset = offset;

		if ( offset[0].start === offset[0].end &&
				out.substr(offset[1].start, offset[1].end - offset[1].start)
					.match(/^\n?<\/[^>]+>\n?$/) )
		{
			// An element was implicitly closed. Fudge the orig offset
			// slightly so it finds the corresponding elements which have the
			// original (unclosed) DSR.
			offset[0].start--;
		}
		origOut = findDsr( body, offset[0] || {}, src.length, true ) || [];
		newOut = findDsr( document.firstChild.childNodes[1], offset[1] || {}, out.length, true ) || [];

		for ( k = 0; k < origOut.length; k++ ) {
			origOrigHTML += myOuterHTML(origOut[k]);
		}

		for ( k = 0; k < newOut.length; k++ ) {
			origNewHTML += myOuterHTML(newOut[k]);
		}

		origHTML = Util.formatHTML( Util.normalizeOut( origOrigHTML ) );
		newHTML = Util.formatHTML( Util.normalizeOut( origNewHTML ) );

		// compute wt diffs
		var wt1 = src.substring( offset[0].start, offset[0].end );
		var wt2 = out.substring( offset[1].start, offset[1].end );
		thisResult.wtDiff = Util.diff(wt1, wt2, false, true, true);

		diff = Util.diff( origHTML, newHTML, false, true, true );

		// Normalize wts to check if we really have a semantic diff
		thisResult.type = 'skip';
		if (diff.length > 0) {
			var normWT1 = normalizeWikitext(wt1),
				normWT2 = normalizeWikitext(wt2);

			if ( normWT1 !== normWT2 ) {
				//console.log( 'normDiff: =======\n' + normWT1 + '\n--------\n' + normWT2);
				thisResult.htmlDiff = diff;
				thisResult.type = 'fail';
			}
		}
		results.push( thisResult );
	}
	cb( null, page, results );
},

doubleRoundtripDiff = function ( page, offsets, src, body, out, cb, wgScript ) {
	var parser, env = Util.getParserEnv();

	if ( offsets.length > 0 ) {
		env.text = src;
		env.wgScript = wgScript;
		env.errCB = function ( error ) {
			cb( error, page, [] );
			process.exit( 1 );
		};


		var parserPipeline = Util.getParser( env, 'text/x-mediawiki/full' );

		parserPipeline.on( 'document', checkIfSignificant.bind( null, page, offsets, src, body, out, cb ) );

		parserPipeline.process( out );

	} else {
		cb( null, page, [] );
	}
},

roundTripDiff = function ( page, src, document, cb, env ) {
	var out, curPair, patch, diff, offsetPairs;

	try {
		out = new WikitextSerializer( { env: env } ).serializeDOM( document.body );

		diff = jsDiff.diffLines( out, src );
		offsetPairs = Util.convertDiffToOffsetPairs( diff );

		if ( diff.length > 0 ) {
			doubleRoundtripDiff( page, offsetPairs, src, document.body, out, cb, env.wgScript );
		} else {
			cb( null, page, [] );
		}
	} catch ( e ) {
		cb( e, page, [] );
	}
},

fetch = function ( page, cb, options ) {
	cb = typeof cb === 'function' ? cb : function () {};

	var env = Util.getParserEnv();

	env.wgScript = env.interwikiMap[options.wiki];
	env.setPageName( page );

	env.debug = options.debug;
	env.trace = options.trace;

    env.errCB = function ( error ) {
        cb( error, null, [] );
    };

	if ( options.setup ) {
		options.setup( env );
	}

	var target = env.resolveTitle( env.normalizeTitle( env.pageName ), '' );
	var tpr = new TemplateRequest( env, target, null );

	tpr.once( 'src', function ( err, src ) {
		if ( err ) {
			cb( err, page, [] );
		} else {
			Util.parse( env, function ( src, err, out ) {
				if ( err ) {
					cb( err, page, [] );
				} else {
					roundTripDiff( page, src, out, cb, env );
				}
			}, err, src );
		}
	} );
},

cbCombinator = function ( formatter, cb, err, page, text ) {
	cb( err, formatter( page, err, text ) );
},

consoleOut = function ( err, output ) {
	if ( err ) {
		console.log( 'ERROR: ' + err.stack );
		process.exit( 1 );
	} else {
		console.log( output );
	}
};

if ( typeof module === 'object' ) {
	module.exports.fetch = fetch;
	module.exports.plainFormat = plainCallback;
	module.exports.xmlFormat = xmlCallback;
	module.exports.cbCombinator = cbCombinator;
}

if ( !module.parent ) {
	argv = optimist.argv;
	title = argv._[0];

	if ( title ) {
		if ( argv.xml ) {
			callback = xmlCallback;
		} else {
			callback = plainCallback;
		}

		callback = cbCombinator.bind( null, callback, consoleOut );

		var options = {
			wiki: argv.wiki || 'en',
			debug: argv.debug,
			trace: argv.trace
		};
		fetch( title, callback, options );
	} else {
		// FIXME: set up optimist spec so that the title does not need to come
		// first
		console.log( 'Usage: node roundtrip-test.js PAGETITLE [--xml] [--wiki CODE] [--debug] [--trace]' );
	}
}

} )();
