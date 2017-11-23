'use strict';

(function (angular, buildfire) {
    angular.module('votingPluginContent')
        .provider('Buildfire', [function () {
            var Buildfire = this;
            Buildfire.$get = function () {
                return buildfire
            };
            return Buildfire;
        }])
        .factory('Location', [function () {
            var _location = window.location;
            return {
                goTo: function (path) {
                    _location.href = path;
                }
            };
        }])
        .factory('ViewStack', ['$rootScope', function ($rootScope) {
            var views = [];
            var viewMap = {};
            return {
                push: function (view) {
                    if (viewMap[view.template]) {
                        this.pop();
                    } else {
                        viewMap[view.template] = 1;
                        views.push(view);
                        $rootScope.$broadcast('VIEW_CHANGED', 'PUSH', view);
                    }
                    return view;
                },
                pop: function () {
                    $rootScope.$broadcast('BEFORE_POP', views[views.length - 1]);
                    var view = views.pop();
                    delete viewMap[view.template];
                    $rootScope.$broadcast('VIEW_CHANGED', 'POP', view);

                    return view;
                },
                hasViews: function () {
                    return !!views.length;
                },
                getPreviousView: function () {
                    return views.length && views[views.length - 2] || {};
                },
                getCurrentView: function () {
                    return views.length && views[views.length - 1] || {};
                },
                popAllViews: function (noAnimation) {
                    $rootScope.$broadcast('BEFORE_POP', null);
                    $rootScope.$broadcast('VIEW_CHANGED', 'POPALL', views, noAnimation);
                    views = [];
                    viewMap = {};
                }
            };
        }])
        .factory('VotingAPI', ['$q', 'Buildfire',
            function ($q, Buildfire) {
                var getContent = function (callback) {
                    Buildfire.datastore.get('content', function (err, result) {
                        if (err)
                            callback(err);
                        else if (result)
                            callback(null, result.data);
                        else
                            callback(null, null);
                    });
                };

                var getVotes = function (callback) {
                    Buildfire.datastore.search({"sort": {"order": 1}}, 'votes', callback);
                };

                var doVote = function (vote, answers, callback) {
                    var i = 0;
                    var doUpdate = function () {
                        if (answers && answers[i] && answers[i].id) {
                            Buildfire.publicData.searchAndUpdate({
                                    voteId: vote.id,
                                    "answers.id": answers[i].id
                                }, {
                                    $inc: {"answers.$.count": 1}
                                },
                                'voteAnswers', function (err, result) {
                                    if (err)
                                        callback(err);
                                    else {
                                        i++;
                                        doUpdate();
                                    }
                                });
                        }
                        else
                            callback(null, true);
                    };
                };

                return {
                    getContent: getContent,
                    getVotes: getVotes,
                    doVote: doVote
                };
            }
        ])
        .factory("DataStore", ['Buildfire', '$q', 'STATUS_CODE', 'STATUS_MESSAGES', function (Buildfire, $q, STATUS_CODE, STATUS_MESSAGES) {
            return {
                get: function (_tagName) {
                    var deferred = $q.defer();
                    Buildfire.datastore.get(_tagName, function (err, result) {
                        if (err) {
                            return deferred.reject(err);
                        } else if (result) {
                            return deferred.resolve(result);
                        }
                        else {
                            return deferred.reject(new Error('Result Not Found'));
                        }
                    });
                    return deferred.promise;
                },
                save: function (_item, _tagName) {
                    var deferred = $q.defer();
                    if (typeof _item == 'undefined') {
                        return deferred.reject(new Error({
                            code: STATUS_CODE.UNDEFINED_DATA,
                            message: STATUS_MESSAGES.UNDEFINED_DATA
                        }));
                    }
                    Buildfire.datastore.save(_item, _tagName, function (err, result) {
                        if (err) {
                            return deferred.reject(err);
                        } else if (result) {
                            return deferred.resolve(result);
                        }
                    });
                    return deferred.promise;
                },
                onUpdate: function () {
                    var deferred = $q.defer();
                    var onUpdateFn = Buildfire.datastore.onUpdate(function (event) {
                        if (!event) {
                            return deferred.notify(new Error({
                                code: STATUS_CODE.UNDEFINED_DATA,
                                message: STATUS_MESSAGES.UNDEFINED_DATA
                            }), true);
                        } else {
                            return deferred.notify(event);
                        }
                    }, true);
                    return deferred.promise;
                }
            }
        }])
        .factory('VoteCache', ['$rootScope', function ($rootScope) {
            var vote = {};
            var votes = [];
            var content = {};
            return {
                setVotes: function (data) {
                    votes = data;
                },
                getVotes: function () {
                    return votes;
                },
                setVote: function (data) {
                    vote = data;
                },
                getVote: function () {
                    return vote;
                },
                setContent: function (data) {
                    content = data;
                },
                getContent: function () {
                    return content;
                }
            };
        }])
        .factory('Context', ['$q', function ($q) {
            var context = null;
            return {
                getContext: function (cb) {
                    if (context) {
                        cb && cb(context);
                        return context;
                    }
                    else {
                        buildfire.getContext(function (err, _context) {
                            if (err) {
                                cb && cb(null);
                                return null;
                            }
                            else {
                                context = _context;
                                cb && cb(_context);
                                return context;
                            }
                        });
                    }
                }
            };
        }])
})(window.angular, window.buildfire);