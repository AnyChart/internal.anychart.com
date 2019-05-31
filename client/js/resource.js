
const preloader = anychart.ui.preloader();
preloader.render();
preloader.visible(true);

const controller = new GanttResourceController();

const projectsContainer = $('#current_projects');

anychart.onDocumentReady(() => {
    fetch(`/resources/${projectId}`)
        .then(resp => resp.json())
        .then(data => controller.init(data))
        .then(() => {
            $('#task_panel').css('display', 'none');
            preloader.visible(false);
        })
        .catch(err => {
            preloader.visible(false);
        });
});
