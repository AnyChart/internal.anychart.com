
const preloader = anychart.ui.preloader();
preloader.render();
preloader.visible(true);

const controller = new GanttController();
const usersStorage = new ListStorage();
const tasksStorage = new ListStorage();

controller.addEventListener('itemSelect', (e) => {
    const item = controller.selectedItem;
    $('#add_task_button').html('Add subtask');
    $('#task_panel').css('display', 'block');
    $('#current_task_name').html(`Editing task "${item.get('name')}"`);
    $('#task_name').val(item.get('name'));
    $('#task_url').val(item.get('url'));

    updateSelectedUser(item.get('userId'));

    const now = Date.now();
    const actStart = item.get('actualStart');
    const actEnd = item.get('actualEnd');

    if (actStart) {
        $('#task_actual_start').datepicker('setUTCDate', new Date(actStart));
    } else {
        $('#task_actual_start').datepicker('update', '');
    }

    if (actEnd) {
        $('#task_actual_end').datepicker('setUTCDate', new Date(actEnd));
    } else {
        $('#task_actual_end').datepicker('update', '');
    }

    if (item.numChildren()) {
        $('#actual_start_dp').addClass('d-none');
        $('#actual_end_dp').addClass('d-none');
    } else {
        $('#actual_start_dp').removeClass('d-none');
        $('#actual_end_dp').removeClass('d-none');
    }

    const blStart = item.get('baselineStart');
    const blEnd = item.get('baselineEnd');
    if (blStart)
        $('#task_baseline_start').datepicker('setUTCDate', new Date(blStart));
    else
        $('#task_baseline_start').datepicker('update', '');

    if (blEnd)
        $('#task_baseline_end').datepicker('setUTCDate', new Date(blEnd));
    else
        $('#task_baseline_end').datepicker('update', '');

    const progress = Math.round(item.get('progressValue') * 100);
    $('#task_progress').val(progress);
    $('#progress_label').html(`Progress: ${progress}%`);
    addState = 'edit';

    $('#task_name').focus();
});

controller.addEventListener('itemDeselect', (e) => {
    $('#add_task_button').html('Add task');
    resetTask();
    addState = 'new';
    $('#task_panel').css('display', 'none');
});

anychart.onDocumentReady(() => {
    fetch(`/tasks/${projectId}`)
        .then(resp => resp.json())
        .then(tasks => {
            tasksStorage.sync(tasks);
            return controller.init(tasks);
        })
        .then(() => {
            $('#task_panel').css('display', 'none');
            return Promise.resolve();
        })
        .then(() => {
            fetch('/users/data')
                .then(r => r.json())
                .then(users => {
                    usersStorage.sync(users);
                    buildUsersDropdown();
                    return Promise.resolve();
                })
                .then(() => preloader.visible(false));
        })
});

function addTask() {
    $('#task_panel').css('display', 'block');
    addState = 'new';
    updateSelectedUser(null);
    if (controller.selectedItem) {
        resetTask();
        $('#current_task_name').html(`Adding subtask to "${controller.selectedItem.get('name')}"`);
        $('#progress_label').html('Progress: 0%');
    }
    $('#task_name').focus();
}

function updateSelectedUser(id = null) {
    let assigneeAva, assigneeName;
    if (id == null) {
        assigneeAva = '/images/banana.png';
        assigneeName = 'Unassigned';
    } else {
        const userInfo = usersStorage.getData(id);
        assigneeAva = userInfo.avatar;
        assigneeName = userInfo.name;
    }

    $('#current_assignee')
        .attr('data-assignee-id', id)
        .html(`<img src="${assigneeAva}"  class="user-image"> ${assigneeName}`);
}

function selectUser(e) {
    const id = $(e.target).attr('data-user-id');
    updateSelectedUser(id);
}


function buildUsersDropdown() {
    Object
        .values(usersStorage.storage)
        .sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0)
        .forEach(user => {
            let option = $('<a class="dropdown-item" href="#">');
            option
                .attr('id', `assignee-option-${user.id}`)
                .attr('data-user-id', user.id)
                .attr('data-thumbnail', user.avatar)
                .on('click', selectUser)
                .html(`<img src="${user.avatar}" class="user-image"> ${user.name}`);
            $('#assignee .dropdown-menu').append(option);
        })

}

function getParentsToResetChain(item = null, parentsData = { ids: [], items: [] }) {
    if (item) {
        if (item.get('actualStart') || item.get('actualEnd') || item.get('progressValue') != null) {
            parentsData.ids.push(item.get('id'));
            parentsData.items.push(item);
        }
        return getParentsToResetChain(item.getParent(), parentsData);
    } else {
        return parentsData;
    }
}

function commitTask() {
    const name = $('#task_name').val();
    const url = $('#task_url').val();
    const as = $('#task_actual_start').datepicker('getDate');
    const ae = $('#task_actual_end').datepicker('getDate');
    const bs = $('#task_baseline_start').datepicker('getDate');
    const be = $('#task_baseline_end').datepicker('getDate');

    let asUtc = null;
    if (as)
        asUtc = as.getTime() - as.getTimezoneOffset() * 60000;

    let aeUtc = null;
    if (ae)
        aeUtc = ae.getTime() - ae.getTimezoneOffset() * 60000 + (24 * 60 * 60 * 1000 - 1);

    let bsUtc = null;
    if (bs)
        bsUtc = bs.getTime() - bs.getTimezoneOffset() * 60000;

    let beUtc = null;
    if (be)
        beUtc = be.getTime() - be.getTimezoneOffset() * 60000 + (24 * 60 * 60 * 1000 - 1);

    const progress = $('#task_progress').val();
    const parent = controller.selectedItem ? controller.selectedItem.get('id') : null;
    const parentsToReset = getParentsToResetChain(controller.selectedItem);
    const assignee = $('#current_assignee').attr('data-assignee-id');

    const newTaskData = {
        id: parent, //This is used in "edit" mode - edits item by id.
        name: name,
        url: url,
        actualStart: asUtc,
        actualEnd: aeUtc,
        baselineStart: bsUtc,
        baselineEnd: beUtc,
        progressValue: +progress / 100,
        parent: parent,
        project: projectId,
        parentsToReset: JSON.stringify(parentsToReset.ids),
        assignee: assignee,
        deleted: 0
    };

    preloader.visible(true);
    if (addState == 'edit') {
        if (controller.selectedItem) {
            // updating existing task.
            $.post(
                '/tasks/update',
                newTaskData,
                (tasks) => {
                    if (tasks.message) {
                        console.error(tasks);
                    } else {
                        const updatedTask = tasks[0];
                        tasksStorage.add(updatedTask.id, updatedTask);

                        controller.chart.autoRedraw(false);
                        controller.tree.dispatchEvents(false);
                        const editedItem = controller.selectedItem;

                        editedItem.set('name', updatedTask.name);
                        editedItem.set('url', updatedTask.url);
                        editedItem.set('actualStart', updatedTask.actualStart);
                        editedItem.set('actualEnd', updatedTask.actualEnd);
                        editedItem.set('baselineStart', updatedTask.baselineStart);
                        editedItem.set('baselineEnd', updatedTask.baselineEnd);
                        editedItem.set('progressValue', updatedTask.progressValue);
                        editedItem.set('userId', updatedTask.userId);
                        editedItem.set('userAvatar', updatedTask.userAvatar);
                        editedItem.set('userName', updatedTask.userName);

                        controller.tree.dispatchEvents(true);
                        controller.chart.autoRedraw(true);
                        controller.chart.fitAll();
                    }
                    resetTask();
                    preloader.visible(false);
                }
            );

        } else {
            alert('Pretty bad bug is found! Debug it!');
        }
        preloader.visible(false);
    } else {
        // Adding new task.
        $.post(
            '/tasks/add',
            newTaskData,
            (tasks) => {
                if (tasks.message) {
                    console.error(tasks);
                } else {
                    controller.chart.autoRedraw(false);
                    controller.tree.dispatchEvents(false);

                    controller.tree.addData(tasks, 'as-table');
                    parentsToReset.items.forEach(item => {
                        item.del('actualStart');
                        item.del('actualEnd');
                        item.del('progressValue');
                    });

                    controller.tree.dispatchEvents(true);
                    controller.chart.autoRedraw(true);

                    controller.chart.fitAll();
                }
                resetTask();
                preloader.visible(false);
            }
        );
    }
}

function resetTask() {
    $('#current_task_name').html('Adding new task');
    $('#task_name').val('');
    $('#task_url').val('');
    // $('#task_actual_start').val('');
    // $('#task_actual_end').val('');
    updateSelectedUser(null);
    $('#task_progress').val('0');
    $('#progress_label').html('Progress: 0%');
    $('#actual_start_dp').removeClass('d-none');
    $('#actual_end_dp').removeClass('d-none');
    $('#task_actual_start').datepicker('update', '');
    $('#task_actual_end').datepicker('update', '');
    $('#task_baseline_start').datepicker('update', '');
    $('#task_baseline_end').datepicker('update', '');
}

function closeTask() {
    resetTask();
    $('#task_panel').css('display', 'none');
}

function removeTask(id, name) {
    if (confirm(`Do you really want to remove task "${name}"?`)) {
        preloader.visible(true);
        const taskData = tasksStorage.getData(id);
        taskData.deleted = 1;
        $.post(
            '/tasks/update',
            taskData,
            (tasks) => {
                if (tasks.message) {
                    console.error(tasks);
                } else {
                    const task = tasks[0];
                    tasksStorage.del(task.id);
                    controller.tree.searchItems('id', task.id)[0].remove();
                }
                preloader.visible(false);
            }
        );
    }
}

function changeProgress(val) {
    $('#progress_label').html(`Progress: ${val}%`);
}

function viewResource() {
    const scale = controller.chart.xScale();
    const range = scale.getRange();
    const min = range.min;
    const max = range.max;
    window.location.href = `/resources/${projectId}/${min}-${max}`;
}
