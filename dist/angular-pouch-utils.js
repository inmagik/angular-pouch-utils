/*!
 * angular-pouch-utils
 * 
 * Version: 0.1.0 - 2014-10-19T23:36:07.095Z
 * License: 
 */


(function() {

  "use strict";

  angular.module("pouchUtils", [] )


  .factory("pouchService", [ "$q", function($q) {

    var svc = {};
    var baseOptions = {include_docs: true, conflicts:true};

    svc.getDocListFactory = function(db) {
      return function(options) {
        var opts = _.extend(baseOptions, options || {});
        var deferred = $q.defer();
        db.allDocs(opts, function(err, doc) {
          if (err){
            deferred.reject(err);
          }
          var out = opts.include_docs ? _.pluck(doc.rows, 'doc') : doc.rows;
          deferred.resolve(out);
        });
        return deferred.promise;
      };
    };

    svc.wrapQuery = function(db, mapRedOptions, options){
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
        whereNot : svc.whereNotFactory(db)

      };
    };

    return svc;

  } ]);

}());
