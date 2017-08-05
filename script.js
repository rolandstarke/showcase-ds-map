/* global L */

var mapElement = document.getElementById('map');
var map = L.map(mapElement, {
    crs: L.CRS.Simple,
    maxZoom: 7,
    center: [-500, 500],
    zoom: 0,
    maxBounds: [[0, 0], [-1000, 1000]]
});
map.zoomControl.setPosition('bottomright');


$.when(
    $.ajax({ url: 'village.txt', dataType: 'text' }),
    $.ajax({ url: 'player.txt', dataType: 'text' }),
    $.ajax({ url: 'ally.txt', dataType: 'text' })
).then(function (villageData, playerData, tribeData) {
    var villages = {};
    var lines = villageData[0].trim().split('\n');
    for (var i = 0; i < lines.length; i++) {
        var colums = lines[i].split(',');
        //$id, $name, $x, $y, $player, $points, $bonus_id
        villages[colums[0]] = {
            id: +colums[0],
            name: decodeURIComponent(colums[1].replace(/\+/g, ' ')),
            x: +colums[2],
            y: +colums[3],
            player: +colums[4],
            points: +colums[5]
        };
    }
    villageData = null; lines = null;

    var players = {};
    var lines = playerData[0].trim().split('\n');
    for (var i = 0; i < lines.length; i++) {
        var colums = lines[i].split(',');
        //$id, $name, $ally, $villages, $points, $rank
        players[colums[0]] = {
            id: +colums[0],
            name: decodeURIComponent(colums[1].replace(/\+/g, ' ')),
            tribe: +colums[2],
            villages: +colums[3],
            points: +colums[4],
            rank: +colums[5]
        };
    }
    playerData = null; lines = null;

    var tribes = {};
    var lines = tribeData[0].trim().split('\n');
    for (var i = 0; i < lines.length; i++) {
        var colums = lines[i].split(',');
        //$id, $name, $tag, $members, $villages, $points, $all_points, $rank
        tribes[colums[0]] = {
            id: +colums[0],
            name: decodeURIComponent(colums[1].replace(/\+/g, ' ')),
            tag: decodeURIComponent(colums[2].replace(/\+/g, ' ')),
            members: +colums[3],
            villages: +colums[4],
            points: +colums[5],
            allPoints: +colums[6],
            rank: +colums[7]
        };
    }
    tribeData = null; lines = null;

    var VillagesLayer = L.GridLayer.extend({
        createTile: function (coords, done) {
            var tile = L.DomUtil.create('canvas', 'leaflet-tile');
            var size = this.getTileSize();
            tile.width = size.x;
            tile.height = size.y;

            setTimeout(function () {
                var ctx = tile.getContext('2d');
                ctx.fillStyle = '#58761B';
                ctx.fillRect(0, 0, size.x, size.y);


                var squareSize = Math.pow(2, coords.z);
                var startX = size.x * coords.x / squareSize;
                var endX = startX + size.x / squareSize;
                var startY = size.y * coords.y / squareSize;
                var endY = startY + size.y / squareSize;


                for (var i in villages) {
                    var village = villages[i];
                    if (
                        village.x >= startX - squareSize && village.x < endX &&
                        village.y >= startY - squareSize && village.y < endY
                    ) {
                        ctx.fillStyle = '#823C0A';
                        if (village.player === 0) {
                            ctx.fillStyle = '#9f9f9f';
                        }
                        ctx.fillRect((village.x - startX) * squareSize, (village.y - startY) * squareSize, squareSize, squareSize);
                    }
                }
                done(null, tile);
            }, 1);


            return tile;
        }
    });
    var villagesLayer = new VillagesLayer();



    map.addLayer(villagesLayer);



    function updatePosition($element, e) {
        if ($(window).width() > $element.width() + (e.clientX + 20)) {
            var left = (e.clientX + 20);
        } else {
            var left = (e.clientX - 20) - $element.width();
        }
        if ($(window).height() > $element.height() + (e.clientY + 20)) {
            var top = (e.clientY + 20);
        } else {
            var top = (e.clientY - 20) - $element.height();
        }
        $element
            .css('left', left + 'px')
            .css('top', top + 'px');
    }
    var lastX;
    var lastY;
    map.on('mousemove', function (e) {
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            return; //dont show hover popup on touch screens
        }
        var y = Math.floor(e.latlng.lat * -1);
        var x = Math.floor(e.latlng.lng);
        if (lastX === x && lastY === y) {
            updatePosition($('#map_hover_popup'), e.originalEvent);
            return;  //if the x,y is same as the last mouse move don't search the village again
        }
        lastX = x; lastY = y;

        var village;
        if (map.getZoom() >= 3) { //only try to get the hovered image if the user zomed in
            for (var i in villages) {
                if (villages[i].x === x && villages[i].y === y) {
                    village = villages[i];
                    break;
                }
            }
        }

        if (village) {
            $('#map_hover_popup').find('.village_name').text(village.name);
            $('#map_hover_popup').find('.village_points').text(village.points);
            if (players[village.player] && players[village.player].tribe && tribes[players[village.player].tribe]) {
                $('#map_hover_popup').find('.village_tribe').text(tribes[players[village.player].tribe].name).closest('tr').css('display', '');
            } else {
                $('#map_hover_popup').find('.village_tribe').closest('tr').css('display', 'none');
            }
            if (players[village.player] && players[village.player]) {
                $('#map_hover_popup').find('.village_player').text(players[village.player].name).closest('tr').css('display', '');
                $('#map_hover_popup').find('.village_no_player').closest('tr').css('display', 'none');
            } else {
                $('#map_hover_popup').find('.village_player').closest('tr').css('display', 'none');
                $('#map_hover_popup').find('.village_no_player').closest('tr').css('display', '');
            }

            updatePosition($('#map_hover_popup'), e.originalEvent);
            $('#map_hover_popup').css('display', 'block');
            mapElement.style.cursor = 'pointer';
        } else {
            mapElement.style.cursor = '';
            $('#map_hover_popup').css('display', 'none');
        }
    });
    map.on('mouseout', function () {
        $('#map_hover_popup').css('display', 'none');
    });

}).then(function () {
    $('#loader').remove();
});