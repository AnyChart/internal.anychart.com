class GanttController extends EventTarget {
    constructor() {
        super();
        this.selectedItem = null;
    }

    init(data, container = 'chart_container') {
        return new Promise((resolve, reject) => {
            anychart.format.outputTimezone((new Date).getTimezoneOffset());
            function boldLabelsOverrider(label, dataItem) {
                if (dataItem.numChildren()) {
                    label.fontWeight('bold').fontStyle('italic');
                }
            }

            this.tree = anychart.data.tree(data, 'as-table');
            this.chart = anychart.ganttProject();

            this.toolbar = anychart.ui.ganttToolbar();
            this.toolbar.container(container);
            this.toolbar.target(this.chart);

            const dataGrid = this.chart.dataGrid();
            dataGrid.edit(true);
            dataGrid.onEditStart(() => null); //prevents rows editing.

            const indexColumn = dataGrid.column(0);
            indexColumn.labels()
                .useHtml(true)
                .format(function() {
                    const item = this.item;
                    let rv = String(this.linearIndex);
                    if (!item.numChildren())
                        rv += ` <span class="ac ac-trash-o" style="color: red; cursor: pointer" onclick="removeTask(${this.item.get('id')}, '${this.item.get('name')}')"></span>`;
                    return rv;
                });

            const taskColumn = dataGrid.column(1);
            taskColumn
                .title('Task')
                .labelsOverrider(boldLabelsOverrider)
                .labels()
                    .useHtml(true)
                    .format(function() {
                        const item = this.item;
                        const url = item.get('url');
                        const name = item.get('name');
                        return url ? `<a href="${url}" target="_blank">${name}</a>` : name;
                    });

            const assigneeColumn = dataGrid.column(2);
            assigneeColumn
                .title('Assignee')
                .width('25%')
                .labels()
                    .useHtml(true)
                    .format('<img src="{%userAvatar}" style="width: 16px; max-height: 14px;"> {%userName}')

            const progressColumn = dataGrid.column(3);
            progressColumn
                .title('%')
                .width(40)
                .labelsOverrider(boldLabelsOverrider)
                .labels()
                    .format('{%progress}');

            this.chart.splitterPosition('30%')

            
            this.chart.xScale().minimumGap(0.2).maximumGap(0.2);
            this.chart.getTimeline().lineMarker(0).value('current').stroke('3 green');

            this.initChartListeners();
            this.initTreeListeners();

            this.chart.data(this.tree);
            this.chart.container(container);
            this.toolbar.draw();
            this.chart.draw();
            
            if (isNaN(+min) || isNaN(+max))
                this.chart.fitAll();
            else
                this.chart.zoomTo(+min, +max);
            //this.chart.zoomTo(now - (3 * 24 * 60 * 60 * 1000), now + (6 * 24 * 60 * 60 * 1000));
            resolve();
        });
    }

    initTreeListeners() {
        this.tree.listen('treeItemMove', function(e) {
            preloader.visible(false);
            const destination = e.target;
            const item = e.item;
            let newParent = destination ? destination.get('id') : null;
            const taskData = tasksStorage.getData(item.get('id'));
            taskData.parent = newParent;
            $.post(
                '/tasks/update',
                taskData,
                (tasks) => {
                    if (tasks.message) {
                        console.error(tasks);
                    } else {
                        preloader.visible(false);
                    }
                }
            );
        });
    }

    initChartListeners() {
        this.chart.listen('rowSelect', (e) => {
            if (e.item) {
                this.selectedItem = e.item;
                const ev = new Event('itemSelect');
                ev.item = e.item;
                this.dispatchEvent(ev);
            } else {
                this.selectedItem = null;
                const ev = new Event('itemDeselect');
                this.dispatchEvent(ev);
            }
        });
    }


}