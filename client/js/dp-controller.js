class DateTimePickerController {
    constructor(containerId = 'date_pickers') {
        this.container = $(`#${containerId}`);
    }

    init() {
        [this.asdp, this.asdpInput] = this.initPicker('actualStart', 'Actual Start');
        [this.aedp, this.aedpInput] = this.initPicker('actualEnd', 'Actual End');
        [this.bsdp, this.bsdpInput] = this.initPicker('baselineStart', 'Planned Start');
        [this.bedp, this.bedpInput] = this.initPicker('baselineEnd', 'Planned End');

        this.container.append(this.asdp);
        this.container.append(this.aedp);
        this.container.append(this.bsdp);
        this.container.append(this.bedp);
    }

    initPicker(prefix, name) {
        const picker = this.createDatePicker(prefix, name);
        const input = $(picker.find('input')[0]);
        input.datepicker(DateTimePickerController.CONFIG);
        const button = $(picker.find('button')[0]);
        button.on('click', () => input.datepicker('show'));
        return [picker, input];
    }

    createDatePicker(prefix, name) {
        return $(`<div class="input-group mb-3" id="${prefix}_dp">
                    <div class="input-group-prepend">
                        <span class="input-group-text">${name}</span>
                    </div>
                    <input id="task_${prefix}" type="text" class="form-control" 
                        placeholder="${name}" aria-describedby="basic-addon2">
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button">
                            <span class="ac ac-v-line-dotted"></span>
                        </button>
                    </div>
                </div>`);
    }

    syncFromItem(item) {
        if (item) {
            if (item.numChildren()) {
                this.asdp.addClass('d-none');
                this.aedp.addClass('d-none');
            } else {
                this.asdp.removeClass('d-none');
                this.aedp.removeClass('d-none');

                const actStart = item.get('actualStart');
                const actEnd = item.get('actualEnd');
                this.syncFromDate_(actStart, this.asdpInput);
                this.syncFromDate_(actEnd, this.aedpInput ,true);
            }

            const blStart = item.get('baselineStart');
            const blEnd = item.get('baselineEnd');
            this.syncFromDate_(blStart, this.bsdpInput);
            this.syncFromDate_(blEnd, this.bedpInput, true);

        }
    }

    syncFromDate_(timestamp, input, addEndOffset = false) {
        if (timestamp == null) {
            input.datepicker('update', '');
        } else {
            const endOffset = (24 * 60 * 60 * 1000 - 1);
            input.datepicker('setUTCDate', new Date(timestamp - (addEndOffset ? endOffset : 0)));
        }
    }

    getDates(item = null) {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const endOffset = (24 * 60 * 60 * 1000 - 1);
        const as = (item && item.numChildren()) ? null : this.asdpInput.datepicker('getDate');
        const ae = (item && item.numChildren()) ? null : this.aedpInput.datepicker('getDate');
        const bs = this.bsdpInput.datepicker('getDate');
        const be = this.bedpInput.datepicker('getDate');

        let asUtc = null;
        if (as)
            asUtc = as.getTime() - offset;

        let aeUtc = null;
        if (ae)
            aeUtc = ae.getTime() - offset + endOffset;

        let bsUtc = null;
        if (bs)
            bsUtc = bs.getTime() - offset;

        let beUtc = null;
        if (be)
            beUtc = be.getTime() - offset + endOffset;

        return [asUtc, aeUtc, bsUtc, beUtc];
    }

    reset() {
        this.asdp.removeClass('d-none');
        this.aedp.removeClass('d-none');
        this.asdpInput.datepicker('update', '');
        this.aedpInput.datepicker('update', '');
        this.bsdpInput.datepicker('update', '');
        this.bedpInput.datepicker('update', '');
    }
}

DateTimePickerController.CONFIG = {
    format: 'dd MM yyyy',
    weekStart: 1,
    todayBtn: true,
    orientation: "left auto",
    autoclose: true,
    todayHighlight: true
};