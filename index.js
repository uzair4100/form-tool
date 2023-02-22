//var modal = document.getElementById("modal");
//modal.style.display = "none";
const electron = require("electron");
const { shell } = electron;
const ipcRenderer = electron.ipcRenderer;
const { webFrame } = require('electron');
const path = require("path");
const http = require("http");
const https = require("https");
const fs = require("fs");
const cheerio = require("cheerio");
const Papa = require('papaparse');
var prettifyXml = require("prettify-xml");
const copy = require("recursive-copy");
const os = require("os");
const axios = require('axios').default;
var COURSEDEV = path.dirname(__filename);
console.log(COURSEDEV)
// set Quill to use <b> and <i>, not <strong> and <em> 
var bold = Quill.import('formats/bold');
bold.tagName = 'b'; // Quill uses <strong> by default
Quill.register(bold, true);
var italic = Quill.import('formats/italic');
italic.tagName = 'i'; // Quill uses <em> by default
Quill.register(italic, true);

// Set the zoom factor to 92%
webFrame.setZoomFactor(0.92);
var htmlFilePath = path.join(require("os").homedir(), "Downloads/content.html")
var source = path.join(require("os").homedir(), "Downloads/CBC.csv");
COURSEDEV = path.join(require("os").homedir(), "Downloads/New folder");

const csv = require('csv-parser')
const results = [];
var rows = '', tr = '', aspOptions, sectionHeader = '', fieldNote = '', updateParameters = '', updateCommand = '', sqlParameters = '', documentType;



var selectitemQuiz = document.querySelector(".selectitem").outerHTML;
var quizContainer = document.getElementById("quiz_container");
const status = document.getElementById("status");
const activityType = document.getElementById("activityType");
const layoutType = document.getElementById("layout");
const accentsType = document.getElementById("accents");
const templateFolder = "\\\\vsl-file01\\coursesdev$\\template";
status.style.display = "none";
const dialog = electron.dialog;

var structure = document.querySelector("#structure");
var activity = "Select Item";


structure.style.display = "none";

checkUpdates();
//fillLayouts()

//load activity event handler
document.querySelector("#load").addEventListener("click", function () {
    quizContainer.innerHTML = "", help = "";

    if (filepath !== "" || typeof (filepath) !== undefined) {
        fs.createReadStream(filepath)
            .pipe(csv())
            .on('headers', (headers) => {
                makeheaders(headers)
            })
    } else {
        alert("Select activity path")
    }

});

/////////////////////document Type/////////////////////////////////////////

document.querySelector("#documentType").addEventListener("change", function () {
    documentType = this.options[this.selectedIndex].text
    if (documentType == 'CSV') {
        document.getElementById('paths').style.visibility = "visible";
        quizContainer.innerHTML = "";

    } else {
        document.getElementById('paths').style.visibility = "hidden";
        quizContainer.innerHTML = selectitemQuiz;
        initQuill(true)
    }
});

/////////////////////find source path/////////////////////////////////////////
document.getElementById("chooseFile").addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation()
    ipcRenderer.send("chooseFile-dialog"); //send choose file event

    //receive choosefile event
    ipcRenderer.on("chooseFile-selected", function (err, file) {
        //if canceled keep path from local storage , else put new path
        if (file) {

            document.getElementById("filePath").value = file.filePaths[0];
            filepath = file.filePaths[0];
        }
    });
}); //end source path


////////////////////////////////////////////////////add or delete quizzes and options//////////////////////////////////////////////////
document.addEventListener("click", function (e) {
    let button = e.target;
    console.log(button);

    if (button.parentElement.parentElement.id == "op") {
        // let bulkText = button.parentElement.previousElementSibling.value; //traverse from button upto textarea
        let bulkText = button.parentElement.parentElement.parentElement.previousElementSibling.value; //traverse from button upto textarea
        console.log(bulkText)
        let acts = quizContainer.querySelectorAll(".quiz");
        let name = button.closest(".quiz").querySelector(".no").innerHTML;
        let values = "";
        bulkText.includes("\n") ? values = bulkText.split("\n") : "";
        values = values.filter((val) => typeof val !== undefined && val != ""); //trim array elements
        console.log(values)

        let opt = "";
        values.map((val, v) => {
            console.log(val + ",," + v)

            switch (activity) {
                case "Select Item":
                    opt = ` <div class="input-group mt-1 option">
                    <div class="input-group-prepend">
                        <div class="input-group-text">
                            <input type="number" name="option" class="form-control option_radio" style="width: 70px;"/>
                        </div>
                    </div>
                    <input type="text" class="form-control option_value" value=${val}  style="height:auto;"/>
                    <button class="del">X</button>
                </div>`;
                    break;
            }
            console.log(opt)
            //add option in quiz depending on button clicked
            if (button.classList.contains("separate")) {
                // if (quizContainer.childElementCount == values.length) {
                (acts[v]) ? acts[v].querySelector(".quiz_options").insertAdjacentHTML("beforeend", opt) : "";

                // }
            } else {
                button.closest(".quiz").querySelector(".quiz_options").insertAdjacentHTML("beforeend", opt);
            }
        });

        button.parentElement.parentElement.parentElement.previousElementSibling.value = "";
        e.target.closest('.makeOptionWrapper').style.display = "none";
        e.target.closest('.quiz').querySelector('.show_bulk').innerHTML = "Show panel";
        arrange(".quiz");
    }
    if (button.id == "show_bulk") {
        if (e.target.closest('.quiz').querySelector('.makeOptionWrapper').hasAttribute("style", "display:none")) {
            e.target.closest('.quiz').querySelector('.makeOptionWrapper').removeAttribute("style");
            button.innerHTML = "Hide Panel";
        } else {
            e.target.closest('.quiz').querySelector('.makeOptionWrapper').setAttribute("style", "display:none");
            button.innerHTML = "Show Panel";
        }
    }
    if (button.id == "bulk_clue") {
        let bulkText = button.parentElement.previousElementSibling.value; //traverse from button upto textarea
        let acts = quizContainer.querySelectorAll(".quiz");
        let values = bulkText.split("\n");
        values = values.filter((val) => typeof val !== undefined && val != ""); //trim array elements

        values.map((val, v) => {
            if (acts[v]) {
                acts[v].querySelector(".ql-editor").innerHTML = val; //it will be added inside ql-editor container
                acts[v].querySelector(".ql-editor").value = val;
            }
        });
        button.parentElement.previousElementSibling.value = "";
        //document.getElementById('show_bulk').click();
        e.target.closest('.makeOptionWrapper').style.display = "none";
        e.target.closest('.quiz').querySelector('.show_bulk').innerHTML = "Show panel";


    }


    ////////////del quiz/////////
    if (button.classList.contains("del_quiz")) {
        let act = button.parentElement.parentElement;
        quizContainer.childElementCount > 1 ? removeFadeOut(act, 300) : "";
    }
    ////////////del option/////////
    if (button.classList.contains("del")) {
        if (activity == "Sentence Builder") {
            if (button.closest(".quiz_options").childElementCount > 1) {
                let sentence = button.parentElement.parentElement.parentElement.children[2].children[0].children[1]; //traverse from delete button(X) upto sentence
                let text = sentence.value;
                let ans = button.previousElementSibling.getAttribute("value");
                console.log(ans);
                let _text = "";
                actName[6] == "punjabi" ? _text = text.replace(`{${ans}}`, ans) : _text = text.replace(`[${ans}]`, ans); //punjabi has "{}" brackets, not "[]"
                sentence.value = _text;
                sentence.innerHTML = sentence.value;
                removeFadeOut(button.closest(".option"), 200);
            }
        } else {
            e.target.closest(".quiz_options").childElementCount > 1 ?
                removeFadeOut(e.target.closest(".option"), 200) : "";
        }
    }
    ///////add option////////
    if (button.classList.contains("addOption")) {
        let opt = button.previousElementSibling.firstElementChild.outerHTML;
        opt = new DOMParser().parseFromString(opt, "text/html");
        console.log(opt.body.innerHTML);
        opt.querySelector("input[type=radio]") ? opt.querySelector("input[type=radio]").removeAttribute("checked", true) : "";

        let newOpt = opt.querySelectorAll(".option_value"); //get all input/text fileds
        for (let i = 0; i < newOpt.length; i++) {
            newOpt[i].setAttribute("value", ""); //empty input fields
            newOpt[i].innerHTML = ""; //empty text area
        }
        button.previousElementSibling.insertAdjacentHTML("beforeend", opt.body.innerHTML);
        button.previousElementSibling.lastElementChild.classList.add("fadeIn");
        button.previousElementSibling.lastElementChild.querySelector(".option_value").focus();
    }
    /////////add quiz////////////
    if (button.id == "addQuiz") {
        switch (activity) {
            case "Select Item":
                quiz = selectitemQuiz;
                break;
        }
        let _quiz = new DOMParser().parseFromString(quiz, 'text/html');
        let no = _quiz.querySelectorAll('.no').innerHTML
        _quiz.querySelector('.makeOptionWrapper') ? _quiz.querySelector('.makeOptionWrapper').setAttribute("style", "display:none;") : "";
        quizContainer.insertAdjacentHTML("beforeend", _quiz.body.innerHTML);
        quizContainer.lastElementChild.classList.add("fadeIn");
        arrange(".quiz");
        setTimeout(() => {
            initQuill(false);
            quizContainer.scrollTop = quizContainer.scrollHeight;
        }, 100);

    }
    /////////duplicate////////////
    if (button.id == "duplicate") {
        //change dom values
        optionValue = quizContainer.querySelectorAll("input");
        for (let i = 0; i < optionValue.length; i++) {
            optionValue[i].setAttribute("value", optionValue[i].value);
            optionValue[i].innerHTML = optionValue[i].value; //for textarea
        }

        let quiz = quizContainer.lastElementChild.outerHTML;
        quiz = new DOMParser().parseFromString(quiz, "text/html");
        let duplicateCount = document.querySelector('#duplicateCount');
        console.log(duplicateCount.value)
        for (i = 1; i <= duplicateCount.value; i++) {

            quizContainer.insertAdjacentHTML("beforeend", quiz.body.innerHTML);
            //initQuill(true);
            quizContainer.scrollTop = quizContainer.scrollHeight;
        }
        arrange(".quiz");
        setTimeout(() => {
            initQuill(true);
            quizContainer.scrollTop = quizContainer.scrollHeight;
        }, 1000);
        duplicateCount.value = 1;
    }


    if (button.id == "help") {
        let parameters = [];
        if (documentType == "CSV") {
            parameters = parameters.concat(updateParameters, updateCommand, sqlParameters)
        } else {
            parameters = makeParameters()
        }
        ipcRenderer.send("help-window", parameters); //send event to main window to open modal window

        //receive form data
        ipcRenderer.on("help-data", function (e, parameters) {
            help = prettifyXml(data);
            console.log(help);
        });
        updateParameters='', updateCommand='', sqlParameters='';
    }


});

function makeParameters() {
    updateCommand = '';
    updateParameters = '';
    sqlParameters = '';
    let prefix = document.getElementById("prefix").value.trim();
    let listType = document.querySelector('#options').querySelector('input[name="listType"]:checked').nextElementSibling.innerHTML;
    console.log(listType)
    prefix.trim().length > 0 ? prefix = prefix + "_" : prefix = "";

    let result = []
    let quizzes = quizContainer.querySelectorAll('.quiz');

    for (let i = 0; i < quizzes.length; i++) {
        let no = quizzes[i].querySelector('.no').innerText;
        switch (listType) {
            case "RadioButtonList": case "DropDownList":

                updateCommand += `,[${prefix}q${no}] = @${prefix}q${no}\n`;
                updateParameters += `<asp:Parameter Name="${prefix}q${no}" Type="Int32" />\n`;
                sqlParameters += `[${prefix}q${no}] [smallint] NULL,\n`;
                break;

            case "TextBox":
                updateCommand += `,[${prefix}q${no}] = @${prefix}q${no}\n`;
                updateParameters += `<asp:Parameter Name="${prefix}q${no}" Type="String" />\n`;
                sqlParameters += `[${prefix}q${no}] [varchar(255)] NULL,\n`;
                break;

            case "CheckBox":
                let options = quizzes[i].querySelectorAll('.option');
                    for (let j = 0; j < options.length; j++) {
                        updateCommand += `,[${prefix}q${no}_${j + 1}] = @${prefix}q${no}_${j + 1}\n`;
                        updateParameters += `<asp:Parameter Name="${prefix}q${no}_${j + 1}" Type="Boolean" />\n`;
                        sqlParameters += `[${prefix}q${no}_${j + 1}] [bit] NULL,\n`;
                    }
                
                break;
        }

    }
    result = result.concat(updateParameters, updateCommand, sqlParameters);
    console.log(result)
    return result;
}
/////////////////////////////////submit//////////////////////////////////////////////////////////

document.querySelector("#submit").addEventListener("click", function () {
    let fileContent;
    if (confirm("Update " + name + " ?")) {
        arrange(".quiz");
        let xmlTemplate, content;
        //find template
        switch (documentType) {
            case "Docx":
                fileContent = updateSI();
                fileContent = prettifyXml(fileContent, { indent: 4 });
                console.log(fileContent);
                break;

            case "CSV":
                let newNames = [], obj = {}
                let dropdowns = quizContainer.querySelectorAll('.dropdown');
                console.log(dropdowns)
                for (let i = 0; i < dropdowns.length; i++) {
                    let tField = dropdowns[i].querySelector('.name').innerText.trim();
                    let tValue = dropdowns[i].querySelector('.sel').options[dropdowns[i].querySelector('.sel').selectedIndex].text;
                    console.log(tField + " = " + tValue)

                    newNames.push({ tField: tField, tValue: tValue });
                }
                console.log(newNames)

                const results = [];
                fs.createReadStream(filepath)
                    .pipe(csv({
                        mapHeaders: ({ header, index }) => swapHeaders(header, newNames)
                    }))
                    .on('data', (data) => {
                        data.newColumn = "ID";

                        results.push(data)
                    })
                    .on('end', () => {
                        console.log(results);

                        fileContent = dictionary(results)
                        console.log(fileContent)
                    })
                    .on('error', (error) => alert("error"));
            default:
                quizContainer.innerHTML = "";
        }
        setTimeout(function () {
            try {
                fs.writeFileSync(htmlFilePath, fileContent, 'utf8')
                displayMessage(status, `updated ${name}`, 3000);
            } catch (err) {
                displayMessage(status, `error!!`, 3000);

            }
        }, 1000)
    }
}); //end submit

function swapHeaders(header, obj) {
    let newHeader = obj.filter(ob => ob.tValue == header).map(ob => ob.tField);
    return newHeader
}
//===========================================================================================================================================================//
//==================================== functions ============================================================================================================//
function checkUpdates() {

    let user = "uzair4100";
    let repo = "form-tool";
    let outputdir = path.join(os.homedir(), "AppData/Local/form-tool-updater/pending");
    console.log(outputdir);
    let leaveZipped = false;

    ipcRenderer.on("version", function (e, appVersion) {
        console.log(appVersion);
        let currentVersion = appVersion;
        axios.get(`https://api.github.com/repos/${user}/${repo}/releases/latest`)
            .then((resp) => {
                let data = resp.data
                console.log(data)
                let appName = data.assets[0].name;
                let latestVersion = data.tag_name;
                console.log('latestVersion is ' + latestVersion);
                if (appVersion != "") {
                    if (currentVersion != latestVersion) {
                        console.log("update found")
                        modal.style.display = "";
                        document.querySelector(".card-body").innerHTML = "update found";
                        if (fs.existsSync(outputdir + "/" + appName)) {
                            ipcRenderer.send("downloaded")
                        } else {
                            modal.style.display = "";
                            !fs.existsSync(outputdir) ? fs.mkdirSync(outputdir) : "";
                            let existingFile = fs.readdirSync(outputdir).filter((file) => path.extname(file) == ".exe"); //check for existing exe file and delete them first
                            existingFile.forEach((file) => fs.unlinkSync(outputdir + "/" + file));
                            //console.log(data)
                            let url_exe = data.assets[0].browser_download_url;
                            console.log(url_exe)
                            // shell.openExternal(url_exe)
                            let dest = path.join(outputdir, appName);
                            var file = fs.createWriteStream(dest);

                            axios({
                                url: url_exe,
                                method: 'GET',
                                responseType: 'arraybuffer', // important
                                onDownloadProgress: (progressEvent) => {
                                    let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                    //console.log(percentCompleted);
                                    document.querySelector(".card-body").innerHTML = "Downloading Updates...";
                                    document.querySelector('#bar').innerHTML = `<div class="progress">
                                    <div class="progress-bar progress-bar-striped" role="progressbar" style="width:${percentCompleted}%" aria-valuenow="${percentCompleted}">${percentCompleted}%</div></div>`
                                }
                            }).then(response => {
                                const buffer = Buffer.from(response.data, 'base64');
                                file.write(buffer, 'base64');
                                displayUpdateStatus(modal, "Successfully Downloaded", 1500);

                                file.on('finish', () => {
                                    console.log('wrote all data to file');
                                    ipcRenderer.send("downloaded"); //send event to main process to ask for update
                                });

                                // close the stream
                                file.end();
                            }).catch(e => {
                                existingFile.forEach((file) => fs.unlinkSync(outputdir + "/" + file));
                            })

                        }

                        //show messagebox and begin installation if user response is yes (0)
                        ipcRenderer.on("user-response", function (e, index) {
                            if (index == 0) {
                                //displayUpdateStatus(modal, "Starting Installation", 3000);
                                shell.openExternal(outputdir + "/" + appName)
                                ipcRenderer.send("close-app")
                            } else {
                                modal.style.display = "none";
                            }
                        });
                    } else {
                        console.log("up to date")
                    }
                }
            });
    });
}

function activityFinder(filepath) {
    // return new Promise(function(resolve, reject) {
    let Type = "",
        layout = "",
        accents = "";
    // webInteractive = false;

    let fileExist = fs.existsSync(path.join(filepath, "content.xml"));


    Type = "Select Item";


    return Type;
}

function fetcher(exist, callFunction, filepath, template) {

    quizContainer.innerHTML = template;
    help = helper(filepath); //get content from help file if exists
    initQuill(true)

}


function initQuill(status) {
    //status is true on intail load, false when add/duplicate quiz
    let quillClue = []
    let _toolbar = [
        ['bold', 'italic', 'underline'],
        ['link'],
        [{
            'color': ['#800000', '#6d26e0']
        }],
        ['clean']
    ]
    if (status) {
        let clues = quizContainer.querySelectorAll('.clue');
        for (let i = 0; i < clues.length; i++) {
            quillClue[i] = new Quill(clues[i], {
                modules: {
                    toolbar: _toolbar
                },
                theme: 'bubble'
            });
            let paragraphs = clues[i].querySelector('.ql-editor').querySelectorAll('p');
            for (let j = 0; j < paragraphs.length; j++) {
                let paraText = paragraphs[j].innerText;
                if (paraText.trim().length == 0) {
                    paragraphs[j].remove();
                }
            }
        }

    } else {
        let last_quiz = quizContainer.lastElementChild;
        new Quill(last_quiz.querySelector('.clue'), {
            modules: {
                toolbar: _toolbar
            },
            theme: 'bubble'
        });
    }
}

function helper(filepath) {
    let fileExist = fs.existsSync(path.join(filepath, "help.html"));
    if (fileExist) {
        let content = fs.readFileSync(path.join(filepath, "help.html"), "utf-8");
        console.log(content);
        return content;
    }
}

function arrange(classname) {
    let quizzes = quizContainer.querySelectorAll(classname);
    for (let i = 0; i < quizzes.length; i++) {
        quizzes[i].querySelector(".no").innerHTML = i + 1;
        let radios = quizzes[i].querySelectorAll("input[type=radio]");
        for (let r = 0; r < radios.length; r++) {
            radios[r].setAttribute("name", i + 1);

            if (radios[r].checked) {
                radios[r].setAttribute("checked", true);
            } else {
                radios[r].removeAttribute("checked", true);
            }
        }
    }
    optionValue = quizContainer.querySelectorAll("input[type=text]");
    for (let i = 0; i < optionValue.length; i++) {
        optionValue[i].setAttribute("value", optionValue[i].value);
    }
}




function removeFadeOut(el, speed) {
    var seconds = speed / 1000;
    el.style.transition = "opacity " + seconds + "s ease";

    el.style.opacity = 0;
    setTimeout(function () {
        el.remove();
        arrange(".quiz");
    }, speed);
}

function auto_grow(element) {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
}

function displayMessage(status, msg, duration) {
    status.style.display = "";
    status.innerHTML = msg;
    setTimeout(function () {
        status.style.display = "none";
    }, duration);
}

function displayUpdateStatus(modal, msg, duration) {
    modal.style.display = "";
    document.querySelector(".card-body").innerHTML = msg;
    setTimeout(function () {
        modal.style.display = "none";
    }, duration);
}

function fillLayouts() {
    const layoutSelector = document.getElementById('layout');
    axios.get('\\\\vsl-file01\\coursesdev$\\template\\layouts.json').then(function (response) {
        let layouts = response.data;

        layouts.forEach(function (layout) {
            layoutSelector.insertAdjacentHTML('beforeend', `<option data-toggle="tooltip" data-placement="bottom" title="test">selectitem1</option>`)
        })
    })

}

function makeheaders(headers) {
    let headerNames = ["FieldName", "FormName", "SectionHeader", "FieldType", "FieldLabel", "Choices", "FieldNote", "TextValidation", "TextValidationMin", "TextValidationMax", "Identifier?", "BranchingLogic", "RequiredField"];
    console.log(headers)
    let headerContent = '', opt = '';
    headers.forEach(function (header, i) {
        opt += `<option value="${i}">${header}</option>`
    })
    for (let index = 0; index < headerNames.length; index++) {

        headerContent +=
            `<div class="d-flex justify-content-around align-items-start mb-2 dropdown">
              <div class="h5 mr-3 name">${headerNames[index]}</div>
                <select class="form-select form-select-sm sel">
                  <option selected></option>
                  ${opt}
                </select>
            </div>`
    }
    // headerContent+ = `<button class="btn btn-info" id="clear">Clear</button>`
    quizContainer.innerHTML = headerContent
}
//clear app
document.querySelector("#clear").addEventListener("click", function () {
    location.reload();
});


