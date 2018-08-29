/*
159.360 Assignment 2 - Terry Rozmus 94131529
*/
/*
What I did:

1. Added a little colour to the geometry to make the form easier to
   'read'.
2. Modified the cube geometry from the humanoid robot a little and 
   added a 'beak' which also functioned as toes.   
2. Built the model. At first I did this by always adding new
   animation tree nodes. Example: neckFeathers1 on line 606.
   Later I found, however, that if a new piece I added moved with a 
   node already present in the tree (same translation and rotation)
   it could simply be added to the function that builds the model for 
   the same tree node. Example: function 'body' on line 765.
3. Built a pose library. Lines 117-388.
4. Built a function for testing poses (currently deactivated).
   This is unction 'nextPose' at line 1124 which is called from the canvas 
   onClick event established at line 1241.
4. Built a function for blending two poses by a certain ratio.
   Function 'blendPoses' on line 1115.
5. Built an animation timeline that stored the frame, pose and
   blending ratio. Lines 399-539.
6. Built the function that animates the kiwis using the timeline (function
   'nextFrame' on line 1140) and set up setInterval time event to 
   call the animation function 50 times every second (line 1250).
7. The second kiwi is drawn by moving the model view matrix and rendering
   again using the same model tree as kiwi 1. (Lines 1262 - 1270).   
8. Animated the kiwis.
*/
var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var vertices = [
    // Cube
	vec4( 0.0, -0.5,  0.5, 1.0 ),
    vec4( 0.0,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.0, 1.0 ),
    vec4( 0.5, -0.5,  0.0, 1.0 ),
    vec4( -0.5, -0.5, 0.0, 1.0 ),
    vec4( -0.5,  0.5, 0.0, 1.0 ),
    vec4( 0.0,  0.5, -0.5, 1.0 ),
    vec4( 0.0, -0.5, -0.5, 1.0 ),
	// Beak
	vec4( 0.0,-0.5, 1.0, 1.0 ),
	vec4( 0.0, 0.5, 0.0, 1.0 ),
	vec4(-0.5,-0.5, 0.0, 1.0 ),
	vec4( 0.5,-0.5, 0.0, 1.0 )
];

// Count of Nodes (Ids)
var numNodes = 27;

// Node Ids
var bodyId = 0;
var upperNeckId = 1;
var lowerNeckId = 2;
var headId = 3;
var beakTopId = 4;
var beakBottomId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var leftUpperFootId = 8;
var leftLowerFootId = 9;
var leftToeOuterId = 10;
var leftToeMiddleId = 11;
var leftToeInnerId = 12;
var rightUpperLegId = 13;
var rightLowerLegId = 14;
var rightUpperFootId = 15;
var rightLowerFootId = 16;
var rightToeOuterId = 17;
var rightToeMiddleId = 18;
var rightToeInnerId = 19;
var eyesId = 20;
var neckFeathers1Id = 21;
var neckFeathers2Id = 22;
var neckFeathers3Id = 23;
var neckFeathers4Id = 24;
var neckFeathers5Id = 25;

var bodyLength = 4.0;
var bodyWidth = 3.0;
var upperLegWidth  = 1.0;
var lowerLegWidth  = 0.25;
var lowerLegHeight = 2.5;
var upperLegHeight = 3.0;
var upperFootHeight = 1.2;
var lowerFootLength = 0.25;
var toeLength = 1.7;
var toeWidth = 0.15;
var headHeight = 1.0;
var headWidth = 1.2;
var neckLength = 2.0;
var lowerNeckWidth = 0.7;
var upperNeckWidth = 0.3;
var beakWidth = 0.5;
var beakLength = 3.0;

// Kiwi Poses
var kiwiPoses = [];
var kiwi1PoseT0 = 0;
var kiwi2PoseT0 = 0;
var kiwi1PoseT1 = 2;
var kiwi2PoseT1 = 2;

/*
Pose array
*/
// Looking Up
var lookingUp = 0;
kiwiPoses[lookingUp] = {
	bodySwivel:		90,
	bodyMedialTilt:	-80,
	bodyLateralTilt:0,
	bodyVertical:   -0.15,
	bodyAlong:      -0.27,
	headTilt:		0, 
	headSwing:      0,
	beakTopTilt:    0, 
	beakBottomTilt: 0, 
	upperNeckTilt:  50,
	lowerNeckTilt:  -10,
	neckSwing:      0,
	leftUpperLeg:	-10, 
	leftLowerLeg:	-130,
	leftUpperFoot:  90,	
	leftLowerFoot:  -95,	
	leftToeOuter:   125,	
	leftToeMiddle:  125,	
	leftToeInner:   125,	
	rightUpperLeg:  -10, 
	rightLowerLeg:  -130,
	rightUpperFoot: 90,
	rightLowerFoot: -95,	
	rightToeOuter:  125,	
	rightToeMiddle: 125,	
	rightToeInner:  125,	
}; 
// Relaxed
var relaxed = 1;
kiwiPoses[relaxed] = {
	bodySwivel:		90,
	bodyMedialTilt:	-80,
	bodyLateralTilt:0,
	bodyVertical:   0,
	bodyAlong:      0,
	headTilt:		-70, 
	headSwing:      0,
	beakTopTilt:    0, 
	beakBottomTilt: 0, 
	upperNeckTilt:  90,
	lowerNeckTilt:  -30,
	neckSwing:      0,
	leftUpperLeg:	-15, 
	leftLowerLeg:	-130,
	leftUpperFoot:  90,	
	leftLowerFoot:  -90,	
	leftToeOuter:   125,	
	leftToeMiddle:  125,	
	leftToeInner:   125,	
	rightUpperLeg:  -15, 
	rightLowerLeg:  -130,
	rightUpperFoot: 90,
	rightLowerFoot: -90,	
	rightToeOuter:  125,	
	rightToeMiddle: 125,	
	rightToeInner:  125,	
};
// Prone
var standingHigh = 2;
kiwiPoses[standingHigh] = {
	bodySwivel:		90,
	bodyMedialTilt:	-50,
	bodyLateralTilt:0,
	bodyVertical:   -0.52,
	bodyAlong:      -0.07,
	headTilt:		-85, 
	beakTopTilt:    0, 
	headSwing:      0,
	beakBottomTilt: 0, 
	upperNeckTilt:  55,
	lowerNeckTilt:  -5,
	neckSwing:      0,
	leftUpperLeg:	-25, 
	leftLowerLeg:	-135,
	leftUpperFoot:  40,	
	leftLowerFoot:  -55,	
	leftToeOuter:   125,	
	leftToeMiddle:  125,	
	leftToeInner:   125,	
	rightUpperLeg:  -25, 
	rightLowerLeg:  -135,
	rightUpperFoot: 40,
	rightLowerFoot: -55,	
	rightToeOuter:  125,	
	rightToeMiddle: 125,	
	rightToeInner:  125,		
};
// Call
var call = 3;
kiwiPoses[call] = {
	bodySwivel:		90,
	bodyMedialTilt:	-60,
	bodyLateralTilt:0,
	bodyVertical:   -0.87,
	bodyAlong:      0.20,
	headTilt:		-105, 
	headSwing:      0,
	beakTopTilt:    13, 
	beakBottomTilt: -13, 
	upperNeckTilt:  140,
	lowerNeckTilt:  -20,
	neckSwing:      0,
	leftUpperLeg:	-15, 
	leftLowerLeg:	-145,
	leftUpperFoot:  50,	
	leftLowerFoot:  -55,	
	leftToeOuter:   125,	
	leftToeMiddle:  125,	
	leftToeInner:   125,	
	rightUpperLeg:  -15, 
	rightLowerLeg:  -145,
	rightUpperFoot: 50,
	rightLowerFoot: -55,	
	rightToeOuter:  125,	
	rightToeMiddle: 125,	
	rightToeInner:  125,		
};
// Call. Left Leg Lifted.
var callLeftLegRaised = 4;
kiwiPoses[callLeftLegRaised] = {
	bodySwivel:		90,
	bodyMedialTilt:	-60,
	bodyLateralTilt:0,
	bodyVertical:   -0.87,
	bodyAlong:      0.20,
	headTilt:		-105, 
	headSwing:      0,
	beakTopTilt:    13, 
	beakBottomTilt: -13, 
	upperNeckTilt:  140,
	lowerNeckTilt:  -20,
	neckSwing:      0,
	leftUpperLeg:	-15, 
	leftLowerLeg:	-145,
	leftUpperFoot:  100,	
	leftLowerFoot:  -90,	
	leftToeOuter:   125,	
	leftToeMiddle:  125,	
	leftToeInner:   125,	
	rightUpperLeg:  -15, 
	rightLowerLeg:  -145,
	rightUpperFoot: 50,
	rightLowerFoot: -55,	
	rightToeOuter:  125,	
	rightToeMiddle: 125,	
	rightToeInner:  125,		
};
// Call. Right Leg Lifted.
var callRightLegRaised = 5;
kiwiPoses[callRightLegRaised] = {
	bodySwivel:		90,
	bodyMedialTilt:	-60,
	bodyLateralTilt:0,
	bodyVertical:   -0.87,
	bodyAlong:      0.20,
	headTilt:		-105, 
	headSwing:      0,
	beakTopTilt:    13, 
	beakBottomTilt: -13, 
	upperNeckTilt:  140,
	lowerNeckTilt:  -20,
	neckSwing:      0,
	leftUpperLeg:	-15, 
	leftLowerLeg:	-145,
	leftUpperFoot:  50,	
	leftLowerFoot:  -55,	
	leftToeOuter:   125,	
	leftToeMiddle:  125,	
	leftToeInner:   125,	
	rightUpperLeg:  -15, 
	rightLowerLeg:  -145,
	rightUpperFoot: 100,
	rightLowerFoot: -90,	
	rightToeOuter:  125,	
	rightToeMiddle: 125,	
	rightToeInner:  125,		
};
// Looking Back Left
var lookToScreen = 6;
kiwiPoses[lookToScreen] = {
	bodySwivel:		90,
	bodyMedialTilt:	-80,
	bodyLateralTilt:0,
	bodyVertical:   0,
	bodyAlong:      0,
	headTilt:		0, 
	headSwing:      70,
	beakTopTilt:    0, 
	beakBottomTilt: 0, 
	upperNeckTilt:  0,
	lowerNeckTilt:  0,
	neckSwing:      45,
	leftUpperLeg:	-15, 
	leftLowerLeg:	-130,
	leftUpperFoot:  90,	
	leftLowerFoot:  -90,	
	leftToeOuter:   125,	
	leftToeMiddle:  125,	
	leftToeInner:   125,	
	rightUpperLeg:  -15, 
	rightLowerLeg:  -130,
	rightUpperFoot: 90,
	rightLowerFoot: -90,	
	rightToeOuter:  125,	
	rightToeMiddle: 125,	
	rightToeInner:  125,	
};
// Looking Back Right
var lookToSceneRear = 7;
kiwiPoses[lookToSceneRear] = {
	bodySwivel:		90,
	bodyMedialTilt:	-80,
	bodyLateralTilt:0,
	bodyVertical:   0,
	bodyAlong:      0,
	headTilt:		0, 
	headSwing:      -70,
	beakTopTilt:    0, 
	beakBottomTilt: 0, 
	upperNeckTilt:  0,
	lowerNeckTilt:  0,
	neckSwing:      -45,
	leftUpperLeg:	-15, 
	leftLowerLeg:	-130,
	leftUpperFoot:  90,	
	leftLowerFoot:  -90,	
	leftToeOuter:   125,	
	leftToeMiddle:  125,	
	leftToeInner:   125,	
	rightUpperLeg:  -15, 
	rightLowerLeg:  -130,
	rightUpperFoot: 90,
	rightLowerFoot: -90,	
	rightToeOuter:  125,	
	rightToeMiddle: 125,	
	rightToeInner:  125,	
};
// Head down
var headDown = 8;
kiwiPoses[headDown] = {
	bodySwivel:		90,
	bodyMedialTilt:	-82,
	bodyLateralTilt:0,
	bodyVertical:   -0.09,
	bodyAlong:      -0.02,
	headTilt:		-100, 
	headSwing:      0,
	beakTopTilt:    0, 
	beakBottomTilt: 0, 
	upperNeckTilt:  50,
	lowerNeckTilt:  -50,
	neckSwing:      0,
	leftUpperLeg:	-11, 
	leftLowerLeg:	-132,
	leftUpperFoot:  90,	
	leftLowerFoot:  -90,	
	leftToeOuter:   125,	
	leftToeMiddle:  125,	
	leftToeInner:   125,	
	rightUpperLeg:  -11, 
	rightLowerLeg:  -132,
	rightUpperFoot: 90,
	rightLowerFoot: -90,	
	rightToeOuter:  125,	
	rightToeMiddle: 125,	
	rightToeInner:  125,	
};

var nowOnFrame = 0;
var kiwi1Timestop0 = 0;
var kiwi1Timestop1 = 1;
var kiwi2Timestop0 = 0;
var kiwi2Timestop1 = 1;
var oldKiwi1Pose = {};
var oldKiwi2Pose = {};
var endFrame = 1410;

// Time line data (ratio is the blend of the new pose to
// the pose visible in the scene at the last timeline stop) 
var kiwi1Timeline = [
	// Relaxed
	{ atFrame:    0, ratio: 1.00, pose: relaxed },
	{ atFrame:   25, ratio: 0.10, pose: lookingUp },
	{ atFrame:   50, ratio: 1.00, pose: relaxed },
	{ atFrame:  135, ratio: 0.01, pose: lookToScreen },
	// Look at other kiwi
	{ atFrame:  145, ratio: 0.15, pose: lookToScreen },
	{ atFrame:  155, ratio: 0.40, pose: lookToSceneRear },
	{ atFrame:  255, ratio: 0.30, pose: relaxed },
	{ atFrame:  265, ratio: 1.00, pose: relaxed },
	{ atFrame:  275, ratio: 0.05, pose: lookToScreen },
	{ atFrame:  285, ratio: 1.00, pose: relaxed },
	// Look at other kiwi again
	{ atFrame:  340, ratio: 1.00, pose: relaxed },
	{ atFrame:  350, ratio: 0.25, pose: lookToSceneRear },
	{ atFrame:  500, ratio: 0.30, pose: relaxed },
	{ atFrame:  510, ratio: 1.00, pose: relaxed },
	{ atFrame:  520, ratio: 0.05, pose: lookToScreen },
	{ atFrame:  530, ratio: 1.00, pose: relaxed },
	{ atFrame:  550, ratio: 0.01, pose: headDown },
	// Nod in acknowledgement
	{ atFrame:  560, ratio: 0.10, pose: lookingUp },
	{ atFrame:  570, ratio: 0.40, pose: headDown },
	{ atFrame:  575, ratio: 0.45, pose: headDown },
	{ atFrame:  585, ratio: 0.40, pose: headDown },
	{ atFrame:  595, ratio: 1.00, pose: relaxed },
	{ atFrame:  635, ratio: 0.10, pose: headDown },
	// Begin calling
	{ atFrame:  665, ratio: 1.00, pose: standingHigh },
	{ atFrame:  680, ratio: 0.50, pose: call },
	{ atFrame:  710, ratio: 0.55, pose: call },
	{ atFrame:  725, ratio: 1.00, pose: standingHigh },
	{ atFrame:  740, ratio: 0.60, pose: call },
	{ atFrame:  770, ratio: 0.65, pose: call },
	{ atFrame:  785, ratio: 1.00, pose: standingHigh },
	{ atFrame:  800, ratio: 0.80, pose: call },
	{ atFrame:  830, ratio: 0.85, pose: call },
	{ atFrame:  845, ratio: 1.00, pose: standingHigh },
	// Lifting leg while calling
	{ atFrame:  853, ratio: 0.50, pose: call },
	{ atFrame:  860, ratio: 0.50, pose: callRightLegRaised },
	{ atFrame:  890, ratio: 0.55, pose: callRightLegRaised },
	{ atFrame:  905, ratio: 1.00, pose: standingHigh },
	{ atFrame:  913, ratio: 0.50, pose: call },
	{ atFrame:  920, ratio: 0.70, pose: callRightLegRaised },
	{ atFrame:  950, ratio: 0.75, pose: callRightLegRaised },
	{ atFrame:  965, ratio: 1.00, pose: standingHigh },
	{ atFrame:  973, ratio: 0.50, pose: call },
	{ atFrame:  980, ratio: 0.80, pose: callRightLegRaised },
	{ atFrame: 1010, ratio: 0.70, pose: callRightLegRaised },
	{ atFrame: 1025, ratio: 1.00, pose: standingHigh },
	{ atFrame: 1033, ratio: 0.95, pose: call },
	{ atFrame: 1040, ratio: 0.90, pose: callRightLegRaised },
	{ atFrame: 1070, ratio: 0.30, pose: call },
	{ atFrame: 1085, ratio: 1.00, pose: standingHigh },
	{ atFrame: 1100, ratio: 0.85, pose: call },
	{ atFrame: 1130, ratio: 0.80, pose: call },
	{ atFrame: 1145, ratio: 1.00, pose: standingHigh },
	{ atFrame: 1160, ratio: 0.75, pose: call },
	{ atFrame: 1190, ratio: 0.70, pose: call },
	{ atFrame: 1205, ratio: 1.00, pose: standingHigh },
	{ atFrame: 1220, ratio: 0.65, pose: call },
	{ atFrame: 1250, ratio: 0.60, pose: call },
	{ atFrame: 1265, ratio: 1.00, pose: standingHigh },
	{ atFrame: 1280, ratio: 0.55, pose: call },
	{ atFrame: 1310, ratio: 0.50, pose: call },
	{ atFrame: 1325, ratio: 1.00, pose: standingHigh },
	// Relaxed
	{ atFrame: 1375, ratio: 0.05, pose: relaxed },
	{ atFrame: 1395, ratio: 1.00, pose: relaxed },
	{ atFrame: 1400, ratio: 0.05, pose: headDown },
	{ atFrame: 1405, ratio: 1.00, pose: relaxed },
	{ atFrame: 1410, ratio: 1.00, pose: relaxed },
];
var kiwi2Timeline = [
	// Relaxed
	{ atFrame:    0, ratio: 1.00, pose: relaxed },
	{ atFrame:   20, ratio: 0.05, pose: lookToSceneRear },
	{ atFrame:   40, ratio: 0.20, pose: lookToScreen },
	{ atFrame:   75, ratio: 0.05, pose: lookToScreen },
	{ atFrame:   85, ratio: 1.00, pose: relaxed },
	// Begin calling
	{ atFrame:  115, ratio: 1.00, pose: standingHigh },
	{ atFrame:  130, ratio: 0.50, pose: call },
	{ atFrame:  160, ratio: 0.55, pose: call },
	{ atFrame:  175, ratio: 1.00, pose: standingHigh },
	{ atFrame:  190, ratio: 0.60, pose: call },
	{ atFrame:  220, ratio: 0.65, pose: call },
	{ atFrame:  235, ratio: 1.00, pose: standingHigh },
	{ atFrame:  250, ratio: 0.80, pose: call },
	{ atFrame:  280, ratio: 0.85, pose: call },
	{ atFrame:  295, ratio: 1.00, pose: standingHigh },
	{ atFrame:  310, ratio: 0.90, pose: call },
	{ atFrame:  340, ratio: 0.95, pose: call },
	{ atFrame:  355, ratio: 1.00, pose: standingHigh },
	{ atFrame:  370, ratio: 0.95, pose: call },
	{ atFrame:  400, ratio: 1.00, pose: call },
	{ atFrame:  415, ratio: 1.00, pose: standingHigh },
	{ atFrame:  445, ratio: 0.60, pose: relaxed },
	// Look at other kiwi
	{ atFrame:  455, ratio: 0.20, pose: lookToScreen },
	{ atFrame:  465, ratio: 0.01, pose: relaxed },
	{ atFrame:  520, ratio: 0.10, pose: relaxed },
	{ atFrame:  530, ratio: 0.20, pose: relaxed },
	{ atFrame:  540, ratio: 0.01, pose: relaxed },
	{ atFrame:  670, ratio: 0.10, pose: relaxed },
	{ atFrame:  680, ratio: 0.15, pose: lookToScreen },
	{ atFrame:  690, ratio: 0.10, pose: relaxed },
	{ atFrame:  850, ratio: 0.10, pose: relaxed },
	{ atFrame:  860, ratio: 0.20, pose: relaxed },
	{ atFrame:  870, ratio: 0.01, pose: relaxed },
	{ atFrame: 1000, ratio: 0.10, pose: headDown },
	// Begin calling again
	{ atFrame: 1015, ratio: 1.00, pose: standingHigh },
	{ atFrame: 1030, ratio: 0.50, pose: call },
	{ atFrame: 1060, ratio: 0.55, pose: call },
	{ atFrame: 1075, ratio: 1.00, pose: standingHigh },
	{ atFrame: 1090, ratio: 0.60, pose: call },
	{ atFrame: 1120, ratio: 0.65, pose: call },
	{ atFrame: 1135, ratio: 1.00, pose: standingHigh },
	{ atFrame: 1150, ratio: 0.80, pose: call },
	{ atFrame: 1180, ratio: 0.85, pose: call },
	{ atFrame: 1195, ratio: 1.00, pose: standingHigh },
	{ atFrame: 1210, ratio: 0.90, pose: call },
	{ atFrame: 1240, ratio: 0.95, pose: call },
	{ atFrame: 1255, ratio: 1.00, pose: standingHigh },
	{ atFrame: 1270, ratio: 0.95, pose: call },
	{ atFrame: 1300, ratio: 1.00, pose: call },
	{ atFrame: 1315, ratio: 1.00, pose: standingHigh },
	{ atFrame: 1330, ratio: 0.80, pose: call },
	{ atFrame: 1360, ratio: 0.85, pose: call },
	{ atFrame: 1390, ratio: 1.00, pose: standingHigh },
	// Relax
	{ atFrame: 1400, ratio: 0.70, pose: relaxed },
	//{ atFrame: 1335, ratio: 0.05, pose: headDown },
	//{ atFrame: 1340, ratio: 0.50, pose: relaxed },
	{ atFrame: 1410, ratio: 1.00, pose: relaxed },
];

oldKiwi1Pose = kiwiPoses[kiwi1Timeline[0]['pose']];
oldKiwi2Pose = kiwiPoses[kiwi2Timeline[0]['pose']];

var kiwi1NowPosed = kiwiPoses[kiwi1PoseT0];
var kiwi2NowPosed = kiwiPoses[kiwi2PoseT0];
var kiwi1ThenPosed = kiwi1NowPosed;
var kiwi2ThenPosed = kiwi2NowPosed;
var pose = kiwi1NowPosed;

var numVertices = 24;

var stack = [];

var figure = [];

for( var i=0; i < numNodes; i++) figure[i] = createNode(null, null, null, null);

var vBuffer;
var vIdBuffer;
var modelViewLoc;

var pointsArray = [];
var pointIdsArray = [];

// Scale component parts
function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

// Create body part
function createNode(transform, render, sibling, child){
    var node = {
		transform: transform,
		render: render,
		sibling: sibling,
		child: child,
    }
    return node;
}

// Initialise body part
function initNodes(Id) {
    var m = mat4();

    switch(Id) {

		case bodyId:
			m = rotate(pose['bodySwivel'], 0, 1, 0);
			m = mult(m, rotate(pose['bodyMedialTilt'], 1, 0, 0));
			m = mult(m, rotate(pose['bodyLateralTilt'], 0, 0, 1));
			m = mult(m, translate(0, pose['bodyAlong'], pose['bodyVertical']));
			figure[bodyId] = createNode( m, body, null, lowerNeckId );
			break;

		case lowerNeckId:
			m = translate(0.0, bodyLength - 0.2, 1.2);
			m = mult(m, rotate(pose['lowerNeckTilt'], 1, 0, 0));
			m = mult(m, rotate(pose['neckSwing'], 0.0, 0.0, 1.0));
			figure[lowerNeckId] = createNode( m, lowerNeck, leftUpperLegId, upperNeckId );
			break;

		case neckFeathers1Id:
			m = translate(0.0, 0.0, 0.0);
			figure[neckFeathers1Id] = createNode( m, neckFeathers1, neckFeathers2Id, null);
			break;
			
		case neckFeathers2Id:
			m = translate(0.0, 0.0, 0.0);
			figure[neckFeathers2Id] = createNode( m, neckFeathers2, neckFeathers3Id, null);
			break;
			
		case neckFeathers3Id:
			m = translate(0.0, 0.0, 0.0);
			figure[neckFeathers3Id] = createNode( m, neckFeathers3, null, null);
			break;
			
		case upperNeckId:
			m = translate(0.0, neckLength - 0.2, 0.0);
			m = mult(m, rotate(pose['upperNeckTilt'], 1, 0, 0));
			m = mult(m, rotate(pose['neckSwing'], 0.0, 0.0, 1.0));
			figure[upperNeckId] = createNode( m, upperNeck, neckFeathers1Id, headId );
			break;

		case neckFeathers4Id:
			m = translate(0.0, 0.0, 0.0);
			figure[neckFeathers4Id] = createNode( m, neckFeathers4, neckFeathers5Id, null);
			break;
			
		case neckFeathers5Id:
			m = translate(0.0, 0.0, 0.0);
			figure[neckFeathers5Id] = createNode( m, neckFeathers5, null, null);
			break;
			
		case headId:
			m = translate(0.0, neckLength - 0.3, 0.0);
			m = mult(m, rotate(pose['headTilt'], 1, 0, 0));
			m = mult(m, rotate(pose['headSwing'], 0, 0, 1));
			figure[headId] = createNode( m, head, neckFeathers4Id, beakTopId);
			break;

		case beakTopId:
			m = translate(0.0, headHeight - 0.3, 0.0);
			m = mult(m, rotate(pose['beakTopTilt'], 1, 0, 0))
			figure[beakTopId] = createNode( m, beakTop, beakBottomId, null);
			break;
			
		case beakBottomId:
			m = translate(0.0, headHeight - 0.3, 0.0);
			m = mult(m, rotate(pose['beakBottomTilt'], 1, 0, 0))
			figure[beakBottomId] = createNode( m, beakBottom, eyesId, null);
			break;

		case eyesId:
			m = translate(0.0, 0.0, 0.0);
			m = mult(m, rotate(90, 0, 0, 1))
			figure[eyesId] = createNode( m, eyes, null, null);
			break;

		case leftUpperLegId:
			m = translate(-(bodyWidth - upperLegWidth) / 2, 0.1 * upperLegHeight, 0.0);
			m = mult(m, rotate(pose['leftUpperLeg'], 1, 0, 0));
			figure[leftUpperLegId] = createNode( m, leftUpperLeg, rightUpperLegId, leftLowerLegId );
			break;

		case rightUpperLegId:
			m = translate((bodyWidth - upperLegWidth) / 2, 0.1 * upperLegHeight, 0.0);
			m = mult(m, rotate(pose['rightUpperLeg'], 1, 0, 0));
			figure[rightUpperLegId] = createNode( m, rightUpperLeg, null, rightLowerLegId );
			break;

		case leftLowerLegId:
			m = translate(0.0, upperLegHeight, 0.0);
			m = mult(m, rotate(pose['leftLowerLeg'], 1, 0, 0));
			figure[leftLowerLegId] = createNode( m, leftLowerLeg, null, leftUpperFootId );
			break;

		case rightLowerLegId:
			m = translate(0.0, upperLegHeight, 0.0);
			m = mult(m, rotate(pose['rightLowerLeg'], 1, 0, 0));
			figure[rightLowerLegId] = createNode( m, rightLowerLeg, null, rightUpperFootId );
			break;
			
		case leftUpperFootId:
			m = translate(0.0, lowerLegHeight, 0.0);
			m = mult(m, rotate(pose['leftUpperFoot'], 1, 0, 0));
			figure[leftUpperFootId] = createNode( m, leftUpperFoot, null, leftLowerFootId );
			break;
			
		case rightUpperFootId:
			m = translate(0.0, lowerLegHeight, 0.0);
			m = mult(m, rotate(pose['rightUpperFoot'], 1, 0, 0));
			figure[rightUpperFootId] = createNode( m, rightUpperFoot, null, rightLowerFootId );
			break;
		
		case leftLowerFootId:
			m = translate(0.0, upperFootHeight, 0.0);
			m = mult(m, rotate(pose['leftLowerFoot'], 1, 0, 0));
			figure[leftLowerFootId] = createNode( m, leftLowerFoot, null, leftToeMiddleId );
			break;
			
		case rightLowerFootId:
			m = translate(0.0, upperFootHeight, 0.0);
			m = mult(m, rotate(pose['rightLowerFoot'], 1, 0, 0));
			figure[rightLowerFootId] = createNode( m, rightLowerFoot, null, rightToeMiddleId );
			break;
		
		case leftToeMiddleId:
			m = translate(0.0, 0.0, 0.0);
			m = mult(m, rotate(pose['leftToeMiddle'], 1, 0, 0));
			figure[leftToeMiddleId] = createNode( m, leftToeMiddle, leftToeOuterId, null );
			break;	
		
		case rightToeMiddleId:
			m = translate(0.0, 0.0, 0.0);
			m = mult(m, rotate(pose['rightToeMiddle'], 1, 0, 0));
			figure[rightToeMiddleId] = createNode( m, rightToeMiddle, rightToeOuterId, null );
			break;

		case leftToeOuterId:
			m = translate(0.0, 0.0, 0.0);
			m = mult(m, rotate(pose['leftToeOuter'], 1, 0, 0));
			m = mult(m, rotate(30, 0, 0, 1));
			figure[leftToeOuterId] = createNode( m, leftToeOuter, leftToeInnerId, null );
			break;
			
		case leftToeInnerId:
			m = translate(0.0, 0.0, 0.0);
			m = mult(m, rotate(pose['leftToeInner'], 1, 0, 0));
			m = mult(m, rotate(-30, 0, 0, 1));
			figure[leftToeInnerId] = createNode( m, leftToeInner, null, null );
			break;
			
		case rightToeOuterId:
			m = translate(0.0, 0.0, 0.0);
			m = mult(m, rotate(pose['rightToeOuter'], 1, 0, 0));
			m = mult(m, rotate(45, 0, 0, 1));
			figure[rightToeOuterId] = createNode( m, rightToeOuter, rightToeInnerId, null );
			break;
			
		case rightToeInnerId:
			m = translate(0.0, 0.0, 0.0);
			m = mult(m, rotate(pose['rightToeInner'], 1, 0, 0));
			m = mult(m, rotate(-45, 0, 0, 1));
			figure[rightToeInnerId] = createNode( m, rightToeInner, null, null );
			break;
					
    }
}

function traverse(Id) {

	if (Id == null) return;
	stack.push(modelViewMatrix);
	modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
	figure[Id].render();
	if (figure[Id].child != null) traverse(figure[Id].child);
		modelViewMatrix = stack.pop();
	if (figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function body() {
	
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * bodyLength, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( bodyWidth, bodyLength, bodyWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * bodyLength, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( bodyWidth * 1.20, bodyLength * 0.55, bodyWidth * 1.25));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * bodyLength, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( bodyWidth * 1.10, bodyLength * 0.8, bodyWidth * 1.125));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function lowerNeck() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * neckLength, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(0.1, neckLength, lowerNeckWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function neckFeathers1() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.4, -0.9) );
	instanceMatrix = mult(instanceMatrix, scale4(2.2, 0.7, 2.5) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function neckFeathers2() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 1.1, -0.55) );
	instanceMatrix = mult(instanceMatrix, scale4(2.0, 0.7, 2.0) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function neckFeathers3() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 1.7, -0.1) );
	instanceMatrix = mult(instanceMatrix, scale4(1.5, 0.7, 1.5) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function neckFeathers4() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.4, -0.15) );
	instanceMatrix = mult(instanceMatrix, rotate(-25, 1, 0, 0) );
	instanceMatrix = mult(instanceMatrix, scale4(1.4, 0.7, 1.4) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function neckFeathers5() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.9, -0.0) );
	instanceMatrix = mult(instanceMatrix, rotate(-35, 1, 0, 0) );
	instanceMatrix = mult(instanceMatrix, scale4(1.2, 0.7, 1.2) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 1.60, -0.1) );
	instanceMatrix = mult(instanceMatrix, rotate(-45, 1, 0, 0) );
	instanceMatrix = mult(instanceMatrix, scale4(1.0, 0.7, 1.0) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function upperNeck() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * neckLength, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperNeckWidth, neckLength, upperNeckWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function head() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight + 0.6, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(headWidth * 0.7, headHeight * 0.6, headWidth * 0.7) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function eyes() {

    instanceMatrix = mult(modelViewMatrix, translate(0.5, 0.0, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(0.3, 1.4, 0.3) );
	instanceMatrix = mult(instanceMatrix, rotate(90, 0, 1, 0) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i + 30, 4);
}

function beakTop() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * beakLength + 0.6, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(beakWidth, beakLength, beakWidth * 0.5) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 2; i++) gl.drawArrays(gl.TRIANGLES, 3 * i + 24, 3);
}

function beakBottom() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * beakLength + 0.6, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(beakWidth, beakLength, beakWidth * 0.5) );
	instanceMatrix = mult(instanceMatrix, rotate(180, 0, 1, 0) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 2; i++) gl.drawArrays(gl.TRIANGLES, 3 * i + 24, 3);
}

function leftUpperLeg() {
	// Leg
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	// Feathers
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth * 1.4, upperLegHeight * 0.7, upperLegWidth * 1.4) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	// Feathers
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth * 1.8, upperLegHeight * 0.4, upperLegWidth * 1.8) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	// Knee
	instanceMatrix = mult(modelViewMatrix, translate(0.0, upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, rotate(45, 0, 1, 0) );
    instanceMatrix = mult(instanceMatrix, scale4(0.7, 0.3, 0.5) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerLeg() {
	// Leg
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	// Ankle
	instanceMatrix = mult(modelViewMatrix, translate(0.0, lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, rotate(90, 0, 0, 1) );
    instanceMatrix = mult(instanceMatrix, scale4(0.3, 0.3, 0.3) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftUpperFoot() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperFootHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, upperFootHeight, lowerLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerFoot() {
	// Foot
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerFootLength, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(toeWidth, lowerFootLength, toeWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 2; i++) gl.drawArrays(gl.TRIANGLES, 3 * i + 24, 3);
	
	// Phalange Joint
	instanceMatrix = mult(modelViewMatrix, translate(-0.1, -0.1, 0.0) );
	instanceMatrix = mult(instanceMatrix, rotate(90, 0, 0, 1) );
    instanceMatrix = mult(instanceMatrix, scale4(0.2, 0.2, 0.2) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftToeMiddle() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * toeLength, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(toeWidth, toeLength, toeWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 2; i++) gl.drawArrays(gl.TRIANGLES, 3 * i + 24, 3);
}

function leftToeOuter() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * toeLength, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(toeWidth, toeLength * 0.8, toeWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 2; i++) gl.drawArrays(gl.TRIANGLES, 3 * i + 24, 3);
}

function leftToeInner() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * toeLength, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(toeWidth, toeLength * 0.8, toeWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 2; i++) gl.drawArrays(gl.TRIANGLES, 3 * i + 24, 3);
}

function rightUpperLeg() {
	// Leg
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	// Feathers
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth * 1.4, upperLegHeight * 0.7, upperLegWidth * 1.4) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	// Feathers
	instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth * 1.8, upperLegHeight * 0.4, upperLegWidth * 1.8) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	// Knee
	instanceMatrix = mult(modelViewMatrix, translate(0.0, upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, rotate(45, 0, 1, 0) );
    instanceMatrix = mult(instanceMatrix, scale4(0.7, 0.3, 0.5) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerLeg() {
	// Leg
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
	
	// Ankle
	instanceMatrix = mult(modelViewMatrix, translate(0.0, lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, rotate(90, 0, 0, 1) );
    instanceMatrix = mult(instanceMatrix, scale4(0.3, 0.3, 0.3) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightUpperFoot() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperFootHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, upperFootHeight, lowerLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerFoot() {
	// Foot
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerFootLength, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(toeWidth, lowerFootLength, toeWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 2; i++) gl.drawArrays(gl.TRIANGLES, 3 * i + 24, 3);
	
	// Phalange Joint
	instanceMatrix = mult(modelViewMatrix, translate(-0.1, -0.1, 0.0) );
	instanceMatrix = mult(instanceMatrix, rotate(90, 0, 0, 1) );
    instanceMatrix = mult(instanceMatrix, scale4(0.2, 0.2, 0.2) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightToeMiddle() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * toeLength, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(toeWidth, toeLength, toeWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 2; i++) gl.drawArrays(gl.TRIANGLES, 3 * i + 24, 3);
}

function rightToeOuter() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * toeLength, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(toeWidth, toeLength * 0.8, toeWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 2; i++) gl.drawArrays(gl.TRIANGLES, 3 * i + 24, 3);
}

function rightToeInner() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * toeLength, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(toeWidth, toeLength * 0.8, toeWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i = 0; i < 2; i++) gl.drawArrays(gl.TRIANGLES, 3 * i + 24, 3);
}

var id = 0.0;
function quad(a, b, c, d) {
    pointIdsArray.push(id);
    pointIdsArray.push(id + 1);
    pointIdsArray.push(id + 2);
    pointIdsArray.push(id + 3);
    id = id + 4;
	
    pointsArray.push(vertices[a]);
    pointsArray.push(vertices[b]);
    pointsArray.push(vertices[c]);
    pointsArray.push(vertices[d]);
}

function tri(a, b, c) {
    pointIdsArray.push(id);
    pointIdsArray.push(id + 1);
    pointIdsArray.push(id + 2);
    id = id + 3;
	
    pointsArray.push(vertices[a]);
    pointsArray.push(vertices[b]);
    pointsArray.push(vertices[c]);
}

function objects()
{
    // Cube
	id = 0.0;
	quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
	
	// Beak
	id = 3.0;
	tri( 8, 9, 10 );
	tri( 8, 9, 11 );
	
	// Eye
	id = 24.0;
	quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

// Blend two poses together by a certain ratio pose2:pose1 (0 = pose1, 1 = pose2)
function blendPoses(pose1, pose2, ratio) {
	var outPose = {};
	for (var key in pose1) {
		outPose[key] = pose1[key] * (1 - ratio) + pose2[key] * ratio;
	}
	return outPose;
}

function nextPose() {
	// This function is mainly for testing poses
	// Disable the setInterval function in the window.onload
	// function below to use and make sure the call to this
	// function is enabled
	
	// Cycle to next available keyframes
	kiwi1PoseT0 = (kiwi1PoseT0 + 1) % kiwiPoses.length;
	kiwi2PoseT0 = (kiwi2PoseT0 + 1) % kiwiPoses.length;
	// For testing individual poses
	//if (kiwi1PoseT0 < 2) kiwi1PoseT0 = 8;
	//else if (kiwi1PoseT0 > 1) kiwi1PoseT0 = 1;
	kiwi1NowPosed = kiwiPoses[kiwi1PoseT0];
	kiwi2NowPosed = kiwiPoses[kiwi2PoseT0];
}

function nextFrame() {
    var time0 = 0;
	var time1 = 0;
	var timeWindow = 0;
	var timeDelta = 0;
	var nextPose = 0;
	var blendRatio = 1.0;
	
	// Process Kiwi 1 Pose
	time0 = kiwi1Timeline[kiwi1Timestop0]['atFrame'];
	time1 = kiwi1Timeline[kiwi1Timestop1]['atFrame'];
	timeWindow = time1 - time0;
	timeDelta = nowOnFrame - time0;
	nextPose = kiwi1Timeline[kiwi1Timestop1]['pose'];
	blendRatio = timeDelta / timeWindow * kiwi1Timeline[kiwi1Timestop1]['ratio'];
	kiwi1NowPosed = blendPoses(oldKiwi1Pose, kiwiPoses[nextPose], blendRatio);
	// Update poses when a timeline stop is reached
	if (nowOnFrame == time1) {
		kiwi1Timestop0++;
		kiwi1Timestop1++;
		oldKiwi1Pose = kiwi1NowPosed;
	}
	
	// Process Kiwi 2 Pose
	time0 = kiwi2Timeline[kiwi2Timestop0]['atFrame'];
	time1 = kiwi2Timeline[kiwi2Timestop1]['atFrame'];
	timeWindow = time1 - time0;
	timeDelta = nowOnFrame - time0;
	nextPose = kiwi2Timeline[kiwi2Timestop1]['pose'];
	blendRatio = timeDelta / timeWindow * kiwi2Timeline[kiwi2Timestop1]['ratio'];;
	kiwi2NowPosed = blendPoses(oldKiwi2Pose, kiwiPoses[nextPose], blendRatio);
	// Update poses when a timeline stop is reached
	if (nowOnFrame == time1) {
		kiwi2Timestop0++;
		kiwi2Timestop1++;
		oldKiwi2Pose = kiwi2NowPosed;
	}
	
	nowOnFrame++;
	if (nowOnFrame > endFrame) {
		nowOnFrame = 0;
		kiwi1Timestop0 = 0;
		kiwi1Timestop1 = 1;
		kiwi2Timestop0 = 0;
		kiwi2Timestop1 = 1;
		oldKiwi1Pose = kiwiPoses[kiwi1Timeline[0]['pose']];
		oldKiwi2Pose = kiwiPoses[kiwi2Timeline[0]['pose']];
	}
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");

    gl.useProgram( program);
	gl.enable(gl.DEPTH_TEST);
    gl.cullFace(gl.BACK);
	gl.clear( gl.COLOR_BUFFER_BIT );

    instanceMatrix = mat4();

    //projectionMatrix = ortho(-10.0, 10.0, -10.0, 10.0, -30.0, 30.0);
	projectionMatrix = perspective(50.0, 1.5, 0.1, 1000.0);
	
    modelViewMatrix = mat4();
	
	gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );
    
    objects();

    vBuffer = gl.createBuffer();

    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	vIdBuffer = gl.createBuffer();

    gl.bindBuffer( gl.ARRAY_BUFFER, vIdBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointIdsArray), gl.STATIC_DRAW);

    var vId = gl.getAttribLocation( program, "vId" );
    gl.vertexAttribPointer( vId, 1, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vId );

    // Iterate through available keyframes on click of the canvas
	/*
	document.getElementById("gl-canvas").onclick = function(event) {
        nextPose();
    };
	*/
    
	// Render active frame
	render();
	
	// Start animation at 50 frames per second
	setInterval(nextFrame, 20);
}		

var render = function() {       
	// Render Kiwi 1
	pose = kiwi1NowPosed;
	for(i = 0; i < numNodes; i++) initNodes(i);
    modelViewMatrix = translate(8.0, -1.0, -15.0);
	gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
	modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	traverse(bodyId);
        
	// Render Kiwi 2
	pose = kiwi2NowPosed;
	for(i = 0; i < numNodes; i++) initNodes(i);
    modelViewMatrix = translate(-15.0, -1.0, -30.0);
	modelViewMatrix = mult(modelViewMatrix, scale4(-1, 1, 1));
	modelViewMatrix = mult(modelViewMatrix, rotate(20.0, 0, 1, 0));
	gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
	modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	traverse(bodyId);
        
	// Update screen
	requestAnimFrame(render);
}
