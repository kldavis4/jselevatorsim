module.exports = function (id, floors) {
    'use strict';
    var tripCount = 0,
        floorCount = 0,
        currentFloor = 0, //start at ground floor
        lastStop = 0,
        destination = -1,
        state = 'ready',
        doorState = 'closed',
        numFloors = floors,
        elevatorStates = {};

    this.id = id;

    this.reset = function () {
        tripCount = 0;
        floorCount = 0;
        currentFloor = 0;
        destination = -1;
        state = 'ready';
        doorState = 'closed';
    }

    this.broadcastState = function(elevators) {
        var i = 0;

        for (i = 0; i < elevators.length; i++) {
            if ( elevators[i].id == this.id ) {
                continue;
            }

            //Send current state to elevator
            elevators[i].receiveMessage({
                type: 'ELEVATOR_STATE',
                state: state,
                doorState: doorState,
                currentFloor: currentFloor,
                destination: destination,
                lastStop: lastStop,
                id: id
            })
        }
    }

    this.receiveMessage = function (msg) {
        if (msg.type === 'ELEVATOR_STATE') {
            elevatorStates[msg.id] = msg;
        }
    };

    this.tick = function () {

    };
};
