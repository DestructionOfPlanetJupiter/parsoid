"use strict";

var Util = require('./mediawiki.Util.js').Util;

function Title ( key, ns, nskey, env ) {
	this.key = env.resolveTitle( key );
	// Namespace index
	this.ns = new Namespace( ns );
	// the original ns string
	this.nskey = nskey;
	this.env = env;
}

Title.prototype.makeLink = function () {
	// XXX: links always point to the canonical namespace name.
	if ( false && this.nskey ) {
		return Util.sanitizeTitleURI( this.env.page.relativeLinkPrefix +
				this.nskey + ':' + this.key );
	} else {
		var l = this.env.page.relativeLinkPrefix,
			ns = this.ns.getDefaultName();

		if ( ns ) {
			l += ns + ':';
		}
		return Util.sanitizeTitleURI( l + this.key );
	}
};

Title.prototype.getPrefixedText = function () {
	// XXX: links always point to the canonical namespace name.
	if ( this.nskey ) {
		return Util.sanitizeURI( this.nskey + ':' + this.key );
	} else {
		var ns = this.ns.getDefaultName();

		if ( ns ) {
			ns += ':';
		}
		return Util.sanitizeTitleURI( ns + this.key );
	}
};


function Namespace ( id ) {
	this.id = id;
}

Namespace.prototype._defaultNamespaceIDs = {
	file: -2,
	image: -2,
	special: -1,
	main: 0,
	category: 14
};

Namespace.prototype._defaultNamespaceNames = {
	'-2': 'File',
	'-1': 'Special',
	'0': '',
	'14': 'Category'
};

Namespace.prototype.isFile = function ( ) {
	return this.id === this._defaultNamespaceIDs.file;
};
Namespace.prototype.isCategory = function ( ) {
	return this.id === this._defaultNamespaceIDs.category;
};

Namespace.prototype.getDefaultName = function ( ) {
	if ( this.id === this._defaultNamespaceIDs.main ) {
		return '';
	} else {
		return this._defaultNamespaceNames[this.id.toString()];
	}
};


if (typeof module === "object") {
	module.exports.Title = Title;
	module.exports.Namespace = Namespace;
}
