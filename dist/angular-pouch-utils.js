/*!
 * angular-pouch-utils
 * 
 * Version: 0.1.0 - 2014-10-27T11:00:06.767Z
 * License: 
 */


(function() {

  "use strict";

  angular.module("pouchUtils", [] )


  .factory("pouchService", [ "$q", function($q) {

    var svc = {};


    svc.getDocListFactory = function(db) {
      return function(options) {
        var baseOptions = {include_docs: true, conflicts:true};
        var opts = _.extend(baseOptions, options || {});
        var deferred = $q.defer();
        db.allDocs(opts, function(err, doc) {
          if (err){
            deferred.reject(err);
            return;
          }
          var out = opts.include_docs ? _.pluck(doc.rows, 'doc') : doc.rows;
          deferred.resolve(out);
        });
        return deferred.promise;
      };
    };

    svc.wrapQuery = function(db, mapRedOptions, options){
      var baseOptions = {include_docs: true, conflicts:true};
      var opts = _.extend(baseOptions, options || {});
      var deferred = $q.defer();
      db.query(mapRedOptions, opts, function(err, doc) {
        if (err){
          deferred.reject(err);
        }
        var out = opts.include_docs ? _.pluck(doc.rows, 'doc') : doc.rows;
        deferred.resolve(out);
      });
      return deferred.promise;
    };

    svc.queryFactory =  function(db){
      return function(mapRedOptions, options) {
        return svc.wrapQuery(db, mapRedOptions, options);
      };
    };

    svc.filterFactory = function(db) {
      return function(predicate, options) {
        var mp = function(doc,emit){
          if(predicate(doc)){
            emit(doc._id);
          }
        };
        return svc.wrapQuery(db, {map:mp}, options);
      };
    };

    svc.rejectFactory = function(db) {
      return function(predicate, options) {
        var mp = function(doc,emit){
          if(!predicate(doc)){
            emit(doc._id);
          }
        };
        return svc.wrapQuery(db, {map:mp}, options);
      };
    };


    svc.whereFactory =  function(db) {
      return function(attrs, options) {
        var predicate = _.matches(attrs);
        var mp = function(doc,emit){
          if(predicate(doc)){
            emit(doc._id);
          }
        };
        return svc.wrapQuery(db, {map:mp}, options);
      };
    };

    svc.whereNotFactory =  function(db) {
      return function(attrs, options) {
        var predicate = _.matches(attrs);
        var mp = function(doc,emit){
          if(!predicate(doc)){
            emit(doc._id);
          }
        };
        return svc.wrapQuery(db, {map:mp}, options);
      };
    };


    svc.getDocFactory = function(db){
      return function(id, options){
        var baseOptions = {include_docs: true, conflicts:true};
        var deferred = $q.defer();
        var opts = _.extend({conflicts:true}, options||{});
        db.get(id, opts, function(err, doc) {
          if (err){
            deferred.reject(err);
          }
          deferred.resolve(doc);
        });
        return deferred.promise;
      };
    };

    svc.saveDocFactory = function(db) {
      return function(item) {
        var deferred = $q.defer();
        if (item._id && item._rev){
          db.put(item, item._id, item._rev)
          .then(function(response) {
            item._rev = response.rev;
            deferred.resolve(item);
          })
          .catch(function(err) {
            deferred.reject(err);
          });
        } else {
          db.post(item, item._id)
          .then(function(response) {
            item._id = response.id;
            item._rev = response.rev;
            deferred.resolve(item);
          })
          .catch(function(err) {
            deferred.reject(err);
          });
        }
        return deferred.promise;
      };
    };


    svc.deleteDocFactory = function(db) {
      return function(item, options) {
        var deferred = $q.defer();
        db.remove(item, options, function(err, doc) {
          if (err) {
            deferred.reject(err);
          }
          deferred.resolve(doc);
        });
        return deferred.promise;
      };
    };

    svc.createDesignDoc = function(name, mapReduceFunction) {
      var ddoc = {
        _id: '_design/' + name,
        views: {}
      };
      ddoc.views[name] = {  };
      if(mapReduceFunction.map){
        ddoc.views[name].map =  mapReduceFunction.map.toString();
      }
      if(mapReduceFunction.reduce){
        ddoc.views[name].reduce =  mapReduceFunction.reduce.toString();
      }
      return ddoc;
    };

    svc.createFilterDoc = function(name, filterFunction){

      var ddoc = {
        _id: '_design/' + name,
        filters: {
          name : filterFunction.toString()
        }
      };
      return ddoc;

    };

    svc.putDesignDocFactory = function(db) {
      return function(ddoc, comparer) {
        var deferred = $q.defer();
        comparer  = comparer || 'views';

        db.get(ddoc._id, function(err,  result){
          if(err){
            //it's not there;

          } else {
            //is there.
            if (angular.equals(ddoc[comparer], result[comparer])){
              deferred.resolve(result);
              return;
            }
            ddoc._rev = result._rev;
          }

          db.put(ddoc,  function(err, doc) {
            if (err) {
              if(err.name == 'conflict'){
                deferred.resolve(doc);
              }
              deferred.reject(err);
            }
            //just init the query
            db.query(name, {stale: 'update_after'});
            deferred.resolve(doc);
          });




        });

        return deferred.promise;
      };
    };




    //#TODO: TAKE A LOOK AT https://github.com/pouchdb/GQL



    svc.getDBManager = function(db){
      return {

        get : svc.getDocFactory(db),
        save : svc.saveDocFactory(db),
        delete : svc.deleteDocFactory(db),
        all : svc.getDocListFactory(db),
        query : svc.queryFactory(db),
        filter : svc.filterFactory(db),
        reject : svc.rejectFactory(db),
        where : svc.whereFactory(db),
        whereNot : svc.whereNotFactory(db),
        putDesign : svc.putDesignDocFactory(db)

      };
    };

    return svc;

  } ]);

}());
