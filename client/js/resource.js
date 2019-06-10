
const preloader = anychart.ui.preloader();
preloader.render();
preloader.visible(true);

const controller = new GanttResourceController();

anychart.onDocumentReady(() => {
    fetch(`/tasks/${projectId}`)
        .then(resp => resp.json())
        .then(tasks => controller.init(tasks))
        .then(() => {
            preloader.visible(false);
        });
});

function viewProject() {
    const scale = controller.chart.xScale();
    const range = scale.getRange();
    const min = range.min;
    const max = range.max;
    window.location.href = `/projects/${projectId}/${min}-${max}`;
}
