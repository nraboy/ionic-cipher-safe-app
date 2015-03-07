var cipherSafe = angular.module("ciphersafe", ["ionic", "firebase"]);
var fb = new Firebase("https://amber-inferno-4704.firebaseio.com/");

cipherSafe.run(function($ionicPlatform, $state) {
    $ionicPlatform.ready(function() {
        if(window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if(window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
});

cipherSafe.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state("locked", {
            url: "/locked",
            templateUrl: "templates/locked.html",
            controller: "VaultController",
            cache: false
        })
        .state("createvault", {
            url: "/createvault",
            templateUrl: "templates/create_vault.html",
            controller: "VaultController"
        })
        .state("firebase", {
            url: "/firebase",
            templateUrl: "templates/firebase.html",
            controller: "FirebaseController"
        })
        .state("categories", {
            url: "/categories/:masterPassword",
            templateUrl: "templates/categories.html",
            controller: "CategoryController"
        })
        .state("passwords", {
            url: "/passwords/:categoryId/:masterPassword",
            templateUrl: "templates/password_list.html",
            controller: "PasswordController",
            cache: false
        })
        .state("newpassword", {
            url: "/newpassword/:categoryId/:masterPassword",
            templateUrl: "templates/password_new.html",
            controller: "PasswordController"
        })
        .state("viewpassword", {
            url: "/viewpassword/:categoryId/:masterPassword/:passwordId",
            templateUrl: "templates/password_view.html",
            controller: "PasswordController"
        });
    $urlRouterProvider.otherwise('/locked');
});


cipherSafe.controller("VaultController", function($scope, $state, $ionicHistory, $firebaseObject, $cipherFactory) {

    $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
    });

    var fbAuth = fb.getAuth();
    if(fbAuth) {
        var userReference = fb.child("users/" + fbAuth.uid);
        var syncObject = $firebaseObject(userReference);
        syncObject.$bindTo($scope, "data");
    } else {
        $state.go("firebase");
    }

    $scope.unlock = function(masterPassword) {
        syncObject.$loaded().then(function() {
            var decipherPhrase = $cipherFactory.decrypt($scope.data.masterPassword.cipher_text, masterPassword, $scope.data.masterPassword.salt, $scope.data.masterPassword.iv, {output: "hex"});
            if(decipherPhrase === "Authenticated".toHex()) {
                $state.go("categories", {masterPassword: masterPassword});
            }
        });
    }

    $scope.create = function(masterPassword) {
        syncObject.$loaded().then(function() {
            userReference.child("masterPassword").set($cipherFactory.encrypt("Authenticated", masterPassword), function(error) {
                $state.go("locked");
            });
        });
    }

    $scope.reset = function() {
        userReference.remove(function(error) {
            if(error) {
                console.error("ERROR: " + error);
            } else {
                $state.go("createvault");
            }
        });
    }

});

cipherSafe.controller("FirebaseController", function($scope, $state, $ionicHistory, $firebaseAuth) {

    $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
    });

    var fbAuth = $firebaseAuth(fb);

    $scope.login = function(username, password) {
        fbAuth.$authWithPassword({
            email: username,
            password: password
        }).then(function(authData) {
            $state.go("locked");
        }).catch(function(error) {
            console.error("ERROR: " + error);
        });
    }

    $scope.register = function(username, password) {
        fbAuth.$createUser({email: username, password: password}).then(function(userData) {
            return fbAuth.$authWithPassword({
                email: username,
                password: password
            });
        }).then(function(authData) {
            $state.go("createvault");
        }).catch(function(error) {
            console.error("ERROR: " + error);
        });
    }

});

cipherSafe.controller("CategoryController", function($scope, $ionicPopup, $firebaseObject, $stateParams, $cipherFactory) {

    $scope.masterPassword = $stateParams.masterPassword;
    $scope.categories = [];

    var fbAuth = fb.getAuth();
    if(fbAuth) {
        var categoriesReference = fb.child("users/" + fbAuth.uid);
        var syncObject = $firebaseObject(categoriesReference);
        syncObject.$bindTo($scope, "data");
    } else {
        $state.go("firebase");
    }

    $scope.list = function() {
        syncObject.$loaded().then(function() {
            for(var key in $scope.data.categories) {
                if($scope.data.categories.hasOwnProperty(key)) {
                    $scope.categories.push({
                        id: key,
                        category: $cipherFactory.decrypt($scope.data.categories[key].category.cipher_text, $stateParams.masterPassword, $scope.data.categories[key].category.salt, $scope.data.categories[key].category.iv)
                    });
                }
            }
        });
    }

    $scope.add = function() {
        $ionicPopup.prompt({
            title: 'Enter a new category',
            inputType: 'text'
        })
        .then(function(result) {
            if(result !== undefined) {
                if($scope.data.categories === undefined) {
                    $scope.data.categories = {};
                }
                if($scope.data.categories[result.toSHA1()] === undefined) {
                    $scope.data.categories[result.toSHA1()] = {
                        category: $cipherFactory.encrypt(result, $stateParams.masterPassword),
                        passwords: {}
                    };
                    $scope.categories.push({
                        id: result.toSHA1(),
                        category: result
                    });
                }
            } else {
                console.log("Action not completed");
            }
        });
    }

});

cipherSafe.controller("PasswordController", function($scope, $stateParams, $firebaseObject, $state, $cipherFactory, $ionicHistory) {

    $scope.masterPassword = $stateParams.masterPassword;
    $scope.categoryId = $stateParams.categoryId;
    $scope.passwords = [];

    var fbAuth = fb.getAuth();
    if(fbAuth) {
        var categoryReference = fb.child("users/" + fbAuth.uid + "/categories/" + $stateParams.categoryId);
        var passwordsReference = fb.child("users/" + fbAuth.uid + "/categories/" + $stateParams.categoryId + "/passwords");
        var syncObject = $firebaseObject(categoryReference);
        syncObject.$bindTo($scope, "data");
    } else {
        $state.go("firebase");
    }

    $scope.list = function() {
        syncObject.$loaded().then(function() {
            var encryptedPasswords = $scope.data.passwords;
            for(var key in encryptedPasswords) {
                if(encryptedPasswords.hasOwnProperty(key)) {
                    $scope.passwords.push({
                        id: key,
                        password: JSON.parse($cipherFactory.decrypt(encryptedPasswords[key].cipher_text, $stateParams.masterPassword, encryptedPasswords[key].salt, encryptedPasswords[key].iv))
                    });
                }
            }
        });
    }

    $scope.view = function() {
        syncObject.$loaded().then(function() {
            var encryptedPassword = $scope.data.passwords[$stateParams.passwordId];
            $scope.password = JSON.parse($cipherFactory.decrypt(encryptedPassword.cipher_text, $stateParams.masterPassword, encryptedPassword.salt, encryptedPassword.iv));
        });
    }

    $scope.save = function(title, username, password) {
        var passwordObject = {
            title: title,
            username: username,
            password: password
        };
        syncObject.$loaded().then(function() {
            passwordsReference.child(JSON.stringify(passwordObject).toSHA1()).set($cipherFactory.encrypt(JSON.stringify(passwordObject), $stateParams.masterPassword), function(ref) {
                $state.go("passwords", $stateParams);
            });
        });
    }

    $scope.back = function() {
        $ionicHistory.goBack();
    }

});


cipherSafe.factory("$cipherFactory", function() {

    return {

        /*
         * Encrypt a message with a passphrase or password
         *
         * @param    string message
         * @param    string password
         * @return   object
         */
        encrypt: function(message, password) {
            var salt = forge.random.getBytesSync(128);
            var key = forge.pkcs5.pbkdf2(password, salt, 4, 16);
            var iv = forge.random.getBytesSync(16);
            var cipher = forge.cipher.createCipher('AES-CBC', key);
            cipher.start({iv: iv});
            cipher.update(forge.util.createBuffer(message));
            cipher.finish();
            var cipherText = forge.util.encode64(cipher.output.getBytes());
            return {cipher_text: cipherText, salt: forge.util.encode64(salt), iv: forge.util.encode64(iv)};
        },

        /*
         * Decrypt cipher text using a password or passphrase and a corresponding salt and iv
         *
         * @param    string (Base64) cipherText
         * @param    string password
         * @param    string (Base64) salt
         * @param    string (Base64) iv
         * @param    object
         * @return   string
         */
        decrypt: function(cipherText, password, salt, iv, options) {
            var key = forge.pkcs5.pbkdf2(password, forge.util.decode64(salt), 4, 16);
            var decipher = forge.cipher.createDecipher('AES-CBC', key);
            decipher.start({iv: forge.util.decode64(iv)});
            decipher.update(forge.util.createBuffer(forge.util.decode64(cipherText)));
            decipher.finish();
            if(options !== undefined && options.hasOwnProperty("output") && options.output === "hex") {
                return decipher.output.toHex();
            } else {
                return decipher.output.toString();
            }
        }

    };

});

String.prototype.toHex = function() {
    var buffer = forge.util.createBuffer(this.toString());
    return buffer.toHex();
}

String.prototype.toSHA1 = function() {
    var md = forge.md.sha1.create();
    md.update(this);
    return md.digest().toHex();
}
