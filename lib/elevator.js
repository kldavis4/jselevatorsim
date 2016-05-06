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

    //Adds a destination to the current destinations stack
    //Top of stack is nearest destination floor
    function addDestination(dest) {
        if (destinations.length === 0) {
            destinations.push(dest);
        }

        sortDestinations(currentFloor < destinations[0]);
    }

    //Sorts destinations so depending on the current direction of the
    //elevator, the nearest floor is on top of the stack
    function sortDestinations(ascending) {
        destinations.sort(function(a, b) {
            if (!ascending) {
                return a - b;
            } else {
                return b - a;
            }
        });
    }

    //Resolves a call request
    function resolveCallRequest(req) {
        var electedElevator,
            readyOnFloor = [],
            movingTowards = [],
            nearest = [],
            el_id,
            elevator;

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
                            //Calculate the distance from current location
                            //to the requested start floor
                            movingTowards.push({
                                dist: (req.startFloor - elevator.currentFloor),
                                elevator: elevator
                            });
                        } else if ( !goingUp &&
                            req.startFloor < elevator.currentFloor &&
                            req.startFloor > elevator.destinations[0] &&
                            req.endFloor < req.startFloor) {
                            movingTowards.push({
                                dist: (elevator.currentFloor - req.startFloor),
                                elevator: elevator
                            })
                        }
                    }
                }
            }
        }

        var nearest = [];
        if (movingTowards.length === 0 && readyOnFloor.length === 0) {
            for (el_id in elevatorStates) {
                if (elevatorStates.hasOwnProperty(el_id)) {
                    elevator = elevatorStates[el_id];

                    if (elevator.state === 'ready') {
                        nearest.push({
                            dist: Math.abs(elevator.currentFloor-req.startFloor),
                            elevator: elevator
                        });
                    }
                }
            }
        }

        if (readyOnFloor.length > 0) {
            electedElevator = readyOnFloor[0];
        } else if (movingTowards.length > 0) {
            //sort ascending by distinace
            movingTowards.sort(function(a,b) {
                return a.dist - b.dist;
            });
            electedElevator = movingTowards[0].elevator;
        } else if (nearest.length > 0) {
            nearest.sort(function(a,b) {
                return a.dist - b.dist;
            });
            electedElevator = nearest[0].elevator;
        }

        //No elevator available so return false
        if (!electedElevator) {
            return false;
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

        return true;
    }

    //Resets this elevator to base state
    this.reset = function () {
        tripCount = 0;
        floorCount = 0;
        currentFloor = 0;
        destinations = [];
        state = 'ready';
        doorState = 'closed';
        occupied = false;
    };

    //Performs service on this elevator
    this.service = function () {
        this.reset();
    };

    //Broadcasts the state of this elevator to the specified elevators
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

    //Receives a message
    this.receiveMessage = function (msg) {
        if (msg.type === 'ELEVATOR_STATE') {
            elevatorStates[msg.id] = msg;
            return true;
        } else if (msg.type === 'CALL') {
            return resolveCallRequest(msg);
        }
    };

    //Updates the state of this elevator
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
