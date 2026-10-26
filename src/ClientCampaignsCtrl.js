(function () {

    angular
        .module('ClientApp')
        .controller('ClientCampaignsCtrl', ['$scope', 'ClientCampaignsService', ClientCampaignsCtrl]);

    /**
     * Campaigns the entity is invited to, received from the BackOffice.
     */
    function ClientCampaignsCtrl($scope, ClientCampaignsService) {
        $scope.campaigns = [];
        $scope.synchronization = 'ok';
        $scope.isLoading = true;

        var today = moment().format('YYYY-MM-DD');

        /**
         * Where the campaign stands today: closed, upcoming, open, or past its response deadline with no answer.
         */
        $scope.getPhase = function (campaign) {
            if (campaign.status === 'closed') {
                return 'closed';
            }
            if (today < campaign.startDate) {
                return 'upcoming';
            }
            if (today > campaign.responseDeadline && campaign.participationStatus === 'invited') {
                return 'noAnswer';
            }

            return 'open';
        };

        ClientCampaignsService.getCampaigns().then(function (data) {
            $scope.campaigns = data.campaigns;
            $scope.synchronization = data.synchronization;
        }).finally(function () {
            $scope.isLoading = false;
        });
    }

})();
