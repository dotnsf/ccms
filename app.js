//. app.js
var express = require( 'express' ),
    ejs = require( 'ejs' ),
    app = express();

var settings = require( './settings' );

var api = require( './api/api' );
app.use( '/api', api );

app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

app.get( '/', async function( req, res ){
  var r1 = await api.readItems();
  var items = ( r1.status ? r1.results : [] );
  //console.log( items );
  var r2 = await api.readDesignDocs();
  var designdocs = ( r2.status ? r2.results : [] );
  //console.log( designdocs );
  res.render( 'index', { db_url: settings.db_url + '/' + settings.db_name, items: items, designdocs: designdocs } );
});

var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

module.exports = app;
