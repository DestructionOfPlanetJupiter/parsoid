/**
 * VisualEditor data model Document tests.
 *
 * @copyright 2011-2012 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

QUnit.module( 've.dm.Document' );

/* Tests */

QUnit.test( 'constructor', 4, function ( assert ) {
	var doc = new ve.dm.Document( ve.dm.example.data );
	assert.equalNodeTree( doc.getDocumentNode(), ve.dm.example.tree, 'node tree matches example data' );
	assert.throws(
		function () {
			doc = new ve.dm.Document( [
				{ 'type': '/paragraph' },
				{ 'type': 'paragraph' }
			] );
		},
		/^Unbalanced input passed to document$/,
		'unbalanced input causes exception'
	);

	// TODO data provider?
	doc = new ve.dm.Document( [ 'a', 'b', 'c', 'd' ] );
	assert.equalNodeTree(
		doc.getDocumentNode(),
		new ve.dm.DocumentNode( [ new ve.dm.TextNode( 4 ) ] ),
		'plain text input is handled correctly'
	);

	doc = new ve.dm.Document( [ { 'type': 'paragraph' }, { 'type': '/paragraph' } ] );
	assert.equalNodeTree(
		doc.getDocumentNode(),
		new ve.dm.DocumentNode( [ new ve.dm.ParagraphNode( [ new ve.dm.TextNode( 0 ) ] ) ] ),
		'empty paragraph gets a zero-length text node'
	);
} );

QUnit.test( 'getData', 1, function ( assert ) {
	var doc = new ve.dm.Document( ve.dm.example.data );
	assert.deepEqual( doc.getData(), ve.dm.example.data );
} );

QUnit.test( 'getNodeFromOffset', function ( assert ) {
	var doc = new ve.dm.Document( ve.dm.example.data ),
		root = doc.getDocumentNode().getRoot(),
		node,
		expected = [
		[], // 0 - document
		[0], // 1 - heading
		[0], // 2 - heading
		[0], // 3 - heading
		[0], // 4 - heading
		[], // 5 - document
		[1], // 6 - table
		[1, 0], // 7 - tableSection
		[1, 0, 0], // 7 - tableRow
		[1, 0, 0, 0], // 8 - tableCell
		[1, 0, 0, 0, 0], // 9 - paragraph
		[1, 0, 0, 0, 0], // 10 - paragraph
		[1, 0, 0, 0], // 11 - tableCell
		[1, 0, 0, 0, 1], // 12 - list
		[1, 0, 0, 0, 1, 0], // 13 - listItem
		[1, 0, 0, 0, 1, 0, 0], // 14 - paragraph
		[1, 0, 0, 0, 1, 0, 0], // 15 - paragraph
		[1, 0, 0, 0, 1, 0], // 16 - listItem
		[1, 0, 0, 0, 1, 0, 1], // 17 - list
		[1, 0, 0, 0, 1, 0, 1, 0], // 18 - listItem
		[1, 0, 0, 0, 1, 0, 1, 0, 0], // 19 - paragraph
		[1, 0, 0, 0, 1, 0, 1, 0, 0], // 20 - paragraph
		[1, 0, 0, 0, 1, 0, 1, 0], // 21 - listItem
		[1, 0, 0, 0, 1, 0, 1], // 22 - list
		[1, 0, 0, 0, 1, 0], // 23 - listItem
		[1, 0, 0, 0, 1], // 24 - list
		[1, 0, 0, 0], // 25 - tableCell
		[1, 0, 0, 0, 2], // 26 - list
		[1, 0, 0, 0, 2, 0], // 27 - listItem
		[1, 0, 0, 0, 2, 0, 0], // 28 - paragraph
		[1, 0, 0, 0, 2, 0, 0], // 29 - paragraph
		[1, 0, 0, 0, 2, 0], // 30 - listItem
		[1, 0, 0, 0, 2], // 31 - list
		[1, 0, 0, 0], // 32 - tableCell
		[1, 0, 0], // 33 - tableRow
		[1, 0], // 33 - tableSection
		[1], // 34 - table
		[], // 35- document
		[2], // 36 - preformatted
		[2], // 37 - preformatted
		[2], // 38 - preformatted
		[2], // 39 - preformatted
		[2], // 40 - preformatted
		[], // 41 - document
		[3], // 42 - definitionList
		[3, 0], // 43 - definitionListItem
		[3, 0, 0], // 44 - paragraph
		[3, 0, 0], // 45 - paragraph
		[3, 0], // 46 - definitionListItem
		[3], // 47 - definitionList
		[3, 1], // 48 - definitionListItem
		[3, 1, 0], // 49 - paragraph
		[3, 1, 0], // 50 - paragraph
		[3, 1], // 51 - definitionListItem
		[3], // 52 - definitionList
		[], // 53 - document
		[4], // 54 - paragraph
		[4], // 55 - paragraph
		[], // 56 - document
		[5], // 57 - paragraph
		[5], // 58 - paragraph
		[] // 59 - document
	];
	QUnit.expect( expected.length );
	for ( var i = 0; i < expected.length; i++ ) {
		node = root;
		for ( var j = 0; j < expected[i].length; j++ ) {
			node = node.children[expected[i][j]];
		}
		assert.ok( node === doc.getNodeFromOffset( i ), 'reference at offset ' + i );
	}
} );

QUnit.test( 'getDataFromNode', 3, function ( assert ) {
	var doc = new ve.dm.Document( ve.dm.example.data );
	assert.deepEqual(
		doc.getDataFromNode( doc.getDocumentNode().getChildren()[0] ),
		ve.dm.example.data.slice( 1, 4 ),
		'branch with leaf children'
	);
	assert.deepEqual(
		doc.getDataFromNode( doc.getDocumentNode().getChildren()[1] ),
		ve.dm.example.data.slice( 6, 36 ),
		'branch with branch children'
	);
	assert.deepEqual(
		doc.getDataFromNode( doc.getDocumentNode().getChildren()[2].getChildren()[1] ),
		[],
		'leaf without children'
	);
} );

QUnit.test( 'getAnnotationsFromOffset', 1, function ( assert ) {
	var c, i, j,
		doc,
		range,
		annotations,
		expectCount = 0,
		cases = [
		{
			'msg': ['bold #1', 'bold #2'],
			'data': [
				['a', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				['b', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }]
			],
			'expected': [
				{ '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } },
				{ '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }
			]
		},
		{
			'msg': ['bold #3', 'italic #1'],
			'data': [
				['a', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				['b', { '{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' } }]
			],
			'expected': [
				{ '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } },
				{ '{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' } }
			]
		},
		{
			'msg': ['bold, italic & underline'],
			'data': [
				['a',
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'},
						'{"type":"textStyle/underline"}': { 'type': 'textStyle/underline'}
					}]
			],
			'expected':
				[
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'},
						'{"type":"textStyle/underline"}': { 'type': 'textStyle/underline'}
					}
				]
		}

	];

	// Calculate expected assertion count
	for ( c = 0; c < cases.length; c++ ) {
		expectCount += cases[c].data.length;
	}
	QUnit.expect ( expectCount );

	// Run tests
	for ( i = 0; i < cases.length; i++ ) {
		doc = new ve.dm.Document ( cases[i].data );
		for ( j = 0; j < doc.getData().length; j++ ) {
			annotations = doc.getAnnotationsFromOffset( j );
			assert.deepEqual( annotations, cases[i].expected[j], cases[i].msg[j] );
		}
	}
} );

QUnit.test( 'getAnnotationsFromRange', 1, function ( assert ) {
	var i, doc,
		cases = [
		{
			'msg': 'single annotations',
			'data': [
				['a', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } } ],
				['b', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } } ]
			],
			'expected': { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }
		},
		{
			'msg': 'mutliple annotations',
			'data': [
				[
					'a',
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'}
					}
				],
				[
					'b',
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'}
					}
				]
			],
			'expected': {
				'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
				'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'}
			}
				
		},
		{
			'msg': 'lowest common coverage',
			'data': [
				[
					'a',
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'}
					}
				],
				[
					'b',
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'},
						'{"type":"textStyle/underline"}': { 'type': 'textStyle/underline'}
					}
				]
			],
			'expected': {
				'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
				'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'}
			}
		},
		{
			'msg': 'no common coverage due to plain character at the start',
			'data': [
				['a'],
				[
					'b',
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'},
						'{"type":"textStyle/underline"}': { 'type': 'textStyle/underline'}
					}
				],
				[
					'c',
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'}
					}
				]
			],
			'expected': {}
		},
		{
			'msg': 'no common coverage due to plain character in the middle',
			'data': [
				[
					'a',
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'},
						'{"type":"textStyle/underline"}': { 'type': 'textStyle/underline'}
					}
				],
				['b'],
				[
					'c',
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'}
					}
				]
			],
			'expected': {}
		},
		{
			'msg': 'no common coverage due to plain character at the end',
			'data': [
				[
					'a',
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'}
					}
				],
				[
					'b',
					{
						'{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' },
						'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'},
						'{"type":"textStyle/underline"}': { 'type': 'textStyle/underline'}
					}
				],
				['c']
			],
			'expected': {}
		},
		{
			'msg': 'no common coverage due to mismatched annotations',
			'data': [
				['a', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } } ],
				['b', { '{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' } } ]
			],
			'expected': {}
		},
		{
			'msg': 'annotations are collected using all with mismatched annotations',
			'data': [
				['a', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } } ],
				['b', { '{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' } } ]
			],
			'all': true,
			'expected': {
				'{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' },
				'{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' }
			}
		},
		{
			'msg': 'annotations are collected using all, even with a plain character at the start',
			'data': [
				['a', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } } ],
				['b', { '{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' } } ],
				['c']
			],
			'all': true,
			'expected': {
				'{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' },
				'{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' }
			}
		},
		{
			'msg': 'annotations are collected using all, even with a plain character at the middle',
			'data': [
				['a', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } } ],
				['b', { '{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' } } ],
				['c']
			],
			'all': true,
			'expected': {
				'{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' },
				'{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' }
			}
		},
		{
			'msg': 'annotations are collected using all, even with a plain character at the end',
			'data': [
				['a', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } } ],
				['b', { '{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' } } ],
				['c']
			],
			'all': true,
			'expected': {
				'{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' },
				'{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' }
			}
		},
		{
			'msg': 'no common coverage from all plain characters',
			'data': ['a', 'b'],
			'expected': {}
		},
		{
			'msg': 'no common coverage using all from all plain characters',
			'data': ['a', 'b'],
			'all': true,
			'expected': {}
		}
	];

	QUnit.expect( cases.length );

	for ( i = 0; i < cases.length; i++ ) {
		doc = new ve.dm.Document ( cases[i].data );
		assert.deepEqual(
			doc.getAnnotationsFromRange( new ve.Range( 0, cases[i].data.length ), cases[i].all ),
			cases[i].expected,
			cases[i].msg
		);
	}
} );

QUnit.test( 'offsetContainsAnnotation', 1, function ( assert ) {
	var i, doc,
		cases = [
		{
			msg: 'contains no annotations',
			data: [
				'a'
			],
			lookFor: {'type': 'textStyle/bold'},
			expected: false
		},
		{
			msg: 'contains bold',
			data: [
				['a', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } } ]
			],
			lookFor: {'type': 'textStyle/bold'},
			expected: true
		},
		{
			msg: 'contains bold',
			data: [
				['a', {
					'{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' },
					'{"type":"textStyle/italic"}': { 'type': 'textStyle/italic'}
					}
				]
			],
			lookFor: {'type': 'textStyle/bold'},
			expected: true
		}
	];

	QUnit.expect( cases.length );

	for ( i = 0;i < cases.length; i++ ) {
		doc = new ve.dm.Document( cases[i].data );
		assert.deepEqual(
			doc.offsetContainsAnnotation( 0, cases[i].lookFor ),
			cases[i].expected,
			cases[i].msg
		);
	}
});

QUnit.test( 'getAnnotatedRangeFromOffset', 1,  function ( assert ) {
	var i, doc,
		cases = [
		{
			'msg': 'a bold word',
			'data': [
				// 0
				'a',
				// 1
				['b', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				// 2
				['o', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				// 3
				['l', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				// 4
				['d', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				// 5
				'w',
				// 6
				'o',
				// 7
				'r',
				// 8
				'd'
			],
			'annotation': { 'type': 'textStyle/bold' },
			'offset': 3,
			'expected': new ve.Range( 1, 5 )
		},
		{
			'msg': 'a linked',
			'data': [
				// 0
				'x',
				// 1
				'x',
				// 2
				'x',
				// 3
				['l', { '{"type:"link/internal"}': { 'type': 'link/internal' } }],
				// 4
				['i', { '{"type:"link/internal"}': { 'type': 'link/internal' } }],
				// 5
				['n', { '{"type:"link/internal"}': { 'type': 'link/internal' } }],
				// 6
				['k', { '{"type:"link/internal"}': { 'type': 'link/internal' } }],
				// 7
				'x',
				// 8
				'x',
				// 9
				'x'
			],
			'annotation': { 'type': 'link/internal' },
			'offset': 3,
			'expected': new ve.Range( 3, 7 )
		},
		{
			'msg': 'bold over an annotated leaf node',
			'data': [
				// 0
				'h',
				// 1
				['b', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				// 2
				['o', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				// 3
				{
					'type': 'image',
					'attributes': { 'html/src': 'image.png' },
					'annotations': {'{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' }}
				},
				// 4
				{ 'type': '/image' },
				// 5
				['l', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				// 6
				['d', { '{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				// 7
				'i'
			],
			'annotation': { 'type': 'textStyle/bold' },
			'offset': 3,
			'expected': new ve.Range ( 1, 7 )
		}
	];

	QUnit.expect( cases.length );

	for ( i = 0; i < cases.length; i++ ) {
		doc = new ve.dm.Document( cases[i].data );
		assert.deepEqual(
			doc.getAnnotatedRangeFromOffset(cases[i].offset, cases[i].annotation),
			cases[i].expected,
			cases[i].msg
		);
	}
} );

QUnit.test( 'getMatchingAnnotationsFromOffset', 1, function ( assert ) {
	var cases = {
		'finds two out of three': {
			'pattern': /textStyle\/.*/,
			'character': [
				'a',
				{
					'{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' },
					'{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' },
					'{"type:"link/internal"}': { 'type': 'link/internal' }
				}
			],
			'expected': {
				'{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' },
				'{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' }
			}
		},
		'finds 3 out of 3': {
			'pattern': /textStyle\/.*/,
			'character': [
				'a',
				{
					'{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' },
					'{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' },
					'{"type:"textStyle/undeline"}': { 'type': 'textStyle/undeline' }
				}
			],
			'expected': {
				'{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' },
				'{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' },
				'{"type:"textStyle/undeline"}': { 'type': 'textStyle/undeline' }
			}
		},
		'finds none': {
			'pattern': /link\/.*/,
			'character': [
				'a',
				{
					'{"type:"textStyle/bold"}': { 'type': 'textStyle/bold' },
					'{"type:"textStyle/italic"}': { 'type': 'textStyle/italic' },
					'{"type:"textStyle/undeline"}': { 'type': 'textStyle/undeline' }
				}
			],
			'expected': {}
		}
	};

	QUnit.expect( ve.getObjectKeys( cases ).length );

	for ( var msg in cases ) {
		assert.deepEqual(
			( new ve.dm.Document( [cases[msg].character] ) )
				.getMatchingAnnotationsFromOffset( 0, cases[msg].pattern ),
			cases[msg].expected,
			msg
		);
	}
} );

QUnit.test( 'getOuterLength', 1, function ( assert ) {
	var doc = new ve.dm.Document( ve.dm.example.data );
	assert.strictEqual(
		doc.getDocumentNode().getOuterLength(),
		ve.dm.example.data.length,
		'document does not have elements around it'
	);
} );

QUnit.test( 'isContentOffset', function ( assert ) {
	var data = [
		{ 'type': 'heading' },
		'a',
		{ 'type': 'image' },
		{ 'type': '/image' },
		'b',
		'c',
		{ 'type': '/heading' },
		{ 'type': 'paragraph' },
		{ 'type': '/paragraph' },
		{ 'type': 'preformatted' },
		{ 'type': 'image' },
		{ 'type': '/image' },
		{ 'type': '/preformatted' },
		{ 'type': 'list' },
		{ 'type': 'listItem' },
		{ 'type': '/listItem' },
		{ 'type': '/list' },
		{ 'type': 'alienBlock' },
		{ 'type': '/alienBlock' },
		{ 'type': 'table' },
		{ 'type': 'tableRow' },
		{ 'type': 'tableCell' },
		{ 'type': 'alienBlock' },
		{ 'type': '/alienBlock' },
		{ 'type': '/tableCell' },
		{ 'type': '/tableRow' },
		{ 'type': '/table' }
	],
	cases = [
		{ 'msg': 'left of document', 'expected': false },
		{ 'msg': 'begining of content branch', 'expected': true },
		{ 'msg': 'left of non-text inline leaf', 'expected': true },
		{ 'msg': 'inside non-text inline leaf', 'expected': false },
		{ 'msg': 'right of non-text inline leaf', 'expected': true },
		{ 'msg': 'between characters', 'expected': true },
		{ 'msg': 'end of content branch', 'expected': true },
		{ 'msg': 'between content branches', 'expected': false },
		{ 'msg': 'inside emtpy content branch', 'expected': true },
		{ 'msg': 'between content branches', 'expected': false },
		{ 'msg': 'begining of content branch, left of inline leaf', 'expected': true },
		{ 'msg': 'inside content branch with non-text inline leaf', 'expected': false },
		{ 'msg': 'end of content branch, right of non-content leaf', 'expected': true },
		{ 'msg': 'between content, non-content branches', 'expected': false },
		{ 'msg': 'between parent, child branches, descending', 'expected': false },
		{ 'msg': 'inside empty non-content branch', 'expected': false },
		{ 'msg': 'between parent, child branches, ascending', 'expected': false },
		{ 'msg': 'between non-content branch, non-content leaf', 'expected': false },
		{ 'msg': 'inside non-content leaf', 'expected': false },
		{ 'msg': 'between non-content branches', 'expected': false },
		{ 'msg': 'between non-content branches', 'expected': false },
		{ 'msg': 'between non-content branches', 'expected': false },
		{ 'msg': 'inside non-content branch before non-content leaf', 'expected': false },
		{ 'msg': 'inside non-content leaf', 'expected': false },
		{ 'msg': 'inside non-content branch after non-content leaf', 'expected': false },
		{ 'msg': 'between non-content branches', 'expected': false },
		{ 'msg': 'between non-content branches', 'expected': false },
		{ 'msg': 'right of document', 'expected': false }
	];
	QUnit.expect( data.length + 1 );
	for ( var i = 0; i < cases.length; i++ ) {
		var left = data[i - 1] ? ( data[i - 1].type || data[i - 1][0] ) : '[start]',
			right = data[i] ? ( data[i].type || data[i][0] ) : '[end]';
		assert.strictEqual(
			ve.dm.Document.isContentOffset( data, i ),
			cases[i].expected,
			cases[i].msg + ' (' + left + '|' + right + ' @ ' + i + ')'
		);
	}
} );

QUnit.test( 'isStructuralOffset', function ( assert ) {
	var data = [
		{ 'type': 'heading' },
		'a',
		{ 'type': 'image' },
		{ 'type': '/image' },
		'b',
		'c',
		{ 'type': '/heading' },
		{ 'type': 'paragraph' },
		{ 'type': '/paragraph' },
		{ 'type': 'preformatted' },
		{ 'type': 'image' },
		{ 'type': '/image' },
		{ 'type': '/preformatted' },
		{ 'type': 'list' },
		{ 'type': 'listItem' },
		{ 'type': '/listItem' },
		{ 'type': '/list' },
		{ 'type': 'alienBlock' },
		{ 'type': '/alienBlock' },
		{ 'type': 'table' },
		{ 'type': 'tableRow' },
		{ 'type': 'tableCell' },
		{ 'type': 'alienBlock' },
		{ 'type': '/alienBlock' },
		{ 'type': '/tableCell' },
		{ 'type': '/tableRow' },
		{ 'type': '/table' }
	],
	cases = [
		{ 'msg': 'left of document', 'expected': [true, true] },
		{ 'msg': 'begining of content branch', 'expected': [false, false] },
		{ 'msg': 'left of non-text inline leaf', 'expected': [false, false] },
		{ 'msg': 'inside non-text inline leaf', 'expected': [false, false] },
		{ 'msg': 'right of non-text inline leaf', 'expected': [false, false] },
		{ 'msg': 'between characters', 'expected': [false, false] },
		{ 'msg': 'end of content branch', 'expected': [false, false] },
		{ 'msg': 'between content branches', 'expected': [true, true] },
		{ 'msg': 'inside emtpy content branch', 'expected': [false, false] },
		{ 'msg': 'between content branches', 'expected': [true, true] },
		{ 'msg': 'begining of content branch, left of inline leaf', 'expected': [false, false] },
		{ 'msg': 'inside content branch with non-text inline leaf', 'expected': [false, false] },
		{ 'msg': 'end of content branch, right of inline leaf', 'expected': [false, false] },
		{ 'msg': 'between content, non-content branches', 'expected': [true, true] },
		{ 'msg': 'between parent, child branches, descending', 'expected': [true, false] },
		{ 'msg': 'inside empty non-content branch', 'expected': [true, true] },
		{ 'msg': 'between parent, child branches, ascending', 'expected': [true, false] },
		{ 'msg': 'between non-content branch, non-content leaf', 'expected': [true, true] },
		{ 'msg': 'inside non-content leaf', 'expected': [false, false] },
		{ 'msg': 'between non-content branches', 'expected': [true, true] },
		{ 'msg': 'between non-content branches', 'expected': [true, false] },
		{ 'msg': 'between non-content branches', 'expected': [true, false] },
		{ 'msg': 'inside non-content branch before non-content leaf', 'expected': [true, true] },
		{ 'msg': 'inside non-content leaf', 'expected': [false, false] },
		{ 'msg': 'inside non-content branch after non-content leaf', 'expected': [true, true] },
		{ 'msg': 'between non-content branches', 'expected': [true, false] },
		{ 'msg': 'between non-content branches', 'expected': [true, false] },
		{ 'msg': 'right of document', 'expected': [true, true] }
	];
	QUnit.expect( ( data.length + 1 ) * 2 );
	for ( var i = 0; i < cases.length; i++ ) {
		var left = data[i - 1] ? ( data[i - 1].type || data[i - 1][0] ) : '[start]',
			right = data[i] ? ( data[i].type || data[i][0] ) : '[end]';
		assert.strictEqual(
			ve.dm.Document.isStructuralOffset( data, i ),
			cases[i].expected[0],
			cases[i].msg + ' (' + left + '|' + right + ' @ ' + i + ')'
		);
		assert.strictEqual(
			ve.dm.Document.isStructuralOffset( data, i, true ),
			cases[i].expected[1],
			cases[i].msg + ', unrestricted (' + left + '|' + right + ' @ ' + i + ')'
		);
	}
} );

QUnit.test( 'isElementData', 1, function ( assert ) {
	var i,
		data = [
		{ 'type': 'heading' },
		'a',
		{ 'type': 'image' },
		{ 'type': '/image' },
		'b',
		'c',
		{ 'type': '/heading' },
		{ 'type': 'paragraph' },
		{ 'type': '/paragraph' },
		{ 'type': 'preformatted' },
		{ 'type': 'image' },
		{ 'type': '/image' },
		{ 'type': '/preformatted' },
		{ 'type': 'list' },
		{ 'type': 'listItem' },
		{ 'type': '/listItem' },
		{ 'type': '/list' },
		{ 'type': 'alienBlock' },
		{ 'type': '/alienBlock' }
	],
	cases = [
		{ 'msg': 'left of document', 'expected': true },
		{ 'msg': 'begining of content branch', 'expected': false },
		{ 'msg': 'left of non-text inline leaf', 'expected': true },
		{ 'msg': 'inside non-text inline leaf', 'expected': true },
		{ 'msg': 'right of non-text inline leaf', 'expected': false },
		{ 'msg': 'between characters', 'expected': false },
		{ 'msg': 'end of content branch', 'expected': true },
		{ 'msg': 'between content branches', 'expected': true },
		{ 'msg': 'inside emtpy content branch', 'expected': true },
		{ 'msg': 'between content branches', 'expected': true },
		{ 'msg': 'begining of content branch, left of inline leaf', 'expected': true },
		{ 'msg': 'inside content branch with non-text leaf', 'expected': true },
		{ 'msg': 'end of content branch, right of inline leaf', 'expected': true },
		{ 'msg': 'between content, non-content branches', 'expected': true },
		{ 'msg': 'between parent, child branches, descending', 'expected': true },
		{ 'msg': 'inside empty non-content branch', 'expected': true },
		{ 'msg': 'between parent, child branches, ascending', 'expected': true },
		{ 'msg': 'between non-content branch, non-content leaf', 'expected': true },
		{ 'msg': 'inside non-content leaf', 'expected': true },
		{ 'msg': 'right of document', 'expected': false }
	];
	QUnit.expect( data.length + 1 );
	for ( i = 0; i < cases.length; i++ ) {
		assert.strictEqual( ve.dm.Document.isElementData( data, i ), cases[i].expected, cases[i].msg );
	}
} );

QUnit.test( 'containsElementData', 1, function ( assert ) {
	var i,
		cases = [
		{
			'msg': 'simple paragraph',
			'data': [{ 'type': 'paragraph' }, 'a', { 'type': '/paragraph' }],
			'expected': true
		},
		{
			'msg': 'plain text',
			'data': ['a', 'b', 'c'],
			'expected': false
		},
		{
			'msg': 'annotated text',
			'data': [['a', { '{"type:"bold"}': { 'type': 'bold' } } ]],
			'expected': false
		},
		{
			'msg': 'non-text leaf',
			'data': ['a', { 'type': 'image' }, { 'type': '/image' }, 'c'],
			'expected': true
		}
	];
	QUnit.expect( cases.length );
	for ( i = 0; i < cases.length; i++ ) {
		assert.strictEqual(
			ve.dm.Document.containsElementData( cases[i].data ), cases[i].expected, cases[i].msg
		);
	}
} );

QUnit.test( 'isContentData', 1, function ( assert ) {
	var cases = [
		{
			'msg': 'simple paragraph',
			'data': [{ 'type': 'paragraph' }, 'a', { 'type': '/paragraph' }],
			'expected': false
		},
		{
			'msg': 'plain text',
			'data': ['a', 'b', 'c'],
			'expected': true
		},
		{
			'msg': 'annotated text',
			'data': [['a', { '{"type:"bold"}': { 'type': 'bold' } } ]],
			'expected': true
		},
		{
			'msg': 'non-text leaf',
			'data': ['a', { 'type': 'image' }, { 'type': '/image' }, 'c'],
			'expected': true
		}
	];
	QUnit.expect( cases.length );
	for ( var i = 0; i < cases.length; i++ ) {
		assert.strictEqual(
			ve.dm.Document.isContentData( cases[i].data ), cases[i].expected, cases[i].msg
		);
	}
} );

QUnit.test( 'rebuildNodes', function ( assert ) {
	var doc = new ve.dm.Document( ve.dm.example.data.slice( 0 ) ),
		documentNode = doc.getDocumentNode();
	// Rebuild table without changes
	doc.rebuildNodes( documentNode, 1, 1, 5, 32 );
	assert.equalNodeTree(
		documentNode,
		ve.dm.example.tree,
		'rebuild without changes'
	);

	// XXX: Create a new document node tree from the old one
	var tree = new ve.dm.DocumentNode( ve.dm.example.tree.getChildren() );
	// Replace table with paragraph
	doc.data.splice( 5, 32, { 'type': 'paragraph' }, 'a', 'b', 'c', { 'type': '/paragraph' } );
	tree.splice( 1, 1, new ve.dm.ParagraphNode( [new ve.dm.TextNode( 3 )] ) );
	// Rebuild with changes
	doc.rebuildNodes( documentNode, 1, 1, 5, 5 );
	assert.equalNodeTree(
		documentNode,
		tree,
		'replace table with paragraph'
	);
} );

QUnit.test( 'getRelativeOffset', function ( assert ) {
	var i, doc, cases = [
		{
			'msg': 'document without any valid offsets returns -1',
			'offset': 0,
			'distance': 1,
			'data': [],
			'callback': function ( data, offset ) {
				return false;
			},
			'expected': -1
		},
		{
			'msg': 'document with all valid offsets returns offset + distance',
			'offset': 0,
			'distance': 2,
			'data': ['a', 'b'],
			'callback': function ( data, offset ) {
				return true;
			},
			'expected': 2
		}
	];
	QUnit.expect( cases.length );
	for ( i = 0; i < cases.length; i++ ) {
		doc = new ve.dm.Document( cases[i].data );
		assert.strictEqual(
			doc.getRelativeOffset.apply(
				doc,
				[
					cases[i].offset,
					cases[i].distance,
					cases[i].callback
				].concat( cases[i].args || [] )
			),
			cases[i].expected,
			cases[i].msg
		);
	}
} );

QUnit.test( 'getRelativeContentOffset', function ( assert ) {
	var i,
		doc = new ve.dm.Document( ve.dm.example.data ),
		cases = [
		{
			'msg': 'invalid starting offset with zero distance gets corrected',
			'offset': 0,
			'distance': 0,
			'expected': 1
		},
		{
			'msg': 'invalid starting offset with zero distance gets corrected',
			'offset': 61,
			'distance': 0,
			'expected': 60
		},
		{
			'msg': 'valid offset with zero distance returns same offset',
			'offset': 2,
			'distance': 0,
			'expected': 2
		},
		{
			'msg': 'invalid starting offset gets corrected',
			'offset': 0,
			'distance': -1,
			'expected': 1
		},
		{
			'msg': 'invalid starting offset gets corrected',
			'offset': 61,
			'distance': 1,
			'expected': 60
		},
		{
			'msg': 'first content offset is farthest left',
			'offset': 2,
			'distance': -2,
			'expected': 1
		},
		{
			'msg': 'last content offset is farthest right',
			'offset': 59,
			'distance': 2,
			'expected': 60
		},
		{
			'msg': '1 right within text',
			'offset': 1,
			'distance': 1,
			'expected': 2
		},
		{
			'msg': '2 right within text',
			'offset': 1,
			'distance': 2,
			'expected': 3
		},
		{
			'msg': '1 left within text',
			'offset': 2,
			'distance': -1,
			'expected': 1
		},
		{
			'msg': '2 left within text',
			'offset': 3,
			'distance': -2,
			'expected': 1
		},
		{
			'msg': '1 right over elements',
			'offset': 4,
			'distance': 1,
			'expected': 10
		},
		{
			'msg': '2 right over elements',
			'offset': 4,
			'distance': 2,
			'expected': 11
		},
		{
			'msg': '1 left over elements',
			'offset': 10,
			'distance': -1,
			'expected': 4
		},
		{
			'msg': '2 left over elements',
			'offset': 10,
			'distance': -2,
			'expected': 3
		}
	];
	QUnit.expect( cases.length );
	for ( i = 0; i < cases.length; i++ ) {
		assert.strictEqual(
			doc.getRelativeContentOffset( cases[i].offset, cases[i].distance ),
			cases[i].expected,
			cases[i].msg
		);
	}
} );

QUnit.test( 'getNearestContentOffset', function ( assert ) {
	var doc = new ve.dm.Document( ve.dm.example.data ),
		cases = [
		{
			'msg': 'unspecified direction results in shortest distance',
			'offset': 0,
			'direction': 0,
			'expected': 1
		},
		{
			'msg': 'unspecified direction results in shortest distance',
			'offset': 5,
			'direction': 0,
			'expected': 4
		},
		{
			'msg': 'positive direction results in next valid offset to the right',
			'offset': 5,
			'direction': 1,
			'expected': 10
		},
		{
			'msg': 'negative direction results in next valid offset to the left',
			'offset': 5,
			'direction': -1,
			'expected': 4
		},
		{
			'msg': 'valid offset without direction returns same offset',
			'offset': 1,
			'expected': 1
		},
		{
			'msg': 'valid offset with positive direction returns same offset',
			'offset': 1,
			'direction': 1,
			'expected': 1
		},
		{
			'msg': 'valid offset with negative direction returns same offset',
			'offset': 1,
			'direction': -1,
			'expected': 1
		}
	];
	QUnit.expect( cases.length );
	for ( var i = 0; i < cases.length; i++ ) {
		assert.strictEqual(
			doc.getNearestContentOffset( cases[i].offset, cases[i].direction ),
			cases[i].expected,
			cases[i].msg
		);
	}
} );

QUnit.test( 'getRelativeStructuralOffset', function ( assert ) {
	var doc = new ve.dm.Document( ve.dm.example.data ),
		cases = [
		{
			'msg': 'invalid starting offset with zero distance gets corrected',
			'offset': 1,
			'distance': 0,
			'expected': 5
		},
		{
			'msg': 'invalid starting offset with zero distance gets corrected',
			'offset': 60,
			'distance': 0,
			'expected': 61
		},
		{
			'msg': 'valid offset with zero distance returns same offset',
			'offset': 0,
			'distance': 0,
			'expected': 0
		},
		{
			'msg': 'invalid starting offset gets corrected',
			'offset': 2,
			'distance': -1,
			'expected': 0
		},
		{
			'msg': 'invalid starting offset gets corrected',
			'offset': 59,
			'distance': 1,
			'expected': 61
		},
		{
			'msg': 'first structural offset is farthest left',
			'offset': 5,
			'distance': -2,
			'expected': 0
		},
		{
			'msg': 'last structural offset is farthest right',
			'offset': 58,
			'distance': 2,
			'expected': 61
		},
		{
			'msg': '1 right',
			'offset': 0,
			'distance': 1,
			'expected': 5
		},
		{
			'msg': '1 right, unrestricted',
			'offset': 5,
			'distance': 1,
			'unrestricted': true,
			'expected': 9
		},
		{
			'msg': '2 right',
			'offset': 0,
			'distance': 2,
			'expected': 6
		},
		{
			'msg': '2 right, unrestricted',
			'offset': 0,
			'distance': 2,
			'unrestricted': true,
			'expected': 9
		},
		{
			'msg': '1 left',
			'offset': 61,
			'distance': -1,
			'expected': 58
		},
		{
			'msg': '1 left, unrestricted',
			'offset': 9,
			'distance': -1,
			'unrestricted': true,
			'expected': 5
		},
		{
			'msg': '2 left',
			'offset': 61,
			'distance': -2,
			'expected': 55
		},
		{
			'msg': '2 left, unrestricted',
			'offset': 9,
			'distance': -2,
			'unrestricted': true,
			'expected': 0
		}
	];
	QUnit.expect( cases.length );
	for ( var i = 0; i < cases.length; i++ ) {
		assert.strictEqual(
			doc.getRelativeStructuralOffset(
				cases[i].offset, cases[i].distance, cases[i].unrestricted
			),
			cases[i].expected,
			cases[i].msg
		);
	}
} );

QUnit.test( 'getNearestStructuralOffset', function ( assert ) {
	var i,
		doc = new ve.dm.Document( ve.dm.example.data ),
		cases = [
		{
			'msg': 'unspecified direction results in shortest distance',
			'offset': 1,
			'direction': 0,
			'expected': 0
		},
		{
			'msg': 'unspecified direction results in shortest distance',
			'offset': 4,
			'direction': 0,
			'expected': 5
		},
		{
			'msg': 'unspecified direction results in shortest distance, unrestricted',
			'offset': 8,
			'direction': 0,
			'unrestricted': true,
			'expected': 9
		},
		{
			'msg': 'unspecified direction results in shortest distance, unrestricted',
			'offset': 6,
			'direction': 0,
			'unrestricted': true,
			'expected': 5
		},
		{
			'msg': 'positive direction results in next valid offset to the right',
			'offset': 1,
			'direction': 1,
			'expected': 5
		},
		{
			'msg': 'positive direction results in next valid offset to the right',
			'offset': 4,
			'direction': 1,
			'expected': 5
		},
		{
			'msg': 'positive direction results in next valid offset to the right, unrestricted',
			'offset': 7,
			'direction': 1,
			'unrestricted': true,
			'expected': 9
		},
		{
			'msg': 'negative direction results in next valid offset to the left',
			'offset': 1,
			'direction': -1,
			'expected': 0
		},
		{
			'msg': 'negative direction results in next valid offset to the left',
			'offset': 4,
			'direction': -1,
			'expected': 0
		},
		{
			'msg': 'negative direction results in next valid offset to the left, unrestricted',
			'offset': 6,
			'direction': -1,
			'unrestricted': true,
			'expected': 5
		},
		{
			'msg': 'valid offset without direction returns same offset',
			'offset': 0,
			'expected': 0
		},
		{
			'msg': 'valid offset with positive direction returns same offset',
			'offset': 0,
			'direction': 1,
			'expected': 0
		},
		{
			'msg': 'valid offset with negative direction returns same offset',
			'offset': 0,
			'direction': -1,
			'expected': 0
		},
		{
			'msg': 'valid offset without direction returns same offset, unrestricted',
			'offset': 0,
			'unrestricted': true,
			'expected': 0
		},
		{
			'msg': 'valid offset with positive direction returns same offset, unrestricted',
			'offset': 0,
			'direction': 1,
			'unrestricted': true,
			'expected': 0
		},
		{
			'msg': 'valid offset with negative direction returns same offset, unrestricted',
			'offset': 0,
			'direction': -1,
			'unrestricted': true,
			'expected': 0
		}
	];
	QUnit.expect( cases.length );
	for ( i = 0; i < cases.length; i++ ) {
		assert.strictEqual(
			doc.getNearestStructuralOffset(
				cases[i].offset, cases[i].direction, cases[i].unrestricted
			),
			cases[i].expected,
			cases[i].msg
		);
	}
} );

QUnit.test( 'selectNodes', function ( assert ) {
	var i,
		doc = new ve.dm.Document( ve.dm.example.data ),
		cases = ve.example.getSelectNodesCases( doc );
	for ( i = 0; i < cases.length; i++ ) {
		assert.equalNodeSelection( cases[i].actual, cases[i].expected, cases[i].msg );
	}
} );

QUnit.test( 'getBalancedData', function ( assert ) {
	var i,
		doc = new ve.dm.Document( ve.dm.example.data ),
		cases = [
		{
			'msg': 'empty range',
			'range': new ve.Range( 2, 2 ),
			'expected': []
		},
		{
			'msg': 'range with one character',
			'range': new ve.Range( 2, 3 ),
			'expected': [
				['b', { '{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' } }]
			]
		},
		{
			'msg': 'range with two characters',
			'range': new ve.Range( 2, 4 ),
			'expected': [
				['b', { '{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				['c', { '{"type":"textStyle/italic"}': { 'type': 'textStyle/italic' } }]
			]
		},
		{
			'msg': 'range with two characters and a header closing',
			'range': new ve.Range( 2, 5 ),
			'expected': [
				{ 'type': 'heading', 'attributes': { 'level': 1 } },
				['b', { '{"type":"textStyle/bold"}': { 'type': 'textStyle/bold' } }],
				['c', { '{"type":"textStyle/italic"}': { 'type': 'textStyle/italic' } }],
				{ 'type': '/heading' }
			]
		},
		{
			'msg': 'range with one character, a header closing and a table opening',
			'range': new ve.Range( 3, 6 ),
			'expected': [
				{ 'type': 'heading', 'attributes': { 'level': 1 } },
				['c', { '{"type":"textStyle/italic"}': { 'type': 'textStyle/italic' } }],
				{ 'type': '/heading' },
				{ 'type': 'table' },
				{ 'type': '/table' }
			]
		},
		{
			'msg': 'range from a paragraph into a list',
			'range': new ve.Range( 15, 21 ),
			'expected': [
				{ 'type': 'paragraph' },
				'e',
				{ 'type': '/paragraph' },
				{ 'type': 'list', 'attributes': { 'style': 'bullet' } },
				{ 'type': 'listItem'  },
				{ 'type': 'paragraph' },
				'f',
				{ 'type': '/paragraph' },
				{ 'type': '/listItem' },
				{ 'type': '/list' }
			]
		},
		{
			'msg': 'range from a paragraph inside a nested list into the next list',
			'range': new ve.Range( 20, 27 ),
			'expected': [
				{ 'type': 'list', 'attributes': { 'style': 'bullet' } },
				{ 'type': 'listItem' },
				{ 'type': 'list', 'attributes': { 'style': 'bullet' } },
				{ 'type': 'listItem' },
				{ 'type': 'paragraph' },
				'f',
				{ 'type': '/paragraph' },
				{ 'type': '/listItem' },
				{ 'type': '/list' },
				{ 'type': '/listItem' },
				{ 'type': '/list' },
				{ 'type': 'list', 'attributes': { 'style': 'number' } },
				{ 'type': '/list' }
			]
		},
		{
			'msg': 'range from a paragraph inside a nested list out of both lists',
			'range': new ve.Range( 20, 26 ),
			'expected': [
				{ 'type': 'list', 'attributes': { 'style': 'bullet' } },
				{ 'type': 'listItem' },
				{ 'type': 'list', 'attributes': { 'style': 'bullet' } },
				{ 'type': 'listItem' },
				{ 'type': 'paragraph' },
				'f',
				{ 'type': '/paragraph' },
				{ 'type': '/listItem' },
				{ 'type': '/list' },
				{ 'type': '/listItem' },
				{ 'type': '/list' }
			]
		},
		{
			'msg': 'range from a paragraph inside a nested list out of the outer listItem',
			'range': new ve.Range( 20, 25 ),
			'expected': [
				{ 'type': 'listItem' },
				{ 'type': 'list', 'attributes': { 'style': 'bullet' } },
				{ 'type': 'listItem' },
				{ 'type': 'paragraph' },
				'f',
				{ 'type': '/paragraph' },
				{ 'type': '/listItem' },
				{ 'type': '/list' },
				{ 'type': '/listItem' }
			]
		}
	];
	QUnit.expect( cases.length );
	for ( i = 0; i < cases.length; i++ ) {
		assert.deepEqual(
			doc.getBalancedData( cases[i].range ),
			cases[i].expected,
			cases[i].msg
		);
	}
} );