$(document).ready(function(){

    // initialize UI elements
    $(".button").css({userSelect:"none"}).easyHover({
        start: {color:"rgb(200,200,200)",lineHeight:"1.0em",fontSize:18},
        end: {color:"rgb(255,255,255)",lineHeight:"0.9em",fontSize:22}
    });

    // initialize the new game button functionality
    $("#newgame-btn").click(function(){
        if (!game.locked) {
            game.restart();
        }
    });

    // create and start the game object
    var game = new Game();
    game.start();

});

// game constants
var OPACITY_NORMAL = 0.6;
var OPACITY_CONTROLLED = 0.0;
var OPACITY_HOVER = 0.0;

// tile states
var STATE_CONTROLLED = "controlled";
var STATE_DORMANT = "dormant";

function Game() {

    // reference to own object
    var self = this;

    // flag for if we can interact with the UI
    this.locked = true;

    // game components
    this.elem = $("#game");
    this.canvas = $("#canvas");
    this.controlBar = $("#controlBar")
    this.startMarker = $("#start-marker");
    this.turnsCounter = $("#turns-container");
    this.completionCounter = $("#completion-container");

    // board constants
    this.board = {
        width: 16,
        height: 8,
        hGap: 10,
        vGap: 10,
        animDuration: 250,
        seed: 100
    };

    // tile constants
    this.tile = {
        borderRadius: "5px",
        width: 32,
        height: 32,
        scaleBy: 1.2,
        animDuration: 200
    };

    // set of colors
    this.numColors = 0;
    this.minColors = 2;
    this.maxColors = 7;
    this.colors = [];
    this.currentColorIndex = -1;

    // game metrics
    this.numTiles = 0;
    this.numTurns = 0;
    this.totalTiles = 0;
    this.totalTurns = 0;

    // cached game metrics
    this._numTiles = -1;
    this._numTurns = -1;
    this._totalTiles = -1;
    this._totalTurns = -1;

    // game variables
    this.anchor = null;
    this.controlled = [];
    this.boundary = [];

    this.start = function() {

        // specify animation parameters
        var o = {opacity:0.0},
            o_ = {opacity:1.0},
            d = self.board.animDuration;

        // reset the primary game metrics
        this.numTurns = 0;
        this.numTiles = 0;

        // first we must create the board!
        self.clear();
        self.controlled = [];
        self.boundary = [];
        _createBoard();
        _createControlBar();

        // create modal background
        _createModal();

        // fade everything into existence
        self.startMarker.css(o).stop().animate(o_,d);
        self.turnsCounter.css(o).stop().animate(o_,d);
        self.completionCounter.css(o).stop().animate(o_,d);
        self.canvas.css(o).stop().animate(o_,d,function(){
            self.locked = false;
        });

        self.numTurns = 0;

        // update the HUD, don't animate the text!
        _updateHud(true);
    };

    this.restart = function() {
        // clear the board and recreate it again
        self.clear(function(){
            self.start()
        });
    };

    this.clear = function(cb){
        // define animation parameters
        var o = {opacity:1.0},
            o_ = {opacity:0.0},
            d = self.board.animDuration;

        // lock UI
        self.locked = true;

        // animate the UI out of existence
        self.startMarker.css(o).stop().animate(o_,d);
        self.turnsCounter.css(o).stop().animate(o_,d);
        self.completionCounter.css(o).stop().animate(o_,d);
        self.canvas.css(o).stop().animate(o_,d,function(){
            self.canvas.empty();
            if (cb) cb();
        })
    };

    function _createBoard() {

        // hide the modal message
        _hideModal();

        // generate the appropriate number of colors
        self.colors = [];
        self.numColors = Math.floor(Math.random() * (self.maxColors-self.minColors))+self.minColors;
        for (var i=0; i<self.numColors; i++) {
            self.colors.push(_generateColor());
        }

        // set the maximum number of turns to be some calculated number
        //   5 (2 colors)  + [1-5]
        //   10 (3 colors) + [6-10]
        //   15 (4 colors) + [11-15]
        //   ...
        var turnsMin = Math.min(5 * (self.numColors - 1),20);
        var turnsBuffer = Math.min(2 * (self.numColors - 2),10);
        var turnRandom = Math.floor(Math.random() * 4);
        self.totalTurns = turnsMin + turnsBuffer + turnRandom;

        // allow the canvas to accept absolute positioned elements within it
        self.canvas.css({
            position: "relative",
            width: self.board.width * (self.tile.width+self.board.hGap) + self.board.hGap,
            height: self.board.height * (self.tile.height+self.board.vGap) + self.board.vGap,
            margin: "0 auto"
        });
        // populate the tiles in the board
        self.totalTiles = 0;
        for (var y=0; y<self.board.height; y++) {
            for (var x=0; x<self.board.width; x++) {

                if (x > 2 || y > 2) {
                    if (Math.floor(Math.random()*100) > self.board.seed) continue;
                }

                // specify tile properties
                var pos = {x:x,y:y};
                var coord = _getCoord(x,y);
                var colorIndex = Math.floor(Math.random()*self.numColors);
                var posStyles = {
                    position: "absolute",
                    borderRadius: self.tile.borderRadius,
                    borderTop: "solid 1px rgb(100,100,100)",
                    borderBottom: "solid 1px rgb(50,50,50)",
                    width: self.tile.width,
                    height: self.tile.height,
                    left: coord.x,
                    top: coord.y,
                };

                // create the tile object
                var tile = $("<div>")
                    .addClass("tile dormant")
                    .attr("pos","("+[x,y]+")")
                    .attr("colorIndex",colorIndex)
                    .data("pos",pos)
                    .data("colorIndex",colorIndex)
                    .css($.extend({ backgroundColor: "rgb("+self.colors[colorIndex]+")", boxShadow: "0px 0px 10px rgba(255,255,255,0.0)"}, posStyles))
                    .appendTo(self.canvas);

                // create the corresponding tile mask
                var mask = $("<div>")
                    .addClass("tile-mask dormant")
                    .attr("pos","("+[x,y]+")")
                    .attr("colorIndex",colorIndex)
                    .data("pos",pos)
                    .data("colorIndex",colorIndex)
                    .css($.extend({opacity:OPACITY_NORMAL, backgroundColor:"black",cursor:"pointer"}, posStyles))
                    .appendTo(self.canvas);

                // define mouse over behaviour
                mask.mouseover(function(){
                    var a = _getAnimProperties($(this)),
                        p = {width:a.w,height:a.h,left:a.c.x,top:a.c.y},
                        p_ = {width:a.w*a.s,height:a.h*a.s,left:a.c_.x,top:a.c_.y},
                        o = {opacity: $(this).hasClass(STATE_CONTROLLED) ? OPACITY_CONTROLLED : OPACITY_NORMAL},
                        o_ = {opacity: $(this).hasClass(STATE_CONTROLLED) ? OPACITY_CONTROLLED : OPACITY_HOVER},
                        c = self.canvas;
                    $(this).stop().css($.extend(o,p)).animate($.extend(o_,p_), a.d);
                    _getTile(a.p).stop().css(p).animate(p_, a.d);
                });

                // define mouse out behaviour
                mask.mouseout(function(){
                    var a = _getAnimProperties($(this)),
                        p = {width:a.w*a.s,height:a.h*a.s,left:a.c_.x,top:a.c_.y},
                        p_ = {width:a.w,height:a.h,left:a.c.x,top:a.c.y}
                        o = {opacity: $(this).hasClass(STATE_CONTROLLED) ? OPACITY_CONTROLLED : OPACITY_HOVER},
                        o_ = {opacity: $(this).hasClass(STATE_CONTROLLED) ? OPACITY_CONTROLLED : OPACITY_NORMAL},
                        c = self.canvas;
                    $(this).stop().css($.extend(o,p)).animate($.extend(o_,p_), a.d);
                    _getTile(a.p).stop().css(p).animate(p_, a.d);
                });

                // define click behaviour
                mask.click(function(){
                    _takeTurn($(this).data("pos"));
                });

                // increment the number of tiles on the board
                self.totalTiles++;
            }
        }
        // set (0,0) as the starting anchor
        _setAnchor({x:0,y:0});
    };

    function _createControlBar() {
        self.controlBar.empty();

        self.controlBar.css({
            marginTop: 16,
            paddingTop: 8,
            width: "100%",
            textAlign: "center"
        });

        var width = self.tile.width;
        var height = self.tile.height;

        for (var i=0; i<self.colors.length; i++) {
            var container = $("<div>")
                .addClass("control-tile-container")
                .data("colorIndex",i)
                .css({
                    display: "inline-block",
                    position: "relative",
                    width: width,
                    height: height,
                    marginRight: 16
                })
                .appendTo(self.controlBar);

            var tile = $("<div>")
                .addClass("control-tile")
                .data("colorIndex",i)
                .css({
                    position: "absolute",
                    top: 0, left: 0,
                    width: width,
                    height: height,
                    background: "rgb("+self.colors[i]+")",
                    borderRadius: "50%",
                })
                .appendTo(container);

            var mask = $("<div>")
                .addClass("control-tile-mask")
                .data("colorIndex",i)
                .css({
                    position: "absolute",
                    top: 0, left: 0,
                    width: width,
                    height: height,
                    backgroundColor: "black",
                    opacity: OPACITY_NORMAL,
                    borderRadius: "50%",
                    cursor: "pointer"
                })
                .appendTo(container);

            mask.mouseover(function(){
                $(this).css({opacity:OPACITY_NORMAL}).stop().animate({opacity: OPACITY_HOVER}, self.tile.animDuration);

                $(".tile-mask[colorIndex='"+$(this).data("colorIndex")+"']").each(function(){
                    if ($(this).hasClass(STATE_DORMANT)) {
                        $(this).css({opacity: OPACITY_HOVER});
                    }
                });
            });
            mask.mouseout(function(){
                $(this).css({opacity:OPACITY_HOVER}).stop().animate({opacity: OPACITY_NORMAL}, self.tile.animDuration);

                $(".tile-mask[colorIndex='"+$(this).data("colorIndex")+"']").each(function(){
                    if ($(this).hasClass(STATE_DORMANT)) {
                        $(this).css({opacity:OPACITY_NORMAL});
                    }
                });
            });
            mask.click(function(){
                _colorSwap($(this).data("colorIndex"));
            });
        }
    }

    function _createModal() {
        var modal = $("<div>")
            .hide()
            .attr("id","modal")
            .css({
                position: "absolute",
                top: self.elem.offset().top,
                left: self.elem.offset().left,
                width: self.elem.width(),
                height: self.elem.height(),
                background: "rgb(20,20,20)"
            })
            .appendTo(self.elem);
        var message = $("<div>")
            .attr("id","modal-message")
            .css({
                fontFamily: "HelveticaNeueUltLt",
                position: "absolute",
                fontSize: 24,
                width: "100%",
                marginTop: 140,
                textAlign: "center"
            })
            .appendTo(modal);
    }

    function _showModalMessage(text) {
        $("#modal").show().css({opacity:0}).stop().animate({opacity:0.9},700);
        $("#modal-message").html(text);
    }
    function _hideModal() {
        $("#modal").css({opacity:0.9}).stop().animate({opacity:0},700,function(){
            $(this).hide();
        });
    }

    function _takeTurn(pos) {
        var tile = _getTile("("+pos.x+","+pos.y+")");
        var colorIndex = tile.data("colorIndex");

        // only process clicks for dormant tiles of different colors than our current color
        if (_isDormant(pos) && colorIndex != self.currentColorIndex) {
            // perform actions for swapping colors
            _colorSwap(colorIndex);
        }
    }

    function _colorSwap(colorIndex) {

        // the board boundaries
        var xMin = 0;
        var xMax = self.board.width - 1;
        var yMin = 0;
        var yMax = self.board.height - 1;

        // update the current color index
        self.currentColorIndex = colorIndex;

        // see if we can get any adjacent tiles to join our controlled group
        _checkBoundaries();

        // update color swap aesthetic for controlled tiles
        for (var i=self.controlled.length-1;i>=0;i--) {
            if (!self.controlled[i]) continue;

            var x = self.controlled[i].x;
            var y = self.controlled[i].y;
            var tile = _getTile("("+x+","+y+")");
            var color = "rgb("+self.colors[colorIndex]+")";

            // animate this tile to the new color
            var a = {backgroundColor:tile.css("background")},
                a_ = {backgroundColor:color},
                d = self.tile.animDuration;
            tile.stop().css(a).animate(a_,d);

            tile.data("colorIndex",colorIndex);
        }

        // see if we can remove some of those boundary checks
        self.boundary = [];
        for (var i=0; i<self.controlled.length; i++) {
            var pos = self.controlled[i];
            var tile = _getTile("("+pos.x+","+pos.y+")");

            var adjacent = [
                {x: pos.x-1, y: pos.y},
                {x: pos.x+1, y: pos.y},
                {x: pos.x, y: pos.y-1},
                {x: pos.x, y: pos.y+1},
            ];

            var numRoutes = 0;
            for (var j=0; j<adjacent.length; j++) {
                var p = adjacent[j], x = p.x, y = p.y;
                var t = _getTile("("+x+","+y+")");
                var c = t.data("colorIndex");

                // if it satisifes these conditions, then we will continue to
                // observe it as a boundary option
                if (x>=xMin && x<=xMax && y>=yMin && y<=yMax && !_isControlled(p)) {
                    numRoutes++;
                }
            }
            if (numRoutes > 0) {
                self.boundary.push({x:pos.x,y:pos.y});
            }
        }

        // update the player variables
        self.numTiles = self.controlled.length;
        self.numTurns++;
        _updateHud();
    }

    function _setAnchor(pos) {
        self.anchor = pos;

        // get references to the appropriate components
        var tile = _getTile("("+pos.x+","+pos.y+")");
        var mask = _getTileMask("("+pos.x+","+pos.y+")");

        // update the current color index
        self.currentColoIndex = tile.data("colorIndex");

        // set this as a controlled tile
        _setControlled(pos);

        // update the player variables
        self.numTiles = self.controlled.length;
        self.numTurns++;
        _updateHud();
    }

    function _setControlled(pos) {
        var tile = _getTile("("+pos.x+","+pos.y+")");
        var mask = _getTileMask("("+pos.x+","+pos.y+")");

        // mark the tile as controlled
        tile.removeClass(STATE_DORMANT).addClass(STATE_CONTROLLED);
        mask.removeClass(STATE_DORMANT).addClass(STATE_CONTROLLED);

        // update aesthetic for controlled groups
        mask.css({opacity: OPACITY_CONTROLLED});
        tile.css({boxShadow: "0px 0px 10px rgba(255,255,255,1.0)"});

        // push it onto the controlled stack
        self.controlled.push(pos);
        self.boundary.push(pos);
        self.currentColorIndex = tile.data("colorIndex");

        // see if we can get any more controlled with adjacent tiles!
        _checkAdjacent(pos);
    }

    function _checkBoundaries() {
        for (var i=0; i<self.boundary.length; i++) {
            _checkAdjacent(self.boundary[i]);
        }
    }

    function _checkAdjacent(pos) {
        var xMin = 0;
        var xMax = self.board.width - 1;
        var yMin = 0;
        var yMax = self.board.height - 1;

        var tile = _getTile("("+x+","+y+")");

        // define the coordinates of the adjacent tiles
        var adjacentTiles = [
            {x: pos.x-1, y: pos.y},
            {x: pos.x+1, y: pos.y},
            {x: pos.x, y: pos.y-1},
            {x: pos.x, y: pos.y+1}
        ];

        // check if any of the adjacent tiles can be added to the controlled group
        for (var i=0; i<adjacentTiles.length; i++) {
            var p = adjacentTiles[i], x = p.x, y = p.y;
            var adjacentTile = _getTile("("+x+","+y+")");
            var colorIndex = adjacentTile.data("colorIndex");

            // is not blocked only if this adjacent tile respects the board boundaries
            // and is an uncontrolled tile that matches our color of interest
            if (x >= xMin && x <= xMax && y >= yMin && y <= yMax &&
                !_isControlled(p) && colorIndex == self.currentColorIndex)
            {
                // mark this tile as a controlled tile, and subsequently check its adjacent
                // tiles as well!
                _setControlled(p);
            }
        }
    }

    function _updateHud(noAnimation) {
        var animDuration = noAnimation ? 0 : 200;

        // perform an update anmation of the value has been changed
        if (self.numTurns != self._numTurns) {
            fadeInOut($("#turns-taken"),self.numTurns,animDuration);
        }
        if (self.totalTurns != self._totalTurns) {
            fadeInOut($("#turns-total"),self.totalTurns,animDuration);
        }
        if (self.numTiles != self._numTiles) {
            fadeInOut($("#completion-taken"),self.numTiles,animDuration);
        }
        if (self.totalTiles != self._totalTiles) {
            fadeInOut($("#completion-total"),self.totalTiles,animDuration);
        }
        // update the cached values
        self._numTurns = self.numTurns;
        self._numTiles = self.numTiles;
        self._totalTurns = self.totalTurns;
        self._totalTiles = self.totalTiles;

        // helper function to fade in/out the text upon update
        function fadeInOut(obj,value,duration) {
            obj.css({opacity:1.0}).stop().animate({opacity:0.0},duration,function(){
                $(this).html(value);
                $(this).css({opacity:0.0}).stop().animate({opacity:1.0},duration);
            });
        }


        // determine what game state we are in now
        var modalMessage = "";
        if (self.numTiles == self.totalTiles) {
            var easeOfCompletion = self.numTurns / self.totalTurns
            if (easeOfCompletion == 1.00) {
                modalMessage =
                    "<b>BY THE SKIN OF YOUR TEETH!</b><br>"+
                    "You have successfully controlled "+
                    "<b>"+self.totalTiles+"</b>"+" tiles with no turns remaining!";
            } else if (easeOfCompletion >= 0.75) {
                modalMessage =
                    "<b>Congratulations!</b><br>"+
                    "You have successfully controlled "+
                    "<b>"+self.totalTiles+"</b>"+" tiles in "+
                    "<b>"+self.numTurns+"</b> turns!";
            } else if (easeOfCompletion >= 0.5) {
                modalMessage =
                    "<b>WOW!</b>"+
                    "<br>You have successfully controlled "+
                    "<b>"+self.totalTiles+"</b>"+" tiles in just "+
                    "<b>"+self.numTurns+"</b> turns!";
            } else {
                modalMessage =
                    "<b>AMAZING!</b><br>"+
                    "You have successfully controlled "+
                    "<b>"+self.totalTiles+"</b>"+" tiles in only "+
                    "<b>"+self.numTurns+"</b> turns!";
            }
            _showModalMessage(modalMessage);
            return;
        }
        if (self.numTurns >= self.totalTurns) {
            var completion = self.numTiles / self.totalTiles;
            if (completion >= 0.90) {
                modalMessage =
                "<b>SO CLOSE!</b><br/>"+
                "You managed to control "+
                "<b>"+Math.floor(completion*100)+"%</b> "+
                "of the board."
            } else if (completion >= 0.60) {
                modalMessage =
                "<b>GAME OVER!</b><br/>"+
                "You only managed to control "+
                "<b>"+Math.floor(completion*100)+"%</b> "+
                "of the board."
            } else if (completion >= 0.40) {
                modalMessage =
                "<b>WHAT ARE YOU DOING?</b><br/>"+
                "You only managed to control "+
                "<b>"+Math.floor(completion*100)+"%</b> "+
                "of the board."
            } else {
                modalMessage =
                "<b>YOU'RE SO BAD YOU SHOULD PLAY AGAIN</b><br/>"+
                "You only managed to control "+
                "<b>"+Math.floor(completion*100)+"%</b> "+
                "of the board."
            }
            _showModalMessage(modalMessage);
            return;
        }
    }

    // function to report animation properties upon mask hover events
    function _getAnimProperties(tileobj) {
        var w = self.tile.width,
            h = self.tile.height,
            s = self.tile.scaleBy,
            p = tileobj.attr("pos"),
            d = self.tile.animDuration,
            x = tileobj.data("pos").x,
            y = tileobj.data("pos").y,
            c = _getCoord(x,y),
            c_ = {x:c.x-w*(s-1)/2,y:c.y-h*(s-1)/2};
        return {w:w,h:h,s:s,p:p,d:d,x:x,y:y,c:c,c_:c_};
    }

    // helper functions to generate colors on the fly
    function _generateColor() {
        return [_getHexValue(),_getHexValue(),_getHexValue()];
    }

    function _getHexValue() {
        return Math.min(255,Math.floor(Math.random()*256)+100);
    }

    // helper functions to get tiles/masks
    function _getTile(pos) {
        return $(".tile[pos='"+pos+"']", self.canvas);
    }
    function _getTileMask(pos) {
        return $(".tile-mask[pos='"+pos+"']", self.canvas);
    }

    // returns the literal coordinate of a tile
    function _getCoord(x,y) {
        return {
            x: x*(self.tile.width+self.board.hGap) + self.board.hGap,
            y: y*(self.tile.height+self.board.vGap) + self.board.vGap
        };
    }

    // state checkers
    function _isControlled(pos) { return _getTile("("+pos.x+","+pos.y+")").hasClass(STATE_CONTROLLED); }
    function _isDormant(pos) { return _getTile("("+pos.x+","+pos.y+")").hasClass(STATE_DORMANT); }

}
