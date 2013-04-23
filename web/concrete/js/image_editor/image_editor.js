///////////////////////////////////////////////////////////////////////////////
//                                  head.js                                  //
///////////////////////////////////////////////////////////////////////////////
;(function(window,jQuery,Kinetic){
	var $ = jQuery;
	window.devicePixelRatio = 1;


///////////////////////////////////////////////////////////////////////////////
//                            kinetic.prototype.js                           //
///////////////////////////////////////////////////////////////////////////////
/////////////////////////////
//      Kinetic.Node       //
/////////////////////////////
Kinetic.Node.prototype.closest = function(type) {
  var active = this.parent;
  while (active !== undefined) {
    if (active.nodeType === type) return active;
    active = active.parent;
  }
  return false;
};


/////////////////////////////
//      Kinetic.Stage      //
/////////////////////////////
Kinetic.Stage.prototype.createCopy = function () {
  var copy = [], children = this.getChildren(), i;
  for (i = 0; i < children.length; i++) {
    copy.push(children[i].clone());
  }
  return copy;
};
Kinetic.Stage.prototype.getScaledWidth = function() {
  return Math.ceil(this.getWidth() / this.getScale().x);
};
Kinetic.Stage.prototype.getScaledHeight = function() {
  return Math.ceil(this.getHeight() / this.getScale().y);
};
Kinetic.Stage.prototype.getSaveWidth = function() {
  return this.im.saveWidth;
};
Kinetic.Stage.prototype.getSaveHeight = function() {
  return this.im.saveHeight;
};
Kinetic.Stage.prototype.getTotalDimensions = function() {
  var minY = (this.getSaveHeight() / 2 - this.im.center.y) * this.getScale().y;
  var maxY = minY + this.getHeight() - (this.getSaveHeight() * this.getScale().y);

  var minX = (this.getSaveWidth() / 2 - this.im.center.x) * this.getScale().x;
  var maxX = minX + this.getWidth() - (this.getSaveWidth() * this.getScale().x);

  return {
    min: {
      x: minX,
      y: minY
    },
    max: {
      x: maxX,
      y: maxY
    },
    width:this.getScaledWidth(),
    height:this.getScaledHeight(),
    visibleWidth:Math.max(this.getSaveWidth(),this.getScaledWidth() * 2 - this.getSaveWidth()),
    visibleHeight:Math.max(this.getSaveHeight(),this.getScaledHeight() * 2 - this.getSaveHeight())
  };
};
Kinetic.Stage.prototype.loadCopy = function (copy) {
  var i;
  this.removeChildren();
  for (i = 0; i < copy.length; i++) {
    this.add(copy[i]);
  }
  this.draw();
};
Kinetic.Stage.prototype.elementType = 'stage';

/////////////////////////////
//      Kinetic.Image      //
/////////////////////////////
Kinetic.Image.prototype.getImageData = function() {
  var canvas = new Kinetic.Canvas(this.attrs.image.width, this.attrs.image.height);
  var context = canvas.getContext();
  context.drawImage(this.attrs.image, 0, 0);
  try {
      var imageData = context.getImageData(0, 0, canvas.getWidth(), canvas.getHeight());
      return imageData;
  } catch(e) {
      Kinetic.Global.warn('Unable to get imageData.');
  }
};

/////////////////////////////
//      Kinetic.Layer      //
/////////////////////////////
Kinetic.Layer.prototype._cacheddraw = (new Kinetic.Layer).draw;
Kinetic.Layer.prototype.draw = function() {
  if (typeof im === 'undefined' || typeof im.trigger === 'undefined') {
    return this._cacheddraw();
  }
  //im.trigger('beforeredraw',this);
  var draw = this._cacheddraw();
  //im.trigger('afterredraw',this);
  return draw;
};
Kinetic.Layer.prototype.elementType = 'layer';


/////////////////////////////
//      Kinetic.Group      //
/////////////////////////////
Kinetic.Group.prototype.elementType = 'group';

/////////////////////////////
//       Kinetic.Text      //
/////////////////////////////
Kinetic.Text.prototype.rasterize = function(e) {
  var layer = this.parent;
  var me = this;
  this.toImage({
    callback:function(img){
      var rasterizedImage = new Kinetic.Image({image:img,x:me.getPosition().x,y:me.getPosition().y});
      me.remove();
      layer.add(rasterizedImage).draw();
      e.callback(rasterizedImage);
    }
  });
};








// Rebuild:
Kinetic.Global.extend(Kinetic.Container, Kinetic.Node);
Kinetic.Global.extend(Kinetic.Shape, Kinetic.Node);
Kinetic.Global.extend(Kinetic.Group, Kinetic.Container);
Kinetic.Global.extend(Kinetic.Layer, Kinetic.Container);
Kinetic.Global.extend(Kinetic.Stage, Kinetic.Container);
Kinetic.Global.extend(Kinetic.Circle, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.Ellipse, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.Image, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.Line, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.Path, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.Polygon, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.Rect, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.RegularPolygon, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.Sprite, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.Star, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.Text, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.TextPath, Kinetic.Shape);
Kinetic.Global.extend(Kinetic.Wedge, Kinetic.Shape);


///////////////////////////////////////////////////////////////////////////////
//                               imageeditor.js                              //
///////////////////////////////////////////////////////////////////////////////

var ImageEditor = function (settings) {
  "use strict";
  if (settings === undefined) return this;
  settings.pixelRatio = 1;
  var im            = this, x, round = function(float){return Math.round(float)};
  im.width          = settings.width;
  im.height         = settings.height;
  im.saveWidth      = settings.saveWidth || round(im.width / 2);
  im.saveHeight     = settings.saveHeight || round(im.height / 2);
  im.strictSize     = (settings.saveWidth !== undefined ? true : false);
  im.stage          = new Kinetic.Stage(settings);
  im.namespaces     = {};
  im.controlSets    = {};
  im.components     = {};
  im.settings       = settings;
  im.filters        = {};
  im.scale          = 1;
  im.crosshair      = new Image();
  im.uniqid         = im.stage.getContainer().id;
  im.editorContext  = $(im.stage.getContainer()).parent();
  im.domContext     = im.editorContext.parent();
  im.controlContext = im.domContext.children('div.controls');

  im.showLoader = $.fn.dialog.showLoader;
  im.hideLoader = $.fn.dialog.hideLoader;
  im.stage.im = im;
  im.stage.elementType = 'stage';
  im.crosshair.src = '/concrete/images/image_editor/crosshair.png';

  im.center = {
    x: Math.round(im.width / 2),
    y: Math.round(im.height / 2)
  };

  im.centerOffset = {
    x: im.center.x,
    y: im.center.y
  };

  var getElem = function(selector) {
    return $(selector, im.domContext);
  },
  log = function() {
    if (settings.debug === true && console !== undefined) {
      var args = arguments;
      if (args.length == 1) args = args[0];
      console.log(args);
    }
  },
  warn = function() {
    if (settings.debug === true && console !== undefined) {
      var args = arguments;
      if (args.length == 1) args = args[0];
      console.warn(args);
    }
  },
  error = function() {
    if (console !== undefined) {
      var args = arguments;
      if (args.length == 1) args = args[0];
      console.error(args);
    }
  };

  im.stage._setDraggable = im.stage.setDraggable;
  im.stage.setDraggable = function(v) {
    warn('setting draggable to '+v);
    return im.stage._setDraggable(v);
  }


///////////////////////////////////////////////////////////////////////////////
//                                 history.js                                //
///////////////////////////////////////////////////////////////////////////////
var History = function () {
  var h = this;
  h.history = [];
  h.pointer = -1;
  h.save = function () {
    im.fire('beforehistorysave');
    h.history = h.history.slice(0, h.pointer + 1);
    h.history.push(im.stage.createCopy());
    h.movePointer(1);
    im.fire('historysave');
  };
  h.movePointer = function (diff) {
    h.pointer += diff;
    (h.pointer < 0 && (h.pointer = 0));
    (h.pointer >= h.history.length && (h.pointer = h.history.length - 1));
    return h.pointer;
  };
  h.render = function () {
    im.fire('beforehistoryrender');
    im.stage.loadCopy(h.history[h.pointer]);
    im.fire('historyrender');
  };
  h.undo = function () {
    im.fire('beforehistoryundo');
    h.movePointer(-1);
    h.render();
    im.fire('historyundo');
  };
  h.redo = function () {
    im.fire('beforehistoryredo');
    h.movePointer(1);
    h.render();
    im.fire('historyredo');
  };
};
im.history = new History();


///////////////////////////////////////////////////////////////////////////////
//                                 events.js                                 //
///////////////////////////////////////////////////////////////////////////////
// Handle event binding.
im.bindEvent = im.bind = im.on = function (type, handler, elem) {
  var element = elem || im.stage.getContainer();
  if (element instanceof jQuery) element = element[0];
  ccm_event.sub(type,handler,element);
};

// Handle event firing
im.fireEvent = im.fire = im.trigger = function (type, data, elem) {
  var element = elem || im.stage.getContainer();
  if (element instanceof jQuery) element = element[0];
  ccm_event.pub(type,data,element);
};


///////////////////////////////////////////////////////////////////////////////
//                                elements.js                                //
///////////////////////////////////////////////////////////////////////////////
im.addElement = function(object,type) {
  var layer = new Kinetic.Layer();
  layer.elementType = layer;
  layer.add(object);
  object.setX(im.center.x - Math.round(object.getWidth() / 2));
  object.setY(im.center.y - Math.round(object.getHeight() / 2));

  object.doppelganger = object.clone();
  if (type == 'image') object.doppelganger.setImage('');
  object.doppelganger.doppelganger = object;
  object.doppelganger.drawHitFunc = object.doppelganger.attrs.drawHitFunc = function(){return false};
  object.doppelganger.setFill('transparent');
  object.doppelganger.elementType = 'StokeClone';
  object.doppelganger.setStroke('blue');
  object.doppelganger._drawFunc = object.getDrawFunc();
  object.doppelganger.setDrawFunc(function(canvas){
    if (typeof this._drawFunc == "function") {
      this.attrs.strokeWidth = 1/im.scale;
      this.setFill('transparent');
      if (type == 'image') { this.attrs.image = ''; }
      this._drawFunc(canvas);
    }
  });

  object.elementType = type;

  object.on('click',function(){
    im.fire('ClickedElement',this);
  });
  object._drawFunc = object.getDrawFunc();
  object.setDrawFunc(function(canvas) {
    for (var attr in this.attrs) {
      if (attr == 'drawFunc' ||
          attr == 'drawHitFunc' ||
          attr == 'strokeWidth' ||
          attr == 'fill') continue;
      this.doppelganger.attrs[attr] = this.attrs[attr];
    }
    im.foreground.draw();
    this._drawFunc(canvas);
  });

  object.on('mouseover',function(){
    this.hovered = true;
    //im.stage.setDraggable(false);
    im.setCursor('pointer');
  });
  object.on('mouseout',function(){
    //im.stage.setDraggable(true);
    if (this.hovered == true) {
      im.setCursor('');
      this.hovered = false;
    }
  });

  im.stage.add(layer);
  im.fire('newObject',{object:object,type:type});
  im.foreground.moveToTop();
  im.stage.draw();
};

im.on('backgroundBuilt',function(){
  if (im.activeElement !== undefined && im.activeElement.doppelganger !== undefined) {
    im.foreground.add(im.activeElement.doppelganger);
    im.activeElement.doppelganger.setPosition(im.activeElement.getPosition());
  }
});

im.setActiveElement = function(element) {
  if (im.activeElement == element) return;
  if (im.activeElement !== undefined && im.activeElement.doppelganger !== undefined) {
    im.activeElement.doppelganger.remove();
  }
  if (element === im.stage || element.nodeType == 'Stage') {
    im.trigger('ChangeActiveAction','ControlSet_Position');
    $('div.control-sets',im.controlContext).find('h4.active').removeClass('active');
  } else if (element.doppelganger !== undefined) {
    im.foreground.add(element.doppelganger);
    im.foreground.draw();
  }
  im.trigger('beforeChangeActiveElement',im.activeElement);
  im.alterCore('activeElement',element);
  im.trigger('changeActiveElement',element);
  im.stage.draw();
};
im.bind('ClickedElement',function(e) {
  im.setActiveElement(e.eventData);
});

im.bind('stageChanged',function(e){
  if (im.activeElement.getWidth() > im.stage.getScaledWidth() || im.activeElement .getHeight() > im.stage.getScaledHeight()) {
    im.setActiveElement(im.stage);
  }
});


///////////////////////////////////////////////////////////////////////////////
//                                controls.js                                //
///////////////////////////////////////////////////////////////////////////////
// Zoom
var controlBar = getElem(im.stage.getContainer()).parent().children('.bottomBar');

controlBar.attr('unselectable', 'on').css('user-select', 'none').on('selectstart', false);

var zoom = {};

zoom.in = getElem("<div class='bottombarbutton plus'><i class='icon-plus'></i></div>");
zoom.out = getElem("<div class='bottombarbutton'><i class='icon-minus'></i></div>");

zoom.in.appendTo(controlBar);
zoom.out.appendTo(controlBar);

zoom.in.click(function(e){im.fire('zoomInClick',e)});
zoom.out.click(function(e){im.fire('zoomOutClick',e)});

var scale = getElem('<div></div>').addClass('scale').text('100%');
im.on('scaleChange',function(e){
  scale.text(Math.round(im.scale * 10000)/100 + "%");
});
scale.click(function(){
  im.scale = 1;
  im.stage.setScale(im.scale);
  var pos = (im.stage.getDragBoundFunc())({x:im.stage.getX(),y:im.stage.getY()});
  im.stage.setX(pos.x);
  im.stage.setY(pos.y);
  im.fire('scaleChange');
  im.buildBackground();
  im.stage.draw();
})
scale.appendTo(controlBar);

var minScale = 0, maxScale = 3000, stepScale = 5/6;

im.on('zoomInClick',function(e){
  var centerx = (-im.stage.getX() + (im.stage.getWidth() / 2)) / im.scale, 
      centery = (-im.stage.getY() + (im.stage.getHeight() / 2)) / im.scale;
  
  im.scale /= stepScale;
  im.scale = Math.round(im.scale * 1000) / 1000;
  im.alterCore('scale',im.scale);

  var ncenterx = (-im.stage.getX() + (im.stage.getWidth() / 2)) / im.scale, 
      ncentery = (-im.stage.getY() + (im.stage.getHeight() / 2)) / im.scale;
    
  im.stage.setX(im.stage.getX() - (centerx - ncenterx) * im.scale);
  im.stage.setY(im.stage.getY() - (centery - ncentery) * im.scale);

  im.stage.setScale(im.scale);
  
  var pos = (im.stage.getDragBoundFunc())({x:im.stage.getX(),y:im.stage.getY()});
  im.stage.setX(pos.x);
  im.stage.setY(pos.y);

  im.fire('scaleChange');
  im.buildBackground();
  im.stage.draw();
});
im.on('zoomOutClick',function(e){
  var centerx = (-im.stage.getX() + (im.stage.getWidth() / 2)) / im.scale, 
      centery = (-im.stage.getY() + (im.stage.getHeight() / 2)) / im.scale;
  
  im.scale *= stepScale;
  im.scale = Math.round(im.scale * 1000) / 1000;
  im.alterCore('scale',im.scale);

  var ncenterx = (-im.stage.getX() + (im.stage.getWidth() / 2)) / im.scale, 
      ncentery = (-im.stage.getY() + (im.stage.getHeight() / 2)) / im.scale;
    
  im.stage.setX(im.stage.getX() - (centerx - ncenterx) * im.scale);
  im.stage.setY(im.stage.getY() - (centery - ncentery) * im.scale);

  im.stage.setScale(im.scale);
  
  var pos = (im.stage.getDragBoundFunc())({x:im.stage.getX(),y:im.stage.getY()});
  im.stage.setX(pos.x);
  im.stage.setY(pos.y);

  im.fire('scaleChange');
  im.buildBackground();
  im.stage.draw();
});

// Save
var saveSize = {};

saveSize.width = getElem('<span/>').addClass('saveWidth');
saveSize.height = getElem('<span/>').addClass('saveHeight');
saveSize.crop = getElem('<div><i class="icon-resize-full"/></div>').addClass('bottombarbutton').addClass('crop');
saveSize.both = saveSize.height.add(saveSize.width).width(32).attr('contenteditable',!!1);

saveSize.area = getElem('<span/>').css({float:'right'});
saveSize.crop.appendTo(saveSize.area);
saveSize.width.appendTo($('<div>w </div>').addClass('saveWidth').appendTo(saveSize.area));
saveSize.height.appendTo($('<div>h </div>').addClass('saveHeight').appendTo(saveSize.area));
saveSize.area.appendTo(controlBar);

if (im.strictSize) {
  saveSize.both.attr('disabled','true');
} else {
  saveSize.both.keyup(function(e){
    im.fire('editedSize',e);
  });
}

im.bind('editedSize',function(e){
  im.saveWidth = parseInt(saveSize.width.text());
  im.saveHeight = parseInt(saveSize.height.text());

  if (isNaN(im.saveWidth)) im.saveWidth = 0;
  if (isNaN(im.saveHeight)) im.saveHeight = 0;

  //im.trigger('saveSizeChange');
  im.buildBackground();
});

im.bind('saveSizeChange',function(){
  saveSize.width.text(im.saveWidth);
  saveSize.height.text(im.saveHeight);
});

im.setCursor = function(cursor) {
  $(im.stage.getContainer()).css('cursor',cursor);
};


///////////////////////////////////////////////////////////////////////////////
//                                  save.js                                  //
///////////////////////////////////////////////////////////////////////////////
im.save = function() {
  im.background.hide();
  if (im.activeElement !== undefined && typeof im.activeElement.releaseStroke == 'function') {
    im.activeElement.releaseStroke();
  }
  im.stage.setScale(1);
  im.setActiveElement(im.stage);

  im.fire('ChangeActiveAction');
  im.fire('changeActiveComponent');

  $(im.stage.getContainer()).hide();

  var startx = Math.round(im.center.x - (im.saveWidth / 2)),
      starty = Math.round(im.center.y - (im.saveHeight / 2)),
      oldx = im.stage.getX(),
      oldy = im.stage.getY(),
      oldwidth = im.stage.getWidth(),
      oldheight = im.stage.getHeight();

  im.stage.setX(-startx);
  im.stage.setY(-starty);
  im.stage.setWidth(Math.max(im.stage.getWidth(),im.saveWidth));
  im.stage.setHeight(Math.max(im.stage.getHeight(),im.saveHeight));
  im.stage.draw();


  im.showLoader('Saving..');
  im.stage.toDataURL({
    width:im.saveWidth,
    height:im.saveHeight,
    callback:function(data){
      var img = $('<img/>').attr('src',data);
      $.fn.dialog.open({element:$(img).width(250)});
      im.hideLoader();
      im.background.show();
      im.stage.setX(oldx);
      im.stage.setY(oldy);
      im.stage.setWidth(oldwidth);
      im.stage.setHeight(oldheight);
      im.stage.setScale(im.scale);
      im.stage.draw();
      $(im.stage.getContainer()).show();
    }
  })
};


///////////////////////////////////////////////////////////////////////////////
//                                 extend.js                                 //
///////////////////////////////////////////////////////////////////////////////
im.extend = function(property,value) {
  this[property] = value;
};

im.alterCore = function(property,value) {
  var nim = im, ns = 'core', i;
  if (im.namespace) {
    var ns = nim.namespace;
    nim = im.realIm;
  }
  im[property] = value;
  for (i in im.controlSets){
    im.controlSets[i].im.extend(property,value);
  }
  for (i in im.filters){
    im.filters[i].im.extend(property,value);
  }
  for (i in im.components){
    im.components[i].im.extend(property,value);
  }
};

im.clone = function(namespace) {
  var newim = new ImageEditor(),i;
  newim.realIm = im;
  for (i in im) {
    newim[i] = im[i];
  }
  newim.namespace = namespace;
  return newim;
};


im.addControlSet = function(ns,js,elem) {
  if (jQuery && elem instanceof jQuery) elem = elem[0];
  elem.controlSet = function(im,js) {
    im.disable = function() {
      $(elem).parent().parent().addClass('disabled');
    };
    im.enable = function() {
      $(elem).parent().parent().removeClass('disabled');
    };
    this.im = im;
    warn('Loading ControlSet',im);
    try {
      eval(js);
    } catch(e) {
      console.error(e);
      var pos = e.stack.replace(/[\S\s]+at HTMLDivElement.eval.+?<anonymous>:(\d+:\d+)[\S\s]+/,'$1').split(':');
      var jsstack = js.split("\n");
      var error = "Parse error at line #"+pos[0]+" char #"+pos[1]+" within "+ns;
      error += "\n"+jsstack[parseInt(pos[0])-1];
      error += "\n"+(new Array(parseInt(pos[1])).join(" "))+"^";
      console.error(error);
    }
    return this;
  };
  var newim = im.clone(ns);
  var nso = elem.controlSet(newim,js);
  im.controlSets[ns] = nso;
  return nso;
};

im.addFilter = function(ns,js) {
  var filter = function(im,js) {
    this.im = im;
    try {
      eval(js);
    } catch(e) {
      console.error(e);
      window.lastError = e;
      var pos = e.stack.replace(/[\S\s]+at HTMLDivElement.eval.+?<anonymous>:(\d+:\d+)[\S\s]+/,'$1').split(':');
      if (e.count != 2) {
        console.error(e.message);
        console.error(e.stack);

      } else {
        var jsstack = js.split("\n");
        var error = "Parse error at line #"+pos[0]+" char #"+pos[1]+" within "+ns;
        console.log(pos);
        error += "\n"+jsstack[parseInt(pos[0])-1];
        error += "\n"+(new Array(parseInt(pos[1])).join(" "))+"^";
        console.error(error);
      }
    }
    return this;
  };
  var newim = im.clone(ns);
  var nso = new filter(newim,js);
  im.filters[ns] = nso;
  return nso;
};

im.addComponent = function(ns,js,elem) {
  if (jQuery && elem instanceof jQuery) elem = elem[0];
  elem.component = function(im,js) {
    im.disable = function() {
      $(this).parent().parent().addClass('disabled');
    };
    im.enable = function() {
      $(this).parent().parent().removeClass('disabled');
    };
    this.im = im;
    warn('Loading component',im);
    try {
      eval(js);
    } catch(e) {
      error(e);
      var pos = e.stack.replace(/[\S\s]+at HTMLDivElement.eval.+?<anonymous>:(\d+:\d+)[\S\s]+/,'$1').split(':');
      var jsstack = js.split("\n");
      var error = "Parse error at line #"+pos[0]+" char #"+pos[1]+" within "+ns;
      error += "\n"+jsstack[parseInt(pos[0])-1];
      error += "\n"+(new Array(parseInt(pos[1])).join(" "))+"^";
      error(error);
    }
    return this;
  };
  var newim = im.clone(ns);
  var nso = elem.component(newim,js);
  im.components[ns] = nso;
  return nso;
};


///////////////////////////////////////////////////////////////////////////////
//                               background.js                               //
///////////////////////////////////////////////////////////////////////////////
// Set up background
im.background = new Kinetic.Layer();
im.foreground = new Kinetic.Layer();
im.stage.add(im.background);
im.stage.add(im.foreground);
im.bgimage = new Image();
im.bgimage.src = '/concrete/images/testbg.png';
im.buildBackground = function() {
  var startbb = (new Date).getTime();

  var dimensions = im.stage.getTotalDimensions();
  var to = (dimensions.max.x + dimensions.visibleHeight + dimensions.visibleWidth) * 2;

  
  if (!im.saveArea) {
    im.saveArea = new Kinetic.Rect({
      width:im.saveWidth,
      height:im.saveHeight,
      fillPatternImage: im.bgimage,
      fillPatternOffset: [-(im.saveWidth/2),-(im.saveHeight/2)],
      fillPatternScale: 1/im.scale,
      fillPatternX:0,
      fillPatternY:0,
      fillPatternRepeat:'repeat',
      x:Math.floor(im.center.x - (im.saveWidth / 2)),
      y:Math.floor(im.center.y - (im.saveHeight / 2))
    });
    im.background.add(im.saveArea);
    im.background.on('click',function(){
      im.setActiveElement(im.stage);
    });
  }

  im.saveArea.setFillPatternOffset([-(im.saveWidth/2) * im.scale,-(im.saveHeight/2) * im.scale]);
  im.saveArea.setX(Math.floor(im.center.x - (im.saveWidth / 2)));
  im.saveArea.setY(Math.floor(im.center.y - (im.saveHeight / 2)));
  im.saveArea.setFillPatternScale(1/im.scale);
  im.saveArea.setWidth(im.saveWidth);
  im.saveArea.setHeight(im.saveHeight);

  if (im.foreground) {
    im.foreground.destroy();
  }
  im.foreground = new Kinetic.Layer();
  im.stage.add(im.foreground);
  if (!im.coverLayer) {
    im.coverLayer = new Kinetic.Rect;
    im.coverLayer.setStroke('rgba(150,150,150,.5)');
    im.coverLayer.setFill('transparent');
    im.coverLayer.setDrawHitFunc(function(){});
    im.coverLayer.setStrokeWidth(Math.max(dimensions.width,dimensions.height,500));
  }
  var width = Math.max(dimensions.width,dimensions.height)*2;
  im.coverLayer.attrs.width = im.saveArea.attrs.width + width;
  im.coverLayer.attrs.height = im.saveArea.attrs.height + width;
  im.coverLayer.attrs.x = im.saveArea.attrs.x - width/2;
  im.coverLayer.attrs.y = im.saveArea.attrs.y - width/2;
  im.coverLayer.setStrokeWidth(width);
  im.foreground.add(im.coverLayer);

  im.fire('backgroundBuilt');
  im.background.draw();
  im.foreground.draw();
};

im.buildBackground();
im.on('stageChanged',im.buildBackground);


///////////////////////////////////////////////////////////////////////////////
//                               imagestage.js                               //
///////////////////////////////////////////////////////////////////////////////
im.stage.setDragBoundFunc(function(ret) {
  var dim = im.stage.getTotalDimensions();

  var maxx = Math.max(dim.max.x,dim.min.x)-1,
      minx = Math.min(dim.max.x,dim.min.x)+1,
      maxy = Math.max(dim.max.y,dim.min.y)-1,
      miny = Math.min(dim.max.y,dim.min.y)+1;

  ret.x = Math.floor(ret.x);
  ret.y = Math.floor(ret.y);

  if (ret.x > maxx) ret.x = maxx;
  if (ret.x < minx) ret.x = minx;
  if (ret.y > maxy) ret.y = maxy;
  if (ret.y < miny) ret.y = miny;

  ret.x = Math.floor(ret.x);
  ret.y = Math.floor(ret.y);

  return ret;
});
im.setActiveElement(im.stage);
im.stage.setDraggable(true);
im.autoCrop = true;
im.on('imageLoad',function(){
  var padding = 100;

  var w = im.stage.getWidth() - (padding * 2), h = im.stage.getHeight() - (padding * 2);
  if (im.saveWidth < w && im.saveHeight < h) return;
  var perc = Math.max(im.saveWidth/w, im.saveHeight/h);
  //im.scale = 1/perc;
  //im.scale = Math.round(im.scale * 1000) / 1000;
  //im.alterCore('scale',im.scale);

  //im.stage.setScale(im.scale);
  im.stage.setX((im.stage.getWidth() - (im.stage.getWidth() * im.stage.getScale().x))/2);
  im.stage.setY((im.stage.getHeight() - (im.stage.getHeight() * im.stage.getScale().y))/2);
  
  var pos = (im.stage.getDragBoundFunc())({x:im.stage.getX(),y:im.stage.getY()});
  im.stage.setX(pos.x);
  im.stage.setY(pos.y);

  im.fire('scaleChange');
  im.fire('stageChanged');
  im.buildBackground();
});

im.fit = function(wh,scale) {
  if (scale === false) {
    return {width:im.saveWidth,height:im.saveHeight};
  }
  var height = wh.height,
      width  = wh.width;

  if (width > im.saveWidth) {
    height /= width / im.saveWidth;
    width = im.saveWidth;
  }
  if (height > im.saveHeight) {
    width /= height / im.saveHeight;
    height = im.saveHeight;
  }
  return {width:width,height:height};
};


///////////////////////////////////////////////////////////////////////////////
//                                  image.js                                 //
///////////////////////////////////////////////////////////////////////////////
if (settings.src) {
  im.showLoader('Loading Image..');
  var img = new Image();
  img.src = settings.src;
  img.onload = function () {
    if (!im.strictSize) {
      im.saveWidth = img.width;
      im.saveHeight = img.height;
      im.fire('saveSizeChange');
      im.buildBackground();
    }
    var center = {
      x: Math.floor(im.center.x - (img.width / 2)),
      y: Math.floor(im.center.y - (img.height / 2))
    };
    var image = new Kinetic.Image({
      image: img,
      x: Math.floor(center.x),
      y: Math.floor(center.y)
    });
    im.fire('imageload');
    im.addElement(image,'image');
  };
} else {
  im.fire('imageload');
}


///////////////////////////////////////////////////////////////////////////////
//                                 actions.js                                //
///////////////////////////////////////////////////////////////////////////////
im.bind('imageload',function(){
  var cs = settings.controlsets || {}, filters = settings.filters || {}, namespace, firstcs;
  var running = 0;
  log('Loading ControlSets');
  im.showLoader('Loading Control Sets..');
  im.fire('LoadingControlSets');
  for (namespace in cs) {
    var myns = "ControlSet_" + namespace;
    $.ajax(cs[namespace]['src'],{
      dataType:'text',
      cache:false,
      namespace:namespace,
      myns:myns,
      beforeSend:function(){running++;},
      success:function(js){
        running--;
        var nso = im.addControlSet(this.myns,js,cs[this.namespace]['element']);
        log(nso);
        im.fire('controlSetLoad',nso);
        if (0 == running) {
          im.trigger('ControlSetsLoaded');
        }
      },
      error: function(xhr, errDesc, exception) {
        running--;
        if (0 == running) {
          im.trigger('ControlSetsLoaded');
        }
      }
    });
  }
});
im.adjustSavers = function() {
  if (im.activeElement.elementType != "stage" && im.autoCrop) {
    im.alterCore('saveWidth',Math.ceil(-(im.activeElement.getX() - im.center.x)*2));
    im.alterCore('saveHeight',Math.ceil(-(im.activeElement.getY() - im.center.y)*2));
    if ((im.activeElement.getWidth() - im.saveWidth / 2) * 2 > im.saveWidth) {
      im.alterCore('saveWidth', Math.ceil((im.activeElement.getWidth() - im.saveWidth / 2) * 2));
    }
    if ((im.activeElement.getHeight() - im.saveHeight / 2) * 2 > im.saveHeight) {
      im.alterCore('saveHeight', Math.ceil((im.activeElement.getHeight() - im.saveHeight / 2) * 2));
    }
    im.buildBackground();
    im.fire('saveSizeChange');
  }
};
im.bind('ControlSetsLoaded',function(){
  im.fire('LoadingComponents');
  im.showLoader('Loading Components..');
  var components = settings.components || {}, namespace, running = 0;
  log('Loading Components');
  for (namespace in components) {
    var myns = "Component_" + namespace;
    $.ajax(components[namespace]['src'],{
      dataType:'text',
      cache:false,
      namespace:namespace,
      myns:myns,
      beforeSend:function(){running++;},
      success:function(js){
        running--;
        var nso = im.addComponent(this.myns,js,components[this.namespace]['element']);
        log(nso);
        im.fire('ComponentLoad',nso);
        if (0 == running) {
          im.trigger('ComponentsLoaded');
        }
      },
      error: function(xhr, errDesc, exception) {
        running--;
        if (0 == running) {
          im.trigger('ComponentsLoaded');
        }
      }
    });
  }
});

im.bind('ComponentsLoaded',function(){ // do this when the control sets finish loading.
  log('Loading Filters');
  im.showLoader('Loading Filters..');
  var filters = settings.filters || {}, namespace, firstf, firstc, active = 0;
  im.fire('LoadingFilters');
  for (namespace in filters) {
    var myns = "Filter_" + namespace;
    var name = filters[namespace].name;
    if (!firstf) firstf = myns;
    active++;
    $.ajax(filters[namespace].src,{
      dataType:'text',
      cache:false,
      namespace:namespace,
      myns:myns,
      name:name,
      success:function(js){
        var nso = im.addFilter(this.myns,js);
        nso.name = this.name;
        im.fire('filterLoad',nso);
        active--;
        if (0 == active) {
          im.trigger('FiltersLoaded');
        }
      },
      error: function(xhr, errDesc, exception) {
        active--;
        if (0 == active) {
          im.trigger('FiltersLoaded');
        }
      }
    });
  }
});
im.bind('ChangeActiveAction',function(e){
  var ns = e.eventData;
  if (ns === im.activeControlSet) return;
  for (var ons in im.controlSets) {
    getElem(im.controlSets[ons]);
    if (ons !== ns) getElem(im.controlSets[ons]).slideUp();
  }
  im.activeControlSet = ns;
  im.alterCore('activeControlSet',ns);
  if (!ns) {
    $('div.control-sets',im.controlContext).find('h4.active').removeClass('active');
    return;
  }
  var cs = $(im.controlSets[ns]),
      height = cs.show().height();
  if (cs.length == 0) return;
  cs.hide().height(height).slideDown(function(){$(this).height('')});
});

im.bind('ChangeActiveComponent',function(e){
  var ns = e.eventData;
  if (ns === im.activeComponent) return;
  for (var ons in im.components) {
    if (ons !== ns) getElem(im.components[ons]).slideUp();
  }
  im.activeComponent = ns;
  im.alterCore('activeComponent',ns);
  if (!ns) return;
  var cs = $(im.components[ns]),
      height = cs.show().height();
  if (cs.length == 0) return;
  cs.hide().height(height).slideDown(function(){$(this).height('')});
});

im.bind('ChangeNavTab',function(e) {
  log('changenavtab',e);
  im.trigger('ChangeActiveAction',e.eventData);
  im.trigger('ChangeActiveComponent',e.eventData);
  var parent = getElem('div.editorcontrols');
  switch(e.eventData) {
    case 'add':
      parent.children('div.control-sets').hide();
      parent.children('div.components').show();
      break;
    case 'edit':
      parent.children('div.components').hide();
      parent.children('div.control-sets').show();
      break;
  }
});


im.bind('FiltersLoaded',function(){
  im.hideLoader();
});


///////////////////////////////////////////////////////////////////////////////
//                                slideOut.js                                //
///////////////////////////////////////////////////////////////////////////////
im.slideOut = $("<div/>").addClass('slideOut').css({
  width:0,
  float:'right',
  height:'100%',
  'overflow-x':'hidden',
  right:im.controlContext.width()-1,
  position:'absolute',
  background:'white',
  'box-shadow':'black -20px 0 20px -25px'
});

im.slideOutContents = $('<div/>').appendTo(im.slideOut).width(300);
im.showSlideOut = function(contents,callback) {
  im.hideSlideOut(function(){
    im.slideOut.empty();
    im.slideOutContents = contents.width(300);
    im.slideOut.append(im.slideOutContents)
    im.slideOut.addClass('active').addClass('sliding');
    im.slideOut.stop(1).slideOut(300,function(){
      im.slideOut.removeClass('sliding');
      ((typeof callback === 'function') && callback());
    });
  });
};
im.hideSlideOut = function(callback) {
  im.slideOut.addClass('sliding');
  im.slideOut.slideIn(300,function(){
    im.slideOut.css('border-right','0');
    im.slideOut.removeClass('active').removeClass('sliding');
    ((typeof callback === 'function') && callback());
  });
};
im.controlContext.after(im.slideOut);


///////////////////////////////////////////////////////////////////////////////
//                              jquerybinding.js                             //
///////////////////////////////////////////////////////////////////////////////
// End the ImageEditor object.

  
  im.setActiveElement(im.stage);

  window.c5_image_editor = im; // Safe keeping
  window.im = im;
  return im;
};
$.fn.ImageEditor = function (settings) {
  (settings === undefined && (settings = {}));
  settings.imageload = $.fn.dialog.hideLoader;
  var self = $(this);
  settings.container = self[0];
  if (self.height() == 0) {
    setTimeout(function(){
      self.ImageEditor(settings);
    },50);
    return;
  }
  self.closest('.ui-dialog').find('.ui-resizable-handle').hide();
  self.height("-=30");
  self.width("-=330").parent().width("-=330").children('div.bottomBar').width("-=330");
  (settings.width === undefined && (settings.width = self.width()));
  (settings.height === undefined && (settings.height = self.height()));
  $.fn.dialog.showLoader();
  var im = new ImageEditor(settings);

  var context = im.domContext;
  im.on('ChangeActiveAction',function(e){
    if (!e.eventData)
      $('h4.active',context).removeClass('active');
  });
  im.on('ChangeActiveComponent',function(e){
    if (!e.eventData)
      $('h4.active',context).removeClass('active');
  });
  $('div.controls',context).children('div.save').children('button.save').click(function(){
    im.save();
  }).end().children('button.cancel').click(function(){
    if (confirm("Are you certain?"))
      $.fn.dialog.closeTop();
  });
  $('div.controls',context).children('ul.nav').children().click(function(){
    if ($(this).hasClass('active')) return false;
    $('div.controls',context).children('ul.nav').children().removeClass('active');
    $(this).addClass('active');
    im.trigger('ChangeNavTab',$(this).text().toLowerCase());
    return false;
  });
  $('div.controlset',context).find('div.control').children('div.contents').slideUp(0)
  .end().end().find('h4').click(function(){
    if ($(this).parent().hasClass('disabled')) return;
    $(this).addClass('active');
    $('div.controlset',context).find('h4').not($(this)).removeClass('active');
    var ns = $(this).parent().attr('data-namespace');
    im.trigger('ChangeActiveAction',"ControlSet_"+ns);
  });

  $('div.component',context).find('div.control').children('div.contents').slideUp(0).hide()
  .end().end().find('h4').click(function(){
    if ($(this).hasClass('active')) return false;
    $(this).addClass('active');
    $('div.component',context).children('h4').not($(this)).removeClass('active');
    var ns = $(this).parent().attr('data-namespace');
    im.trigger('ChangeActiveComponent',"Component_"+ns);
  });
  $('div.components').hide();

  im.bind('imageload', $.fn.dialog.hideLoader);
  return im;
};
$.fn.slideOut = function(time,callback) {
  var me = $(this),
      startWidth = me.width(), 
      totalWidth = 300;
  me.css('overflow-y','auto');
  if (startWidth == totalWidth) {
    me.animate({width:totalWidth},0,callback);
    return this;
  };
  me.width(startWidth).animate({width:totalWidth},time || 300,callback || function(){});
  return this;
};
$.fn.slideIn = function(time,callback) {
  var me = $(this);
  me.css('overflow-y','hidden');
  if (me.width() === 0) {
    me.animate({width:0},0,callback);
    return this;
  };
  me.animate({width:0},time || 300,callback || function(){});
  return this;
};


///////////////////////////////////////////////////////////////////////////////
//                                 filters.js                                //
///////////////////////////////////////////////////////////////////////////////
ImageEditor.prototype = ImageEditor.fn = {
  filter: {
    grayscale: Kinetic.Filters.Grayscale,
    sepia: function (imageData) {
      var i;
      var data = imageData.data;
      for (i = 0; i < data.length; i += 4) {
        data[i]     = (data[i] * 0.393 + data[i + 1] * 0.769 + data[i + 2] * 0.189);
        data[i + 1] = (data[i] * 0.349 + data[i + 1] * 0.686 + data[i + 2] * 0.168);
        data[i + 2] = (data[i] * 0.272 + data[i + 1] * 0.534 + data[i + 2] * 0.131);
      }
    },
    brightness: function (imageData,ob) {
      var adjustment = ob.level;
      var d = imageData.data;
      for (var i=0; i<d.length; i+=4) {
        d[i] += adjustment;
        d[i+1] += adjustment;
        d[i+2] += adjustment;
      }
    },
    invert: function (imageData,ob) {
      var d = imageData.data;
      for (var i=0; i<d.length; i+=4) {
        d[i] = 255 - d[i];
        d[i+1] = 255 - d[i+1];
        d[i+2] = 255 - d[i+2];
      }
    },
    restore: function (imageData,ob) {
      var adjustment = ob.level;
        var d = imageData.data;
        var g = ob.imageData.data;
      for (var i=0; i<d.length; i+=4) {
        d[i] = g[i];
        d[i+1] = g[i+1];
        d[i+2] = g[i+2];
      }
    }
  }
};


///////////////////////////////////////////////////////////////////////////////
//                                  foot.js                                  //
///////////////////////////////////////////////////////////////////////////////
})(window,jQuery,Kinetic);