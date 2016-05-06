module.exports = function (id, floors) {
    'use strict';
    var tripCount = 0,
        floorCount = 0,
        currentFloor = 0, //start at ground floor
        lastStop = 0,
        destination = -1,
        occupied = false,
        state = 'ready',
        doorState = 'closed',
        numFloors = floors,
        elevatorStates = {};

    this.id = id;

    function resolveCallRequest(req) {
        var electedElevator = undefined;

        for (elevator in elevatorStates) {
            //TODO Handle elevator elecation
        }

        if ( electedElevator && electedElevator.id === this.id ) {
            if (req.startFloor === currentFloor) {
                doorState = 'opened'; //TODO broadcast door open
                state = 'occupant_entering';
            } else {
                state = 'moving';
            }

            destination = req.endFloor;
        }
    }

    this.reset = function () {
        tripCount = 0;
        floorCount = 0;
        currentFloor = 0;
        destination = -1;
        state = 'ready';
        doorState = 'closed';
        occupied = false;
    };

    this.service = function () {
        this.reset();
    };

    this.broadcastState = function(elevators) {
        var i;

        for (i = 0; i < elevators.length; i++) {
            //Send current state to elevator
            elevators[i].receiveMessage({
                type: 'ELEVATOR_STATE',
                state: state,
                doorState: doorState,
                currentFloor: currentFloor,
                destination: destination,
                lastStop: lastStop,
                id: id,
                occupied: occupied
            })
        }
    }

    this.receiveMessage = function (msg) {
        if (msg.type === 'ELEVATOR_STATE') {
            elevatorStates[msg.id] = msg;
        } else if (msg.type === 'CALL') {
            resolveCallRequest();
        }
    };

    this.tick = function () {
        switch (state) {
            case 'occupant_entering':
                occupied = true;
                state = 'moving';
                doorState = 'closed'; //TODO broadcast door state closed
            break;
            case 'occupant_exiting':
                occupied = false;
                state = 'ready';
                doorState = 'closed'; //TODO broadcast door state change
                destination = -1;
                tripCount += 1;

                if (tripCount >= 100) {
                    state = 'maintenance';
                }
            break;
            case 'moving':
                if (destination === currentFloor) {
                    state = 'occupant_exiting';
                    doorState = 'opened'; //TODO broadcast door opening
                } else {
                    if ( destination > currentFloor ) {
                        currentFloor += 1;
                    } else {
                        currentFloor -= 1;
                    }
                    floorCount += 1;
                    //TODO broadcast floor change

                    //Validate floor state
                    if (currentFloor < 0 || currentFloor >= numFloors) {
                        throw new Exception('Invalid floor state ' + currentFloor);
                    }
                }
            break;
            default:
                //do nothing
        }
    };
};
