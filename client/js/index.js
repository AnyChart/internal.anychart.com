const preloader = anychart.ui.preloader();
preloader.render();
preloader.visible(true);

const projectsContainer = $('#current_projects');

function addProject(project) {
    return $(`<div class="media text-muted pt-3">
                        <div class="media-body pb-3 mb-0 small lh-125 border-bottom border-gray">
                            <div class="d-flex justify-content-between align-items-center w-100">
                                <strong class="text-gray-dark"><a href="/p/${project.id}">${project.name}</a></strong>
                                <a href="/delete-project/${project.id}">Remove (doesn't work for a while)</a>
                            </div>
                            <span class="d-block">${anychart.format.dateTime(project.last_modified)}</span>
                        </div>
                    </div>`);
}

anychart.onDocumentReady(() => {
    fetch('/projects')
        .then(resp => resp.json())
        .then(projects => {
            if (projects.message)
                return Promise.reject(projects);

            if (projects.length) {
                projectsContainer.html('');
                projects.forEach(project => {
                    projectsContainer.append(addProject(project));
                });
            } else {
                projectsContainer.html('No projects exist.');
            }
            preloader.visible(false);
            $('#newProject').modal('hide');
        })
        .catch((err) => {
            if (err) {
                console.log(err);
                projectsContainer.html(err.message ? err.message : 'Unknown error on loading data.');
            } else {
                projectsContainer.html('Could not fetch projects data.');
            }
            preloader.visible(false);
            $('#newProject').modal('hide');
        });
});


function createNewProject() {
    const newProjectName = $('#new_project_name').val();
    if (newProjectName) {
        preloader.visible(true);
        $.post(
            '/add-project',
            { "name": newProjectName },
            (project) => {
                if (project.message) {
                    //TODO add exception.
                } else {
                    projectsContainer.prepend(addProject(project));
                }

                preloader.visible(false);
                $('#newProject').modal('hide');
            }
        );
    }
}