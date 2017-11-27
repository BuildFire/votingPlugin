'use strict';

(function (angular, window) {
    angular
        .module('votingPluginContent')
        .controller('WidgetItemCtrl', ['$scope', 'ViewStack', 'VotingAPI', 'VoteCache', '$sce', '$rootScope', '$timeout',
            function ($scope, ViewStack, VotingAPI, VoteCache, $sce, $rootScope, $timeout) {

                var WidgetItem = this;
                var breadCrumbFlag = true;

                WidgetItem.listeners = {};
                WidgetItem.insufficientPoints = false;

                //create new instance of buildfire carousel viewer
                WidgetItem.view = null;

                buildfire.history.get('pluginBreadcrumbsOnly', function (err, result) {
                    if (result && result.length) {
                        result.forEach(function (breadCrumb) {
                            if (breadCrumb.label == 'Item') {
                                breadCrumbFlag = false;
                            }
                        });
                    }
                    if (breadCrumbFlag) {
                        buildfire.history.push('Item', {elementToShow: 'Item'});
                    }
                });

                //Refresh item details on pulling the tile bar

                buildfire.datastore.onRefresh(function () {
                });

                /**
                 * Initialize variable with current view returned by ViewStack service. In this case it is "Item_Details" view.
                 */
                var currentView = ViewStack.getCurrentView();

                /**
                 * Initialize WidgetItem.reward with reward details set in home controller
                 */
                if (VoteCache.getVote()) {
                    WidgetItem.vote = VoteCache.getVote();

                    WidgetItem.selectionTypeTemplate = getAnswerTemplate(WidgetItem.vote);
                }

                /**
                 * Method to parse and show reward's description in html format
                 */
                WidgetItem.safeHtml = function (html) {
                    if (html)
                        return $sce.trustAsHtml(html);
                };

                WidgetItem.doVote = function () {
                    //todo: check if the selectionAnswers
                    debugger;
                    WidgetItem.selectionAnswers;
                    VotingAPI.doVote(WidgetItem.vote, WidgetItem.selectionAnswers,function () {
                        debugger;
                    });
                };

                WidgetItem.selectAnswer = function (answer) {
                    if (!WidgetItem.selectionAnswers)
                        WidgetItem.selectionAnswers = [];
                    if (WidgetItem.vote && WidgetItem.vote.data &&
                        WidgetItem.vote.data.selectionType) {
                        switch (WidgetItem.vote.data.selectionType.value) {
                            case "single":
                                WidgetItem.selectionAnswers = [JSON.parse(angular.toJson(answer))];
                                break;
                            case "multi":
                                var index = -1;
                                for (var i = 0; i < WidgetItem.selectionAnswers; i++) {
                                    if (WidgetItem.selectionAnswers[i] && WidgetItem.selectionAnswers[i].id == answer.id) {
                                        index = i;
                                        break;
                                    }
                                }
                                if (index > -1)
                                    WidgetItem.selectionAnswers.splice(index, 1);
                                else
                                    WidgetItem.selectionAnswers.push(JSON.parse(angular.toJson(answer)));
                                break;
                        }
                    }
                };

                function getAnswerTemplate(vote) {
                    if (vote && vote.data && vote.data.selectionType) {
                        switch (vote.data.selectionType.value) {
                            case "single":
                                return 'templates/answers/singleSelection.html';
                                break;
                            case "multi":
                                return 'templates/answers/multiSelection.html';
                                break;
                        }
                        return null;
                    }
                };

                WidgetItem.listeners['REWARD_UPDATED'] = $rootScope.$on('REWARD_UPDATED', function (e, item, index) {

                    if (item.carouselImage) {
                        WidgetItem.reward.carouselImage = item.carouselImage || [];
                        if (WidgetItem.view) {
                            WidgetItem.view.loadItems(WidgetItem.reward.carouselImage, null, "WideScreen");
                        }
                    }

                    if (item && item.title) {
                        WidgetItem.reward.title = item.title;
                    }
                    if (item && item.description) {
                        WidgetItem.reward.description = item.description;
                    }
                    if (item && item.pointsToRedeem) {
                        WidgetItem.reward.pointsToRedeem = item.pointsToRedeem;
                    }
                });

                /**
                 * This event listener is bound for "Carousel2:LOADED" event broadcast
                 */
                WidgetItem.listeners['Carousel2:LOADED'] = $rootScope.$on("Carousel2:LOADED", function () {
                    WidgetItem.view = null;
                    if (!WidgetItem.view) {
                        WidgetItem.view = new buildfire.components.carousel.view("#carousel2", [], "WideScreen");
                    }
                    if (WidgetItem.reward && WidgetItem.reward.carouselImage) {
                        WidgetItem.view.loadItems(WidgetItem.reward.carouselImage, null, "WideScreen");
                    } else {
                        WidgetItem.view.loadItems([]);
                    }
                });

                WidgetItem.listeners['GOTO_HOME'] = $rootScope.$on('GOTO_HOME', function (e) {
                    ViewStack.popAllViews();
                });

                WidgetItem.listeners['POP'] = $rootScope.$on('BEFORE_POP', function (e, view) {
                    if (!view || view.template === "Item_Details") {
                        $scope.$destroy();
                    }
                });

                WidgetItem.listeners['CHANGED'] = $rootScope.$on('VIEW_CHANGED', function (e, type, view) {
                    if (ViewStack.getCurrentView().template == 'Item') {
                        buildfire.datastore.onRefresh(function () {
                        });
                    }
                });

                $scope.$on("$destroy", function () {
                    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>destroyed");
                    if (WidgetItem.view) {
                        WidgetItem.view._destroySlider();
                        WidgetItem.view._removeAll();
                    }
                    for (var i in WidgetItem.listeners) {
                        if (WidgetItem.listeners.hasOwnProperty(i)) {
                            WidgetItem.listeners[i]();
                        }
                    }
                });

            }])
})(window.angular, window);
