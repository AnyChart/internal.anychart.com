
const preloader = anychart.ui.preloader();
preloader.render();
preloader.visible(true);

const controller = new GanttController();

controller.addEventListener('itemSelect', (e) => {
    $('#add_task_button').html('Добавить подзадачу');
    $('#task_panel').css('display', 'block');
    $('#current_task_name').html(`Редактирование задачи "${controller.selectedItem.get('name')}"`);
    $('#task_name').val(e.item.get('name'));
    const now = Date.now();
    $('#task_actual_start').datepicker('setUTCDate', new Date(e.item.get('actualStart')));
    $('#task_actual_end').datepicker('setUTCDate', new Date(e.item.get('actualEnd')));
    const progress = Math.round(e.item.get('progressValue') * 100);
    $('#task_progress').val(progress);
    $('#progress_label').html(`Прогресс: ${progress}%`);
    addState = 'edit';

    $('#task_name').focus();
});

controller.addEventListener('itemDeselect', (e) => {
    $('#add_task_button').html('Добавить задачу');
    resetTask();
    addState = 'new';
    $('#task_panel').css('display', 'none');
});

const projectsContainer = $('#current_projects');

anychart.onDocumentReady(() => {
    fetch(`/tasks/${projectId}`)
        .then(resp => resp.json())
        .then(tasks => controller.init(tasks))
        .then(() => {
            $('#task_panel').css('display', 'none');
            preloader.visible(false);
        })
        .catch(err => {
            preloader.visible(false);
        });
});

function addTask() {
    $('#task_panel').css('display', 'block');
    addState = 'new';
    if (controller.selectedItem) {
        resetTask();
        $('#current_task_name').html(`Добавление подзадачи в "${controller.selectedItem.get('name')}"`);
        $('#progress_label').html('Прогресс: 0%');
    }
    $('#task_name').focus();
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

    const newTaskData = {
        id: parent, //This is used in "edit" mode - edits item by id.
        name: name,
        actualStart: asUtc,
        actualEnd: aeUtc,
        baselineStart: bsUtc,
        baselineEnd: beUtc,
        progress: +progress / 100,
        parent: parent,
        project: projectId,
        parentsToReset: JSON.stringify(parentsToReset.ids)
    };

    preloader.visible(true);
    if (addState == 'edit') {
        if (controller.selectedItem) {
            alert('EDIT!');
        } else {
            alert('Pretty bad bug is found! Debug it!');
        }
        preloader.visible(false);
    } else {
        // Adding new task.
        $.post(
            '/add-task',
            newTaskData,
            (tasks) => {
                if (tasks.message) {
                    //TODO add exception.
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
    $('#current_task_name').html('Добавление новой задачи');
    $('#task_name').val('');
    // $('#task_actual_start').val('');
    // $('#task_actual_end').val('');
    $('#task_progress').val('0');
    $('#task_actual_start').datepicker('update', '');
    $('#task_actual_end').datepicker('update', '');
    $('#task_baseline_start').datepicker('update', '');
    $('#task_baseline_end').datepicker('update', '');
}

function closeTask() {
    resetTask();
    $('#task_panel').css('display', 'none');
}

function changeProgress(val) {
    $('#progress_label').html(`Прогресс: ${val}%`);
}
