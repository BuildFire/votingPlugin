'use strict';

(function (angular, buildfire) {
    angular
        .module('votingPluginContent')
        .controller('WidgetHomeCtrl', ['$scope', 'ViewStack', 'VotingAPI', 'STATUS_CODE', 'TAG_NAMES', 'LAYOUTS', 'DataStore', 'VoteCache', '$rootScope', '$sce', 'Context',
            function ($scope, ViewStack, VotingAPI, STATUS_CODE, TAG_NAMES, LAYOUTS, DataStore, VoteCache, $rootScope, $sce, Context) {
                var WidgetHome = this;

                $rootScope.deviceHeight = window.innerHeight;
                $rootScope.deviceWidth = window.innerWidth || 320;
                $rootScope.itemListbackgroundImage = "";
                $rootScope.itemDetailsBackgroundImage = "";

                $scope.setWidth = function () {
                    $rootScope.deviceWidth = window.innerWidth > 0 ? window.innerWidth : '320';
                };

                //Refresh list of items on pulling the tile bar
                buildfire.datastore.onRefresh(function () {
                    init();
                });

                //create new instance of buildfire carousel viewer
                WidgetHome.view = null;

                WidgetHome.listeners = {};
                $rootScope.deviceratio = window.devicePixelRatio;
                WidgetHome.PlaceHolderImageWidth = 60 * window.devicePixelRatio + 'px';
                WidgetHome.PlaceHolderImageHeight = 60 * window.devicePixelRatio + 'px';
                WidgetHome.PlaceHolderImageWidth3 = 110 * window.devicePixelRatio + 'px';
                WidgetHome.PlaceHolderImageHeight3 = 60 * window.devicePixelRatio + 'px';
                /**
                 * Initialize current logged in user as null. This field is re-initialized if user is already logged in or user login user auth api.
                 */
                WidgetHome.currentLoggedInUser = null;

                /**
                 * Method to open a reward details page.
                 */
                WidgetHome.openVote = function (vote, index) {
                    debugger;
                    if (vote)
                        vote = JSON.parse(angular.toJson(vote));
                    VoteCache.setVote(vote);
                    ViewStack.push({
                        template: 'Item_Details'
                    });
                    buildfire.messaging.sendMessageToControl({
                        type: 'OpenItem',
                        data: vote,
                        index: index
                    });
                };

                /**
                 * Method to fetch get Content and Votes
                 */
                WidgetHome.getContentAndVotes = function () {
                    var successVotes = function (result) {
                        WidgetHome.votes = result;
                        if (!WidgetHome.votes)
                            WidgetHome.votes = [];
                        $scope.$digest();
                    };
                    var errorVotes = function (err) {
                        if (err && err.code !== STATUS_CODE.NOT_FOUND) {
                            console.error('Error while getting data loyaltyRewards--------------------------------------', err);
                        }
                        $scope.$digest();
                    };
                    var successContent = function (result) {
                        WidgetHome.data = result;
                        if (!WidgetHome.data)
                            WidgetHome.data = {};
                        if (WidgetHome.data.images)
                            WidgetHome.carouselImages = WidgetHome.data.images;
                        else
                            WidgetHome.carouselImages = [];

                        VoteCache.setContent(result);

                        $scope.$digest();
                    };

                    var errorContent = function (error) {
                        WidgetHome.carouselImages = [];
                        console.error('Error fetching voting content---------------------------------------------------', error);

                        $scope.$digest();
                    };

                    Context.getContext(function (ctx) {
                        VotingAPI.getContent(function (err, result) {
                            if (err)
                                errorContent(err);
                            else
                                successContent(result);
                        });
                        VotingAPI.getVotes(function (err, result) {
                            if (err)
                                errorVotes(err);
                            else
                                successVotes(result);
                        });
                    });
                };

                /**
                 * This event listener is bound for "REWARD_DELETED" event broadcast
                 */
                WidgetHome.listeners['REWARD_DELETED'] = $rootScope.$on('REWARD_DELETED', function (e, index) {
                    WidgetHome.getContentAndVotes();
                });

                /**
                 * This event listener is bound for "REWARDS_SORTED" event broadcast
                 */
                WidgetHome.listeners['REWARDS_SORTED'] = $rootScope.$on('REWARDS_SORTED', function (e) {
                    WidgetHome.getContentAndVotes();
                });

                /**
                 * This event listener is bound for "Carousel:LOADED" event broadcast
                 */
                WidgetHome.listeners['Carousel:LOADED'] = $rootScope.$on("Carousel:LOADED", function () {
                    WidgetHome.view = null;
                    if (!WidgetHome.view) {
                        WidgetHome.view = new buildfire.components.carousel.view("#carousel", [], "WideScreen");
                    }
                    if (WidgetHome.carouselImages) {
                        WidgetHome.view.loadItems(WidgetHome.carouselImages, null, "WideScreen");
                    } else {
                        WidgetHome.view.loadItems([]);
                    }
                });

                /**
                 * This event listener is bound for "REWARD_ADDED" event broadcast
                 */
                WidgetHome.listeners['REWARD_ADDED'] = $rootScope.$on('REWARD_ADDED', function (e, item) {
                    WidgetHome.getContentAndVotes();
                });

                /**
                 * This event listener is bound for "GOTO_HOME" event broadcast
                 */
                WidgetHome.listeners['GOTO_HOME'] = $rootScope.$on('GOTO_HOME', function (e) {
                    WidgetHome.getContentAndVotes();
                });

                /**
                 * This event listener is bound for "APPLICATION_UPDATED" event broadcast
                 */
                WidgetHome.listeners['APPLICATION_UPDATED'] = $rootScope.$on('APPLICATION_UPDATED', function (err, result) {
                    WidgetHome.getContentAndVotes();
                });

                /**
                 * This event listener is bound for "REFRESH_APP" event broadcast
                 */
                WidgetHome.listeners['REFRESH_APP'] = $rootScope.$on('REFRESH_APP', function (e) {
                    WidgetHome.getContentAndVotes();
                });

                WidgetHome.showDescription = function (description) {
                    return !((description == '<p>&nbsp;<br></p>') || (description == '<p><br data-mce-bogus="1"></p>'));
                };

                /**
                 * Method to parse and show description in html format
                 */
                WidgetHome.safeHtml = function (html) {
                    if (html) {
                        var $html = $('<div />', {html: html});
                        $html.find('iframe').each(function (index, element) {
                            var src = element.src;
                            console.log('element is: ', src, src.indexOf('http'));
                            src = src && src.indexOf('file://') != -1 ? src.replace('file://', 'http://') : src;
                            element.src = src && src.indexOf('http') != -1 ? src : 'http:' + src;
                        });
                        return $sce.trustAsHtml($html.html());
                    }
                };

                /*
                 * Fetch user's data from datastore
                 */

                var init = function () {
                    var success = function (result) {
                        if (result && result.data) {
                            console.log('BUILDFIRE GET--------------------------LOYALTY---------RESULT', result);
                            WidgetHome.data = result.data;
                        }
                        else {
                            WidgetHome.info = {
                                design: {
                                    listLayout: LAYOUTS.listLayout[0].name
                                }
                            };
                        }
                        if (!WidgetHome.info)
                            WidgetHome.info = {};
                        if (!WidgetHome.info.design)
                            WidgetHome.info.design = {};
                        if (!WidgetHome.info.settings)
                            WidgetHome.info.settings = {};
                        if (!WidgetHome.info.design.listLayout) {
                            WidgetHome.info.design.listLayout = LAYOUTS.listLayout[0].name;
                        }
                        if (!WidgetHome.info.design.itemListbackgroundImage) {
                            $rootScope.itemListbackgroundImage = "";
                        } else {
                            $rootScope.itemListbackgroundImage = WidgetHome.info.design.itemListbackgroundImage;
                        }
                        if (!WidgetHome.info.design.itemDetailsBackgroundImage) {
                            $rootScope.itemDetailsBackgroundImage = "";
                        } else {
                            $rootScope.itemDetailsBackgroundImage = WidgetHome.info.design.itemDetailsBackgroundImage;
                        }
                    };
                    var error = function (err) {
                        WidgetHome.data = {design: {listLayout: LAYOUTS.listLayout[0].name}};
                        console.error('Error while getting data', err);
                    };
                    DataStore.get(TAG_NAMES.VOTING_INFO).then(success, error);
                    WidgetHome.getContentAndVotes();
                };

                var onUpdateCallback = function (event) {
                    console.log("++++++++++++++++++++++++++", event);
                    setTimeout(function () {
                        if (event && event.tag) {
                            switch (event.tag) {
                                case TAG_NAMES.LOYALTY_INFO:
                                    WidgetHome.data = event.data;
                                    if (!WidgetHome.data.design)
                                        WidgetHome.data.design = {};
                                    if (!WidgetHome.data.design.listLayout) {
                                        WidgetHome.data.design.listLayout = LAYOUTS.listLayout[0].name;
                                    }
                                    if (!WidgetHome.data.design.itemListbackgroundImage) {
                                        $rootScope.itemListbackgroundImage = "";
                                    } else {
                                        $rootScope.itemListbackgroundImage = WidgetHome.data.design.itemListbackgroundImage;
                                    }
                                    if (!WidgetHome.data.design.itemDetailsBackgroundImage) {
                                        $rootScope.itemDetailsBackgroundImage = "";
                                    } else {
                                        $rootScope.itemDetailsBackgroundImage = WidgetHome.data.design.itemDetailsBackgroundImage;
                                    }
                                    break;
                            }
                            $scope.$digest();
                            $rootScope.$digest();
                        }
                    }, 0);
                };

                /**
                 * DataStore.onUpdate() is bound to listen any changes in datastore
                 */
                DataStore.onUpdate().then(null, null, onUpdateCallback);

                WidgetHome.listeners['REWARD_UPDATED'] = $rootScope.$on('REWARD_UPDATED', function (e, item, index) {
                    if (item && WidgetHome.loyaltyRewards && WidgetHome.loyaltyRewards.length) {
                        WidgetHome.loyaltyRewards.some(function (reward, index) {
                            if (reward._id == item._id) {
                                WidgetHome.loyaltyRewards[index] = item;
                                return true;
                            }
                        })
                    }
                });

                $scope.$on("$destroy", function () {
                    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>destroyed");
                    for (var i in WidgetHome.listeners) {
                        if (WidgetHome.listeners.hasOwnProperty(i)) {
                            WidgetHome.listeners[i]();
                        }
                    }
                });

                WidgetHome.listeners['CHANGED'] = $rootScope.$on('VIEW_CHANGED', function (e, type, view) {
                    if (!ViewStack.hasViews()) {
                        // bind on refresh again
                        buildfire.datastore.onRefresh(function () {
                            init();
                        });
                    }
                });

                init();
            }]);
})(window.angular, window.buildfire);

