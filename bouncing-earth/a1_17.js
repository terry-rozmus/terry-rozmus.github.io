x`x`/*
My methods for constructing lights and doing shadow calculations

1. The lights were constructed basically in the same manner as described in the book.
2. To generate shadows I exploited the fact that the main scene objects are
   spheres. I tested whether the light from a source should be used to illuminate
   a pixel by working out whether a vector to the light passes through a circle
   drawn around the central point of the sphere with the same radius as the sphere
   and perpendicular to the vector. If the vector is inside the circle, then the
   the light will not be added to the surface and so the area becomes shadow.

Ideas for other things I could try or improve:

1. One thing I thought about doing in addition to the standard set of light is 
   making a long tube light (like an office fluorescent light, but time was 
   pressing. The idea is to model the the light as a line segment, but to consider 
   the rays striking each point on surfaces as originating from whichever point 
   along the light is nearest to the surface point. Alternatively a random point 
   along the light could be considered the origin point of the light ray for each 
   incident surface point, but I'm not sure how well this would work with animation.
2. Instead of calculating whether a point is in shadow by checking if the vector
   from the surface point to the light source passes through either of the spheres
   (Earth and Moon), I could have generalised this calculation by seeing if the 
   same vector passes through any of the triangles that make up the sphere. This may
   technically involve more calculations, but these could be reduced by using a low-
   polygon stand-in model for calculating shadows, or by filter the object vertices
   in some way so that only triangles that the ray passes near to are checked. Only
   doing the calculations if the ray passes through a bounding box or sphere may also
   help to lower any overhead created by this approach.
3. Use functions or classes to calculate and model lights, shadows and positions of 
   objects. Now that I understand things better, using a more structured program
   would allow me to simplify my code.
*/

var gl;
var canvas;
var shaderProgram;

window.onload = function init() {
  // Get A WebGL context
  canvas = document.getElementById( "canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

        // setup GLSL program
        shaderProgram = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram(shaderProgram);

        defineAttributes();
        initBuffers();
        initTextures();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        //gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        render();
}

function defineAttributes() {
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	/* The following lines Eliminate an unknown error in the
	provided code (at least it appears in Windows 10 in all
	browsers I used). The error does not appear to be fatal
	to the operation of the program, but it does fill up
	the console with warning messages. *******************************************************************(LINES COMMENTED OUT IN
	CASE THEY MAY CAUSE A PROBLEM ON SOME PLATFORMS */
	if (shaderProgram.vertexNormalAttribute == -1) {
		shaderProgram.vertexNormalAttribute = 2;
	}
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	
	// Establish shader properties for the Earth and Moon position for calculating shadows
	shaderProgram.earthPositionUniform = gl.getUniformLocation(shaderProgram, "earthPosition");
	shaderProgram.moonPositionUniform = gl.getUniformLocation(shaderProgram, "moonPosition");
	
	// The following line also causes the console to fill with
	// errors in Windows 10
	//shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}

var moonTexture;
var earthTexture;
var tableTexture;

function initTextures() {
	moonTexture = gl.createTexture();
	moonTexture.image = new Image();
	moonTexture.image.onload = function () {
		bindTextures(moonTexture)
	}
	moonTexture.image.src = "moon.gif";

	earthTexture = gl.createTexture();
	earthTexture.image = new Image();
	earthTexture.image.onload = function () {
		bindTextures(earthTexture)
	}
	earthTexture.image.src = "earth.jpg";

	// Load the tablecloth texture for the table
	tableTexture = gl.createTexture();
	tableTexture.image = new Image();
	tableTexture.image.onload = function () {
		bindTextures(tableTexture)
	}
	tableTexture.image.src = "tablecloth.jpg";

}

function bindTextures(texture) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);

	gl.bindTexture(gl.TEXTURE_2D, null);
}

var mvMatrix = mat4.create();
//var mvMatrixStack = [];
var pMatrix = mat4.create();
var nMatrix = mat4.create();

/* These functions appear to do nothing useful in the current implementation of this code
function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}
*/

function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

	/* 
	I had trouble with this calculation causing my lights to move over 
	the objects in crazy patterns for reasons I couldn't figure out, 
	so I opted to abandon this approach and simply rotate the normal vector 
	matrices in the drawScene() function for each rotating object. Since the 
	objects are not being scaled, this method should cause no problems.
	// Rotate normals based on object rotation correcting for situations where an
	// object is scaled in one or two of its three dimensions only.
	var normalMatrix = mat4.create();
	normalMatrix = mvMatrix;
	mat4.toInverseMat3(mvMatrix, normalMatrix);
	mat4.transpose(normalMatrix);
	gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, normalMatrix);
	*/
	gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);
	
	// Send Earth and Moon Coordinates to the Shaders
	gl.uniform3fv(shaderProgram.earthPositionUniform, earthPosition);
	gl.uniform3fv(shaderProgram.moonPositionUniform, moonPosition);
}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

var earthVertexPositionBuffer;
var earthVertexNormalBuffer;
var earthVertexTextureCoordBuffer;
var earthVertexIndexBuffer;

var moonVertexPositionBuffer;
var moonVertexNormalBuffer;
var moonVertexTextureCoordBuffer;
var moonVertexIndexBuffer;

var tableVertexPositionBuffer;
var tableVertexNormalBuffer;
var tableVertexTextureCoordBuffer;
var tableVertexIndexBuffer;

function initBuffers() {
	// Table initialisation
	var size = 1;
	var half = size / 2;
	var z = 0;

	var vertexPositionData = [-8, -8, 0, 8, -8, 0, -8, 8, 0, 8, 8, 0];
	var normalData = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];
	var textureCoordData = [0, 0, 1, 0, 0, 1, 1, 1];

	tableVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tableVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
	tableVertexNormalBuffer.itemSize = 3;
	tableVertexNormalBuffer.numItems = normalData.length / 3;

	tableVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tableVertexTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
	tableVertexTextureCoordBuffer.itemSize = 2;
	tableVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

	tableVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tableVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
	tableVertexPositionBuffer.itemSize = 3;
	tableVertexPositionBuffer.numItems = vertexPositionData.length / 3;

	// Earth initialisation
	var latitude = 30;
	var longitude = 30;
	var radius = 4;

	var vertexPositionData = [];
	var normalData = [];
	var textureCoordData = [];
	for (var latNumber=0; latNumber <= latitude; latNumber++) {
		var theta = latNumber * Math.PI / latitude;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);

		for (var longNumber=0; longNumber <= longitude; longNumber++) {
			var phi = longNumber * 2 * Math.PI / longitude;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);

			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			var u = 1 - (longNumber / longitude);
			var v = 1 - (latNumber / latitude);

			normalData.push(x);
			normalData.push(y);
			normalData.push(z);
			textureCoordData.push(u);
			textureCoordData.push(v);
			vertexPositionData.push(radius * x);
			vertexPositionData.push(radius * y);
			vertexPositionData.push(radius * z);
		}
	}

	var indexData = [];
	for (var latNumber=0; latNumber < latitude; latNumber++) {
		for (var longNumber=0; longNumber < longitude; longNumber++) {
			var first = (latNumber * (longitude + 1)) + longNumber;
			var second = first + longitude + 1;
			indexData.push(first);
			indexData.push(second);
			indexData.push(first + 1);

			indexData.push(second);
			indexData.push(second + 1);
			indexData.push(first + 1);
		}
	}

	earthVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, earthVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
	earthVertexNormalBuffer.itemSize = 3;
	earthVertexNormalBuffer.numItems = normalData.length / 3;

	earthVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, earthVertexTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
	earthVertexTextureCoordBuffer.itemSize = 2;
	earthVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

	earthVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, earthVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
	earthVertexPositionBuffer.itemSize = 3;
	earthVertexPositionBuffer.numItems = vertexPositionData.length / 3;

	earthVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, earthVertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
	earthVertexIndexBuffer.itemSize = 1;
	earthVertexIndexBuffer.numItems = indexData.length;

	// Moon initialisation
	var radius = 1;

	var vertexPositionData = [];
	var normalData = [];
	var textureCoordData = [];
	for (var latNumber=0; latNumber <= latitude; latNumber++) {
		var theta = latNumber * Math.PI / latitude;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);

		for (var longNumber=0; longNumber <= longitude; longNumber++) {
			var phi = longNumber * 2 * Math.PI / longitude;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);

			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			var u = 1 - (longNumber / longitude);
			var v = 1 - (latNumber / latitude);

			normalData.push(x);
			normalData.push(y);
			normalData.push(z);
			textureCoordData.push(u);
			textureCoordData.push(v);
			vertexPositionData.push(radius * x);
			vertexPositionData.push(radius * y);
			vertexPositionData.push(radius * z);
		}
	}

	var indexData = [];
	for (var latNumber=0; latNumber < latitude; latNumber++) {
		for (var longNumber=0; longNumber < longitude; longNumber++) {
			var first = (latNumber * (longitude + 1)) + longNumber;
			var second = first + longitude + 1;
			indexData.push(first);
			indexData.push(second);
			indexData.push(first + 1);

			indexData.push(second);
			indexData.push(second + 1);
			indexData.push(first + 1);
		}
	}

	moonVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
	moonVertexNormalBuffer.itemSize = 3;
	moonVertexNormalBuffer.numItems = normalData.length / 3;

	moonVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
	moonVertexTextureCoordBuffer.itemSize = 2;
	moonVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

	moonVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
	moonVertexPositionBuffer.itemSize = 3;
	moonVertexPositionBuffer.numItems = vertexPositionData.length / 3;

	moonVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
	moonVertexIndexBuffer.itemSize = 1;
	moonVertexIndexBuffer.numItems = indexData.length;

}

var moonAngle = 180;
var earthAngle = 0;
var earthX = -3.0;
var earthY = -0.6;
var earthZ = 4.0;
var moonX = 2.0;
var moonY = 5.0;
var moonZ = 1.0;
var earthPosition = vec3.create(earthX, earthY, earthZ);
var moonPosition = vec3.create(moonX, moonY, moonZ);

function drawScene() {
	gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100.0, pMatrix);
	
	// Calculate the position of the Earth and Moon
	earthPosition = [earthX - 17, earthY, earthZ + zoom];
	moonPosition = [moonX, moonY - 15, moonZ + zoom];
	
	// Draw the table
	mat4.identity(mvMatrix);
	mat4.identity(nMatrix);
	// Translate the modelview matrix to the position of
	// the zoom
	mat4.translate(mvMatrix, [0, 0, zoom]);

	//mvPushMatrix();
	//  Load shaders and initialize attribute buffers
    gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, tableTexture);
	gl.uniform1i(shaderProgram.samplerUniform, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, tableVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, tableVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, tableVertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	//mvPopMatrix();

	// Draw the moon
	//mvPushMatrix();
	mat4.identity(mvMatrix);
	mat4.identity(nMatrix);
	
	// Translate the modelview matrix to the position of
	// the zoom and the current position of the moon in 3d space
	mat4.translate(mvMatrix, moonPosition);

	// Changed the moon so it rotates faster and around the x-axis
	mat4.rotate(mvMatrix, degToRad(moonAngle), [-1, 0, 0]);
	mat4.rotate(nMatrix, degToRad(moonAngle), [-1, 0, 0]);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, moonTexture);
	gl.uniform1i(shaderProgram.samplerUniform, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, moonVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, moonVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	//mvPopMatrix();

	// Draw the earth
	mat4.identity(mvMatrix);
	mat4.identity(nMatrix);
	// Translate the modelview matrix to the position of
	// the zoom and the current position of the earth in 3d space
	mat4.translate(mvMatrix, earthPosition)

	//mvPushMatrix();
	mat4.rotate(mvMatrix, degToRad(earthAngle), [0, 1, 0]);
	mat4.rotate(nMatrix, degToRad(earthAngle), [0, 1, 0]);
	gl.bindBuffer(gl.ARRAY_BUFFER, earthVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, earthVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, earthVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, earthVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, earthVertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, earthVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, earthTexture);
	gl.uniform1i(shaderProgram.samplerUniform, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, earthVertexIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, earthVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	//mvPopMatrix();
}

var lastTime = 0;
var moonDeltaAngle = 0.2;
var moonDelta = Math.PI * 2 * moonDeltaAngle / 360;
var earthDeltaAngle = 0.05;
var earthDelta = Math.PI * 8 * earthDeltaAngle / 360;
/*
The following variable are for the zoom. The motion is not
actually a true zoom. It is actually a 'dolly' or 'trucking'
motion in filmography language, but these terms are less
familiar to most people than the word 'zoom', which is
actually what happens when the focal-length of a lense
changes.
*/
var zoom = -19;        // Current zoom distance
var zoomTarget = -19;  // Where the zoom will end
var zoomRange = 20;    // The range over which the zoom moves
//var elapsedAverage = 0;
//var elapsedMax = 0;

function render() {
	var timeNow = new Date().getTime();
	drawScene();
	if (lastTime != 0) {
		var elapsed = timeNow - lastTime;

		// Calculate x position of the moon
		earthAngle += earthDeltaAngle * elapsed;
		earthX = (earthX + earthDelta * elapsed) % 35;

		/*
		Calculate z for when the earth lands, rolls and
		falls relative to the table. It is 'thrown' from
		below the table on the left and goes above it
		before falling onto it. As it goes over the right
		edge of the table it falls below it.
		*/
		if (earthX > 28.5) {
			earthZ = -Math.pow((earthX - 28.5) / earthDelta * 0.007, 2);
		} else
		if (earthX < 9) {
			earthZ = 16 - Math.pow((earthX - 7.1) / earthDelta  * 0.007, 2);
		} else {
			earthZ = 0;
		}
		earthZ = earthZ + 4.0; // Adjust because I discovered that it was buried in the table when I put in the shadows.
		
		// Calculate y position of the moon
		moonAngle += moonDeltaAngle * elapsed;
		moonY = (moonY + moonDelta * elapsed) % 35;

		/*
		Calculate z for when the moon lands, rolls and
		falls relative to the table. It is 'thrown' from
		below the table at the bottom of the screen and
		goes above the table before falling onto it.
		As it goes over the top edge of the table it falls
		below it.
		*/
		if (moonY > 24) {
			moonZ = -Math.pow((moonY - 24) / moonDelta * 0.007, 2);
		} else
		if (moonY < 9) {
			moonZ = 16 - Math.pow((moonY - 7) / moonDelta  * 0.007, 2);
		} else {
			moonZ = 0; 
		}
		moonZ = moonZ + 1.0; // Adjust because I discovered that it was buried in the table when I put in the shadows. 

		// Eased slow zoom to target zoom distance
		/*
		The motion used here is not actually a true zoom.
		It is actually a 'dolly' or 'trucking' motion in
		filmography language, but these terms are less
		familiar to most people than the word 'zoom', which
		is actually what happens when the focal-length of a
		lense changes.

        I added a Gaussian function to ease the motion so
		it looks a little more natural. That is to say, the
        zoom starts slow, goes a little faster in the middle
        and slows again before finishing.
		*/
		var threshhold = 0.2;	// A non-zero value prevents bouncing at the end of the zoom run
		var peakWidth = 0.45;	// The lower the number, the sharper the change in the acceleration between the ends and the middle of the motion
        var peakHeight = 0.4;	// The higher the number, the faster the zoom completes
		var peakCentre = 0.5;	// 0.5 means it peaks in the centre of the motion

		//elapsedAverage = (elapsedAverage + elapsed) / 2;
		//elapsedMax = Math.max(elapsedMax, elapsed);
		if (zoom != zoomTarget)
		{
			var zoomDifference = zoomTarget - zoom;
			// alert("Average Elapsed = " + elapsedAverage + "; Maximum Elapsed = " + elapsedMax);
			var zoomProgress = Math.min(Math.abs(zoomDifference) / zoomRange + elapsed / 100, 1);
			// Ease the zoom using a circle function
			// var easingFunction = Math.sqrt(1 - Math.pow(zoomProgress - 0.5, 2)) * peakHeight;
			// Ease the zoom using a Gaussian function
			var easingFunction = Math.pow(Math.E, -Math.pow((zoomProgress - peakCentre) / peakWidth, 2)) * peakHeight;
			if (zoomDifference < -threshhold) {
				zoom = zoom - easingFunction;
			} else
			if (zoomDifference > threshhold) {
				zoom = zoom + easingFunction;
			} else {
				// Clamp values below the threshold to avoid bouncing zooms
				zoom = zoomTarget;
			}
		}
	}
	lastTime = timeNow;
	requestAnimFrame(render)
}

function zoom_out() {
	zoomTarget = zoom - zoomRange;
	document.getElementById("zoomOut").style.display = "none";
	document.getElementById("zoomIn").style.display = "inherit";
}

function zoom_in() {
	zoomTarget = zoom + zoomRange;
	document.getElementById("zoomOut").style.display = "inherit";
	document.getElementById("zoomIn").style.display = "none";
}
