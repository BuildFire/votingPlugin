'use strict';

(function (angular, buildfire) {
    angular.module('votingPluginContent', ['ngRoute', 'ui.bootstrap', 'ui.tinymce',
        'ui.sortable', 'ngAnimate'])
        //injected ngRoute for routing
        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider
                .when('/', {
                    templateUrl: 'templates/home.html',
                    controllerAs: 'ContentHome',
                    controller: 'ContentHomeCtrl',
                    resolve: {
                        context: function (Context) {
                            return Context.getContext();
                        }
                    }
                })
                .when('/vote', {
                    templateUrl: 'templates/vote.html',
                    controllerAs: 'ContentVote',
                    controller: 'ContentVoteCtrl',
                    resolve: {
                        context: function (Context) {
                            return Context.getContext();
                        }
                    }
                })
                .when('/vote/:id/:index', {
                    templateUrl: 'templates/vote.html',
                    controllerAs: 'ContentVote',
                    controller: 'ContentVoteCtrl',
                    resolve: {
                        context: function (Context) {
                            return Context.getContext();
                        }
                    }
                })
                .otherwise('/');
        }]).filter('getImageUrl', function () {
            return function (url, width, height, type) {
                if (type == 'resize')
                    return buildfire.imageLib.resizeImage(url, {
                        width: width,
                        height: height
                    });
                else
                    return buildfire.imageLib.cropImage(url, {
                        width: width,
                        height: height
                    });
            }
        })
        .directive("loadImage", [function () {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    element.attr("src", "../../../../styles/media/holder-" + attrs.loadImage + ".gif");

                    var elem = $("<img>");
                    elem[0].onload = function () {
                        element.attr("src", attrs.finalSrc);
                        elem.remove();
                    };
                    elem.attr("src", attrs.finalSrc);
                }
            };
        }])
        .run(['$location', '$rootScope', 'VoteCache', function ($location, $rootScope, VoteCache) {
            buildfire.messaging.onReceivedMessage = function (msg) {
                switch (msg.type) {
                    case 'OpenItem':
                        VoteCache.setVote(msg.data);
                        $location.path('/vote/' + msg.data._id + '/' + msg.index);
                        $rootScope.$apply();
                        break;
                    case 'BackToHome':
                        $location.path('/');
                        $rootScope.$apply();
                        break;
                }
            };
        }])
})(window.angular, window.buildfire);