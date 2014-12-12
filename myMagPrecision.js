var arduino = { comName : "", pnpId : "usb-Arduino" };

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

    });
  }

});






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


