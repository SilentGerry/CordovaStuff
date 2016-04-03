angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    // Form data for the login modal
    $scope.loginData = {};

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function() {
        $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function() {
        $scope.modal.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function() {
        console.log('Doing login', $scope.loginData);

        // Simulate a login delay. Remove this and replace with your login
        // code if using a login system
        $timeout(function() {
            $scope.closeLogin();
        }, 1000);
    };
})

.controller('PlaylistsCtrl', function($ionicPlatform, $scope, $cordovaDevice, $cordovaCapture, $cordovaMedia) {
    $ionicPlatform.ready(function() {
        $scope.$apply();

        var src = 'audio.mp3';
        var media = null;

        $scope.captureAudio = function() {
            media.pause();
            /*
            var options = { limit: 3, duration: 10 };
            $cordovaCapture.captureAudio(options).then(function(audioData) {
                console.log('Audio captured successfully');
            }, function(err) {
                console.log('Audio capture failed');
                console.error(err);
            });
            */
        };

        $scope.startCapture = function() {
            if (media != null) {
                media.release();
                console.log('audio resources released...');
            }
            media = $cordovaMedia.newMedia(src);
            console.log('started recording...' + media.media.id);
            media.startRecord();
        };
        $scope.endCapture = function() {
            media.stopRecord();
            console.log('stopped recording...' + media.media.id);
        };
        $scope.playCapture = function() {
            console.log('playing audio file...' + media.media.id);
            media.play();
        };

        // sometimes binding does not work! :/

        // getting device infor from $cordovaDevice
        var device = $cordovaDevice.getDevice();

        $scope.manufacturer = device.manufacturer;
        $scope.model = device.model;
        $scope.platform = device.platform;
        $scope.uuid = device.uuid;

    });
})

.controller('PlaylistCtrl', function($scope, $stateParams) {})

.controller('SearchCtrl', function($ionicPlatform, $scope, $cordovaCapture, $cordovaFile) {
    $ionicPlatform.ready(function() {
        console.log(cordova.file);
        $scope.captureImageToProcess = function() {
            var options = { limit: 1, };
            $scope.picTaken = false;
            console.log(OCRAD.version());
            $cordovaCapture.captureImage(options).then(function(imageData) {
                console.log('Image capture successfull...');
                console.log(imageData[0]);
                $cordovaFile.checkFile(cordova.file.externalRootDirectory, 'Pictures/' + imageData[0].name)
                    .then(function(sucess) {
                        console.log('The file is there...');
                        console.log(sucess);
                        $scope.thePicture = sucess.nativeURL;
                        $scope.picTaken = true;
                        console.log('Creating image...');
                        img = new Image();
                        img.src = sucess.nativeURL;
                        img.onload = function() {
                            console.log('Image loaded...');
                            console.log(this);
                            console.log('Creating canvas...');
                            var canvas = document.createElement('canvas');
                            canvas.width = this.naturalWidth;
                            canvas.height = this.naturalHeight;
                            var context = canvas.getContext('2d');
                            context.drawImage(this, 0, 0);
                            console.log(canvas.getImageData);
                            console.log(context.getImageData);
                            var theText = OCRAD(context);
                            console.log('The text: ' + theText);
                            $scope.imageText = theText;
                            $scope.$apply();
                        };
                    }, function(err) {
                        console.log('The file is not where we looked...');
                        console.error(err);
                    });
            }, function(err) {
                console.log('Ran into an issue...');
                console.error(err);
            });
        };
    });
})

.controller('NFCCtrl', function($scope, $ionicPlatform, $cordovaDevice) {
    $ionicPlatform.ready(function() {
        console.log('Page loaded...');
        $scope.currState = 'Just started';
        $scope.message = 'Message';
        $scope.writeToTag = false;
        var tagsWritten = 1;

        function ndefListenerCB(nfcEv) {
            console.log('Found a NDEF message...');
            console.log(nfcEv);
            $scope.currState = 'Read NDEF';
            $scope.$apply();
        }

        function doIwrite() {
            return $scope.writeToTag;
        }

        function tagListenerCB(nfcEv) {
            console.log('Found a tag...');
            console.log(nfcEv);
            $scope.currState = 'Read Tag';
            $scope.$apply();
            console.log($scope.writeToTag);
            if (doIwrite() === true) {
                console.log('Entering write code...');
                var payload = [ndef.textRecord('$scope.message'), ndef.textRecord('Tag Write: ' + tagsWritten)];
                nfc.write(payload,
                    function() {
                        console.log('Tag written successfully...');
                        tagsWritten = tagsWritten + 1;
                        $scope.currState = 'Write Success';
                        $scope.$apply();
                    },
                    function(err) {
                        console.log('Error writing tag...');
                        console.error(err);
                        $scope.currState = 'Write Failed';
                        $scope.$apply();
                    });
            }
        }

        $scope.listenForTag = function() {
            console.log('Buttong clicked, about to create listeners...');
            nfc.addNdefListener(ndefListenerCB,
                function() {
                    console.log('Listening for NDEF messages');
                },
                function(err) {
                    console.log('Error listening for NDEF messages...');
                    console.error(err);
                });
            nfc.addTagDiscoveredListener(tagListenerCB,
                function() {
                    console.log('Listening for tags...');
                },
                function(err) {
                    console.log('Error listening for tags...');
                    console.error(err);
                });
            $scope.currState = 'Listening';
        };

        $scope.stopListeningForTag = function() {
            nfc.removeTagDiscoveredListener(tagListenerCB,
                function() {
                    console.log('Stopped listening for tags...');
                },
                function(err) {
                    console.log('Error stopping the tag listener...');
                    console.error(err);
                });
            nfc.removeNdefListener(ndefListenerCB,
                function() {
                    console.log('Stopped listening for NDEF messages...');
                },
                function(err) {
                    console.log('Error stopping the NDEF listener...');
                    console.error(err);
                });
            $scope.currState = 'Not listening'
        };
    });
})

.controller('DragDropUrl', function($scope, $ionicPlatform) {
    $ionicPlatform.ready(function() {
        
    });
});
