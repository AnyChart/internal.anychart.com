class GanttController extends EventTarget {
    constructor() {
        super();
        this.selectedItem = null;
    }

    preprocessData(filterFunction){
        let data = filterFunction ? this.sourceData.filter(filterFunction) : this.sourceData;
        this.tree = anychart.data.tree(data, 'as-table');
        this.initTreeListeners();
    }

    init(data, container = 'chart_container') {
        return new Promise((resolve, reject) => {
            anychart.format.outputTimezone((new Date).getTimezoneOffset());
            function boldLabelsOverrider(label, dataItem) {
                if (dataItem.numChildren()) {
                    label.fontWeight('bold').fontStyle('italic');
                }
            }

            this.sourceData = data;
            this.preprocessData()
            
            this.chart = anychart.ganttProject();
            this.chart.defaultRowHeight(35);

            this.toolbar = anychart.ui.ganttToolbar();
            this.toolbar.container('toolbar_container');
            this.toolbar.target(this.chart);

            const dataGrid = this.chart.dataGrid();
            dataGrid.edit(true);
            dataGrid.onEditStart(() => null); //prevents rows editing.

            const indexColumn = dataGrid.column(0);
            const rowIndexTemplate = '<span class="ac ac-trash-o" style="color: {color}; cursor: pointer" onclick="removeTask({id}, \'{name}\')"></span>&nbsp;{index}';
            indexColumn.labels()
                .useHtml(true)
                .width(35)
                .format(function() {
                    const item = this.item;
                    let params = {color:'red', id: this.item.get('id'), name: this.item.get('name')};
                    if (item.numChildren()){
                        params.color = 'gray';
                        params.id = 'x';
                    }
                    return rowIndexTemplate
                            .replace('{index}', String(this.linearIndex))
                            .replace('{color}', params.color)
                            .replace('{id}', params.id)
                            .replace('{name}', params.name);
                });            

            const priorityColumn = dataGrid.column(1);
            priorityColumn
                .title('')
                .width(30)
                .collapseExpandButtons(false)
                .depthPaddingMultiplier(5)
                .labels()
                    .useHtml(true)
                    .format(function() {
                        const item = this.item;
                        let clc=item.get('priority');
                        switch(clc){
                            case '?':
                                clc="qst";
                                break;
                            case 'x':
                                clc="drop";
                                break;
                        }
                        return `<i class="prio prio-${clc}">${clc || ''}</i>`;
                    });

            const taskColumn = dataGrid.column(2);
            taskColumn
                .title('Task')
                .width(200)
                .labelsOverrider(boldLabelsOverrider)
                .depthPaddingMultiplier(20)
                .collapseExpandButtons(true)
                .labels().format('{%name}');
            const urlColumn = dataGrid.column(3);
            urlColumn
                .title('URL')
                .width(70)
                .labels()
                    .useHtml(true)
                    .fontSize(10)
                    .format(function() {
                        const item = this.item;
                        let name = item.get('url') || '';
                        let url = item.get('url') || '';
                        if (name && ['dv','ts','en'].includes(name.substr(0,2).toLowerCase())){
                            url = 'https://anychart.atlassian.net/browse/'+url;
                        }
                        return `<a href="${url}" target="_blank">${name}</a>`;
                    });

            const assigneeColumn = dataGrid.column(4);
            assigneeColumn
                .title('Assignee')
                .width(100)
                .labels()
                    .useHtml(true)
                    .format('<img src="{%userAvatar}" style="width: 16px; height: 16px"> {%userName}');
                    // .format('{%userName}');

            const progressColumn = dataGrid.column(5);
            progressColumn
                .title('%')
                .width(40)
                .labelsOverrider(boldLabelsOverrider)
                .labels()
                    .format('{%progress}');

            this.chart.splitterPosition(500);

            this.chart.xScale().minimumGap(0.2).maximumGap(0.2);
            const timeline = this.chart.getTimeline();
            timeline.lineMarker(0).value('current').stroke('3 green');

            const ths = this;
            timeline.tooltip().titleFormat(function() {
                return ths.getParentNamesChain_(this.item);
            });
            //TODO maybe add more complex formatter.
            timeline.tooltip().format('Actual: {%start}{dateTimeFormat:dd MMM} - {%end}{dateTimeFormat:dd MMM}\nPlanned: {%baselineStart}{dateTimeFormat:dd MMM} - {%baselineEnd}{dateTimeFormat:dd MMM}\nProgress: {%progress}');

            this.initChartListeners();

            this.chart.data(this.tree);
            this.chart.container(container);
            this.toolbar.draw();
            this.chart.draw();
            
            this.createAddonsOnToolbar();

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

    getParentNamesChain_(item) {
        let name = item.get('name');
        let parent = item.getParent();
        while (parent) {
            name = `${parent.get('name')} → ${name}`;
            parent = parent.getParent();
        }
        return name;
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

    reset() {
        if (this.selectedItem) {
            this.selectedItem.meta('selected', false);
            this.selectedItem = null;
        }
    }

    createAddonsOnToolbar(){
        const toolbar = $('.anychart-toolbar')
        const toggleCompletedBtn = $('<button></button>');

        toggleCompletedBtn
            .text('Toggle Completed Tasks')
            .addClass('float-right btn btn-sm btn-info')
            .css('padding','1px 10px')

        toggleCompletedBtn.on('click',()=>{
            toggleCompletedBtn.toggleClass('btn-info btn-dark');
            let filterFunction = null;
            if (toggleCompletedBtn.hasClass('btn-dark')){
                filterFunction = function (item){
                    return item.progressValue != 1;
                }
            }
            this.preprocessData(filterFunction);
            this.chart.data(this.tree);
        })

        toolbar.append(toggleCompletedBtn)
    }

}