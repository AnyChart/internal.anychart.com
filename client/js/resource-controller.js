class GanttResourceController extends EventTarget {
    constructor() {
        super();
    }

    init(tasks, container = 'chart_container') {
        return new Promise((resolve, reject) => {
            // anychart.format.outputTimezone((new Date).getTimezoneOffset());

            const data = this.toPeriods(tasks);

            this.tree = anychart.data.tree(data, 'as-table');
            this.chart = anychart.ganttResource();

            this.toolbar = anychart.ui.ganttToolbar();
            this.toolbar.container(container);
            this.toolbar.target(this.chart);

            this.chart.splitterPosition('20%')

            const xScale = this.chart.xScale();
            xScale.minimumGap(0.2).maximumGap(0.2);

            this.chart.getTimeline().tooltip().titleFormat(function () {
                return this.period ?
                    `${this.period.name} (${this.period.parentName})` :
                    this.name;
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
            this.toolbar.draw();
            this.chart.draw();
            
            if (isNaN(+min) || isNaN(+max))
                this.chart.fitAll();
            else
                this.chart.zoomTo(+min, +max);
            // this.chart.zoomTo(now - (3 * 24 * 60 * 60 * 1000), now + (6 * 24 * 60 * 60 * 1000));
            resolve();
        });
    }

    toPeriods(tasks = []) {
        const tasksTree = anychart.data.tree(tasks, 'as-table');
        let periodUid = 0;
        const resMap = {};
        const resourcesData = [];
        let dataIndex = NaN;

        const traverser = tasksTree.getTraverser();
        traverser.nodeYieldCondition(item => {
            const actualStart = item.get('actualStart');
            const actualEnd = item.get('actualEnd');
            const baselineStart = item.get('baselineStart');
            const baselineEnd = item.get('baselineEnd');

            return !item.numChildren() && (actualStart != null || baselineStart != null) && (actualEnd != null || baselineEnd != null);
        });
        while (traverser.advance()) {
            const current = traverser.current();
            const userName = current.get('userName') || 'Unassigned';
            const id = current.get('userId') == null ? -1 : current.get('userId');

            if (userName in resMap) {
                dataIndex = resMap[userName];
            } else {
                dataIndex = resourcesData.length;
                resMap[userName] = dataIndex;
                const newResource = {
                    id: id,
                    name: userName,
                    periods: []
                };
                resourcesData.push(newResource);
            }

            const actualStart = current.get('actualStart');
            const actualEnd = current.get('actualEnd');
            const baselineStart = current.get('baselineStart');
            const baselineEnd = current.get('baselineEnd');

            const resource = resourcesData[dataIndex];
            const newPeriod = {
                id: `p${periodUid++}`,
                name: current.get('name'),
                start: baselineStart || actualStart,
                end: baselineEnd || actualEnd,
                parentName: current.getParent() ? current.getParent().get('name') : ''
            };
            resource.periods.push(newPeriod);

        }
        return resourcesData.sort((a, b) => a.name > b.name ? -1 : a.name < b.name ? 1 : 0);
    }

    initTreeListeners() {

    }

    initChartListeners() {

    }


}