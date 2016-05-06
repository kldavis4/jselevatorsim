var Elevator = require('../lib/elevator');

module.exports = function (numElevators, numFloors) {
    'use strict';
    var elevators = [],
        i;

    //Initialize elevator objects
    for (i = 0; i < numElevators; i += 1) {
        elevators.push(new Elevator(i, numFloors));
    }

    //Process a set of call requests
    this.processCallRequests = function (calls) {
        var time = 0;

        //Reset all elevators
        for (i = 0; i < numElevators; i += 1) {
            elevators[i].reset();
        }

        while (true) {
            //Each elevator broadcast its state to all the other elevators
            for (i = 0; i < numElevators; i += 1) {
                elevators[i].broadcastState(elevators);
            }

            time += 1;
        }
    }
}
