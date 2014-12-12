var arduino = { comName : "", pnpId : "usb-Arduino" };

var qed = [];

var serialPort = require("serialport");
serialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
    // find arduino on usb serial
    if( port.pnpId.indexOf( arduino.pnpId ) != -1 ) { 
        arduino.comName = port.comName;
        console.log( arduino  );
    }
  });

  // if arduino NOT found
  if( arduino.comName == "" ) {
    console.log( "Error: Can't Find Arduino On USB - Is It Plugged In?" );
    process.exit()
  } else { // arduino FOUND, open the serialport
    var daPath = arduino.comName; 
    var SerialPort = require("serialport").SerialPort;
    console.log( "Attempting to open Serialport to Arduino..." );
    serialPort = new SerialPort( daPath, {
        baudrate: 9600
    } );
    serialPort.on("open", function () {
        console.log('Serialport to Arduino opened!');
        serialPort.on('data', function(data) {
            console.log('data received: ' + data);
        });
        //daController = new MagController( serialPort, Gamepad );
        //setTimeout( function() { serialPort.write( "goNORTH" ); },5000 );
        daController.port = serialPort;
    });
  }

});




var Gamepad = require("gamepad");
console.log("init");
Gamepad.init()

var num = Gamepad.numDevices();
console.log("numDevices", num);

setInterval(Gamepad.processEvents, 100);
setInterval(Gamepad.detectDevices, 500);




var MagController = function( port, pad ) {
// constructor function
    var self = this;
    self.port = port;
    self.pad = pad;
    
    // operational variables
    self.minSpeedX = 20;
    self.minSpeedY = 20;
    self.maxSpeedX = 1500;
    self.maxSpeedY = 1500;
    self.currentSpeedX = 1000;
    self.currentSpeedY = 1000;
    self.minAccelX = 500;
    self.minAccelY = 500;
    self.maxAccelX = 6000;
    self.maxAccelY = 6000;
    self.currentAccelX = 6000;
    self.currentAccelY = 5000;
    self.stepX = 50;
    self.stepY = 50;
    self.anchorX = 1000;
    self.anchorY = 1000;
    self.topLeftAnchorX = 0;
    self.topLeftAnchorY = 0;
    self.bottomRightAnchorX - 1000;
    self.bottomRightAnchorY = 1000;
    self.axisDeadZone = 0.2;
    self.currentHorDir = "STOPPED";
    self.currentVerDir = "STOPPED";
    self.hatMoveXInterval = [];
    self.hatMoveYInterval = [];
    
    // callee functions
    self.sendCease = function( ax ) {
        if( ax == "X" && self.currentHorDir != "STOPPED" ){ 
            self.currentHorDir = "STOPPED";
            self.currentSpeedX = 0;
            qed.push( "cease" + ax );
        }
        else if( ax == "Y" && self.currentVerDir != "STOPPED" ){
            self.currentVerDir = "STOPPED";
            self.currentSpeedY = 0;
            qed.push( "cease" + ax );
        }

    };
    
    self.throttleMove = function( ax, moved ) {
     
        var pct = Math.floor( map( moved.value + 1, 0, 2, self.minSpeedX, self.maxSpeedX ) );
        qed[0] = ( "setMspX" + pct );
        qed[1] = ( "setMspY" + pct );
    };
    
    self.hatMove = function( ax, moved ) {
        console.log( moved );
        if( ax == "Y" ) {
            if( moved.value > 0 ) { 
                qed.push( "stepDown" );
                self.hatMoveYInterval = setInterval( function() {  
                    qed.push( "stepDown" );
                }, 200 );
            } else if( moved.value < 0 ) { 
                qed.push ( "stepUp" );
                self.hatMoveYInterval = setInterval( function() { 
                    qed.push( "stepUp" );
                }, 200 );
            } else {
                clearInterval( self.hatMoveYInterval );
            }
        } else if( ax == "X" ) {
            if( moved.value > 0 ) { 
                qed.push( "stepRight" );
                self.hatMoveXInterval = setInterval( function() {
                    qed.push( "stepRight" );
                }, 200 );  
            } else if( moved.value < 0 ) { 
                qed.push( "stepLeft" );
                self.hatMoveXInterval = setInterval( function() { 
                    qed.push( "stepLeft" );
                }, 200 );
            } else {
                clearInterval( self.hatMoveXInterval );
            }
        }
    };
    
    self.stickMove = function( ax, moved ) {
        if( Math.abs( moved.value ) > self.axisDeadZone ) { // filter noise
            // determine directions
            var dir = moved.value / Math.abs( moved.value );
            var dirOld = moved.valueOld / Math.abs( moved.valueOld );
            // stop motion if yanked
            if( dir != dirOld ) { //yanked
                self.sendCease( ax );
            } else {
                // refer to correct set of vars, Xs or Ys
                var minSpeedAx = self.minSpeedX;
                var maxSpeedAx = self.maxSpeedX;
                var minAccelAx = self.minAccelX;
                var maxAccelAx = self.maxAccelX;
                if( ax == "Y" ) {
                    minSpeedAx = self.minSpeedY;
                    maxSpeedAx = self.maxSpeedY;
                    minAccelAx = self.minAccelY;
                    maxAccelAx = self.maxAccelY;
                }
                // do mappings
                var absValue = Math.abs( moved.value );
                var mappedSpeed = Math.floor( map( absValue, self.axisDeadZone, 1, minSpeedAx, maxSpeedAx ) );
                var mappedAccel = Math.floor( map( absValue, self.axisDeadZone, 1, minAccelAx, maxAccelAx ) ); 
                // send message
                if( ax == "X" ){
                    if( dir == 1 && self.currentHorDir != "EAST" ){  
                        qed.push( "goEAST" );
                        self.currentHorDir = "EAST";
                    }
                    else if( dir == -1 && self.currentHorDir != "WEST" ){ 
                        qed.push( "goWEST" );
                        self.currentHorDir = "WEST";
                    }
                    /*if( Math.ceil( ( moved.valueOld - self.axisDeadZone ) / 5  ) != Math.ceil( ( moved.value-self.axisDeadZone) / 5 ) ) {
                        self.currentSpeedX = mappedSpeed;
                        self.currentAccelX = mappedAccel;
                        //qed.push ( "setAccX" + self.currentAccelX );
                        qed.push ( "setMspX" + self.currentSpeedX );
                    }*/
                } else if( ax == "Y" ) {
                    if( dir == 1 && self.currentVerDir != "SOUTH") {
                        qed.push( "goSOUTH" );
                        self.currentVerDir = "SOUTH";
                    } 
                    else if( dir == -1 && self.currentVerDir != "NORTH" ) {
                        qed.push( "goNORTH" );
                        self.currentVerDir = "NORTH";
                    }
                    /*if( Math.ceil( ( moved.valueOld - self.axisDeadZone ) / 5  ) != Math.ceil( ( moved.value-self.axisDeadZone) / 5 ) ) {
                        self.currentSpeedY = mappedSpeed;
                        self.currentAccel = mappedSpeed;   
                        //qed.push ( "setAccY" + self.currentAccelY );
                        qed.push ( "setMspY" + self.currentSpeedY );           
                    }*/     
                }    
            }    
         
        } else { // stick back to neutral position
            self.sendCease( ax );
        }
    }
    //joystick inputs
    self.pad.on( "down", function( pressed, id, value ) {  
        console.log( arguments );
        switch( id ){
            case 0 : // TRIGGER
                qed.push( "ancNxl" );
            break;
            case 1 : // thumbpress
                qed.push( "ancPut" );
            break;
            case 2 : // hat bootom left
                qed.push( "ancHom" );
            break;
            case 3 : // hat bootom right
                qed.push( "ancPvl" );
            break;
            
            case 4 :  // hat top left
                qed.push( "stepLeft" );
                self.hatMoveXInterval = setInterval( function() {
                    qed.push( "stepLeft" );
                }, 200 );
            break;
            
            case 5 : // hat top right
                qed.push( "stepRight" );
                self.hatMoveXInterval = setInterval( function() {
                    qed.push( "stepRight" );
                }, 200 );
            break;
            
            
            case 6 : // 11oclock outer
                qed.push( "stepIncVer" );
            break;
            
            case 7 : // 11oclock inner
                qed.push( "stepDecVer" );
            break;
            
            case 8 : // 10oclock outer
                qed.push( "stepIncHor" );
            break;
            
            case 9 : // 10oclock inner
                qed.push( "stepDecHor" );
            break;
            
            case 10 : // 9oclock outer
            
            break;
            
            case 11 :  // 9oclock inner
            
            break;
        }
    } );
    
    self.pad.on( "up", function( pressed, id, value ) {  
        console.log( arguments );
        switch( id ){
            case 0 : // TRIGGER

            break;
            case 1 : // thumbpress

            break;
            case 2 : // hat bootom left
                
            break;
            case 3 : // hat bootom right
            
            break;
            
            case 4 :  // hat top left
                clearInterval( self.hatMoveXInterval );
            break;
            
            case 5 : // hat top right
                clearInterval( self.hatMoveXInterval );
            break;
            
            
            case 6 : // 11oclock outer

            break;
            
            case 7 : // 11oclock inner

            break;
            
            case 8 : // 10oclock outer

            break;
            
            case 9 : // 10oclock inner

            break;
            
            case 10 : // 9oclock outer
            
            break;
            
            case 11 :  // 9oclock inner
            
            break;
        }
    } );
    
    self.pad.on("move", function ( pressed, axis, value, valueOld ) {

        var moved = { 'pressed': pressed,
                      'axis': axis,
                      'value': value,
                      'valueOld': valueOld };
        switch( axis ) {
            case 1 : // Y or VERTICAL axis
                self.stickMove( "Y", moved );
            break;
            case 0 : // X or HORIZONTAL axis
                self.stickMove( "X", moved );
            break;
            case 2 : //Z or TWIST
                // do nothing
            break;
            case 3 : // stepX or THROTTLE
                self.throttleMove( "maxSpd", moved );
            break;
            case 4 : // discrete X or HAT X
                self.hatMove( "X", moved );
            break;
            case 5 : // discrete Y or HAT Y
                self.hatMove( "Y", moved );
            break;
        }
        
        
    });
    
    
    //self.pad.on( '', function() );
} // end constructor


/*
// Set a deadzone of +/-3500 (out of +/-32k) and a sensitivty of 350 to reduce signal noise in joystick axis
var joystick = new (require('joystick'))(0, 3500, 350);
joystick.on('button', function( daButton ) {  
    if( daButton.number == 0 ) {
        if( daButton.value == 1 ) {  
            serialPort.write( "stepDec", function(err, results) {} );
        }
    } else if( daButton.number == 2 ) {
        if( daButton.value == 1 ) {
            serialPort.write( "stepInc", function(err,results) {} );
	}
    } else if( daButton.number == 1 ) {
        if( daButton.value == 1 ) {
            serialPort.write( "motionDecAcc", function(err,results){} );
	}
    } else if( daButton.number == 3 ) {
        if( daButton.value == 1 ) {
            serialPort.write( "motionIncAcc", function(err,results){} );
	}
    }
} );

joystick.on('axis', function( daAxis ){
    if( daAxis.number == 0 ) {
        if( daAxis.value > 1000 ) {
            serialPort.write( "stepRight", function(err, results) {
                console.log('err ' + err);
                console.log('results ' + results);
            });
        }
        else if( daAxis.value < -1000 ) {
            serialPort.write( "stepLeft", function( err, results ) {  
                console.log('err ' + err);
                console.log('results ' + results);
            } );
        }
    } else if( daAxis.number == 1 ) {
        if( daAxis.value > 1000 ) {
            serialPort.write( "stepDown", function(err, results) {
                console.log('err ' + err);
                console.log('results ' + results);
            });
        } else if( daAxis.value < -1000 ) {
             serialPort.write( "stepUp", function(err, results) {
                console.log('err ' + err);
                console.log('results ' + results);
            });       
        }
    }
});
*/

// utility functions
map = function( val, minFrom, maxFrom, minTo, maxTo ) {
    var ret = minFrom;
    var ratio = ( maxTo - minTo ) / ( maxFrom - minFrom );
    ret = val * ratio;
    if( ret < minTo ) ret = minTo;
    if( ret > maxTo ) ret = maxTo;
    return ret;
}


setInterval( function() {  
    if( qed.length != 0 ) {
        var daMsg = qed[ 0 ]; 
        console.log( qed );
        console.log( daMsg );
        serialPort.write( daMsg, function( err,results ) {  } );
        qed.splice( 0, 1 );
    }
}, 50 );

// running
var daController = new MagController( serialPort, Gamepad );
setTimeout( function(  ){ 
    qed.push( "motionCrawl" );
    qed.push( "setAccX6000" );
    qed.push( "setAccY6000" );
    setTimeout( function() {  
        qed.push( "motionZoom" );
    }, 5000 );
} , 10000 );
