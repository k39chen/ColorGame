$(document).ready(function(){

	var canvas = $("#canvas");

	$(".button").css({userSelect:"none"}).easyHover({
		start: {color:"rgb(200,200,200)",lineHeight:"1.0em",fontSize:18},
		end: {color:"rgb(255,255,255)",lineHeight:"0.9em",fontSize:22}
	});

	var game = new Game(canvas);

	game.start();

	$("#newgame-btn").click(function(){
		if (!game.locked) {
			game.restart();
		}
	});

});

var OPACITY_NORMAL = 0.4;
var OPACITY_CONTROLLED = 0.0;
var OPACITY_HOVER = 0.0;

function Game(canvas) {

	var self = this;

	this.locked = true;

	// constructor
	this.anchor = null;
	this.canvas = canvas;
	this.startMarker = $("#start-marker");
	this.turnsCounter = $("#turns-container");
	this.completionCounter = $("#completion-container");
	this.board = {
		width: 16,
		height: 8,
		hGap: 10,
		vGap: 10,
		animDuration: 250,
		seed: 60
	};
	this.tile = {
		borderRadius: "5px",
		width: 32,
		height: 32,
		scaleBy: 1.3,
		animDuration: 200
	};
	this.numColors = 5;
	this.colors = [];

	this.numTiles = 0;
	this.numTurns = 0;
	this.totalTiles = 0;
	this.totalTurns = 200;

	this._numTiles = -1;
	this._numTurns = -1;
	this._totalTiles = -1;
	this._totalTurns = -1;

	this.start = function() {
		// first we must create the board!
		self.clear();
		_createBoard();
		self.startMarker.css({opacity:0.0}).stop().animate({opacity:1.0},self.board.animDuration);
		self.turnsCounter.css({opacity:0.0}).stop().animate({opacity:1.0},self.board.animDuration);
		self.completionCounter.css({opacity:0.0}).stop().animate({opacity:1.0},self.board.animDuration);
		self.canvas.css({opacity:0.0}).stop().animate({opacity:1.0},self.board.animDuration,function(){
			self.locked = false;
		});

		_updateHud(true);
	};

	this.restart = function() {
		self.clear(function(){
			self.start()
		});
	};

	this.clear = function(cb){
		self.locked = true;
		self.startMarker.css({opacity:1.0}).stop().animate({opacity:0.0},self.board.animDuration);
		self.turnsCounter.css({opacity:1.0}).stop().animate({opacity:0.0},self.board.animDuration);
		self.completionCounter.css({opacity:1.0}).stop().animate({opacity:0.0},self.board.animDuration);
		self.canvas.css({opacity:1.0}).stop().animate({opacity:0.0},self.board.animDuration,function(){
			self.canvas.empty();
			if (cb) cb();
		})
	};

	function _createBoard() {

		// generate the appropriate number of colors
		self.colors = [];
		for (var i=0; i<self.numColors; i++) {
			self.colors.push(_generateColor());
		}

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

				var pos = {x:x,y:y};
				var coord = _getCoord(x,y);
				var colorIndex = Math.floor(Math.random()*self.numColors);
				var posStyles = {
					position: "absolute",
					borderRadius: self.tile.borderRadius,
					borderTop: "solid 1px rgb(180,180,180)",
					borderBottom: "solid 1px rgb(50,50,50)",
					width: self.tile.width,
					height: self.tile.height,
					left: coord.x,
					top: coord.y,
				};

				var tile = $("<div>")
					.addClass("tile")
					.attr("pos","("+[x,y]+")")
					.data("pos",pos)
					.data("colorIndex",colorIndex)
					.css($.extend({ background: "rgb("+self.colors[colorIndex]+")"}, posStyles))
					.appendTo(self.canvas);
				var mask = $("<div>")
					.addClass("tile-mask")
					.attr("pos","("+[x,y]+")")
					.data("pos",pos)
					.css($.extend({opacity:OPACITY_NORMAL, background:"black",cursor:"pointer"}, posStyles))
					.appendTo(self.canvas);

				mask.mouseover(function(){
					var a = _getAnimProperties($(this)),
						p = {width:a.w,height:a.h,left:a.c.x,top:a.c.y},
						p_ = {width:a.w*a.s,height:a.h*a.s,left:a.c_.x,top:a.c_.y},
						o = {opacity: $(this).hasClass("controlled") ? OPACITY_CONTROLLED : OPACITY_NORMAL},
						o_ = {opacity: $(this).hasClass("controlled") ? OPACITY_CONTROLLED : OPACITY_HOVER},
						c = self.canvas;
					$(this).stop().css($.extend(o,p)).animate($.extend(o_,p_), a.d);
					_getTile(a.p).stop().css(p).animate(p_, a.d);
				});
				mask.mouseout(function(){
					var a = _getAnimProperties($(this)),
						p = {width:a.w*a.s,height:a.h*a.s,left:a.c_.x,top:a.c_.y},
						p_ = {width:a.w,height:a.h,left:a.c.x,top:a.c.y}
						o = {opacity: $(this).hasClass("controlled") ? OPACITY_CONTROLLED : OPACITY_HOVER},
						o_ = {opacity: $(this).hasClass("controlled") ? OPACITY_CONTROLLED : OPACITY_NORMAL},
						c = self.canvas;
					$(this).stop().css($.extend(o,p)).animate($.extend(o_,p_), a.d);
					_getTile(a.p).stop().css(p).animate(p_, a.d);
				});

				mask.click(function(){

					self.numTurns++;
					_updateHud();

				});

				self.totalTiles++;
			}
		}
		// set (0,0) as the starting anchor
		_setAnchor({x:0,y:0});
	};

	function _updateHud(noAnimation) {
		var animDuration = noAnimation ? 0 : 200;

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
		self._numTurns = self.numTurns;
		self._numTiles = self.numTiles;
		self._totalTurns = self.totalTurns;
		self._totalTiles = self.totalTiles;

		function fadeInOut(obj,value,duration) {
			obj.css({opacity:1.0}).stop().animate({opacity:0.0},duration,function(){
				$(this).html(value);
				$(this).css({opacity:0.0}).stop().animate({opacity:1.0},duration);
			});
		}
	}

	function _setAnchor(pos) {
		_setControlled(pos);
		self.anchor = pos;

		var tile = _getTile("("+pos.x+","+pos.y+")");
		var mask = _getTileMask("("+pos.x+","+pos.y+")");

		tile.addClass("anchor");
		mask.addClass("anchor");
	}

	function _setControlled(pos) {
		var tile = _getTile("("+pos.x+","+pos.y+")");
		var mask = _getTileMask("("+pos.x+","+pos.y+")");

		tile.addClass("controlled");
		mask.addClass("controlled");

		mask.css({opacity: OPACITY_CONTROLLED});
	}

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

	function _generateColor() {
		return [_getHexValue(),_getHexValue(),_getHexValue()];
	}

	function _getHexValue() {
		return Math.min(255,Math.floor(Math.random()*256)+100);
	}

	function _getTile(pos) {
		return $(".tile[pos='"+pos+"']", self.canvas);
	}
	function _getTileMask(pos) {
		return $(".tile-mask[pos='"+pos+"']", self.canvas);
	}

	function _getCoord(x,y) {
		return {
			x: x*(self.tile.width+self.board.hGap) + self.board.hGap,
			y: y*(self.tile.height+self.board.vGap) + self.board.vGap
		};
	}

}