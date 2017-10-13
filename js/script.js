var app = angular.module("mainApp", []);
app.controller('AppController', ['$scope', function AppController($scope) {
    $scope.devices = [];
    $scope.countries = [];
    $scope.isAllSelected = [false, false];
    $scope.selectedCountries = [];
    $scope.selectedDevices = [];
    $scope.selectedTesters = [];
    var map = new Map();


    // watch devices for changes
    $scope.$watch('devices|filter:{selected:true}', function (nv) {
        $scope.selectedDevices = nv.map(function (device) {
            return device;
        });
        // console.log("selectedDevices: ", $scope.selectedDevices.length);
    }, true);

    $scope.$watch('devices|filter:{selected:false}', function (nv) {
        if (nv.length != 0) {
            $scope.isAllSelected[1] = false;
        } else {
            $scope.isAllSelected[1] = true;
        }
    }, true);

    // watch countries for changes
    $scope.$watch('countries|filter:{selected:true}', function (nv) {
        $scope.selectedCountries = nv.map(function (country) {
            return country;
        });
        // console.log($scope.selectedCountries);
    }, true);

    $scope.$watch('countries|filter:{selected:false}', function (nv) {
        if (nv.length != 0) {
            $scope.isAllSelected[0] = false;
        } else {
            $scope.isAllSelected[0] = true;
        }
    }, true);


    // initialize
    getTesters();
    getDevices();
    getBugs();

    // get all the testers from testers.csv file and eventually save them as the list into different countries
    function getTesters() {
        Papa.parse("data/testers.csv", {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: function (results) {
                for (var obj of results.data) {
                    getCountries(obj);
                }
                $scope.$apply();
            }
        })
    }

    // get all the different countries from testers.csv and save into countries list
    function getCountries(tester) {
        var exist = false;
        for (var country of $scope.countries) {
            if (country.name === tester.country) {
                exist = true;
                country.testers.push(tester);
                break;
            }
        }
        if (!exist) {
            $scope.countries.push({
                name: tester.country,
                selected: false,
                testers: [tester]
            })
        }
    }

    // get all the devices from devices.csv and save into a devices list
    function getDevices() {
        Papa.parse("data/devices.csv", {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: function (results) {
                for (var obj of results.data) {
                    obj.selected = false;
                    $scope.devices.push(obj);
                }
                // console.log($scope.devices);
                $scope.$apply();
            }
        })
    }

    // count number of bugs for each tester with different device from bugs.csv
    function getBugs() {
        Papa.parse("data/tester_device.csv", {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: function (results) {
                // create a map, key is <testerId, deviceId>, value is number of bugs
                for (var obj of results.data) {
                    var key = obj.testerId + ',' + obj.deviceId;
                    map.set(key, 0)  // initial number of bugs is 0
                }
                // console.log(map.get('1,1'));

                // count number of bugs based on the key in map
                Papa.parse("data/bugs.csv", {
                    download: true,
                    header: true,
                    dynamicTyping: true,
                    complete: function (results) {
                        for ( var obj of results.data) {
                            var key = obj.testerId + ',' + obj.deviceId;
                            var value = map.get(key) + 1;
                            map.set(key, value);    // update the value with a given key
                        }
                        // console.log(map);
                    }
                })
            }
        })
    }

    $scope.toggleAll = function(items, idx) {
        var toggleStatus = $scope.isAllSelected[idx];
        angular.forEach(items, function(itm){ itm.selected = toggleStatus; });

    }

    $scope.search = function() {
        var testers = getSelectedTesters();
        $scope.selectedTesters = addBugs(testers);
        sort(0, $scope.selectedTesters.length - 1);
        // console.log($scope.selectedTesters);
    }
    
    function getSelectedTesters() {
        var results = [];
        for (var country of $scope.selectedCountries) {
            results = results.concat(country.testers);
        }
        // console.log(results);
        return results;
    }

    function addBugs(testers) {
        var results = [];
        testers.forEach(function (tester) {
            var all = 0;
            var flag = false;
            $scope.selectedDevices.forEach(function (device) {
                var key = tester.testerId + ',' + device.deviceId;
                var value = map.get(key);
                if (value !== undefined) {
                    all = all + value;
                    flag = true;
                }
            });
            tester.bugs = all;
            if (flag) {
                results.push(tester);
            }
        });
        return results;
    }

// use quicksort to sort the array by bugs number
    function sort(low, high) {
        if (low < high) {
            var pi = partition(low, high);
            sort(low, pi - 1);
            sort(pi + 1, high);
        }
    }

    function partition(low, high) {
        var pivot = $scope.selectedTesters[high].bugs;
        var i = low - 1;
        for (var j = low; j < high; j++) {
            if ($scope.selectedTesters[j].bugs  > pivot) {
                i++;
                swap(i, j);
            }
        }
        swap(i+1, high);
        return (i+1);
    }

    function swap(a, b) {
        var temp = $scope.selectedTesters[a];
        $scope.selectedTesters[a] = $scope.selectedTesters[b];
        $scope.selectedTesters[b] = temp;
    }

}]);



