var ElevatorSim = require('./lib/elevatorsim');

//Instantiate new sim
var sim = new ElevatorSim(4, 10);

//Process a simulation made up of a series of call requests
// The call requests object consists of a time field and an
// associated set of requests. Each request is defined by
// a startFloor and an endFloor
sim.processCallRequests({
    0: [{
        startFloor: 0,
        endFloor: 4
    }],
    3: [{
        startFloor: 2,
        endFloor: 0
    }],
    6: [{
        startFloor: 10,
        endFloor: 0
    }]
});
