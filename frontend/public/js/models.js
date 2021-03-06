(function ($) {
  $.fn.findByData = function (prop, val) {
    var $self = this;
    if (typeof val === 'undefined') {
      return $self.filter(
        function () { return typeof $(this).data(prop) !== 'undefined'; }
      );
    }
    return $self.filter(
      function () { return $(this).data(prop) == val; }
    );
  };
})(window.jQuery);

$(function() {
  var filters = {};
  var ranges = {};
  var newKey = null;
  var newVal = null;
  var rangeId = 0;
  var supportsRange = false;
  var sortOrder = 'asc';
  var sortKey = null;
  var numModels = $('.model').length;
  console.log(numModels);

  $(document).on('click', '.menu-icon', function(event) {
    var open = $($('.menu')[0]).hasClass('open');
    $('.menu').toggleClass('open');
    var px = open ? "-325px" : "0px";
    $('.menu').animate({
      right: px
    }, 500);

    var px = open ? "0px" : "325px";
    $('.chart-close').animate({
      right: px
    }, 200);
  });


  $(document).on('click', '.hyperparams-container', function(event) {
    var params = $(event.target).find('.hyperparams');
    if (params.hasClass('hyperparams-show')) {
      params.removeClass('hyperparams-show');
      params.hide();
    } else {
      params.addClass('hyperparams-show');
      params.show();
    }
  });

  $(document).on('click', '.dfmetadata-container', function(event) {
    var params = $(event.target).find('.dfmetadata');
    if (params.hasClass('dfmetadata-show')) {
      params.removeClass('dfmetadata-show');
      params.hide();
    } else {
      params.addClass('dfmetadata-show');
      params.show();
    }
  });

  $(document).mouseup(function (e) {
    var elt = $(e.target);
    if (!(elt.hasClass('popup-container') ||
      elt.closest('.popup-container').length == 1)) {
      $('.hyperparams').hide();
      $('.hyperparams-show').removeClass('hyperparams-show');
      $('.dfmetadata').hide();
      $('.dfmetadata-show').removeClass('dfmetadata-show');
    }
    if (!($(e.target).hasClass('filters') || $(e.target).hasClass('sort'))) {
      newKey = null;
      newVal = null;
      sortKey = null;
    }
  });

  $('.filter-area').on('mouseup', function() {
    if (newKey != null && newVal != null) {
      if (supportsRange) {
        addRange(newKey);
      } else {
        addFilter(newKey, newVal);
      }
    }
    newKey = null;
    newVal = null;
    sortKey = null;
  });

  $('.sort-area').on('mouseup', function() {
    if (sortKey != null) {
      addSort(sortKey);
      sort(sortKey, sortOrder);
    }
    newKey = null;
    newVal = null;
    sortKey = null;
  });

  $(document).on('click', '.filter-close', function(event) {
    var filter = $(event.target).parent('.filter');
    var key = filter.data('key');
    filter.remove();
    removeFilter(key);
  });

  $(document).on('click', '.range-close', function(event) {
    var range = $(event.target).parent('.range');
    var id = range.data('id');
    range.remove();

    $('.loader').show();
    removeRange(id);
  });

  $(document).on('click', '.sort-close', function(event) {
    var sortDiv = $(event.target).parent('.sort');
    sortDiv.remove();

    $('.loader').show();
    setTimeout(function() {
      sort('Model ID', 'asc');
      $('.loader').hide();
    }, numModels);
  });

  $(document).on('click', '.chart-close', function(event) {
    $('.model-chart').html("");
  });

  $(document).on('click', '.group-header', function(event) {
    var group = $($(event.target).closest('.models-group'));
    if (group.hasClass("hide-group")) {
      group.removeClass("hide-group");
      group.css("height", "auto");
      var height = group.height();
      group.css("height", "48px");
      group.animate({height: height+"px"}, 300, function() {
        group.css({"height": "auto", "overflow": "visible"});
      });
    } else {
      group.addClass("hide-group");
      group.animate({height: "48px"}, 300, function() {
        group.css({"overflow": "hidden"});
      });
    }
  });

  $(document).on('change', '.range-options select, .range-options input', function(event) {
    var range = $(this).closest('.range');
    var id = range.data('id');
    var key = range.data('key');
    var val = range.find('input').val();
    var type = range.find('select').val();
    updateRange(id, key, val, type);
  });

  $(document).on('change', '.sort-order', function(event) {
    sortOrder = event.target.value;
    sort($('.sort').data('key'), sortOrder);
  });

  $(document).on('change', '.group-table', function(event) {
    $('.loader').show();
    setTimeout(function() {
      var groupkey = event.target.value;
      groupModels(groupkey);
      $('.loader').hide();
    }, numModels);
  });

  $('.model-config').draggable({
    revert: true,
    revertDuration: 0,
    start: dragStart
  });

  $('.model-metric').draggable({
    revert: true,
    revertDuration: 0,
    start: dragStart
  });

  $('.kv:not(.nkv)').draggable({
    revert: true,
    revertDuration: 0,
    start: dragStart
  });

  function dragStart(event, ui) {
    newKey = ui.helper.data('key');
    newVal = ui.helper.data('val');
    sortKey = newKey;
    supportsRange = ui.helper.data('num');
  }

  function addFilter(key, val) {
    if (filters.hasOwnProperty(key)) {
      // update existing filter
      filters[key] = val;
      var filterDiv = $('.filter').findByData('key', key);
      filterDiv.find('.filter-val').html(val);
    } else {
      // add new filter
      filters[key] = val;
      var filterDiv = getFilterDiv(key,val);
      $('.filter-area').append(filterDiv);
    }

    // update models visually
    filter();
  }

  function removeFilter(key) {
    delete filters[key];

    // update models visually
    filter();
  }

  function addRange(key) {
    var rangeDiv = getRangeDiv(key);
    rangeDiv.data('key', key);
    rangeDiv.data('id', rangeId);
    rangeId += 1;
    $('.filter-area').append(rangeDiv);
  }

  function updateRange(id, key, val, type) {
    ranges[id] = {
      "key": key,
      "val": val,
      "type": type
    };
    filter();
  }

  function removeRange(id) {
    delete ranges[id];
    filter();
  }

  function addSort(key) {
    var sortDiv = getSortDiv(key);
    $('.sort').remove();
    console.log(sortDiv);
    $('.sort-area').append(sortDiv);
  }

  function getFilterDiv(key, val) {
    var div = $(
      '<div class="filter">' +
      '<div class="filter-key">'+ key + '</div>:'+
      '<div class="filter-val">'+ val + '</div>' +
      '<div class="filter-close">X</div>' +
      '</div>'
    );
    div.data('key', key);
    div.data('val', val);

    return div;
  }

  function getRangeDiv(key) {
    var div = $(
      '<div class="range">' +
      '<div class="range-key">' + key + '</div>' +
      '<div class="range-close">X</div>' +
      '<div class="range-options">' +
      '<select><option value="<"><</option><option value=">">></option></select>' +
      '<input class="range-input" type="text"></input>' +
      '</div>' +
      '</div>'
    );
    return div;
  }

  function getSortDiv(key) {
    var div = $(
      '<div class="sort">' + key +
      '<div class="sort-close">X</div>' +
      '</div>'
    );
    div.data('key', key);
    return div;
  }

  function sort(key, order) {
    var options = {
      data: "val",
      order: order
    };
    options.selector = '.kv[data-key="' + key + '"], .nkv[data-key="' + key + '"]';
    var groups = $('.models-group');
    for (var i=0; i<groups.length; i++) {
      tinysort($($('.models-group')[i]).find('.model'), options);
    }
  }

  function filter() {
    $('.loader').show();
    setTimeout(function() {
      var models = $('.model');
      var show = Array(models.length).fill(true);
      for (var key in filters) {
        if (filters.hasOwnProperty(key)) {
          filterByKey(key, filters[key], show);
        }
      }

      for (var id in ranges) {
        if (ranges.hasOwnProperty(id)) {
          var key = ranges[id].key;
          var val = ranges[id].val;
          var type = ranges[id].type;
          filterByRange(key, val, type, show);
        }
      }

      for (var i=0; i<show.length; i++) {
        if (show[i]) {
          $(models[i]).data('show', true);
          $(models[i]).slideDown();
         } else {
          $(models[i]).data('show', false);
          $(models[i]).slideUp()
        }
      }

      groupModels($('.group-table').val());
      $('.loader').hide();
    }, numModels);
  };

  function filterByKey(key, val, show) {
    let models = $('.model');
    for (var i=0; i<models.length; i++) {
      let fields = $(models[i]).find('.kv');
      let field = fields.findByData('key', key)[0];
      if (field && $(field).data('val') === val) {
        // console.log('match');
      } else {
        show[i] = false;
      }
    }
  };

  function filterByRange(key, val, type, show) {
    if (isNaN(parseFloat(val))) {
      return;
    } else {
      let models = $('.model');
      for (var i=0; i<models.length; i++) {
        let fields = $(models[i]).find('.kv');
        let field = fields.findByData('key', key)[0];
        if (field) {
          if (type === "<") {
            show[i] = show[i] && ($(field).data('val') < parseFloat(val));
          } else if (type === ">") {
            show[i] = show[i] && ($(field).data('val') > parseFloat(val));
          }
        } else {
          show[i] = false;
        }
      }
    }
  }

  function groupModels(key) {
    // get rid of old groups
    var groups = $('.models-group');
    for (var i=0; i<groups.length; i++) {
      $(groups[i]).data('groupkey', 'delete');
    }

    var models = $('.model');
    if (key == "None") {
      // no grouping
      group = $('<div data-groupkey="' + key + '" data-groupval="None"></div>');
      group.addClass("models-group");
      for (var i=0; i<models.length; i++) {
        group.append($(models[i]));
        $('.models').append(group);
      }
    } else {
      // separate into groups
      for (var i=0; i<models.length; i++) {
        let fields = $(models[i]).find('.kv');
        let field = fields.findByData('key', key)[0];
        var val = $(field).data('val');
        if (val == null) {
          val = "undefined";
        }
        var group = $('.models-group').filter(function() {
          return ($(this).data('groupkey') == key && $(this).data('groupval') == val);
        });
        if (group.length == 0) {
          // create new group
          group = $('<div data-groupkey="' + key + '" data-groupval="' + val + '"></div>');
          group.addClass("models-group");
          group.addClass("hide-group");
          if (key != "None") {
            group.append($('<div class="group-header">' + key + ': ' + val + '</div>'));
          }
          group.append($(models[i]));
          $('.models').append(group);
          group.css('height', '48px');
        } else {
          // add to existing group
          $(group[0]).append($(models[i]));
        }
      }
    }

    // remove old groups and add numbers
    var groups = $('.models-group');
    for (var i=0; i<groups.length; i++) {
      if ($(groups[i]).data('groupkey') != key) {
        $(groups[i]).remove();
      } else {
        var header = $(groups[i]).find('.group-header');
        var numModels = $(groups[i]).children().filter(function() {
          return $(this).data('show');
        });
        numModels = numModels.length;
        var text = numModels == 1 ? " model" : " models";
        $(header).append($('<div class="group-num-models"> ('
          + numModels + text
          + ')</div>'));
      }
    }

    // sort groups
    var options = {
      data: "groupval",
      order: "asc"
    };
    tinysort($('.models-group'), options);
    $('.sort-order').trigger('change');
  }
});