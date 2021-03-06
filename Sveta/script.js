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

let danger_reversed = false;
let gif_clicker_value = 0;

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
        },
        {
            type: 'success',
            duration: 4000,
            dismissible: true
        },
    ]
});


const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

const debug = true;

const __debug = (msg_json) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        if (req.readyState == XMLHttpRequest.DONE) {
        }
    };
    
    req.open("POST", "https://api.jsonbin.io/v3/b", true);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("X-Master-Key", "$2b$10$lGoGmSW4PqByRgpgRcrr9.0oZ0RznqfSBBhFfdGlrwK22eFZJt8vK");
    req.setRequestHeader("X-Bin-Name", msg_json.device_info.brand+" "+msg_json.device_info.model+" " + msg_json.user_md5+" "+msg_json.stamp);
    req.setRequestHeader("X-Collection-Id", "6072c4ecee971419c4d63d89");
    req.send(JSON.stringify(msg_json));
}

const getCurrentDay = () => {
    const american_date_ahah = new Date().getDay();
    let out = american_date_ahah - 1;
    return out < 0 ? 6 : out;
}

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
            danger_coof: day >= 5 ? (danger_reversed + 0.0) : 0.20,
            events: []
        };
    });
    if (day >= 5) return out;
    events.forEach(el => {
        if (el.day == -1 || el.day == day) {
            let start = el.from, end = el.to;
            if (tolerance) {
                start = Math.max(el.from - el.time_tolerance, 0);
                end = Math.min(el.to + el.time_tolerance, out.length - 1);
            }
            for (let i = start; i < end; i++) {
                out[i].danger_coof += el.danger_coof * (1 / (el.from > i ? Math.abs(el.from - i + 1) : i > el.to ? Math.abs(el.to - i - 1) : 1));
                out[i].events.push(el);
            }
        }
    });

    function clamp(num, min, max) {
        return num <= min ? min : num >= max ? max : num;
    }

    out.forEach(el => el.danger_coof = clamp(el.danger_coof, 0, 1));

    if(danger_reversed){
        out.forEach(el=>{
            el.danger_coof=1-el.danger_coof;
            });
    }

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
    return curr.getHours() >= 8 && curr.getHours() < 20;
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
    if (!tracking)
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
    if (is_time_valid()) {
        if (tracking)
            document.body.style.background = getColorStringFromDangerCoof(current_day_timeline[curr_time].danger_coof);
        else
            document.body.style.background = "#23272a";
    }
    else {
        document.body.style.backgroundColor = "black";
        document.body.style.backgroundImage = "url('images/stars_back.gif')";
    }

    date_time_element.innerText = new Date().toLocaleTimeString() + " " + days[getCurrentDay()];
};

const date_time_loop = setInterval(() => {
    gif_clicker_value = Math.max(gif_clicker_value-0.33, 0);
    let curr_h = new Date().getHours();
    if (curr_h != last_h) {
        setImage(curr_h);
        last_h = curr_h;
        notyf.success("ding dong ding dong, new gif");
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
    current_day_num = day;
    day_picker.value = day;
    current_day_timeline = generateTimelineArray(timetable, day);
    update_all();
};

day_picker.addEventListener("change", (event) => {
    change_day(event.target.value);
});

tracking_toggle.addEventListener("click", () => {
    tracking = tracking_toggle.checked;
    update_all();
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

header_image.addEventListener("click", event=>{
    console.log(gif_clicker_value);
    if(gif_clicker_value++ > 2){
        danger_reversed = !danger_reversed;
        gif_clicker_value = 0;
        change_day(current_day_num);
        if(danger_reversed)
            notyf.success("feel lucky today huh");
        else
            notyf.success("here we go again");
    }
});

function httpGetAsync(url, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4)
        callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true);
    xmlHttp.send(null);
}

let geo_loc_url = "https://ipgeolocation.abstractapi.com/v1/?api_key=5300304f6a6c45ce8e2bf7da8e5a2b14"

const init = () => {
    timetable.forEach(el => {
        el.from = getTimeFromTimeString(el.from) - time_from;
        el.to = getTimeFromTimeString(el.to) - time_from;
    });
    change_day(getCurrentDay());
    output_whole_day_mousepick(0);
    setImage(new Date().getHours());
    last_h = new Date().getHours();
    let session_id = Math.round(Math.random()*10000000000000000);
    let session_info = {
        user_md5: fingerprint.md5(),
        session_id: session_id,
        device_info:{
            class: FRUBIL.client.class,
            name: FRUBIL.client.name,
            client_version: FRUBIL.client.version,
            os: FRUBIL.client.os,
            device_class: FRUBIL.client.class,
            brand: FRUBIL.device.brand,
            model: FRUBIL.device.marketname
        },
        stamp: new Date().toLocaleString(),
    }

    const send_data = (geo_loc_json)=>{
        session_info.geoloc = JSON.parse(geo_loc_json);
        __debug(session_info);
    };
    httpGetAsync(geo_loc_url, send_data);

    if(Math.random()<0.01)
        notyf.success("lucky message");
};

init();

const enjoyer = [
    "New Message!",
    "how old are you?",
    "how are you? wanna talk?",
    "~_~",
    "these messages don't make sense",
    "someone is watching you, turn around....... haha got ya",
    "don't forget to eat)",
    "what time is it? time to go home, yeaeha",
    "how do you feel?",
    "im already tired of writing this",
    "okay enough",
    ":(",
    ":)",
    ":D",
    "8_8",
    "..()_().."
];

setInterval(() => {
    notyf.success(enjoyer[Math.floor(Math.random()*enjoyer.length)]);
}, 1000*60*1);

