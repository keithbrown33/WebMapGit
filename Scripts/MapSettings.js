        var map;
        var building = 'https://sites.google.com/site/mapkmlfiles33/kml-files/CustomBuildings3.kml?attredirects=0&d=1';
        var route = 'https://sites.google.com/site/mapkmlfiles33/kml-files/CharlestownRoute5.kml?attredirects=0&d=1';
        var roads = 'https://sites.google.com/site/mapkmlfiles33/kml-files/CustomRoads3.kml?attredirects=0&d=1';
        var cci = 'https://sites.google.com/site/mapkmlfiles33/kml-files/ccibase2.kml?attredirects=0&d=1';
        var marker;

       
        
  // Operations when the web page is loaded.
  function onload2() {
    var i, items, tabs;
    // Initiatlize CognitoAuth object
    var auth = initCognitoSDK();

    //assigning the sign in option to the sign in button, adding click action event.
    document.getElementById("signInButton").addEventListener("click", function() {
        userButton(auth);
    });
    var curUrl = window.location.href;
    auth.parseCognitoWebResponse(curUrl);
}

// Perform user operations.
function userButton(auth) {
    var state = document.getElementById('signInButton').innerHTML;

        auth.getSession();
    }

// Operations when signed in.
function showSignedIn(session) {

    if (session) {
        var idToken = session.getIdToken().getJwtToken();
        if (idToken) {
            var payload = idToken.split('.')[1];
            var tokenobj = JSON.parse(atob(payload));
            var formatted = JSON.stringify(tokenobj, undefined, 2);
        }
        var accToken = session.getAccessToken().getJwtToken();
        if (accToken) {
            var payload = accToken.split('.')[1];
            var tokenobj = JSON.parse(atob(payload));
            var formatted = JSON.stringify(tokenobj, undefined, 2);

        }
        var refToken = session.getRefreshToken().getToken();
    }
}

      
      function initCognitoSDK() {
        AWS.config.region = 'us-east-1'; // like: us-east-1
        var authData = {
            ClientId: '', // Your client id here
            AppWebDomain: '',
            TokenScopesArray: ['email', 'openid'], // e.g.['phone', 'email', 'profile','openid', 'aws.cognito.signin.user.admin'],
            RedirectUriSignIn: '', // callback url once signed in
            RedirectUriSignOut: '', // callback url when signed out
            UserPoolId: '', // Your user pool id here
        };
        var login = {};
        var auth = new AmazonCognitoIdentity.CognitoAuth(authData);
        auth.userhandler = {
            onSuccess: function (result) {
                showSignedIn(result);
                var loginKey = 'cognito-idp.' + AWS.config.region + '.amazonaws.com/' + authData['UserPoolId'];
                login[loginKey] = result.getIdToken().getJwtToken();
                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: '', //Identity Pool ID goes here
                    Logins: login
                });
                AWS.config.credentials.refresh((error) => {
                    if (error) {
                        console.error(error);
                    } else {
                        var principal = AWS.config.credentials.identityId;
                        console.log("IdentityId: " + principal);

                        //Now we have cognito identity and credentials to make AWS IoT calls.
                        //Attach pre-created IoT policy to this principal. 
                        //IMPORTANT: Make sure you have granted AttachPrincipalPolicy API permission in IAM to Cognito Identity Pool's Role.
                        //It is done here for the demo purpose only while cognito user should NOT be allowed to call AttachPrincipalPolicy in production, this step must be done by Administrator only
                        attachPrincipalPolicy("policy_name", principal); //Enter Policy Name here

                        //Now we can use this principal for IoT actions
                        //We'll need aws-iot-device-sdk-js for mqtt over websocket calls using these cognito credentials.
                        connect();
                    }
                });
            },
            onFailure: function (err) {
                alert("Error!");
            }
        };
        return auth;
      }

      //Need aws-sdk.js to work
      function attachPrincipalPolicy(policyName, principal) {
          new AWS.Iot().attachPrincipalPolicy({ policyName: policyName, principal: principal }, function (err, data) {
            if (err) {
                    console.error(err); // an error occurred
                }
          });
       }
       
     
   
       function connect() {
            var clientID = 'webapp:' + new Date().getTime(); //needs to be unique
           
            device = AwsIot.device({
                clientId: clientID,
                host: '', //can be queried using 'aws iot describe-endpoint'
                protocol: 'wss',
                accessKeyId: AWS.config.credentials.accessKeyId,
                secretKey: AWS.config.credentials.secretAccessKey,
                sessionToken: AWS.config.credentials.sessionToken
            });

              console.log("Connecting... ")
            device.on('connect', function () {
                console.log("Connected!");
                device.subscribe('topic_name');
                console.log('Subscribing..')
                publishMessage(device, 'topic_name', 'Client Connected...');
            });

            

            function publishMessage(device, topic, msg) {
                device.publish(topic, msg, { qos: 1 }, function (err) {
                    if (err) {
                        alert("failed to publish iot message!");
                        console.error(err);
                    } else {
                        console.log("Subscribing and Publishing to: " + topic);
                    
                    }  

                });     
             }              
              
              device.on('message', function(topic, msg){
                   // console.log('Message From Topic:', topic+ ': ' + msg.toString());                  
                    receivedMessage(msg);
                    });

                    //receiving message function
                function receivedMessage(msg){
                    var info = msg.toString();
                    var info2 = info.split(",", 1);
                    var part2 = info.slice(-18)
                    var part1 = info2.toString();
                         console.log(part1, part2)
                    updateMarker(part1, part2);                    
                    };
                    
                    //set marker position upon receiving message
                function updateMarker(part1, part2){
                    marker.setPosition(new google.maps.LatLng(parseFloat(part1), parseFloat(part2)));
                }

                // Marker requires initial setup and coordinates - otherwise will result in connection error
                var coord = {lat: 39.26908031087739,
                lng: -76.69813401818953};
   
   
               marker =  new google.maps.Marker({
                   position: coord,
                   draggable: true,
                   icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/shuttle.png?attredirects=0&d=1',
                   map: map});
                    } ;
   
  

        function initMap() {

            //Declaring the Map/Marker locations
            var mapcenter = {
                lat: 39.26943246374224,
                lng: -76.70338433653166
            };
       

            //Setting the map to populate in the div and to center at declared location. Setting rules for the map
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 17,
                center: mapcenter,
                draggable: true,
                scrollwheel: true,
                minZoom: 16,
                maxZoom: 18,
                clickableIcons: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreen: false,

                styles: [{
                        "elementType": "labels",
                        "stylers": [{

                            "visibility": "off"
                        }]
                    },
                    {
                        "featureType": "landscape",
                        "stylers": [{
                            "color": "#d1d1d1",
                            "visibility": "off"

                        }]
                    },
                    {
                        "featureType": "poi",
                        "stylers": [{
                            "visibility": "off"
                        }]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "labels.text",
                        "stylers": [{
                            "visibility": "off"
                        }]
                    },
                    {
                        "featureType": "poi.medical",
                        "stylers": [{
                            "visibility": "off"
                        }]
                    },
                    {
                        "featureType": "poi.medical",
                        "elementType": "geometry.fill",
                        "stylers": [{
                            "color": "#9df744"
                        }]
                    },
                    {
                        "featureType": "poi.medical",
                        "elementType": "labels",
                        "stylers": [{
                            "visibility": "off"
                        }]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry",
                        "stylers": [{
                            "visibility": "off"
                        }]
                    },
                    {
                        "featureType": "road",
                        "elementType": "labels.icon",
                        "stylers": [{
                            "visibility": "off"
                        }]
                    },
                    {
                        "featureType": "transit",
                        "stylers": [{
                            "visibility": "off"
                        }]
                    }
                ]
            });


            //Creating KML layers
            var ccilayer = new google.maps.KmlLayer(cci, {
                zindex: 0,
                suppressInfoWindows: true,
                preserveViewport: false,
                map: map,
            });

            var buildinglayer = new google.maps.KmlLayer(building, {
                suppressInfoWindows: true,
                preserveViewport: false,
                map: map

            });

            var roadslayer = new google.maps.KmlLayer(roads, {

                suppressInfoWindows: true,
                preserveViewport: false,
                map: map,
            });
            var routelayer = new google.maps.KmlLayer(route, {

                suppressInfoWindows: true,
                preserveViewport: false,
                map: map,
            });






            var icons = {
                house: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/house.png?attredirects=0&d=1' },
                parking: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/parking_lot.png?attredirects=0&d=1' },
                food: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/food.png?attredirects=0&d=1' },

                hr: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/hr.png?attredirects=0&d=1' },
                ccs: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/CCS.png?attredirects=0&d=1' },
                br: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/br.png?attredirects=0&d=1' },
                cts: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/cts.png?attredirects=0&d=1' },
                wo: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/wo.png?attredirects=0&d=1' },
                cw: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/cw2.png?attredirects=0&d=1' },
                ew: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/ew.png?attredirects=0&d=1' },
                cy: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/cy.png?attredirects=0&d=1' },
                nc: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/NC.png?attredirects=0&d=1' },
                chapel: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/chapel.png?attredirects=0&d=1' },
                fh: { icon: 'https://sites.google.com/site/mapkmlfiles33/mapicons/fh.png?attredirects=0&d=1' },
            }

            var features = [{

                    //parking
                    position: new google.maps.LatLng(39.267525912850445, -76.70094031122147),
                    type: 'parking',
                },
                {
                    position: new google.maps.LatLng(39.269961431492064, -76.7026944619393),
                    type: 'parking',
                },
                {
                    position: new google.maps.LatLng(39.26808186371117, -76.69930250820732),
                    type: 'parking',
                },

                //food

                {
                    position: new google.maps.LatLng(39.26969701301572, -76.70107279977759),
                    type: 'food',
                },

                //Herbert's Run
                {
                    position: new google.maps.LatLng(39.27137701790451, -76.69886548516035),
                    type: 'hr'
                },
                //Cross Creek Station Clubhouse
                {
                    position: new google.maps.LatLng(39.271335488899844, -76.70037825104475),
                    type: 'ccs',
                },
                //Brookside Commons
                {
                    position: new google.maps.LatLng(39.27126489835498, -76.70181521604832),
                    type: 'br',
                },

                //charlestown town center
                {
                    position: new google.maps.LatLng(39.26862160320048, -76.70032240096839),
                    type: 'cts',
                },
                //Wilton overlook
                {
                    position: new google.maps.LatLng(39.26853520301405, -76.70498797816822),
                    type: 'wo',
                },
                //Caton Woods
                {
                    position: new google.maps.LatLng(39.27041522135929, -76.70330049863549),
                    type: 'cw',
                },
                //Edgewood
                {
                    position: new google.maps.LatLng(39.27020251249421, -76.70182401948972),
                    type: 'ew',
                },

                //Courtyard Crossing
                {
                    position: new google.maps.LatLng(39.269758143418954, -76.702234397469),
                    type: 'cy',
                },
                //New Carroll
                {
                    position: new google.maps.LatLng(39.26915109878431, -76.70341861705248),
                    type: 'nc',
                },
                //Chapel
                {
                    position: new google.maps.LatLng(39.2686101761196, -76.70343160629272),
                    type: 'chapel',
                },
                {
                    position: new google.maps.LatLng(39.26896484937277, -76.70307808510006),
                    type: 'fh',
                },
            ];

        


            for (var i = 0; i < features.length; i++) {
                var marker = new google.maps.Marker({
                    position: features[i].position,
                    icon: icons[features[i].type].icon,
                    map: map
                });
            };
            //end generating icons for set locations

    
        };
