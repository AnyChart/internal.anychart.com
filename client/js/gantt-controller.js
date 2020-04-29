class GanttController extends EventTarget {
    constructor() {
        super();
        this.currentUserData = {};
        this.selectedItem = null;
        this._lastUsedFilterFunction = undefined;
        this._filterByUserRepaintNeeded = true;
    }

    updateTasks(data) {
        if (data) {
            this.sourceData = data;
            this._filterByUserRepaintNeeded = true;
        }
        // console.log(this._lastUsedFilterFunction)
        this.preprocessData(this._lastUsedFilterFunction);
        this.chart.data(this.tree);
        this.chart.getTimeline().lineMarker(0).value('current').stroke('3 green');
        this.chart.fitAll();
    }

    createUsersFilter() {
        if (this._filterByUserRepaintNeeded && usersStorage && usersStorage.storage[1]) {
            const filterPane = $('#filter-by-user');
            filterPane
                .html('')
                .append(
                    $('<button class="btn celar-filter-clear">')
                    .append($('<i class="ac ac-diagonal-cros" style="font-size:30"></i>'))
                    .append($('<br/><span>Clear</span>')))
                .append(
                    $('<button class="btn filter-user" data-rel="">')
                    .append($('<i class="ac ac-group" style="font-size:30"></i>'))
                    .append($('<br/><span>Unassigned</span>'))
                );

            Object
                .values(usersStorage.storage)
                .sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0)
                .forEach(user => {
                    let usrBtn = $('<button></button>');
                    usrBtn.attr('data-rel', user.id)
                        .addClass('btn filter-user')
                        .append(`<img src="${user.avatar}" class="rounded-circle" width="32">`)
                        .append(`<br/><span>${user.name}</span>`);

                    if (!this._usersInCurrentData.includes(user.id))
                        usrBtn.attr('disabled', true);
                    filterPane.append(usrBtn);
                });

            let filterUserElements = $('.filter-user');

            filterUserElements.on('click', (e) => {
                let ths = $(e.currentTarget);
                if (e.shiftKey){
                    ths.toggleClass('active');
                }else{
                    ths.toggleClass('active');
                    if ($('.filter-user.active').length > 1){
                        filterUserElements.removeClass('active');
                        ths.addClass('active');
                    }
                }                
                this.filterDataBySelectedUsers();
            });

            $('.celar-filter-clear').on('click', () => {
                filterUserElements.removeClass('active');
                this.filterDataBySelectedUsers();
            })

            this._filterByUserRepaintNeeded = false;
        }
    }

    filterDataBySelectedUsers() {
        $('#toggleCompletedBtn')
            .removeClass('btn-dark')
            .addClass('btn-info');
        let filterUserIds = [];
        $('.filter-user.active').each((i, item) => {
            filterUserIds.push(+$(item).attr('data-rel'))
        });
        this._lastUsedFilterFunction = function (item) {
            if (filterUserIds.length && item.userId) {
                return filterUserIds.includes(item.userId);
            } else return true;
        }
        this.updateTasks();
    }

    preprocessData(filterFunction) {
        let data = filterFunction ? this.sourceData.filter(filterFunction) : this.sourceData;
        this._lastUsedFilterFunction = filterFunction;
        let now = Date.now();
        this._usersInCurrentData = [];
        data.forEach(item => {
            if (item.baselineStart && item.baselineStart < now && item.baselineEnd && item.baselineEnd > now) {
                let fullTime = item.baselineEnd - item.baselineStart;
                let current = now - item.baselineStart;
                item.baselineProgressValue = +(current / fullTime).toFixed(2);
            }
            this._usersInCurrentData.push(item.userId);
        });
        data.sort(function (a, b) {
            return +a.priority - b.priority
        });
        this.tree = anychart.data.tree(data, 'as-table');
        this.initTreeListeners();
        this.createUsersFilter();
    }

    init(data, currentUserData, container = 'chart_container') {
        // console.log(data)
        this.currentUserData = currentUserData;
        return new Promise((resolve, reject) => {
            anychart.format.outputTimezone((new Date).getTimezoneOffset());

            function boldLabelsOverrider(label, dataItem) {
                if (dataItem.numChildren() || !dataItem.getParent()) {
                    label.fontWeight('bold').fontStyle('italic');
                }
            }

            this.sourceData = data;
            this.preprocessData()

            this.chart = anychart.ganttProject();
            this.chart.defaultRowHeight(25);

            this.toolbar = anychart.ui.ganttToolbar();
            this.toolbar.container('toolbar_container');
            this.toolbar.target(this.chart);
            this.toolbar.buttonsMode('icon');

            const dataGrid = this.chart.dataGrid();
            if (this.currentUserData){
                dataGrid.edit(true);
                dataGrid.onEditStart(() => null); //prevents rows editing.
            }

            const indexColumn = dataGrid.column(0);
            const userRowIndexTemplate = '{index}';
            const adminRowIndexTemplate = '<span class="ac ac-trash-o" style="color: {color}; cursor: pointer" onclick="removeTask({id}, \'{name}\')"></span>&nbsp;{index}';
            indexColumn.labels()
                .useHtml(true)
                .width(35)
                .format(function () {
                    const item = this.item;
                    const templateString =
                        currentUserData.isAdmin
                        ? adminRowIndexTemplate : userRowIndexTemplate;
                    let params = {
                        color: 'red',
                        id: this.item.get('id'),
                        name: this.item.get('name')
                    };
                    if (item.numChildren()) {
                        params.color = 'gray';
                        params.id = 'x';
                    }

                    return templateString
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
                .depthPaddingMultiplier(1)
                .labels()
                .useHtml(true)
                .format(function () {
                    const item = this.item;
                    let clc = item.get('priority');
                    let className = clc;
                    switch (clc) {
                        case '?':
                            className = "qst";
                            break;
                        case 'X':
                            className = "drop";
                            break;
                    }
                    return `<span class="prio prio-${className}">&nbsp;${clc || ''}&nbsp;</span>`;
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
                .format(function () {
                    const item = this.item;
                    let url = item.get('url') || '';
                    let name = url;
                    if (name && name.match(new RegExp("[A-z]+\-[0-9]+"))) {
                        url = 'https://anychart.atlassian.net/browse/' + url;
                    }
                    return `<a href="${url}" target="_blank">${name}</a>`;
                });

            const assigneeColumn = dataGrid.column(4);
            assigneeColumn
                .title('Assignee')
                .width(115)
                .labels()
                .useHtml(true)
                .format((a, b) => {
                    let userPic = a.item.get('userAvatar');
                    let userName = a.item.get('userName');
                    if (userPic)
                        return `<img src="${userPic}" style="width:24px; height: 24px;border-radius:12px;"> ${userName}`;
                    else return '';
                });
            // .format('{%userName}');

            const timeSpentColumn = dataGrid.column(5);
            timeSpentColumn
                .title('%')
                .width(50)
                .labelsOverrider(boldLabelsOverrider)
                .labels()
                .format('{%timeSpent}');

            this.chart.splitterPosition(565);
            dataGrid.fixedColumns(true);

            const progressColumn = dataGrid.column(6);
            progressColumn
                .title('%')
                .width(40)
                .labelsOverrider(boldLabelsOverrider)
                .labels()
                .format('{%progress}');

            this.chart.splitterPosition(515);
            dataGrid.fixedColumns(true);

            this.chart.xScale().minimumGap(0.2).maximumGap(0.2);
            const timeline = this.chart.getTimeline();

            timeline.lineMarker(0).value('current').stroke('3 green');

            const ths = this;
            timeline.tooltip().titleFormat(function () {
                return ths.getParentNamesChain_(this.item);
            });
            //TODO maybe add more complex formatter.
            timeline.tooltip().format('Actual: {%start}{dateTimeFormat:dd MMM} - {%end}{dateTimeFormat:dd MMM}\nPlanned: {%baselineStart}{dateTimeFormat:dd MMM} - {%baselineEnd}{dateTimeFormat:dd MMM}\nProgress: {%progress}');

            timeline.tasks()
                .labels({
                    position: 'left-center',
                    anchor: 'right-center',
                    format: '{%ticketStatus}'
                }).progress().labels({
                    background: "white 0.4"
                });
            timeline.groupingTasks().progress().fill('#96e0ca');

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
        this.tree.listen('treeItemMove', function (e) {
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
                ev.currentUser = this.currentUserData;
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

    createAddonsOnToolbar() {
        const toolbar = $('.anychart-toolbar');

        if (this.currentUserData.isAdmin){
            const addTaskBtn = $('<div id="add_task_button"></div>');
            addTaskBtn
                .addClass('float-right btn btn-sm btn-success')
                .css('padding', '1px 5px')
                .css('margin', '1px 5px')
                .text('Add Task')
                .on('click', addTask);
            toolbar.append(addTaskBtn);
        }
        const viewResourceChartLink = $('<div></div>');
        viewResourceChartLink
            .addClass('float-right btn btn-sm btn-primary')
            .css('padding', '1px 5px')
            .css('margin', '1px 5px')
            .text('View Resource Chart')
            .on('click', viewResource);

        toolbar.append(viewResourceChartLink);

        const updateDataBtn = $('<div></div>');

        updateDataBtn
            .addClass('float-right btn btn-sm btn-warning')
            .css('padding', '1px 5px')
            .css('margin', '1px 5px')

        updateDataBtn
            .append('<i class="ac ac-refresh"></i>')
            .append('<span>   Update Data</span>')

        updateDataBtn.on('click', updateData);

        toolbar.append(updateDataBtn)


        const toggleCompletedBtn = $('<div id="toggleCompletedBtn"></div>');

        toggleCompletedBtn
            .addClass('float-right btn btn-sm btn-info')
            .css('padding', '1px 5px')
            .css('margin', '1px 5px');

        toggleCompletedBtn
            .append('<i class="ac ac-clipboard"></i>')
            .append('<span>   Toggle Completed Tasks</span>')

        toggleCompletedBtn.on('click', () => {
            $('.filter-user.active').removeClass('active');
            toggleCompletedBtn.toggleClass('btn-info btn-dark');
            let filterFunction = null;
            if (toggleCompletedBtn.hasClass('btn-dark')) {
                filterFunction = function (item) {
                    return item.progressValue != 1;
                }
            }
            this.preprocessData(filterFunction);
            this.chart.data(this.tree);
            this.chart.fitAll();
        })

        toolbar.append(toggleCompletedBtn)

    }

}