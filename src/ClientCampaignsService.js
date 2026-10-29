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

        var accessResource = $resource('api/campaigns/:id/access', {id: '@id'}, {
            'get': {
                method: 'GET'
            },
            'replace': {
                method: 'PUT'
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

        /**
         * Utilisateurs pouvant accéder à l'analyse de la campagne, avec leur droit : { users: [{id, ..., rwd}] }.
         */
        var getAccess = function (id) {
            return accessResource.get({id: id}).$promise;
        };

        /**
         * Remplace les accès ; accesses : [{userId, rwd}], rwd valant 0 (lecture) ou 1 (écriture).
         */
        var setAccess = function (id, accesses) {
            return accessResource.replace({id: id}, {accesses: accesses}).$promise;
        };

        return {
            getCampaigns: getCampaigns,
            participate: participate,
            getAccess: getAccess,
            setAccess: setAccess
        };
    }

})();
