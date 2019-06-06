class GanttController extends EventTarget {
    constructor() {
        super();
        this.selectedItem = null;
    }

    init(data, container = 'chart_container') {
        this.isInitial = !data.length;
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

            dataGrid.column(1).labelsOverrider(boldLabelsOverrider)

            dataGrid.column(2, {
                title: "Leader",
                width: "25%",
                format: "{%leader}",
                labelsOverrider: boldLabelsOverrider
            });
            dataGrid.column(3, {
                title: "Progress",
                width: "25%",
                format: "{%progress}",
                labelsOverrider: boldLabelsOverrider
            });

            this.chart.splitterPosition('30%')

            dataGrid.column(1).title('Task');
            this.chart.xScale().minimumGap(0.2).maximumGap(0.2);

            this.chart.getTimeline().lineMarker(0).value('current').stroke('2 green');

            this.initChartListeners();
            this.initTreeListeners();

            this.chart.data(this.tree);
            this.chart.container(container);
            this.toolbar.draw();
            this.chart.draw();
            // this.chart.edit(true);
            this.chart.fitAll();
            //this.chart.zoomTo(now - (3 * 24 * 60 * 60 * 1000), now + (6 * 24 * 60 * 60 * 1000));
            resolve();
        });
    }

    initTreeListeners() {

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