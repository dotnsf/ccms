//. api.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    uuidv1 = require( 'uuid/v1' ),
    api = express();
var settings = require( '../settings' );

api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );

var db_service_name = 'CLOUDANT';

//. env values
process.env[db_service_name + '_AUTH_TYPE'] = settings.db_auth_type;
process.env[db_service_name + '_URL'] = settings.db_url;
process.env[db_service_name + '_APIKEY'] = settings.db_apikey;
process.env[db_service_name + '_USERNAME'] = settings.db_username;
process.env[db_service_name + '_PASSWORD'] = settings.db_password;

//. DB
var { CloudantV1 } = require( '@ibm-cloud/cloudant' );

//. 環境変数 CLOUDANT_AUTH_TYPE を見て、その内容によって CLOUDANT_URL や CLOUDANT_APIKEY を参照して接続する
var client = CloudantV1.newInstance( { serviceName: db_service_name, disableSslVerification: true } );  //. disableSslVerification は BASIC 認証時に必須（ないとエラー）

client.putDatabase( { db: settings.db_name } ).then( function( result ){
  if( result.result.ok ){
    console.log( { result } );
  }
}).catch( function( err ){
  //console.log( { err } );
});

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';
api.all( '/*', function( req, res, next ){
  if( settings_cors ){
    res.setHeader( 'Access-Control-Allow-Origin', settings_cors );
    res.setHeader( 'Vary', 'Origin' );
  }
  next();
});

//. Create
api.createItem = async function( item ){
  return new Promise( async ( resolve, reject ) => {
    if( client ){
      client.postDocument({
        db: settings.db_name,
        document: item
      }).then( function( result ){
        resolve( { status: true, result: result } );
      });
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};

/*
api.createDesignDoc = async function( viewname, viewmap, indexname, indexmap, ddoc ){
  return new Promise( async ( resolve, reject ) => {
    if( client ){
      var views = {};
      var indexes = {};
      views[""+viewname] = { map: viewmap };
      indexes[""+indexname] = { index: indexmap };
      client.putDesignDocument({
        db: settings.db_name,
        designDocument: {
          views: views,
          indexes: indexes
        },
        ddoc: ddoc
      }).then( function( result ){
        resolve( { status: true, result: result.result } );
      });
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};
*/
api.createDesignDoc = async function( id, views, lists, shows ){
  return new Promise( async ( resolve, reject ) => {
    if( client ){
      var designdoc = {
        _id: id,
        language: "javascript"
      };
      if( views ){
        designdoc['views'] = views;
      }
      if( lists ){
        designdoc['lists'] = lists;
      }
      if( shows ){
        designdoc['shows'] = shows;
      }
      client.postDocument({
        db: settings.db_name,
        document: designdoc
      }).then( function( result ){
        resolve( { status: true, result: result } );
      });
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};

//. Read
api.readItem = async function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    if( client ){
      client.getDocument({
        db: settings.db_name,
        docId: item_id,
        includeDocs: true
      }).then( function( result ){
        resolve( { status: true, result: result.result } );
      });
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};

api.readItems = async function( limit, skip ){
  return new Promise( async ( resolve, reject ) => {
    if( client ){
      var params = {
        db: settings.db_name,
        includeDocs: true
      };
      if( limit ){ params.limit = limit; }
      if( skip ){ params.skip = skip; }
      client.postAllDocs( params ).then( function( result ){
        var docs = [];
        result.result.rows.forEach( function( r ){
          if( r.doc.types ){
            docs.push( r.doc );
          }
        });
        resolve( { status: true, results: docs } );
      });
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};

api.queryItems = async function( selector, limit, skip ){
  /*
  selector = { type: { "$eq": "user" } };
  */
  return new Promise( async ( resolve, reject ) => {
    if( client ){
      var params = {
        db: settings.db_name,
        selector: selector
      };
      if( limit ){ params.limit = limit; }
      if( skip ){ params.skip = skip; }
      client.postFind( params ).then( function( result ){
        resolve( { status: true, results: result.result.docs } );
      });

    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};

api.readDesignDoc = async function( ddoc ){
  return new Promise( async ( resolve, reject ) => {
    if( client ){
      client.getDesignDocument({
        db: settings.db_name,
        ddoc: ddoc,
        latest: true
      }).then( function( result ){
        /* 
        {
          _id: '_design/ddoc',
          _rev: '8-7e2537..',
          indexes: {
            ..
          },
          views: {
            ..
          }
        }
        */
        resolve( { status: true, result: result.result } );
      });
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};

api.readDesignDocs = async function( limit, skip ){
  return new Promise( async ( resolve, reject ) => {
    /*
    if( client ){
      var params = {
        db: settings.db_name,
        includeDocs: true
      };
      if( limit ){ params.limit = limit; }
      if( skip ){ params.skip = skip; }
      client.postAllDocs( params ).then( function( result ){
        var docs = [];
        result.result.rows.forEach( function( r ){
          console.log( r );
          if( !r.types ){
            docs.push( r.doc );
          }
        });
        resolve( { status: true, results: docs } );
      });
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
    */
    if( client ){
      var params = {
        db: settings.db_name,
        includeDocs: true
      };
      if( limit ){ params.limit = limit; }
      if( skip ){ params.skip = skip; }
      client.postDesignDocs( params ).then( function( result ){
        var docs = [];
        result.result.rows.forEach( function( r ){
          docs.push( r.doc );
        });
        resolve( { status: true, results: docs } );
      });
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};

//. Update
api.updateItem = async function( item ){
  return new Promise( async ( resolve, reject ) => {
    if( client ){
      client.getDocument({
        db: settings.db_name,
        docId: item._id
      }).then( function( result ){
        item._rev = result.result._rev;
        client.postDocument({
          db: settings.db_name,
          document: item
        }).then( function( result0 ){
          //. Parameter validation errors
          resolve( { status: true } );
        });
      });
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};

//. Delete
api.deleteItem = async function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    if( client ){
      client.getDocument({
        db: settings.db_name,
        docId: item_id
      }).then( function( result ){
        var item_rev = result.result._rev;
        client.deleteDocument({
          db: settings.db_name,
          docId: item_id,
          rev: item_rev
        }).then( function( result0 ){
          resolve( { status: true } );
        });
      });
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};

api.deleteItems = async function(){
  return new Promise( async ( resolve, reject ) => {
    if( client ){
      resolve( { status: true, message: 'not implemented yet.' } );
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};

api.deleteDesignDoc = async function( ddoc ){
  return new Promise( async ( resolve, reject ) => {
    if( client ){
      client.getDesignDocument({
        db: settings.db_name,
        ddoc: ddoc,
        latest: true
      }).then( function( result0 ){
        var rev = result0.result._rev;
        client.deleteDesignDocument({
          db: settings.db_name,
          ddoc: ddoc,
          rev: rev
        }).then( function( result1 ){
          resolve( { status: true } );
        });
      });
    }else{
      resolve( { status: false, error: 'no db ready.' } );
    }
  });
};


api.post( '/item', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item = req.body;
  item.price = parseInt( item.price );

  api.createItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.post( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var items = req.body;
  for( var i = 0; i < items.length; i ++ ){
    items[i].price = parseInt( items[i].price );
  }

  api.createItems( items ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.post( '/design', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var viewname = req.body.viewname;
  var viewmap = req.body.viewmap;
  var indexname = req.body.indexname;
  var indexmap = req.body.indexmap;
  var ddoc = req.body.ddoc;
  var id = req.body.id;
  var views = req.body.views ? JSON.parse( req.body.views ) : null;
  var lists = req.body.lists ? JSON.parse( req.body.lists ) : null;
  var shows = req.body.shows ? JSON.parse( req.body.shows ) : null;

  //api.createDesignDoc( viewname, viewmap, indexname, indexmap, ddoc ).then( function( result ){
  api.createDesignDoc( id, views, lists, shows ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.readItem( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var limit = 0;
  var start = 0;
  if( req.query.limit ){
    try{
      limit = parseInt( req.query.limit );
    }catch( e ){
    }
  }
  if( req.query.start ){
    try{
      start = parseInt( req.query.start );
    }catch( e ){
    }
  }
  api.readItems( limit, start ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/items/:key', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var key = req.params.key;
  api.queryItems( key ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/design/:ddoc', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var ddoc = req.params.ddoc;
  api.readDesignDoc( ddoc ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/designs', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var limit = 0;
  var start = 0;
  if( req.query.limit ){
    try{
      limit = parseInt( req.query.limit );
    }catch( e ){
    }
  }
  if( req.query.start ){
    try{
      start = parseInt( req.query.start );
    }catch( e ){
    }
  }
  api.readDesignDocs( limit, start ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.put( '/item/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  var item = req.body;
  //item.id = item_id;
  item._id = item_id;
  item.price = parseInt( item.price );
  api.updateItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/item/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.deleteItem( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/items', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  api.deleteItems().then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/design/:ddoc', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var ddoc = req.params.ddoc;
  api.deleteDesignDoc( ddoc ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});


//. api をエクスポート
module.exports = api;
