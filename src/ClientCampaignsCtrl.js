(function () {

    angular
        .module('ClientApp')
        .controller('ClientCampaignsCtrl', [
            '$scope', '$state', '$stateParams', '$mdDialog', 'ClientCampaignsService', 'ClientAnrService',
            ClientCampaignsCtrl
        ]);

    /**
     * Campaigns the entity is invited to, received from the BackOffice. A campaign is handled in its own page.
     */
    function ClientCampaignsCtrl($scope, $state, $stateParams, $mdDialog, ClientCampaignsService, ClientAnrService) {
        $scope.campaigns = [];
        $scope.freeAnrs = [];
        $scope.synchronization = 'ok';
        $scope.isLoading = true;
        $scope.filters = {search: '', progress: 'all'};
        $scope.getProgress = ClientCampaignsService.getProgress;

        function matchesSearch(label) {
            return (label || '').toLowerCase().indexOf($scope.filters.search.toLowerCase().trim()) !== -1;
        }

        $scope.filterCampaigns = function (campaign) {
            return matchesSearch(campaign.label)
                && ($scope.filters.progress === 'all' || $scope.getProgress(campaign) === $scope.filters.progress);
        };

        $scope.filterAnrs = function (anr) {
            return matchesSearch(anr.label);
        };

        $scope.openCampaign = function (campaign) {
            $state.go('main.campaigns.detail', {campaignId: campaign.id});
        };

        /**
         * Reports of an analysis outside any campaign: it needs write access to send one.
         */
        $scope.showReports = function (anr, ev) {
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'anr', function ($scope, $mdDialog, anr) {
                    $scope.anr = anr;
                    $scope.canSubmit = anr.rwd === 1;
                    $scope.requiresSignature = false;
                    $scope.close = function () {
                        $mdDialog.hide();
                    };
                }],
                templateUrl: 'views/dialogs/campaign.reports.html',
                targetEvent: ev,
                locals: {anr: anr},
                clickOutsideToClose: false
            });
        };

        $scope.loadData = function () {
            $scope.isLoading = true;
            ClientAnrService.getAnrs().then(function (data) {
                $scope.freeAnrs = data.anrs.filter(function (anr) {
                    return anr.rwd >= 0 && !anr.campaignLocked;
                });
            });

            ClientCampaignsService.getCampaigns().then(function (data) {
                $scope.campaigns = data.campaigns;
                $scope.synchronization = data.synchronization;
                openLinkedCampaign();
            }).finally(function () {
                $scope.isLoading = false;
            });
        };

        /**
         * The mails of the BackOffice link to "campaigns?campaign=<BackOffice id>": the campaign is known here
         * only once synchronized, then its page opens.
         */
        function openLinkedCampaign() {
            if (!$stateParams.campaign) {
                return;
            }
            var boCampaignId = parseInt($stateParams.campaign, 10);
            var linked = $scope.campaigns.filter(function (campaign) {
                return campaign.boCampaignId === boCampaignId;
            })[0];
            if (linked) {
                $state.go('main.campaigns.detail', {campaignId: linked.id}, {location: 'replace'});
            }
        }

        $scope.loadData();
    }

})();
