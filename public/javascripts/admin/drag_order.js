var DragOrder = Class.create({
  
  // Constants
  BEFORE    : 0,
  AFTER     : 1,
  CHILD     : 2,
  CHILD_PAD : 21,
  NO_COPY   : 0,
  COPY      : 1,
  
  // Defaults
  origRow   : null,
  expandObj : null,
  rowHeight : 0,
  dragLine  : null,
  moveTo    : null,
  
  initialize: function(table) {
    // Needed in order to use SiteMap function. Already created in sitemap.js,
    // but cannot be referred to...
    this.sMap = new SiteMap( new Element('table') );
    
    // Attach listeners to drag images in table
    var _this = this;
    Event.observe( $(table), 'mousedown', function(evt){
      if ($(evt.target.parentNode).hasClassName('drag_order') && evt.target.tagName.toLowerCase() == 'img')
        _this.rowDragStart(evt);
    }.bindAsEventListener(this) );
    document.dragOrderObj = this;
  },
  
  rowDragStart: function(evt) {
    // Store original row, give it a color, store the height of the row and initialise some objects
    this.origRow = evt.findElement('tr');
    this.origRow.addClassName('dragging');
    this.rowHeight = this.origRow.getHeight();
    this.moveTo = new Object();
    this.expandObj = new Object();
    this.childEdge = $(evt.target).cumulativeOffset().left + $(evt.target).getWidth();
    
    // Attach event listeners for the movement
    this.moveBind = this.rowDragMove.bindAsEventListener(this);
    Event.observe($(document.body), 'mousemove', this.moveBind);
    this.stopBind = this.rowDragStop.bindAsEventListener(this);
    Event.observe($(document.body), 'mouseup', this.stopBind);
    
    return this.cancelEvent(evt);
  },
  
  rowDragMove: function(evt) {
    // If no origRow is available, we've come here by mistake
    if (!this.origRow) return false;
    
    // Create dragline
    if (!this.dragLine) {
      this.dragLine = new Element('div');
      this.dragLine.id = 'drag_line';
      this.dragLine.setStyle({
        position: 'absolute'
      });
      this.dragLine.innerHTML = "line";
      dragLineCircle = new Element('div');
      this.dragLine.appendChild(dragLineCircle);
      document.body.appendChild(this.dragLine);
    }
    else
      this.dragLine.show();
    
    // If children are visible, hide them first
    if (this.sMap.isExpanded(this.origRow))
      this.sMap.hideBranch(this.origRow, this.origRow.getElementsByClassName('expander')[0] );
    
    // Loop through all rows
    var _this = document.dragOrderObj;
    var top;
    this.origRow.parentNode.getElementsBySelector('tr').find(function(obj){
      top = obj.cumulativeOffset().top;
      
      // Check if cursor is over row
      if (evt.pageY >= top && evt.pageY <= top + _this.rowHeight) {
        
        // If row has children and is collapsed, create timer for expansion
        if (obj.hasClassName('children-hidden') && _this.expandObj != obj) {
          _this.expandObj.row = obj;
          if (_this.expandObj.timer)
            clearTimeout(_this.expandObj.timer);
          _this.expandObj.timer = setTimeout("document.dragOrderObj.rowDragExpand();", 750);
        }
        else if (_this.expandObj != obj) {
          _this.expandObj.row = null;
          clearTimeout(_this.expandObj.timer);
        }
        
        var targetRow = null;
        var targetLoc;
        // If on the upper half of the row, put the dragline at the top of the row (= bottom of previous)
        if (evt.pageY >= top && evt.pageY <= top + _this.rowHeight / 2 && obj.previous()) {
          if (obj.previous().hasClassName('children-visible')) {
            targetRow = obj;
            targetLoc = _this.BEFORE;
          }
          else {
            targetRow = _this.sMap.extractLevel(obj.previous()) > _this.sMap.extractLevel(obj) ? obj : obj.previous();
            targetLoc = _this.sMap.extractLevel(obj.previous()) > _this.sMap.extractLevel(obj) ? _this.BEFORE : _this.AFTER;
          }
        }
        // If on the lower half of the row, put the line at the bottom of the row
        else if (evt.pageY > top + _this.rowHeight / 2 && evt.pageY <= top + _this.rowHeight) {
          // Check for moving as new child
          if (obj != _this.origRow && !_this.sMap.hasChildren(obj) && evt.pageX > _this.childEdge) {
            targetRow = obj;
            targetLoc = _this.CHILD;
          }
          else {
            targetRow = obj.hasClassName('children-visible') ? obj.next() : obj;
            targetLoc = obj.hasClassName('children-visible') ? _this.BEFORE : _this.AFTER;
          }
        }
        
        // Check for copy action
        var copy = evt.ctrlKey || evt.metaKey ? true : false;
        if (copy)
          _this.dragLine.getElementsByTagName('div')[0].addClassName('copy');
        else
          _this.dragLine.getElementsByTagName('div')[0].removeClassName('copy');
      }
      
      // If a row has been found
      if (targetRow) {
        // Set the dragline
        var padding = parseInt(targetRow.firstDescendant().getStyle('padding-left')) + 30;
        _this.dragLine.style.width = targetRow.getWidth() - padding - (targetLoc == _this.CHILD ? _this.CHILD_PAD : 0) + 'px';
        _this.dragLine.setStyle({
          left: targetRow.cumulativeOffset().left + padding + (targetLoc == _this.CHILD ? _this.CHILD_PAD : 0) + 'px',
          top: targetRow.cumulativeOffset().top + (targetLoc == _this.AFTER  || targetLoc == _this.CHILD ? _this.rowHeight : 0) - 1 + 'px'
        });
        
        // Store the found row and options
        _this.moveTo.hovering = obj;
        _this.moveTo.relativeTo = targetRow;
        _this.moveTo.side = targetLoc;
        _this.moveTo.copy = copy;
        
        return true;
      }
      
    });
    
    return this.cancelEvent(evt);
  },
  
  rowDragExpand: function(row) {
    row = this.expandObj.row;
    this.sMap.showBranch(row, row.getElementsByClassName('expander')[0] );
  },
  
  rowDragStop: function() {
    
    if (this.moveTo.relativeTo && (this.moveTo.hovering != this.origRow || this.moveTo.copy))
      window.location.href = "/admin/pages/" + this.sMap.extractPageId(this.origRow) + "/move_to/" + this.sMap.extractPageId(this.moveTo.relativeTo) + "/" + this.moveTo.side + "/" + (this.moveTo.copy ? this.COPY : this.NO_COPY);
    else {  
      // Cleanup not necessary when redirected
      this.origRow.removeClassName('dragging');
      
      this.origRow = null;
      if (this.expandObj.timer) clearTimeout(this.expandObj.timer);
      this.expandObj = null;
      if (this.dragLine) this.dragLine.hide();
    }  
      
    Event.stopObserving(document.body, 'mousemove', this.moveBind);
    Event.stopObserving(document.body, 'mouseup', this.stopBind);
  },
  
  cancelEvent: function(evt) {
    // Cancel default event actions
    evt.returnValue = false;
    evt.cancel = true;
    if (evt.preventDefault) evt.preventDefault();
    return false;
  }
  
});

// If the DOM is loaded, create the DragOrder object
document.observe('dom:loaded', function() {
  when('table.index', function(table){
  if(table.identify() == 'site-map')
    new DragOrder(table);
  });
});