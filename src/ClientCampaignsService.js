(function () {

    angular
        .module('ClientApp')
        .factory('ClientCampaignsService', ['$resource', ClientCampaignsService]);

    function ClientCampaignsService($resource) {
        var campaignsResource = $resource('api/campaigns', {}, {
            'query': {
                isArray: false
            }
        });

        /**
         * Campagnes de l'entité, après synchronisation avec le BackOffice : { campaigns: [], synchronization: '' }.
         */
        var getCampaigns = function () {
            return campaignsResource.query().$promise;
        };

        return {
            getCampaigns: getCampaigns
        };
    }

})();
