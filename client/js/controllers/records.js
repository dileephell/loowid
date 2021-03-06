angular.module('mean.rooms').controller('RecordController', ['$scope', '$routeParams', '$location', 'Global','Rooms','$timeout','ngI18nResourceBundle','ngI18nConfig','$cookieStore','$sce','FileService','ChatService','MediaService','WindowHandler','UserHandler','UIHandler',function ($scope, $routeParams, $location, Global, Rooms, $timeout,ngI18nResourceBundle, ngI18nConfig, $cookieStore,$sce,FileService,ChatService,MediaService,WindowHandler,UserHandler,UIHandler) {    

	var uiHandler = UIHandler;
	$scope.global = Global;
	$scope.ui = uiHandler;
    var room = new Rooms({});
    var fileService = new FileService();
    var chatService = new ChatService();
    var mediaService = new MediaService();
    var windowHandler = new WindowHandler();
    var userHandler = new UserHandler();
    
    uiHandler.isowner = true;
    
    document.getElementById('noscript').style.display = 'none';
    
    //We had three objects stream to handle the diferent stream sources webcam/screen


	uiHandler.conn_new = '';
	uiHandler.connected_class = '';
	uiHandler.chat_class = '';
	uiHandler.helpchat_class = '';
	uiHandler.dash_conn = '';
	uiHandler.dash_chat = '';
	
	uiHandler.shareDesktopStatus='unknown';
	
	// Handle error
	uiHandler.eror_class = '';
	uiHandler.error_message = '';

	uiHandler.supportedLocales = ngI18nConfig.supportedLocales;
	uiHandler.defaultLocale = ngI18nConfig.defaultLocale;
	uiHandler.basePath = ngI18nConfig.basePath;
	uiHandler.cache = ngI18nConfig.cache;
   	ngI18nResourceBundle.get().success(function (resourceBundle) {
            $scope.resourceBundle = resourceBundle;
    });

    //Controles de salao

	$scope.hideError = function() {
		$scope.global.hideError($scope);
	}
	
	$scope.toogleConnected = function() { 
		uiHandler.connected_class=(uiHandler.connected_class=='collapsed')?'':'collapsed'; 
		uiHandler.dash_conn=(uiHandler.connected_class=='collapsed')?'connected_collapsed':'';
	}
	$scope.toogleChat = function() { 
		uiHandler.chat_class=(uiHandler.chat_class=='collapsed')?'':'collapsed'; 
		uiHandler.helpchat_class=(uiHandler.helpchat_class=='showed')?'':'showed';
		uiHandler.dash_chat=(uiHandler.chat_class=='collapsed')?'chat_collapsed':'';
	}
	
    window.onfocus = function() {
    	uiHandler.focused = true;
    };
    
    window.onblur = function() {
    	uiHandler.focused = false;
    }


    uiHandler.focused = true;

    $scope.configureRoom = function() {

        room.editShared($scope.global.roomId, uiHandler.access, function(rdo){
            $scope.global.access = angular.copy(uiHandler.access);
            rtc.updateOwnerData(uiHandler.roomId,uiHandler.name,uiHandler.avatar,uiHandler.status,uiHandler.access);
            if (uiHandler.enabledChat !=  uiHandler.access.chat) {
                chatService.alertChatStatus($scope,rdo.access.chat?'enabled':'disabled');
            };
              $scope.enableEditAccess();
        });
    };


    $scope.fireUser = function (index){
         var users = [];
         if (typeof(index) === "string"){
            users.push(index);
         }else{
            users.push(uiHandler.users[index].connectionId);
         }

         var fUser  = function (){
              room.moveRoom(uiHandler.roomId,users,function(rdo){
                if (rdo.success) {
                    uiHandler.roomId = $scope.global.roomId = rdo.toRoomId;
                    $location.search('r',uiHandler.roomId);
                    uiHandler.screenurl = $location.$$protocol+ "://"+ $location.$$host +  "/#!/r/" + $scope.global.roomId;
                    rtc.moveRoom(uiHandler.roomId,rdo.fromRoomId,users);
                }
            });
         }

        uiHandler.safeApply ($scope,function (){
            if (!uiHandler.modals) uiHandler.modals = [];

            uiHandler.modals.push({'text': '<strong>' + $scope.getUserName(users[0]) + '</strong> ' + $scope.resourceBundle.fireuser,
                'yes': function (index){
                    uiHandler.safeApply ($scope,function(){
                        uiHandler.modals.splice(index,1);
                    });
                    
                    fUser();
                },
                'no': function (index){
                    uiHandler.safeApply ($scope,function(){
                        uiHandler.modals.splice(index,1);
                    });
                        
                },
                "class":'modalform editable',
                "done":false,
                "avatar": $scope.getUser(users[0]).avatar
            }); 
        });
   };
    

    $scope.enableEditAccess = function() {
    	uiHandler.access = angular.copy($scope.global.access);
        uiHandler.editAccess = !uiHandler.editAccess;
        uiHandler.enabledChat =  uiHandler.access.chat;

        if (uiHandler.editAccess) {
        	uiHandler.editAccessClass = 'editable';
            setTimeout('document.getElementById("chgacctitle").focus();',100);
        } else {
        	uiHandler.editAccessClass = '';
            setTimeout('document.getElementById("chgacctitle").blur();',100);
        }
        return false;
    }

    $scope.roomLeave = function (){
        var leaveFn = function (){
            rtc.reset();
            $scope.global.roomId ='';
            $location.search('r',null);
            $location.path("/");
        }

        if (uiHandler.status=='DISCONNECTED') {
            leaveFn ();
        }else {
            uiHandler.safeApply ($scope,function (){
                if (!uiHandler.modals) uiHandler.modals = [];

                uiHandler.modals.push({'text': $scope.resourceBundle.errorleavetheroom,
                    'yes': function (index){
                        uiHandler.safeApply ($scope,function(){
                            uiHandler.modals.splice(index,1);
                        });
                        
                        leaveFn();
                    },
                    'no': function (index){
                        uiHandler.safeApply ($scope,function(){
                            uiHandler.modals.splice(index,1);
                        });
                            
                    },
                    "class":'modalform editable',
                    "done":false
                }); 
            });
        }
    };


    //control de media
	$scope.lastCharsUrl = function (url){
		return url.substring (url.length -10);
	}
  

 	$scope.init = function (){
    	var rid = $location.search().r;
    	if (!rid) rid = $scope.global.roomId?$scope.global.roomId:$routeParams.roomId;

    	uiHandler.roomId = $scope.global.roomId = rid;	
    	uiHandler.screenurl = $location.$$protocol+ "://"+ $location.$$host +  "/#!/r/" + $scope.global.roomId;

		var guy = new Guy( {
           'appendElement': document.getElementById( 'eyesLogo' ),'color':'#FFFFFF','scale':0.30
       	});

		// Keep Session with auto request every 15 min
		window.clearInterval($scope.global.keepInterval);
		$scope.global.keepInterval = window.setInterval(function(){
			room.keepSession(function(){},function(){});
		},900000);
		
		// Show Timeout CountDown
		window.clearInterval($scope.global.countDownInterval);
		$scope.global.countDownInterval = window.setInterval(function(){
			var now = new Date();
			var dueDate = new Date($scope.global.roomDueDate);
			var hours = Math.floor(Math.abs(dueDate - now) / 36e5);
			var mins = Math.floor((Math.abs(dueDate - now) - (hours * 36e5)) / 6e4);
			var secs = Math.floor((Math.abs(dueDate - now) - (hours * 36e5) - (mins * 6e4)) / 1e3);
			uiHandler.countDown = (hours>9?hours:'0'+hours)+'h'+(mins>9?mins:'0'+mins)+'m'+(secs>9?secs:'0'+secs)+'s';
			uiHandler.safeApply($scope,function(){});
		},1000);
		

		//look if who is selecting the room is valid
		room.isRoomAvailable(uiHandler.roomId, function(result){
			uiHandler.roomStatus = result.status;
    
            //Initialize userHandler options
            userHandler.init ($scope);

			if (uiHandler.roomStatus == 'inactive'){
				 	//$scope.global.sessionclosed=true;
				 	if (result.owner) {
				 		room.joinPass($scope.global.roomId,'',true);
			            
                        var joinUsr = room.join($scope.global.roomId,function(results){
                        	uiHandler.roomStatus = 'active';
						 	$scope.global.sessionclosed=false;
						 	uiHandler.users = results.guests;
						 	uiHandler.name = results.owner.name;
						 	uiHandler.avatar = results.owner.avatar;
						 	uiHandler.gravatar = results.owner.gravatar;
						 	uiHandler.status = results.status;
						 	uiHandler.access = results.access;
						 	uiHandler.gravatar = results.owner.gravatar;
						 	$scope.global.roomDueDate = results.dueDate;
					    	$scope.global.access = uiHandler.access;
					    	uiHandler.permanenturl = $location.$$protocol+ "://"+ $location.$$host +  "/#!/r/" + uiHandler.access.permanentkey + "/claim";
                            $scope.global.name = uiHandler.name;
					    	$scope.global.avatar = uiHandler.avatar;
					    	$scope.global.gravatar = uiHandler.gravatar;
						 	rtc.updateOwnerData (uiHandler.roomId,uiHandler.name,uiHandler.avatar,uiHandler.status,uiHandler.access);
						 	chatService.init ($scope,results.chat);
			            });
			            
                        uiHandler.name = joinUsr.name;
                        uiHandler.avatar = joinUsr.avatar;
                        uiHandler.gravatar = joinUsr.gravatar;
			            $scope.global.name = uiHandler.name;
			            $scope.global.gravatar = uiHandler.gravatar;

                        if (window.innerWidth <= 800 ){
                            $scope.toogleConnected();
                            $scope.toogleChat();
                        }
                        
				 	} else {
				 		// Probably is a viewer trying to use join url
				 		$location.path("r/"+$scope.global.roomId);
				 	}
   			} else {
   				// Owner trying to open multiple tabs not allowed
   				if (result.owner || !rtc._me) {
   					$location.path("r/"+$scope.global.roomId+'/owner');
   				} else {
   					room.chat($scope.global.roomId,function(results){
   						chatService.init ($scope,results.chat);
   					});
   				}
   			}

		},function (error){
			uiHandler.roomStatus = 'inactive';
			$scope.global.roomId ='';
			$scope.global.sessionclosed =true;
	 		$location.path("/");
		});

      
        fileService.init ($scope);
        mediaService.init ($scope,windowHandler);
  
		
    };

}]).config(function($sceProvider) {
	$sceProvider.enabled(true);
}).directive('ngEscape', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
        });
    };
});
