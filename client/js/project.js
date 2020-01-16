
const preloader = anychart.ui.preloader();
preloader.render();
preloader.visible(true);

const controller = new GanttController();
const usersStorage = new ListStorage();
const tasksStorage = new ListStorage();
const dpController = new DateTimePickerController();

controller.addEventListener('itemSelect', (e) => {
    const item = controller.selectedItem;
    $('#add_task_button').html('Add subtask');
    $('#task_panel').css('display', 'block');
    $('#current_task_name').html(`Editing task "${item.get('name')}"`);
    $('#task_name').val(item.get('name'));
    $('#task_url').val(item.get('url'));
    $('#task_priority').val(item.get('priority'));

    updateSelectedUser(item.get('userId'));
    dpController.syncFromItem(item);

    const progress = Math.round(item.get('progressValue') * 100);
    $('#task_progress').val(progress);
    $('#progress_label').html(`Progress: ${progress}%`);
    addState = 'edit';

    if(item.numChildren() || !item.getParent()){
        $('#child-props').hide();
    }else $('#child-props').show();

    $('#task_name').focus();
});

controller.addEventListener('itemDeselect', (e) => {
    $('#add_task_button').html('Add task');
    resetTask();
    addState = 'new';
    $('#task_panel').css('display', 'none');
});

anychart.onDocumentReady(() => {
    dpController.init();
    fetch(`/tasks/p/${projectId}`)
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
                    controller.createUsersFilter();
                    return Promise.resolve();
                })
                .then(() => preloader.visible(false));
        })
});

function updateData(){
    fetch(`/tasks/p/${projectId}`)
        .then(resp => resp.json())
        .then(tasks => {
            tasksStorage.sync(tasks);
            return controller.updateTasks(tasks);
        })
}

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
    const priority = $('#task_priority').val();

    const currentItem = addState == 'edit' ? controller.selectedItem : null;
    const dates = dpController.getDates(currentItem);

    const progress = $('#task_progress').val();
    const parent = addState == 'edit' ?
        (controller.selectedItem ? controller.selectedItem.getParent() : null) :
        controller.selectedItem;

    const parentsToReset = getParentsToResetChain(parent);
    const assignee = $('#current_assignee').attr('data-assignee-id');

    const newTaskData = {
        id: addState == 'edit' ? controller.selectedItem.get('id') : null, //This is used in "edit" mode - edits item by id.
        name: name,
        url: url,
        priority: priority,
        actualStart: dates[0],
        actualEnd: dates[1],
        baselineStart: dates[2],
        baselineEnd: dates[3],
        progressValue: +progress / 100,
        parent: parent ? parent.get('id') : null,
        project: projectId,
        parentsToReset: JSON.stringify(parentsToReset.ids),
        assignee: assignee,
        deleted: 0
    };

    preloader.visible(true);
    if (addState == 'edit') {
        if (currentItem) {
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

                        currentItem.set('name', updatedTask.name);
                        currentItem.set('url', updatedTask.url);
                        currentItem.set('priority', updatedTask.priority);
                        currentItem.set('actualStart', updatedTask.actualStart);
                        currentItem.set('actualEnd', updatedTask.actualEnd);
                        currentItem.set('baselineStart', updatedTask.baselineStart);
                        currentItem.set('baselineEnd', updatedTask.baselineEnd);
                        currentItem.set('progressValue', updatedTask.progressValue || null);
                        currentItem.set('userId', updatedTask.userId);
                        currentItem.set('userAvatar', updatedTask.userAvatar);
                        currentItem.set('userName', updatedTask.userName);

                        dpController.syncFromItem(currentItem);

                        controller.tree.dispatchEvents(true);
                        controller.chart.autoRedraw(true);
                        controller.chart.fitAll();
                    }
                    preloader.visible(false);
                }
            );
        } else {
            alert('Pretty bad bug is found! Debug it!');
            preloader.visible(false);
        }
    } else {
        // Adding new task.
        $.post(
            '/tasks/add',
            newTaskData,
            (tasks) => {
                if (tasks.message) {
                    console.error(tasks);
                } else {
                    const newTask = tasks[0];
                    tasksStorage.add(newTask.id, newTask);

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
                // closeTask();
                // controller.reset();
                preloader.visible(false);
            }
        );
    }
}

function resetTask() {
    $('#current_task_name').html('Adding new task');
    $('#task_name').val('');
    $('#task_url').val('');
    $('#task_priority').val('');
    
    updateSelectedUser(null);
    $('#task_progress').val('0');
    $('#progress_label').html('Progress: 0%');

    dpController.reset();
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
    $('#progress_label').html(`Progress: ${val || 0}%`);
}

function viewResource() {
    const scale = controller.chart.xScale();
    const range = scale.getRange();
    const min = range.min;
    const max = range.max;
    window.location.href = `/resources/${projectId}/${min}-${max}`;
}
