module.exports = function (id, floors, msgListener) {
    'use strict';
    var tripCount = 0,
        floorCount = 0,
        currentFloor = 0, //start at ground floor
        lastStop = 0,
        destinations = [],
        occupied = false,
        state = 'ready',
        doorState = 'closed',
        numFloors = floors,
        elevatorStates = {},
        listener = msgListener;

    this.id = id;

    function addDestination(dest) {
        if (destinations.length === 0) {
            destinations.push(dest);
        }

        sortDestinations(currentFloor < destinations[0]);
    }

    function sortDestinations(ascending) {
        destinations.sort(function(a, b) {
            if (!ascending) {
                return a - b;
            } else {
                return b - a;
            }
        });
    }

    function resolveCallRequest(req) {
        var electedElevator;

        var readyOnFloor = [];
        for (el_id in elevatorStates) {
            if (elevatorStates.hasOwnProperty(el_id)) {
                elevator = elevatorStates[el_id];
                if (elevator.currentFloor === req.startFloor &&
                    elevator.state === 'ready' ||
                    elevator.state === 'occupant_entering' ) {
                        readyOnFloor.push(elevator);
                    }
            }
        }

        var movingTowards = [];
        if (readyOnFloor.length === 0) {
            for (el_id in elevatorStates) {
                if (elevatorStates.hasOwnProperty(el_id)) {
                    elevator = elevatorStates[el_id];
                    if (elevator.state === 'moving') {
                        var goingUp = false;
                        if ( elevator.currentFloor < elevator.destinations[0] ) {
                            goingUp = true;
                        }

                        //If the elevator is going up and the requested floor
                        // is within the destination range of the current floor
                        // and the request is going up
                        if ( goingUp &&
                             req.startFloor > elevator.currentFloor &&
                             req.startFloor < elevator.destinations[0] &&
                             req.endFloor > req.startFloor) {

                        }

                        // //Elevator currently going up and the user
                        // if (goingUp && req.endFloor > req.startFloor) {
                        //     if (elevator.current)
                        // }
                    }
                }
            }
        }

        if ( electedElevator && electedElevator.id === this.id ) {
            if (req.startFloor === currentFloor) {
                doorState = 'opened';
                state = 'occupant_entering';
                if (listener) {
                    listener('Elevator ' + this.id + ' door opened');
                }
            } else {
                state = 'moving';
            }

            addDestination(req.endFloor);
        }
    }

    this.reset = function () {
        tripCount = 0;
        floorCount = 0;
        currentFloor = 0;
        destinations = [];
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
                destinations: destinations,
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
            resolveCallRequest(msg);
        }
    };

    this.tick = function () {
        switch (state) {
            case 'occupant_entering':
                occupied = true;
                state = 'moving';
                doorState = 'closed';
                if (listener) {
                    listener('Elevator ' + this.id + ' door closed');
                }
            break;
            case 'occupant_exiting':
                occupied = false;
                state = 'ready';
                doorState = 'closed';
                tripCount += 1;

                if (listener) {
                    listener('Elevator ' + this.id + ' door closed');
                }

                if (tripCount >= 100) {
                    state = 'maintenance';
                }
            break;
            case 'moving':
                var destination = destinations.pop();

                if (destination === currentFloor) {
                    state = 'occupant_exiting';
                    doorState = 'opened';

                    if (listener) {
                        listener('Elevator ' + this.id + ' door opened');
                    }
                } else {
                    destinations.push(destination);

                    if ( destination > currentFloor ) {
                        currentFloor += 1;
                    } else {
                        currentFloor -= 1;
                    }
                    floorCount += 1;

                    if (listener) {
                        listener('Elevator ' + this.id + ' moving from ' + (currentFloor-1) + ' to ' + currentFloor);
                    }

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
