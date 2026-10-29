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
        var participationResource = $resource('api/campaigns/:id/participation', {id: '@id'}, {
            'participate': {
                method: 'POST'
            }
        });

        /**
         * Campagnes de l'entité, après synchronisation avec le BackOffice : { campaigns: [], synchronization: '' }.
         */
        var getCampaigns = function () {
            return campaignsResource.query().$promise;
        };

        /**
         * L'entité participe : renvoie la campagne mise à jour (statut de participation, analyse créée).
         */
        var participate = function (id) {
            return participationResource.participate({id: id}, {}).$promise;
        };

        return {
            getCampaigns: getCampaigns,
            participate: participate
        };
    }

})();
