// Inspired by "Motion in 2D" Phet Simulation 
// adds graphing, number input/output features

//variables global for access in all functions
CONTAINER_WIDTH = 500;
CONTAINER_HEIGHT = 500;
//distance particle can travel horizontally in linear and harmonic simulations
var hDist = 400;
var PARTICLE_SIZE = 20;
var particle;
var paper;
var circlePath;
var particlePath;
var linePath;
var prevVelocityVector = null;
var prevAccelerationVector = null;
var vMagnitude;
var aMagnitude;
var aGroup;
var vGroup;
//for graphic display
var VSCALING = 35;
var ASCALING = 1225;
//for numerical display
var DATASCALING = 1024;
//used to keep track of particle's location on paths
var counter;
//stored for centripetal motion
var radius;
var circleAnimation;
var harmonicAnimation;
var linearAnimation;
var dragAnimation;
//used for harmonic motion
var mass = 300.0;
var kConstant = 1;
//used for the dragging (with a lag) option/method
var CX;
var CY;
var MX;
var MY;
var prevCX;
var prevCY;
var prevMX;
var prevMY;
//for drawing graphs of linear and harmonic motion
var axes;
var drawn = false;
var flag = false;
var xMax = 0;
var first = true;
var shift;
var LEGEND_WIDTH = 36;
var LEGEND_HEIGHT = 20;

//clears the moving/changing components of the screen to prepare for the next simulation
function refresh() {
    if (particle) {
        particle.remove();
    }
    if (prevAccelerationVector && prevVelocityVector) {
        prevAccelerationVector.remove();
        prevVelocityVector.remove();
    }
    if (vGroup && aGroup) {
        vGroup.remove();
        aGroup.remove();
    }
    if (linePath) {
        linePath.remove();
    }
    if (circlePath) {
        circlePath.remove();
    }
    clearInterval(circleAnimation);
    clearInterval(harmonicAnimation);
    clearInterval(linearAnimation);
    clearInterval(dragAnimation);
    //necessary for condition in drag methods (can't be just undefined)
    dragAnimation = null;
    $('#numAcceleration').html(" __ units"); 
    $('#numVelocity').html(" __ units"); 
    drawn = false;
    flag = false;
    first = true;
    xMax = 0;
    (canvas.getContext("2d")).clearRect(0, 0, canvas.width, canvas.height);
    
};

//computes length of vectors
//used to make particle move faster with longer velocity vectors and slower with shorter velocity vectors
function length(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

//draws legend arrows
function drawLegend(vLegend, aLegend) {
    var legendVelVector = vLegend.path("M" + 5 + " " + 10 + "L" + (LEGEND_WIDTH - 10) + " " + 10);
    var legendVelArrow = vLegend.path("M" + (LEGEND_WIDTH - 13)+ " " + 10 + "L" + (LEGEND_WIDTH-5)+ " " +   10);
    legendVelArrow.attr({'arrow-end':'classic-wide-long', stroke:"black"});
    vGroup = paper.set();
    vGroup.push(
        legendVelArrow,
        legendVelVector
    );
    vGroup.attr({stroke:"green", 'stroke-width': 3});
    var legendAccVector = aLegend.path("M" + 5 + " " + 10 + "L" + (LEGEND_WIDTH - 10) + " " + 10);
    var legendAccArrow = aLegend.path("M" + (LEGEND_WIDTH - 13)+ " " + 10 + "L" + (LEGEND_WIDTH - 5)+ " " +10);
    legendAccArrow.attr({'arrow-end':'classic-wide-long', stroke:"black"});
    aGroup = paper.set();
    aGroup.push(
        legendAccVector,
        legendAccArrow 
    );
    aGroup.attr({stroke:"black", 'stroke-width': 3});
    legendAccVector.attr({stroke:"blue"});
}

//set-up for situation where particle moves in circle with radius chosen by the user
function centripetalMotion(x, y, rad, color) {
    particle = paper.circle(x, y-rad, PARTICLE_SIZE, PARTICLE_SIZE).attr({
               stroke: "none",
               fill: color
    });
    circlePath = paper.path(Raphael._getPath.circle({ attrs: { cx:x, cy:y, r:rad} }));
    circlePath.attr({opacity: "0"});
    counter = 0;
}

//draw velocity vector tangent to circle for centripetal motion
function setTangentVelocityVector(curPos, counter, nextPos) {
    var posX = curPos.x;
    var posY = curPos.y;
    vMagnitude = Math.sqrt(Math.pow((posX - nextPos.x), 2) + Math.pow((posY - nextPos.y),2));
    //because velocity and acceleration have constant magnitudes and path is constant, just need one reading to display
    if (counter == 1) {
        $('#numVelocity').html(Math.round(vMagnitude*Math.sqrt(DATASCALING))+" units"); 
    }
    prevVelocityVector = paper.path("M" + posX+ " " + (posY) + "L" + (posX+(vMagnitude*VSCALING))+ " " + (posY));
    velocityArrow = paper.path("M" + (posX+(vMagnitude*VSCALING)-5)+ " " + posY + "L" + (posX+(vMagnitude*VSCALING)+40)+ " " +     posY);
    velocityArrow.attr({'arrow-end':'classic-wide-long'});
    vGroup = paper.set();
    vGroup.push(
        velocityArrow,
        prevVelocityVector
    );
    //rotate both vector and arrow
    vGroup.transform("R"+(counter/circlePath.getTotalLength())*360+ "," +Math.round(posX) + ", "+ Math.round(posY));
    vGroup.attr({stroke:"green", 'stroke-width': 3});
    return vGroup;
};

//draw acceleration vector which changes direction as particle moves around the circle for centripetal motion
function updateCentripetalAccelerationVector(curPos, counter, nextPos) {
    var posX = curPos.x;
    var posY = curPos.y;
    aMagnitude = ((Math.pow((posX - nextPos.x), 2) + Math.pow((posY - nextPos.y),2))/radius);
    if (counter == 1) {
        $('#numAcceleration').html(Math.round(aMagnitude*DATASCALING)+" units"); 
    }
    accelerationVector = paper.path("M" + posX+ " " + (posY) + "L" + (posX)+ " " + (posY+(aMagnitude*ASCALING)));
    accelerationArrow = paper.path("M" + posX+ " " + (posY+(aMagnitude*ASCALING)) + "L" + posX+ " " + 
    (posY+(aMagnitude*ASCALING)+10));
    accelerationArrow.attr({stroke:'black', 'stroke-width': 3, 'arrow-end':'classic-wide-long'});
    aGroup = paper.set();
    aGroup.push(
        accelerationArrow,
        accelerationVector
    );
    //rotate both vector and arrow
    aGroup.transform("R"+((counter/circlePath.getTotalLength())*360)+ "," +Math.round(posX) + ", "+  Math.round(posY));
    accelerationVector.attr({stroke:"blue", 'stroke-width': 3});
    return aGroup;
};

//controls movement of particle around the circle for centripetal motion
function animateCentripetal() {
    if (prevVelocityVector && prevAccelerationVector) {
        prevVelocityVector.remove();
        prevAccelerationVector.remove();
    }
    var curPos = circlePath.getPointAtLength(counter);  
    var nextPos = circlePath.getPointAtLength((counter + 1) % circlePath.getTotalLength());   
    particle.attr({cx: curPos.x, cy: curPos.y});  
    prevVelocityVector = setTangentVelocityVector(curPos, counter, nextPos);
    prevAccelerationVector = updateCentripetalAccelerationVector(curPos, counter, nextPos);
    counter = (counter + 1) % circlePath.getTotalLength();
};

//users can drag particle (with lag) to see how velocity and acceleration vectors change 
//record changes in drag coordinates and call interval() if needed
function animateDrag() {
    drawLegend(velocityLegendDrag, accelerationLegendDrag);
    counter = 0;
    particle = paper.circle(50, 50, PARTICLE_SIZE, PARTICLE_SIZE).attr({
               stroke: "none",
               fill: "red"
    });
    
    //cx and cy are center coordinates of particle, mx is mouse's x coordinate, my is mouse's y coordinate
    particle.drag(function(cx, cy, mx, my) {
        CX = particle.attr('cx');
        CY = particle.attr('cy');
        MX = mx;
        MY = my;
        if (dragAnimation){}  
        else{
            dragAnimation = window.setInterval(interval, 60);
} });
};

//adjusts path and particle coordinates based on changes in drag coordinates
function interval() { 
    if ((prevCX != CX) || (prevCY != CY) || (prevMX != MX) || (prevMY != MY)) {
        if(particlePath) {
            particlePath.remove();
        }
        particlePath = paper.path("M" + CX+ " " + CY + "L" +MX+ " " + MY);
        particlePath.attr({opacity: "0"});   
        prevCX = CX;
        prevCY = CY;
        counter = 0;
    }
    var curPos = particlePath.getPointAtLength(counter);  
    if (vGroup && aGroup) {
       vGroup.remove();
       aGroup.remove();
    }
    var endpoint = particlePath.getPointAtLength(particlePath.getTotalLength());
    if ((endpoint.x != curPos.x) || (endpoint.y != curPos.y)) {
       if (counter == 0) {
           curPos = particlePath.getPointAtLength(counter); 
           counter += length(curPos.x, curPos.y, MX, MY)/6.0;
           curPos = particlePath.getPointAtLength(counter); 
           //don't let particle move outside of the container
           if (curPos.x <= CONTAINER_WIDTH - PARTICLE_SIZE &&        // not too far right
               curPos.y <= CONTAINER_HEIGHT - PARTICLE_SIZE &&       // and not too far down
               curPos.x >= PARTICLE_SIZE &&            // and not too far left
               curPos.y >= PARTICLE_SIZE)              // and not too far up
           {
           particle.attr({cx: curPos.x, cy: curPos.y}); }
           prevVelocityVector = paper.path("M" + curPos.x+ " " + curPos.y + "L"+ MX + " " + MY);
       }
       else {
           curPos = particlePath.getPointAtLength(counter); 
           //don't let particle move outside of the container
           if (curPos.x <= CONTAINER_WIDTH - PARTICLE_SIZE &&        // not too far right
               curPos.y <= CONTAINER_HEIGHT - PARTICLE_SIZE &&       // and not too far down
               curPos.x >= PARTICLE_SIZE &&            // and not too far left
               curPos.y >= PARTICLE_SIZE)              // and not too far up
           {
           particle.attr({cx: curPos.x, cy: curPos.y}); }
           prevVelocityVector = paper.path("M" + curPos.x+ " " + curPos.y + "L"+ MX + " " + MY);
           counter += length(curPos.x, curPos.y, MX, MY)/6.0;
       }
       velocityArrow = paper.path("M" + MX+ " " + MY+ "L" + ((MX - curPos.x)/5 + MX) + " " + ((MY - curPos.y)/5 +                      MY));
       if (velocityArrow.getTotalLength() > 8){
       velocityArrow.attr({'arrow-end':'classic-wide-long'});}
       vGroup = paper.set();
       vGroup.push(
       velocityArrow,
       prevVelocityVector
       );
       //throws error if arrow on very short line https://github.com/DmitryBaranovskiy/raphael/issues/648 (raphael bug)
       //after testing, 8 is minimum length
       if (length(MX, MY, curPos.x, curPos.y)< 8){
           vGroup.attr({'opacity': '0'});}
       vGroup.attr({stroke:"green", 'stroke-width': 3});
       //don't show large arrow with tiny acceleration vector 
       if (length(curPos.x, curPos.y, (curPos.x/0.8 - MX/4), (curPos.y/0.8 - MY/4)) < 8) {
           prevAccelerationVector = paper.path("M" + 1+ " " + 1+ "L"+ 100 + " " +  
           100);
           prevAccelerationVector.attr({'opacity': '0'});
           accelerationArrow = paper.path("M" + 98 + " " + 98+ "L" + 100 + " " + 100);
           accelerationArrow.attr({'opacity': '0'}); }
       else {if ((curPos.x + MX-prevMX) == curPos.x){
           prevAccelerationVector = paper.path("M" + curPos.x+ " " + curPos.y + "L"+ (curPos.x/0.8 - MX/4) + " " +  
           (curPos.y/0.8 - MY/4));
           accelerationArrow = paper.path("M" + (curPos.x/0.8 - MX/4) + " " + (curPos.y/0.8 - MY/4)+ "L" + ((curPos.x - MX)/5 +            (curPos.x/0.8 - MX/4)) + " " + ((curPos.y - MY)/5 +(curPos.y/0.8 - MY/4)));
       }
       else{
           prevAccelerationVector = paper.path("M" + curPos.x+ " " + curPos.y + "L"+ (curPos.x + MX-prevMX) + " " +                        (curPos.y + MY-prevMY));
           accelerationArrow = paper.path("M" + (curPos.x + MX-prevMX)+ " " + (curPos.y + MY-prevMY)+ "L" + (((curPos.x + MX-              prevMX) - curPos.x) + (curPos.x + MX-prevMX)) + " " + (((curPos.y + MY-prevMY) - curPos.y) +(curPos.y + MY-                    prevMY)));
       }
       }
        if (accelerationArrow.getTotalLength() > 8){
        accelerationArrow.attr({stroke:'black', 'stroke-width': 3, 'arrow-end':'classic-wide-long'});}
        aGroup = paper.set();
        aGroup.push(
            accelerationArrow,
            prevAccelerationVector
        );
        aGroup.attr({stroke:"blue", 'stroke-width': 3});
        velocityArrow.attr({stroke:"black", 'stroke-width': 3});
        prevMX = MX;
        prevMY = MY;
    }
   else{
     clearInterval(dragAnimation);
     dragAnimation = null;
   }
};

//simple harmonic motion velocity vector
function setHarmonicVelocityVector(curPos, counter, direction, k) {
    var posX = curPos.x;
    var posY = curPos.y;
    vMagnitude = (direction)*(Math.sqrt(((hDist/2) * (hDist/2))-(posX-(CONTAINER_WIDTH/2))*(posX-(CONTAINER_WIDTH/2)))*
    (Math.sqrt(k/mass)))/mass;
    $('#numVelocity').html(Math.round(vMagnitude*DATASCALING)+" units"); 
    velocityVector = paper.path("M" + posX+ " " + posY + "L" + (posX+Math.round(vMagnitude*DATASCALING)) + " " + posY);
    velocityArrow = paper.path("M" + (posX+Math.round(vMagnitude*DATASCALING))+ " " + posY+ "L" +  
    (posX+Math.round(vMagnitude*DATASCALING)+ 10*direction)+ " " + posY);
    velocityArrow.attr({stroke:'black', 'stroke-width': 3, 'arrow-end':'classic-wide-long'});
    vGroup = paper.set();
    vGroup.push(
        velocityArrow,
        velocityVector
    );
    velocityVector.attr({stroke:"green", 'stroke-width': 3});
    return vGroup;
};

//helps to update harmonic motion acceleration vector
function sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }

//simple harmonic motion acceleration vector
function updateHarmonicAccelerationVector(curPos, counter, direction, k) {
    var posX = curPos.x;
    var posY = curPos.y;
    aMagnitude = (((CONTAINER_WIDTH/2)-curPos.x)*(k/mass))/mass;
    $('#numAcceleration').html(Math.round(aMagnitude*DATASCALING)+" units"); 
    accelerationVector = paper.path("M" + posX+ " " + posY + "L" + ((Math.round(aMagnitude*DATASCALING))+posX)+ " " + posY);
    accelerationArrow = paper.path("M" + ((Math.round(aMagnitude*DATASCALING))+posX)+ " " + posY+ "L" +                   
    ((Math.round(aMagnitude*DATASCALING))+posX+ 10*sign((CONTAINER_WIDTH/2)-posX))+ " " + posY);
    accelerationArrow.attr({stroke:'black', 'stroke-width': 3, 'arrow-end':'classic-wide-long'});
    aGroup = paper.set();
    aGroup.push(
        accelerationArrow,
        accelerationVector
    );
    accelerationVector.attr({stroke:"blue", 'stroke-width': 3});
    return aGroup;
};

//demonstrates simple harmonic motion with k chosen by user
function animateHarmonic(k) {
    counter = 0;
    //stored for use in graphs
    kConstant = k;
    //records which way the particle is currently moving
    var direction = -1;
    particle = paper.circle(((CONTAINER_WIDTH/2) + (hDist/2)), (CONTAINER_HEIGHT/2), PARTICLE_SIZE, PARTICLE_SIZE).attr({
               stroke: "none",
               fill: "red"
    });
    linePath = paper.path("M" + ((CONTAINER_WIDTH/2) + (hDist/2))+ " " + (CONTAINER_HEIGHT/2) + "L" + ((CONTAINER_WIDTH/2) - 
    (hDist/2))+ " " + (CONTAINER_HEIGHT/2));
    linePath.attr({"opacity": 0});
    harmonicAnimation = window.setInterval(function() { 
        if (prevAccelerationVector){
            prevAccelerationVector.remove();
            prevVelocityVector.remove();   
        }
        var curPos = linePath.getPointAtLength(counter);  
        particle.attr({cx: curPos.x, cy: curPos.y});  //set the particle's new position  
        //handles case where there is no previously incremented counter
        if (counter == 0) {
           counter++;
        }
        if (counter > hDist - 1) {
           direction = 1;
        }
        if (counter < 1) {
           direction = -1;
        }
        if ((direction == -1) && !(drawn) && !(flag)) {
             drawHarmonic(counter, linePath.getTotalLength()*2);
        }
        else {if ((direction == 1) && !(drawn)) {
             drawHarmonic((linePath.getTotalLength()-counter)+linePath.getTotalLength(), linePath.getTotalLength()*2);
             flag = true;}
        else{ 
            drawn = true;
        }
        }
        prevVelocityVector = setHarmonicVelocityVector(curPos, counter, direction, k);
        prevAccelerationVector = updateHarmonicAccelerationVector(curPos, counter, direction, k);
        counter = counter - (length(curPos.x, curPos.y, vMagnitude+curPos.x, curPos.y)*40)*direction;
    }, 10); 
};

//simple linear motion velocity vector
function setLinearVelocityVector(curPos, counter, direction, a) {
    var posX = curPos.x;
    var posY = curPos.y;
    if (direction == -1){
        if (posX > (CONTAINER_WIDTH/2)) {
            vMagnitude = Math.sqrt(2*a)*(posX - ((CONTAINER_WIDTH/2) + (hDist/2)))/Math.sqrt(hDist/2);
        }
        else {
           vMagnitude = -Math.sqrt(a*(hDist)) + (Math.sqrt(2*a)*(((CONTAINER_WIDTH/2) - posX)/Math.sqrt(hDist/2))); 
        }
    }
    else{
        if (posX < (CONTAINER_WIDTH/2)) {
        vMagnitude = Math.sqrt(2*a)*(posX-((CONTAINER_WIDTH/2) - (hDist/2)))/Math.sqrt(hDist/2);
        }
        else {
        vMagnitude = Math.sqrt(a*(hDist)) - (Math.sqrt(2*a)*(posX-(CONTAINER_WIDTH/2))/Math.sqrt(hDist/2));
        }
    }
    $('#numVelocity').html(Math.round(vMagnitude)+" units"); 
    velocityVector = paper.path("M" + posX+ " " + posY + "L" + ((Math.round(vMagnitude))+posX)+ " " + posY);
    velocityArrow = paper.path("M" + (Math.round(vMagnitude)+posX)+ " " + posY+ "L" + ((Math.round(vMagnitude))+posX+          
    10*direction)+ " " + posY);
    velocityArrow.attr({stroke:'green', 'stroke-width': 3, 'arrow-end':'classic-wide-long'});
    vGroup = paper.set();
    vGroup.push(
        velocityArrow,
        velocityVector
    );
    velocityVector.attr({stroke:"green", 'stroke-width': 3});
    return vGroup;
};

//simple linear motion acceleration vector
function updateLinearAccelerationVector(curPos, counter, direction, a) {
    var posX = curPos.x;
    var posY = curPos.y;
    var v_center = Math.sqrt(a*(hDist/2));
    if (direction == -1){
        if (posX > (CONTAINER_WIDTH/2)) {
            aMagnitude = -a;
        }
        else{
            aMagnitude = a; 
        }
    }
    else{
        if (posX < (CONTAINER_WIDTH/2)) {
        aMagnitude = a;
        }
        else{
        aMagnitude = -a;
        }
    }
    $('#numAcceleration').html(Math.round(aMagnitude)+" units"); 
    accelerationVector = paper.path("M" + posX+ " " + posY + "L" + ((Math.round(aMagnitude))+posX)+ " " + posY);
    accelerationArrow = paper.path("M" + (Math.round(aMagnitude)+posX)+ " " + posY+ "L" + ((Math.round(aMagnitude))+posX+ 
    10*sign((CONTAINER_WIDTH/2)-posX))+ " " + posY);
    accelerationArrow.attr({stroke:'black', 'stroke-width': 3, 'arrow-end':'classic-wide-long'});
    aGroup = paper.set();
    aGroup.push(
        accelerationArrow,
        accelerationVector
    );
    accelerationVector.attr({stroke:"blue", 'stroke-width': 3});
    return aGroup;
};

//demonstrates simple linear motion with acceleration chosen by the user
function animateLinear(a) {
    counter = 0;
    var direction = -1;
    particle = paper.circle(((CONTAINER_WIDTH/2) + (hDist/2)), (CONTAINER_HEIGHT/2), PARTICLE_SIZE, PARTICLE_SIZE).attr({
               stroke: "none",
               fill: "red"
    });
    linePath = paper.path("M" + ((CONTAINER_WIDTH/2) + (hDist/2))+ " " + (CONTAINER_HEIGHT/2) + "L" + ((CONTAINER_WIDTH/2) -       (hDist/2))+ " " + (CONTAINER_HEIGHT/2));
    linePath.attr({"opacity": 0});
    linearAnimation = window.setInterval(function() { 
        if (prevAccelerationVector){
            prevAccelerationVector.remove();
            prevVelocityVector.remove();   
        }
        //handles case when there is not a previously incremented counter
        if (counter == 0){
            counter++;
        }
        var curPos = linePath.getPointAtLength(counter); 
        particle.attr({cx: curPos.x, cy: curPos.y});  //set the particle's new position  
        if (counter >= (hDist-1)){
            direction = 1;
        }
        if (counter <= 1){
            direction = -1;
        }
        if ((direction == -1) && !(drawn) && !(flag)) {
         drawLinear(counter, hDist);
        }
        else {
            if ((direction == 1) && !(drawn)) {
                 drawLinear(((hDist-counter)/2+hDist/2), hDist);
                 flag = true;
             }
             else{ 
                 drawn = true;
             }
        }
        prevVelocityVector = setLinearVelocityVector(curPos, counter, direction, a);
        prevAccelerationVector = updateLinearAccelerationVector(curPos, counter, direction, a);
        //increment counter based on length of velocity vector to see particle move slower and faster appropriately
        counter = counter - (length(curPos.x, curPos.y, vMagnitude+curPos.x, curPos.y)/8.0)*direction;
    }, 10); 
};

//GRAPHING FUNCTIONS (graph one period of periodic motions)
//for harmonic motion simulation
function harmonicPosition(x) {
    return -(hDist/2) * Math.sin(Math.sqrt(kConstant/mass)*(x))/(10*Math.sqrt(kConstant));
}
function harmonicVelocity(x) {
    return ((2*Math.sqrt(kConstant/mass)*(hDist/2)*Math.cos(Math.sqrt(kConstant/mass)*(20*x +                                       (Math.PI/2)/(Math.sqrt(kConstant/mass)))))/(10*Math.sqrt(kConstant)));
}
function harmonicAcceleration(x) {
    return ((kConstant*2/mass)*harmonicPosition(20*x + (Math.PI/2)/(Math.sqrt(kConstant/mass))));
}

//for linear motion simulation
function linearVelocity(x) {
    if (!(flag)){
        if (counter < hDist/2) {
            xMax = x;
            return -Math.abs(aMagnitude)*x;
        }
        else{
           if (-xMax*Math.abs(aMagnitude) + Math.abs(aMagnitude)*(x-xMax) <= 0){
           return  -xMax*Math.abs(aMagnitude) + Math.abs(aMagnitude)*(x-xMax); }
        }
    }
    else{
        if (counter > hDist/2) {
            xMax = x;
            if (first) {
                shift = Math.abs(aMagnitude)*x;
                first = false;
            }
            return (Math.abs(aMagnitude)*x)-shift;
    }
    else{
       if (xMax*Math.abs(aMagnitude) - Math.abs(aMagnitude)*(x-xMax)-shift >= 0){
           return  xMax*Math.abs(aMagnitude) - Math.abs(aMagnitude)*(x-xMax)-shift; 
       }
    }
    }  
}
function linearAcceleration(x) {
    if (counter < hDist/2)
    return -Math.abs(aMagnitude);
    else{
    return Math.abs(aMagnitude);
    }
}

//draw axes and preparation for graphing
//only do once per graph
//modified from http://www.javascripter.net/faq/plotafunctiongraph.htm
function setup() {
    var canvas = document.getElementById("canvas");
    if (null==canvas || !canvas.getContext) return;
    axes={}, ctx=canvas.getContext("2d");
    axes.x0 = .5 + .5*canvas.width;  // x0 pixels from left to x=0
    axes.y0 = .5 + .5*canvas.height; // y0 pixels from top to y=0
    axes.scale = 40;                 // 40 pixels from x=0 to x=1
    axes.doNegativeX = true;
    showAxes(ctx,axes);
}

function drawHarmonic(ctr, totalLength) {
    ctx=canvas.getContext("2d");
    functionGraphHarmonic(ctx,axes,harmonicAcceleration,"blue",2, ctr/totalLength); 
    functionGraphHarmonic(ctx,axes,harmonicVelocity,"green",2, ctr/totalLength);
}

function drawLinear(ctr, totalLength) {
    ctx=canvas.getContext("2d");
    functionGraphLinear(ctx,axes,linearAcceleration,"blue",2, ctr/totalLength); 
    functionGraphLinear(ctx,axes,linearVelocity,"green",2, ctr/totalLength);
}

function functionGraphHarmonic (ctx,axes,func,color,thick, scaling) {
    var xx, yy, dx=2, x0=axes.x0, y0=axes.y0, scale=axes.scale;
    //time full period of harmonic motion takes
    var iMax = 2*Math.PI*scaling/(Math.sqrt(kConstant/mass));
    var iMin = 0;
    ctx.beginPath();
    ctx.lineWidth = thick;
    ctx.strokeStyle = color;
    for (var i=iMin;i<=iMax;i++) {
        xx = dx*i; yy = scale*func(xx/scale);
        if (i==iMin) ctx.moveTo(x0+xx,y0-yy);
        else         ctx.lineTo(x0+xx,y0-yy);
        }
        ctx.stroke();
    }

function functionGraphLinear (ctx,axes,func,color,thick, scaling) {
    var xx, yy, dx=2, x0=axes.x0, y0=axes.y0, scale=axes.scale;
    if (!(flag)) {
         //time half of period of this linear motion takes 
         var iMax = 2*scaling*Math.sqrt(hDist)/Math.sqrt(Math.abs(aMagnitude));
         if (counter < hDist/2) {
             var iMin = 0;
         }
         else {
             var iMin = Math.sqrt(hDist)/Math.sqrt(Math.abs(aMagnitude));
         }
         }
        else {
         //time full period of this linear motion takes
         var iMax = 4*scaling*Math.sqrt(hDist)/Math.sqrt(Math.abs(aMagnitude));
         if (counter > hDist/2) {
             var iMin = 2*Math.sqrt(hDist)/Math.sqrt(Math.abs(aMagnitude));
         }
         else {
             var iMin = 3*Math.sqrt(hDist)/Math.sqrt(Math.abs(aMagnitude));
         }
    }
    ctx.beginPath();
    ctx.lineWidth = thick;
    ctx.strokeStyle = color;
    //code from http://www.javascripter.net/faq/plotafunctiongraph.htm
    for (var i=iMin;i<=iMax;i++) {
        xx = dx*i; yy = scale*func(xx/scale);
        if (i==iMin) ctx.moveTo(x0+xx,y0-yy);
        else         ctx.lineTo(x0+xx,y0-yy);
    }
    ctx.stroke();
}

function showAxes(ctx,axes) {
    var x0=axes.x0, w=ctx.canvas.width;
    var y0=axes.y0, h=ctx.canvas.height;
    var xmin = axes.x0;
    ctx.beginPath();
    ctx.strokeStyle = "rgb(0,0,0)"; 
    ctx.moveTo(xmin,y0); ctx.lineTo(w,y0);  // X axis
    ctx.moveTo(x0,0);    ctx.lineTo(x0,h);  // Y axis
    ctx.stroke();
    ctx.font = "15px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Time",ctx.canvas.width-35,ctx.canvas.height/2 + 20);
}


//main function; handles user interactions
$(document).ready(function() {  
    //if user picks auto, another drop down menu is displayed.
    var firstOptions= $('.optionControl');
    firstOptions.on('click', function(event) {
        refresh();
        var target = $(event.target);
        var name = target.attr('id');
        if (name == 'auto') {
          $('#legendV').empty();
          $('#legendA').empty();
          $('.maybeAppear').css("opacity", "1");
          drawLegend(velocityLegend, accelerationLegend);
        }
        else {
          $('#legendV').empty();
          $('#legendA').empty();
          $('#legendV').append("<p> <font color = green> Velocity </font> <b id = velocityLegendDrag> </b> </p>");
          //add velocity legend arrow for drag
          velocityLegendDrag = Raphael("velocityLegendDrag", LEGEND_WIDTH, LEGEND_HEIGHT);
          $('#legendA').append("<p> <font color = blue> Acceleration </font> <b id = accelerationLegendDrag> </b> </p>");
          //add acceleration legend arrow for drag
          accelerationLegendDrag = Raphael("accelerationLegendDrag", LEGEND_WIDTH, LEGEND_HEIGHT);
          $('.maybeAppear').css("opacity", "0");
          animateDrag(); 
          drawLegend(velocityLegendDrag, accelerationLegendDrag);
        }          
    });
    
    //only available if user picks auto
    //choice of what type of auto motion
    var autoOptions= $('.optionType');
    autoOptions.on('click', function(event) {
        $("#extraOptions").empty();
        refresh();
        var target = $(event.target);
        var name = target.attr('id');
        if (name == 'circular') {
            clearInterval(circleAnimation);
            if (particle && circlePath) {
                particle.remove();
                circlePath.remove();}
            var input = $('<input></input>');
            var button = $('<button class=enter>Start</button>');
            $('#extraOptions').append("<div class= autoInput style= padding-top:5px>")
                              .append("Radius (between 20 and 200):")
                              .append("<div>")
                              .append(input)
                              .append(button)
                              .append("</div></div>");
           drawLegend(velocityLegend, accelerationLegend);
          //get user input for radius of the circle that the particle travels in (CLICK ENTER BUTTON)
          var enterButton = $('.enter');
                enterButton.on('click', function(event) {
                refresh();
                radius = input.val();
                centripetalMotion((CONTAINER_WIDTH/2), (CONTAINER_HEIGHT/2), radius, "red");
                //make the circle move continuously by calling function every 20ms 
                circleAnimation = window.setInterval("animateCentripetal()", 20); 
                drawLegend(velocityLegend, accelerationLegend);
            });
            
           //get user input for radius of the circle that the particle travels in (PRESS ENTER KEY)
          input.on('keyup', function(evt) {
            if (evt.keyCode == 13) {
                refresh();
                radius = input.val();
                centripetalMotion((CONTAINER_WIDTH/2), (CONTAINER_HEIGHT/2), radius, "red");
                //make the circle move continuously by calling function every 20ms 
                circleAnimation = window.setInterval("animateCentripetal()", 20); 
                drawLegend(velocityLegend, accelerationLegend);
            }
          });
        }
        else if (name == "harmonic") {
            refresh();
            var button = $('<button class=enter>Start</button>');
            var input = $('<input></input>');
            $('#extraOptions').append("<div class= autoInput style= padding-top:5px>")
                              .append("k (between 0.75 and 30): ")
                              .append("<div>")
                              .append(input)
                              .append(button)
                              .append("</div></div>");
            drawLegend(velocityLegend, accelerationLegend);
            $('#graph').css("right", "-80px");

           //get user input for k (PRESS ENTER KEY)
           input.on('keyup', function(evt) {
             if (evt.keyCode == 13) {
                 refresh();
                 k = input.val();
                 //demonstrate simple harmonic motion
                 setup();
                 animateHarmonic(k);
                 drawLegend(velocityLegend, accelerationLegend);
             }
           });
            
            //get user input for k (CLICK ENTER BUTTON)
            var enterButton = $('.enter');
                enterButton.on('click', function(event) {
                refresh();
                k = input.val();
                //demonstrate simple harmonic motion
                setup();
                animateHarmonic(k);
                drawLegend(velocityLegend, accelerationLegend);
            });
        }
        else {   
            refresh();
            var input = $('<input></input>');
            var button = $('<button class=enter>Start</button>');
            $('#extraOptions').append("<div class= autoInput style= padding-top:5px>")
                              .append("Acceleration (between 0.5 and 3.5): ")
                              .append("<div>")
                              .append(input)
                              .append(button)
                              .append("</div></div>");
            drawLegend(velocityLegend, accelerationLegend);
            $('#graph').css("right", "-45px");

            //get user input for acceleration magnitude (PRESS ENTER KEY)
           input.on('keyup', function(evt) {
             if (evt.keyCode == 13) {
                refresh();
                a = input.val();
                 setup();
                //demonstrate simple linear motion
                animateLinear(a);
                drawLegend(velocityLegend, accelerationLegend);
             }
           });
            
            //get user input for acceleration magnitude (CLICK ENTER BUTTON)
            var enterButton = $('.enter');
                enterButton.on('click', function(event) {
                refresh();
                a = input.val();
                setup();
                //demonstrate simple linear motion
                animateLinear(a);
                drawLegend(velocityLegend, accelerationLegend);
            });
        }
               
    });
    
    //add Raphael paper (their word for canvas) to main div
    paper = Raphael("container", CONTAINER_WIDTH, CONTAINER_HEIGHT),
            circleStyle = {
            fill: "red",
            stroke: "none"
        };
    //add velocity legend arrow for auto
    velocityLegend = Raphael("velocityLegend", LEGEND_WIDTH, LEGEND_HEIGHT);
    //add acceleration legend arrow for autro
    accelerationLegend = Raphael("accelerationLegend", LEGEND_WIDTH, LEGEND_HEIGHT);
    
});
