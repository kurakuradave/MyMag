/*************************************************************************
* File Name          : Plotter.ino
* Author             : Evan
* Updated            : Ander
* Version            : V0.1.0
* Date               : 10/10/2013
* Description        : Data transmission format (7 byte):
                       =======================================
                        [6]   [5]   [4]   [3]   [2]   [1]   [0]
                        End   X_H   X_L   Y_H   Y_L   0xFE  0xFF
                        
                       End:0xFD for Data,0xFC for Reset
                       =======================================
* License            : CC-BY-SA 3.0
* Copyright (C) 2011-2013 Hulu Robot Technology Co., Ltd. All right reserved.
* http://www.makeblock.cc/
**************************************************************************/

#include <AccelStepper.h>
#include <SoftwareSerial.h>
#include <Me_BaseShield.h>

// Define a stepper and the pins it will use
AccelStepper stepperX(AccelStepper::DRIVER, 13, 12); // 13-PUL, 12-DIR PORT 3
AccelStepper stepperY(AccelStepper::DRIVER, 2, 8); // 2-PUL, 8-DIR, PORT 4
int motorDrc = 4; //M1
int motorPwm = 5; //M1
int limitSW_X = A0; //PORT 7
int limitSW_Y = A1; //PORT 8

const int minX = 100;
const int maxX = 2100;
const int minY = 100;
const int maxY = 2100;
int stepX = 50;
int stepY = 50;
int accelX = 6000;
int accelY = 6000;
int maxSpeedX = 1500;
int maxSpeedY = 1500;
int ancX = 1050;
int ancY = 1050;
int ancXp = ancX;
int ancYp = ancY;

boolean reanchor = false;
boolean reapplyMotion = false;



//byte rxBuf;
//unsigned int timer = 0;
int x=0,y=0,xLast=0,yLast=0;
//int inByte;
//unsigned char dataBuf[8] = {0};
//int xPos[40]={0};int yPos[40]={0};

//char stateMachine = 0,t=0; 
boolean isMoving = false;int minIndex = 10,posIndex = 0;

void initMotor(){
  stepperX.setMaxSpeed(1500);stepperX.setAcceleration(6000); // set X stepper speed and acceleration
  stepperY.setMaxSpeed(1500);stepperY.setAcceleration(6000); // set Y stepper speed and acceleration
  stepperX.moveTo(-2700);stepperY.moveTo(-2700);// move XY to origin

  while(digitalRead(limitSW_X))stepperX.run();
  while(digitalRead(limitSW_Y))stepperY.run();// scanning stepper motor
  stepperX.setCurrentPosition(0);stepperY.setCurrentPosition(0); // reset XY position
  stepperX.setMaxSpeed(1500);stepperY.setMaxSpeed(1500);// set XY working speed
  stepperX.setSpeed(1000 ); stepperY.setSpeed( 1000 );
   stepperX.moveTo( ancX ); stepperY.moveTo( ancY );

}

void setup(){  
  pinMode(limitSW_X, INPUT);
  pinMode(limitSW_Y, INPUT);
  
  pinMode(motorDrc, OUTPUT);
  digitalWrite(motorDrc, HIGH);
  pinMode(motorPwm, OUTPUT);
  analogWrite(motorPwm, 0);
  
  initMotor();
  Serial.begin(9600);
  Serial.setTimeout( 20 );
  //bluetooth.begin(9600);
  //stepperX.setAcceleration( 500 );
  //stepperY.setAcceleration( 500 );
  //stepperX.setMaxSpeed( 50 );
  //stepperY.setMaxSpeed( 50 );
}

void loop() {
  if( reanchor ) {
    if( stepperX.distanceToGo() == 0 && stepperY.distanceToGo() == 0 ) {
      ancX += stepX;
      ancY += 0;
      reanchor = false;
      if( reapplyMotion ) {
        applyMotion();
        reapplyMotion = false; 
      }
    }  
  }
  String msg;
  if( Serial.available() > 0 ) {
    msg = Serial.readString();
    if( msg.startsWith( "step" ) )
      translateStep( msg );
    else if( msg.startsWith( "motion" ) )
      adjustMotion( msg );
    else if( msg.startsWith( "cease" ) )
      doCease( msg );
    else if( msg.startsWith( "go" ) )
      doGo( msg );
    else if( msg.startsWith( "set" ) )
      doSet( msg );
    else if( msg.startsWith( "anc" ) ) 
      doAnc( msg );

  }

  stepperX.run(); stepperY.run();
    
/*
  minIndex = isMoving?5:20;//buffer limit
  if(posIndex<minIndex){
    while(bluetooth.available()){
        rxBuf = bluetooth.read();
        if(stateMachine == 0)// check state machine
        {
          if(rxBuf == 0xff) stateMachine = 1;
          else stateMachine = 0;
        }
        else if(stateMachine == 1)
        {
          if(rxBuf == 0xfe) stateMachine = 2;
          else stateMachine = 0;
        }
        else if(stateMachine == 2)// receive data
        {
          dataBuf[t++] = rxBuf&0xff;
          if(t>4){// when receive all of data, reset stateMachine
            if(dataBuf[4]==0xfd){
              posIndex++;
              xPos[posIndex] = (dataBuf[2] + (dataBuf[3]<<8)); yPos[posIndex] = (dataBuf[0] + (dataBuf[1]<<8));//push data into buffer.
              if(yPos[posIndex]<0||yPos[posIndex]>3200)yPos[posIndex]=yPos[posIndex-1]; //limit Y postion
              if(xPos[posIndex]<0||xPos[posIndex]>3200)xPos[posIndex]=xPos[posIndex-1]; //limit X postion
              
            }else if(dataBuf[4]==0xfc){
              //when finish or reset
              analogWrite(motorPwm, 0);
              posIndex = 0;
              delay(1000);
            }
          t=0;// reset 
          stateMachine=0;// reset stateMachine
          }
        }
      }
    }
    stepperX.run(); stepperY.run(); // scanning stepper motor
    isMoving = posIndex>15;
    if(posIndex>0){
      readPosition();
    
    }
  //************************************
  //    [3]     [2]     [1]     [0]
  //    Y-H     Y-L     X-H     X-L
  //************************************
*/
}

/*
void readPosition(){
  int i=0;
  if(stepperX.currentPosition() == xLast && stepperY.currentPosition() ==  yLast ){  
        for(i=0;i<posIndex;i++){
          xPos[i]=xPos[i+1]; yPos[i]=yPos[i+1]; //update buffer
        }
        if(posIndex>0){
          posIndex--;//update buffer index 
        }
        int dx = xLast-xPos[0];
        int dy = yLast-yPos[0];
        unsigned long dist = dx*dx+dy*dy;//calculate distance between points.
        if(dist>25){
           analogWrite(motorPwm, 0); //pen up
        }else{
          if(posIndex!=0) analogWrite(motorPwm, 200);//pen down
        }
        stepperX.moveTo(xPos[0]); stepperY.moveTo(yPos[0]);// move to target
        xLast = xPos[0]; yLast = yPos[0];// save last position
    }
}
*/
void stepIncVer(){
    stepX += 20;
    if( stepX > maxX ) stepX = maxX;
}

void stepDecVer() {
    stepX -= 20;
    if( stepX < 10 ) stepX = 10;
}

void stepIncHor() {
    stepY += 40;
    if( stepY > maxY ) stepY = maxY;
}

void stepDecHor() {
    stepY -= 40;
    if( stepY < 10 ) stepY = 10;
}

void translateStep( String someString ) {
    int cur, tgt;
   if( someString == "stepUp" ) { 
       cur = stepperX.currentPosition();
       tgt = cur - stepX;
       if( tgt < minX ) 
           tgt = minX; 
       else if( tgt > maxX ) 
           tgt = maxX;
       stepperX.moveTo( tgt );
   } 
   else if( someString == "stepDown" ){  
       cur = stepperX.currentPosition();
       tgt = cur + stepX;
       if( tgt < minX ) 
           tgt = minX; 
       else if( tgt > maxX ) 
           tgt = maxX;
       stepperX.moveTo( tgt );
   }
      else if( someString == "stepRight" ) {  
       cur = stepperY.currentPosition();
       tgt = cur + stepY;
       if( tgt < minY ) 
           tgt = minY; 
       else if( tgt > maxY ) 
           tgt = maxY;
       stepperY.moveTo( tgt );
   }
   else if( someString == "stepLeft" ) {  
       cur = stepperY.currentPosition();
       tgt = cur - stepY;
       if( tgt < minY )
           tgt = minY; 
       else if( tgt > maxY )
           tgt = maxY;
       stepperY.moveTo( tgt );
  }
  else if( someString == "stepInc" ){
    stepIncHor();
    stepIncVer(); 
  }
  else if( someString == "stepDec" ) {
    stepDecHor();
    stepDecVer();
  }
  else if( someString == "stepIncHor" ) {
    stepIncHor();
  }
  else if( someString == "stepDecHor" ) {
    stepDecHor();
  }
  else if( someString == "stepIncVer" ) {
    stepIncVer();
  }
  else if( someString == "stepDecVer" ) {
    stepDecVer();
  }
}




void applyMotion(){
  stepperX.setAcceleration( accelX );
 stepperY.setAcceleration( accelY );
 stepperX.setMaxSpeed( maxSpeedX );
 stepperY.setMaxSpeed( maxSpeedY ); 
}




void adjustMotion( String s ) {
  if( s == "motionCrawl" ){
    accelX = 200;
    accelY = 200;
    maxSpeedX = 20;
    maxSpeedY = 20;
  } else if( s == "motionZoom" ) {
    accelX = 6000;
    accelY = 6000;
    maxSpeedX = 1500;
    maxSpeedY = 1500;
  } else if( s == "motionIncAcc" ) {
    accelX += 1500;
    accelY += 1500;
    maxSpeedX += 500;
    maxSpeedY += 500;
    if( accelX > 6000 ) accelX = 6000;
    if( accelY > 6000 ) accelY = 6000;
    if( maxSpeedX > 2550 ) maxSpeedX = 2550;
    if( maxSpeedY > 2550 ) maxSpeedY = 2550;
  } else if( s == "motionDecAcc" ) {
    accelX -= 1500;
    accelY -= 1500;
    maxSpeedX -= 500;
    maxSpeedY -= 500;
    if( accelX < 500 ) accelX = 500;
    if( accelY < 500 ) accelY = 500;
    if( maxSpeedX < 50 ) maxSpeedX = 50;
    if( maxSpeedY < 50 ) maxSpeedY = 50;
  } 
  applyMotion();
}

void doCease( String s ) {
    char ax = s[ 5 ];
    if( ax == 'Y' ) {
        stepperX.setSpeed( 0 );
        stepperX.moveTo( stepperX.currentPosition() );
    } else {
        stepperY.setSpeed( 0 );
        stepperY.moveTo( stepperY.currentPosition() );
    }
}

void doGo( String s ) {
    String dir = s.substring( 2, s.length() );
    if( dir == "SOUTH" ) {
        stepperX.moveTo( maxX );
    } else if( dir == "NORTH" ) {
        stepperX.moveTo( minX );
    } else if( dir == "WEST" ) {
        stepperY.moveTo( minY );
    } else if( dir == "EAST" ) {
        stepperY.moveTo( maxY );
    }
}



void doSet( String s ) {
    String prop = s.substring( 3, 6 );
    char ax = s[ 6 ];
    int val = s.substring( 7, s.length() ).toInt();
    if( ax == 'Y' ) {
        if( prop == "Spd" ) stepperX.setSpeed( val );
        if( prop == "Acc" ){
          accelX = val;
          stepperX.setAcceleration( accelX );
        }
        if( prop == "Msp" ){ 
           maxSpeedX = val;
           stepperX.setMaxSpeed( maxSpeedX );
        }
        if( prop == "Stp" ) stepX = val;
    } else if( ax == 'X' ) {
        if( prop == "Spd" ) stepperY.setSpeed( val );
        if( prop == "Acc" ) { 
           accelY = val;
           stepperY.setAcceleration( accelY );
        }
        if( prop == "Msp" ) { 
           maxSpeedY = val;
           stepperY.setMaxSpeed( maxSpeedY );
        }
        if( prop == "Stp" ) stepY = val;
    }
}

void updatePrevAnchor() { 
    // set previous anchor
    ancXp = stepperX.currentPosition();
    ancYp = stepperY.currentPosition();
}

void goTopSpeed() {
    stepperX.setAcceleration( 6000 );
    stepperY.setAcceleration( 6000 );
    stepperX.setMaxSpeed( 1500 );
    stepperY.setMaxSpeed( 1500 );
}

void zoomToAnchor( int xpos, int ypos, boolean sethooks ) {    // bring up to top speed
    goTopSpeed();
    // instruct to move to target
    stepperX.moveTo( xpos );
    stepperY.moveTo( ypos );
   
    // set hooks for next loop iteration
    if( sethooks ) {
        reanchor = true;
        reapplyMotion = true;        
    }
}

void doAnc( String s ) {
    String action = s.substring( 3, s.length() );
    if( action == "Put" ) {
        ancX = stepperX.currentPosition();
        ancY = stepperY.currentPosition();
        if( ancX < minX ) ancX = minX;
        else if( ancX > maxX ) ancX = maxX;
        if( ancY < minY ) ancY = minY;
        else if( ancY > maxY ) ancY = maxY;
    } else if ( action == "Nxl" ) {
        updatePrevAnchor();
        // determine target to zoom to
        int tgtX = ancX + stepX;
        if( tgtX > maxX ) tgtX = maxX;
        // instruct to zoom to target
        zoomToAnchor( tgtX, ancY, true );
    } else if( action == "Hom" ) {
        updatePrevAnchor();
        zoomToAnchor( ancX, ancY, false );
    } else if( action == "Pvl" ) {
         zoomToAnchor( ancXp, ancYp,false ); 
    }

}
