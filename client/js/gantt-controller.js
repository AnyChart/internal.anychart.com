class GanttController extends EventTarget {
    constructor() {
        super();
        this.selectedItem = null;
    }

    init(data, container = 'chart_container') {
        this.isInitial = !data.length;
        return new Promise((resolve, reject) => {
            this.tree = anychart.data.tree(data, 'as-table');
            this.chart = anychart.ganttProject();

            this.initChartListeners();
            this.initTreeListeners();

            this.chart.data(this.tree);
            this.chart.container(container);
            this.chart.draw();
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
            console.log(this);
        });
    }


}