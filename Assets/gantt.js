KB.on("dom.ready", function () {
  if (KB.exists("#gantt-chart")) {
    console.log("load gantt chart");

    var default_view_mode = "Week",
      allowed_view_modes = ["Day", "Week", "Month", "Year"];

    if (
      ($ls = localStorage.getItem("gantt_view_mode")) &&
      jQuery.inArray($ls, allowed_view_modes) > -1
    ) {
      default_view_mode = $ls;
      jQuery("ul.gantt li").removeClass("active");
      jQuery(
        '.gantt-change-mode[data-mode-view="' + default_view_mode + '"]'
      ).addClass("active");
    }

    var task_load_url = jQuery("#gantt-chart").data("load-url");

    $.getJSON(task_load_url, function (data) {
      var tasks = data.tasks;

      // remove loading spinner
      jQuery("#gantt-chart").html("");

      var gantt = new Gantt("#gantt-chart", initGanttTasks(tasks), {
        view_modes: allowed_view_modes,
        view_mode: default_view_mode,
        date_format: "YYYY-MM-DD",
		bar_height: 40,
		popup_trigger: 'mouseover',
        custom_popup_html: function (task) {
          function format_date(oDate) {
            if (oDate.getHours() === 0 && oDate.getMinutes() === 0) {
              return oDate.toLocaleDateString();
            } else {
              return oDate.toLocaleString();
            }
          }
          task.start_date = format_date(task._start);
          task.end_date = format_date(task._end);
          // TODO: add more info and translate text
          var html = jQuery("#gantt-popup-template").html();
          var matches = html.match(/\$\{([\w-_\.]*)\}/g);
          if (matches) {
            jQuery.each(matches, function (i, taskValue) {
              var _taskValue = taskValue.slice(2, -1).split(".");
              if (_taskValue.length > 1 && task.hasOwnProperty(_taskValue[1])) {
                html = html.replace(taskValue, task[_taskValue[1]]);
              } else if (
                _taskValue.length == 1 &&
                task.hasOwnProperty(_taskValue[0])
              ) {
                html = html.replace(taskValue, task[_taskValue[0]]);
              } else {
                var $div = jQuery("<div/>");
                $div.append(html);
                ($el = jQuery(
                  'td:contains("' + taskValue + '")',
                  jQuery($div)
                )) &&
                  $el.parent() &&
                  $el.parent().remove();
                html = $div.html();
              }
            });
          }
          return html;
        },
        language: jQuery("html").attr("lang"),
        on_click: function (task) {
          //console.log(task);
          //window.open(task.url);
        },
        on_date_change: function (task, start, end) {
          console.log(task, start, end);

          //get save url
          var sUrl = jQuery("#gantt-chart").data("save-url");

          var oValues = {
            id: task.id,
            start: start,
            end: end,
          };

          $.ajax({
            cache: false,
            url: sUrl,
            contentType: "application/json",
            type: "POST",
            processData: false,
            data: JSON.stringify(oValues),
          });
        },
      });

      // handler to toggle task on first colum
      jQuery(document).on("change", "#hide-first-column", function (t) {
        if (typeof gantt === "undefined") {
          return;
        }

        var columIdToHide = "0"; // coz localStorage accepts strings
        if (jQuery(this).is(":checked")) {
          columIdToHide = jQuery(this).val().toString();
        }

        localStorage.setItem("gantt_hide_first_colum", columIdToHide);

        gantt.refresh(initGanttTasks(tasks, columIdToHide));
      });

      // remove resize handles for the moment
      /*var handles = document.querySelectorAll("#gantt-chart .handle-group");
            for (var i = 0; i < handles.length; i++) {
                handles[i].remove();
            }*/

      console.log("gantt chart loaded");

      KB.onClick(".gantt-change-mode", function (element) {
        var mode = jQuery(element.srcElement).data("modeView");
        if (mode && jQuery.inArray(mode, allowed_view_modes) > -1) {
          gantt.change_view_mode(mode);
          localStorage.setItem("gantt_view_mode", mode);
          jQuery(".gantt-change-mode").removeClass("active");
          KB.dom(element.srcElement).addClass("active");
        }
      });
    });
  }
});

function initGanttTasks(_tasks, columIdToHide) {
  var tasksData = [];
  var columnToHide =
    typeof columIdToHide !== "undefined"
      ? columIdToHide
      : jQuery.isNumeric(localStorage.getItem("gantt_hide_first_colum"))
      ? localStorage.getItem("gantt_hide_first_colum")
      : "0";

  if (columnToHide && parseInt(columnToHide) > 0) {
    jQuery("#hide-first-column").attr("checked", "checked");
    jQuery.each(_tasks, function (i, t) {
      if (columnToHide != t.column_id) {
        tasksData.push(t);
      }
    });

    return tasksData;
  }

  return _tasks;
}
