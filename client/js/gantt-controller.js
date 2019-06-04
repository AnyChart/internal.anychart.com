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

            const dg = this.chart.dataGrid();
            const tl = this.chart.getTimeline();

            dg.column(1).title('Task');
            this.chart.xScale().minimumGap(0.2).maximumGap(0.2);

            // Commented for a while because of timeline marker bug.
            // this.chart.getTimeline().lineMarker(0).value('current').stroke('2 green');

            const tooltipFormat = function() {
                let format = `Actual Start: ${anychart.format.dateTime(this.actualStart || this.autoStart, 'd MMM yyyy')}`;
                if (this.actualEnd || this.autoEnd)
                    format = `${format}\Actual End: ${anychart.format.dateTime(this.actualEnd || this.autoEnd, 'd MMM yyyy')}`;
                if (this.baselineStart)   
                    format = `${format}\nPlanned Start: ${anychart.format.dateTime(this.baselineStart, 'd MMM yyyy')}`; 
                if (this.baselineEnd)   
                    format = `${format}\nPlanned End: ${anychart.format.dateTime(this.baselineEnd, 'd MMM yyyy')}`; 
                format = `${format}\nProgress: ${Math.round(this.progress * 100)}%`;    
                return format;
            };

            dg.tooltip().format(tooltipFormat);
            tl.tooltip().format(tooltipFormat);

            this.initChartListeners();
            this.initTreeListeners();

            this.chart.data(this.tree);
            this.chart.container(container);
            this.chart.draw();
            this.chart.fitAll();
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