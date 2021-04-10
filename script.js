const timeline_whole_day_canvas = document.getElementById("timeline-whole-day");
const date_time_element = document.getElementById("date_time");
const tracking_toggle = document.getElementById("tracking-toggle");
const header_image = document.getElementById("header_image");
const tolerance_toggle = document.getElementById("tolerance-toggle");
const day_picker = document.getElementById("slct");
const date_time_mouse_picker_time = document.getElementById("mouse_time_pick_info_time");
const date_time_mouse_picker_danger_header = document.getElementById("mouse_time_pick_danger_header");
const date_time_mouse_picker_events = document.getElementById("mouse_time_pick_events");
const timeline_whole_day_width = timeline_whole_day_canvas.clientWidth;
let timetable = JSON.parse(timetable_json);
let last_h;

const image_names = [
    "stars.gif", //00 00
    "sleep.gif", // 01 00
    "ghost.gif", // 02 00
    "crying_hand.gif", // 03 00
    "crying.gif", // 04 00
    "rain.gif", // 05 00
    "tears.gif", // 06 00
    "cat.gif", // 07 00
    "anime_girl.gif", // 08 00
    "doggy.gif", // 09 00
    "girl.gif", // 10 00
    "child.gif", // 11 00
    "alg.gif", // 12 00
    "anime_2.gif", // 13 00
    "111.gif", // 14 00
    "1111.gif", // 15 00
    "dog.gif", // 16 00
    "duck.gif", // 17 00
    "homer.gif", // 18 00
    "sun.gif", //19 00
    "tnt.gif", // 20 00
    "square.gif", // 21 00
    "new_header.gif", // 22 00
    "robot.gif" // 23 00
];

var notyf = new Notyf({
    types: [
        {
            type: 'warning',
            background: 'orange',
            icon: {
                className: 'material-icons',
                tagName: 'i',
                text: 'warning'
            }
        },
        {
            type: 'error',
            background: 'indianred',
            duration: 4000,
            dismissible: true
        }
    ]
});


const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timeline_whole_day_ctx = timeline_whole_day_canvas.getContext("2d");

let tracking = false;
let tolerance = true;

// timeline from 7 am to 8 pm in h
const time_from = 8 * 60;
const time_to = 20 * 60;
const time_interval = time_to - time_from;

let current_day_num;
let current_day_timeline;

let picker_time;

/*
day timeline datatype
all timeline by default is empty
array of events, each element has:
    day
    from - timestamp
    to - timestamp
    time_tolerance - linear
    danger_coof
    description - string
*/

const setImage = (id) => {
    header_image.src = "images/" + image_names[id];
};

const getTimeFromTimeString = (stamp_string) => {
    [hours, minutes] = stamp_string.trim().split(':');
    return +hours * 60 + +minutes;
}

const generateTimelineArray = (events, day) => {
    let out = Array(time_interval).fill().map(el => {
        return {
            danger_coof: 0.20,
            events: []
        };
    });
    events.forEach(el => {
        if (el.day == -1 || el.day == day) {
            let start = el.from, end = el.to;
            if (tolerance) {
                start = Math.max(el.from - el.time_tolerance, 0);
                end = Math.min(el.to + el.time_tolerance, out.length - 1);
            }
            for (let i = start; i <= end; i++) {
                out[i].danger_coof += el.danger_coof * (1 / (el.from > i ? Math.abs(el.from - i + 1) : i > el.to ? Math.abs(el.to - i - 1) : 1));
                out[i].events.push(el);
            }
        }

    });

    function clamp(num, min, max) {
        return num <= min ? min : num >= max ? max : num;
    }

    out.forEach(el => el.danger_coof = clamp(el.danger_coof, 0, 1));
    return out;
};

const getColorStringFromDangerCoof = (coof) => {
    const color_palette = [
        "#339900",
        "#99cc33",
        "#ffcc00",
        "#ff9966",
        "#cc3300",
    ];
    return color_palette[Math.min(Math.floor(coof * 5), color_palette.length - 1)];

}

const is_time_valid = () => {
    const curr = new Date();
    return curr.getHours() > 8 && curr.getHours() < 20;
}

const drawDangerTimeline = (ctx, from, to, dataset, currTimeStampVal) => {
    const width = timeline_whole_day_width / (to - from);
    for (let i = from; i <= to; i++) {
        ctx.lineWidth = 0;
        ctx.fillStyle = getColorStringFromDangerCoof(dataset[i].danger_coof);
        ctx.fillRect(Math.floor(i * width), 0, Math.ceil(width), 100);
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(Math.floor((currTimeStampVal - 1) * width), 0, Math.ceil(width), 100);

    ctx.fillStyle = "#000000";
    if(!tracking)
    ctx.fillRect(Math.floor((picker_time - 1) * width), 0, Math.ceil(width), 100);
};

const output_info = (time) => {
    picker_time = time - time_from;
    let curr = current_day_timeline[picker_time];
    date_time_mouse_picker_danger_header.innerText = "Danger: " + Math.round(curr.danger_coof * 100) + "%";
    let temp_s = "";
    curr.events.forEach(el => {
        temp_s += el.description + "<br/>";
    });
    date_time_mouse_picker_events.innerHTML = temp_s;
    date_time_mouse_picker_time.innerText = Math.floor(time / 60) + ":" + String(time % 60).padStart(2, 0);
}

const output_whole_day_mousepick = (mousex) => {
    if (tracking) return;
    let time = Math.round(mousex / timeline_whole_day_width * time_interval) + time_from;
    output_info(time);
}

const update_time = () => {
    const curr_time = getTimeFromTimeString(new Date().getHours() + ":" + new Date().getMinutes()) - time_from;
    if (is_time_valid())
        document.body.style.background = getColorStringFromDangerCoof(current_day_timeline[curr_time].danger_coof);
    else {
        document.body.style.backgroundColor = "black";
        document.body.style.backgroundImage = "url('images/stars_back.gif')";
    }

    date_time_element.innerText = new Date().toLocaleTimeString() + " " + days[new Date().getDay()];
};

const date_time_loop = setInterval(() => {
    let curr_h = new Date().getHours();
    if (curr_h != last_h) {
        setImage(curr_h);
        last_h = curr_h;
    }

    update_time();
    if (tracking) {
        let time = getTimeFromTimeString(new Date().getHours() + ":" + new Date().getMinutes());
        if (!is_time_valid()) {
            tracking = false;
            tracking_toggle.checked = false;
            notyf.error("Tracking works only from 8 am to 8 pm");
            return;
        }
        output_info(time);
    }
}, 333);

const update_whole_timeline = () => {
    let curr_time = getTimeFromTimeString(new Date().getHours() + ":" + new Date().getMinutes()) - time_from;
    drawDangerTimeline(timeline_whole_day_ctx, 0, time_interval - 1, current_day_timeline, curr_time);
};

const timeline_redraw_loop = setInterval(() => {
    update_whole_timeline();
}, 800);

timeline_whole_day_canvas.addEventListener("mousemove", e => {
    output_whole_day_mousepick(e.offsetX);
    update_whole_timeline();
});

const update_all = () => {
    update_time();
    update_whole_timeline();
};

const change_day = (day) => {
    current_day_num = Math.max(Math.min(day, 4), 0);
    day_picker.value = current_day_num;
    current_day_timeline = generateTimelineArray(timetable, current_day_num);
    update_all();
};

day_picker.addEventListener("change", () => {
    change_day(day_picker.value);
});

tracking_toggle.addEventListener("click", () => {
    tracking = tracking_toggle.checked;
});

tolerance_toggle.addEventListener("click", () => {
    tolerance = tolerance_toggle.checked;
    current_day_timeline = generateTimelineArray(timetable, current_day_num);
    update_all();
});

date_time_mouse_picker_time.addEventListener("click", () => {
    if (tracking) return;
    let input = prompt("Time in format HH:MM", "");
    let temp_a = input.split(':');
    let err = temp_a.length != 2 | isNaN(temp_a[0]) | isNaN(temp_a[1]) | Number(temp_a[0]) < 8 | Number(temp_a[0]) > 20 | Number(temp_a[1]) < 0 | Number(temp_a[1]) >= 60;
    if (err) {
        notyf.error("Wrong time format or value out of interval");
    } else {
        output_info(getTimeFromTimeString(input));
        update_whole_timeline();
    }
});

const init = () => {
    timetable.forEach(el => {
        el.from = getTimeFromTimeString(el.from) - time_from;
        el.to = getTimeFromTimeString(el.to) - time_from;
    });
    change_day(new Date().getDay() - 1);
    output_whole_day_mousepick(0);
    setImage(new Date().getHours());
    last_h = new Date().getHours();
};

init();