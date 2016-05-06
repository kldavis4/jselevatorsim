var ElevatorSim = require('./lib/elevatorsim');

var sim = new ElevatorSim(4, 10);

sim.processCallRequests({
    0: {
        startFloor: 0,
        endFloor: 4
    },
    3: {
        startFloor: 2,
        endFloor: 0
    },
    6: {
        startFloor: 10,
        endFloor: 0
    }
});
