class GanttResourceController extends EventTarget {
    constructor() {
        super();
        this.selectedItem = null;
    }

    init(data, container = 'chart_container') {
        this.isInitial = !data.length;
        return new Promise((resolve, reject) => {
            anychart.format.outputTimezone((new Date).getTimezoneOffset());
            
            this.tree = anychart.data.tree(data, 'as-table');
            this.chart = anychart.ganttResource();

            this.chart.splitterPosition('20%')

            this.chart.xScale().minimumGap(0.2).maximumGap(0.2);

            this.chart.getTimeline().tooltip().titleFormat(function(){
                return this.period ? (
                    this.period.name + (this.period.parentName ? ` (${this.period.parentName})`:'')
                    ) : this.name;
            })

            this.chart.getTimeline().periods().stroke('black').fill('blue 0.4')

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
            // this.chart.zoomTo(now - (3 * 24 * 60 * 60 * 1000), now + (6 * 24 * 60 * 60 * 1000));
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