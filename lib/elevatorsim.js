var Elevator = require('../lib/elevator');

module.exports = function (numElevators, numFloors) {
    'use strict';
    var elevators = [],
        i;

    //Initialize elevator objects
    for (i = 0; i < numElevators; i += 1) {
        elevators.push(new Elevator(i, numFloors, function (msg) {
            console.log(msg);
        }));
    }

    //Process a set of call requests
    this.processCallRequests = function (calls) {
        var time = 0,
            call;

        //Reset all elevators
        for (i = 0; i < numElevators; i += 1) {
            elevators[i].reset();
        }

        while (true) {
            //Get call for current time
            call = calls[time];

            //Each elevator broadcast its state to all the other elevators
            for (i = 0; i < numElevators; i += 1) {
                elevators[i].broadcastState(elevators);
            }

            //Send call request
            for (i = 0; i < numElevators; i += 1) {
                elevators[i].receiveMessage({
                    type: 'CALL',
                    startFloor: call.startFloor,
                    endFloor: call.endFloor
                });

                elevators[i].tick();
            }

            time += 1;
        }
    };
};
