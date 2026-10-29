(function () {

    angular
        .module('ClientApp')
        .controller('ClientCampaignsCtrl', [
            '$scope', '$rootScope', '$mdDialog', 'gettextCatalog', 'toastr', 'ClientCampaignsService',
            ClientCampaignsCtrl
        ]);

    /**
     * Campaigns the entity is invited to, received from the BackOffice.
     */
    function ClientCampaignsCtrl($scope, $rootScope, $mdDialog, gettextCatalog, toastr, ClientCampaignsService) {
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

        /**
         * The entity has not answered yet, or answered but its analysis is missing (the creation failed).
         */
        $scope.canParticipate = function (campaign) {
            return $scope.getPhase(campaign) === 'open'
                && (campaign.participationStatus === 'invited' || !campaign.anrId);
        };

        $scope.participate = function (campaign, ev) {
            if (campaign.participationStatus !== 'invited') {
                saveParticipation(campaign);
                return;
            }

            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Do you want to participate in this campaign?'))
                .textContent(gettextCatalog.getString(
                    'An analysis based on the campaign model will be created. You cannot withdraw afterwards.'
                ))
                .targetEvent(ev)
                .theme('light')
                .ok(gettextCatalog.getString('Participate'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function () {
                saveParticipation(campaign);
            });
        };

        function saveParticipation(campaign) {
            campaign.isSaving = true;
            ClientCampaignsService.participate(campaign.id).then(function (data) {
                campaign.participationStatus = data.participationStatus;
                campaign.anrId = data.anrId;
                toastr.success(
                    gettextCatalog.getString('Your analysis has been created.'),
                    gettextCatalog.getString('Participation recorded')
                );
                $rootScope.$broadcast('fo-anr-changed');
            }).finally(function () {
                campaign.isSaving = false;
            });
        }

        ClientCampaignsService.getCampaigns().then(function (data) {
            $scope.campaigns = data.campaigns;
            $scope.synchronization = data.synchronization;
        }).finally(function () {
            $scope.isLoading = false;
        });
    }

})();
