(function () {

    angular
        .module('ClientApp')
        .factory('ClientUsersService', ['$resource', '$http', ClientUsersService]);

    function ClientUsersService($resource, $http) {
        var self = this;

        self.UserResource = $resource('api/users/:userId', {userId: '@id'},
            {
                'update': {
                    method: 'PUT'
                },
                'patch': {
                    method: 'PATCH'
                },
                'query': {
                    isArray: false
                }
            });

        self.UserResetResource = $resource('api/users/:userId/resetPassword', {userId: '@id'},
            {
                'query': {
                    isArray: false
                }
            });

        var getUsers = function (params) {
            return self.UserResource.query(params).$promise;
        };

        var getUser = function (id) {
            return self.UserResource.query({userId: id}).$promise;
        };

        var createUser = function (params, success, error) {
            new self.UserResource(params).$save(success, error);
        };

        var updateUser = function (params, success, error) {
            self.UserResource.update(params, success, error);
        };

        var deleteUser = function (id, success, error) {
            self.UserResource.delete({userId: id}, success, error);
        };

        var patchUser = function (id, params, success, error) {
            self.UserResource.patch({userId: id}, params, success, error);
        }

        var resetUserPassword = function (id, success, error) {
            return self.UserResetResource.query({userId: id}, success, error).$promise;
        };

        var getIdentityProviders = function() {
            return $http.get('api/identity-providers').then(function(res) { return res.data; });
        };
        var getUserIdentity = function(userId) {
            return $http.get('api/users/' + userId + '/identity').then(function(res) { return res.data; });
        };
        var saveUserIdentity = function(userId, data) {
            return $http.post('api/users/' + userId + '/identity', data);
        };
        var deleteUserIdentity = function(userId) {
            return $http.delete('api/users/' + userId + '/identity');
        };

        return {
            getUsers: getUsers,
            getUser: getUser,
            createUser: createUser,
            deleteUser: deleteUser,
            updateUser: updateUser,
            patchUser: patchUser,
            resetUserPassword: resetUserPassword,
            getIdentityProviders: getIdentityProviders,
            getUserIdentity: getUserIdentity,
            saveUserIdentity: saveUserIdentity,
            deleteUserIdentity: deleteUserIdentity
        };
    }

})
();
