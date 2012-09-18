/* Front-end/Wrapper for a particular tree builder, in this case the
 * parser/tree builder from the node 'html5' module. Feed it tokens using
 * processToken, and it will build you a DOM tree retrievable using .document
 * or .body(). */

var events = require('events'),
	HTML5 = require('./html5/index');

FauxHTML5 = {};


FauxHTML5.TreeBuilder = function ( env ) {
	// The parser we are going to emit our tokens to
	this.parser = new HTML5.Parser();

	// Sets up the parser
	this.parser.parse(this);

	// implicitly start a new document
	this.processToken(new TagTk( 'body' ));

	this.env = env;
};

// Inherit from EventEmitter
FauxHTML5.TreeBuilder.prototype = new events.EventEmitter();
FauxHTML5.TreeBuilder.prototype.constructor = FauxHTML5.TreeBuilder;

/**
 * Register for (token) 'chunk' and 'end' events from a token emitter,
 * normally the TokenTransformDispatcher.
 */
FauxHTML5.TreeBuilder.prototype.addListenersOn = function ( emitter ) {
	emitter.addListener('chunk', this.onChunk.bind( this ) );
	emitter.addListener('end', this.onEnd.bind( this ) );
};

FauxHTML5.TreeBuilder.prototype.onChunk = function ( tokens ) {
	this.env.dp( 'chunk: ' + JSON.stringify( tokens, null, 2 ) );
	for (var i = 0, length = tokens.length; i < length; i++) {
		this.processToken(tokens[i]);
	}
};

FauxHTML5.TreeBuilder.prototype.onEnd = function ( ) {
	//console.warn('Fauxhtml5 onEnd');
	// FIXME HACK: For some reason the end token is not processed sometimes,
	// which normally fixes the body reference up.
	var document = this.parser.document;
	document.body = document.getElementsByTagName('body')[0];

	//console.warn( 'onEnd: ' + document.body.innerHTML );

	this.emit( 'document', document );

	// XXX: more clean up to allow reuse.
	this.parser.setup();
	this.processToken(new TagTk( 'body' ));
};

FauxHTML5.TreeBuilder.prototype._att = function (maybeAttribs) {
	var atts = [];
	if ( maybeAttribs && $.isArray( maybeAttribs ) ) {
		for(var i = 0, length = maybeAttribs.length; i < length; i++) {
			var att = maybeAttribs[i];
			atts.push({nodeName: att.k, nodeValue: att.v});
		}
	}
	return atts;
};

// Adapt the token format to internal HTML tree builder format, call the actual
// html tree builder by emitting the token.
FauxHTML5.TreeBuilder.prototype.processToken = function (token) {
	//console.warn( 'processToken: ' + JSON.stringify( token ));

	var attribs = token.attribs || [];
	if ( token.dataAttribs ) {
		var dataMW = JSON.stringify( token.dataAttribs );
		if ( dataMW !== '{}' ) {
			attribs = attribs.concat([
					{
						// Mediawiki-specific round-trip / non-semantic information
						k: 'data-parsoid',
						v: dataMW
					} ] );
		}
	}

	// console.warn("T: " + JSON.stringify(token));
	switch( token.constructor ) {
		case String:
			if ( token.match(/^[ \t\r\n\f]+$/) ) {
				// Treat space characters specially so that the tree builder
				// doesn't apply the foster parenting algorithm
				this.emit('token', {type: 'SpaceCharacters', data: token});
			} else {
				this.emit('token', {type: 'Characters', data: token});
			}
			break;
		case NlTk:
			this.emit('token', {type: 'SpaceCharacters', data: '\n'});
			break;
		case TagTk:
			this.emit('token', {type: 'StartTag',
				name: token.name,
				data: this._att(attribs)});
			break;
		case SelfclosingTagTk:
			this.emit('token', {type: 'StartTag',
				name: token.name,
				data: this._att(attribs)});
			if ( HTML5.VOID_ELEMENTS.indexOf( token.name.toLowerCase() ) < 0 ) {
				// VOID_ELEMENTS are automagically treated as self-closing by
				// the tree builder
				this.emit('token', {type: 'EndTag',
					name: token.name,
					data: this._att(attribs)});
			}
			break;
		case EndTagTk:
			// not used since HTML5 tree builder strips this anyway
			this.emit('token', {type: 'EndTag', name: token.name});
			if (token.dataAttribs && token.dataAttribs.tsr) {
				var attrs = this._att(attribs);
				attrs.push({nodeName: "typeof", nodeValue: "mw:EndTag"});
				this.emit('token', {type: 'StartTag', name: 'meta', data: attrs});
			}
			break;
		case CommentTk:
			this.emit('token', {type: 'Comment', data: token.value});
			break;
		case EOFTk:
			this.emit('end');
			this.emit('token', { type: 'EOF' } );
			this.document = this.parser.document;
			if ( ! this.document.body ) {
				// HACK: This should not be needed really.
				this.document.body = this.parser.document.getElementsByTagName('body')[0];
			}
			// Emit the document to consumers
			//this.emit('document', this.document);
			break;
		default:
			console.warn("Unhandled token: " + JSON.stringify(token));
			break;
	}
};



if (typeof module == "object") {
	module.exports.FauxHTML5 = FauxHTML5;
}