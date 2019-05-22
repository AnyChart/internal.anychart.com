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

            const dataGrid = this.chart.dataGrid();

            dataGrid.column(1).labelsOverrider(boldLabelsOverrider)

            dataGrid.column(2, {
                title: "Leader",
                width: "45%",
                format: "{%leader}",
                labelsOverrider: boldLabelsOverrider
            });

            this.chart.splitterPosition('25%')

            this.chart.xScale().minimumGap(0.2).maximumGap(0.2);

            // Commented for a while because of timeline marker bug.
            // this.chart.getTimeline().lineMarker(0).value('current').stroke('2 green');

            var now = (new Date()).getTime();
            this.chart.getTimeline().lineMarker(0)
                .value(now)
                .stroke('2 red')
                .zIndex(50);

            this.initChartListeners();
            this.initTreeListeners();

            this.chart.data(this.tree);
            this.chart.container(container);
            this.chart.draw();
            this.chart.fitAll();
            this.chart.zoomTo(now - (3 * 24 * 60 * 60 * 1000), now + (6 * 24 * 60 * 60 * 1000));
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