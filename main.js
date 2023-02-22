const electron = require('electron');
const url = require('url');
const http = require('http');
const path = require('path');
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;
const { app, BrowserWindow } = electron
var mainWindow, helpWindow = "",
    position = [];
const isDev = require('electron-is-dev');


app.on('ready', function() {
    //creat new window
    mainWindow = new BrowserWindow({
        width: 850,
        minWidth: 850,
        minHeight: 925,
        height: 925,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // load html
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }));

    if (isDev) {
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.removeMenu();
    }


    console.log('App loaded...');

    //receive load file event
    ipcMain.on('chooseFile-dialog', function(event) {
        var window = BrowserWindow.fromWebContents(event.sender);

        var chooseFileOptions = {
                title: 'Choose activity Folder',
                buttonLabel: 'Select',
                properties: [
                    'openFile'
                ]
            }
            /* dialog.showOpenDialog({}, chooseFileOptions, function(folders) {
                 if (folders)
                     event.sender.send('chooseFile-selected', folders);
             })*/
        dialog.showOpenDialog(mainWindow, chooseFileOptions).then(filepaths => {
            if (filepaths) {
                event.sender.send('chooseFile-selected', filepaths);
            }
            console.log(filepaths)
        })
    });

   
    var helpWindowOption = {
        height: 850,
        minWidth: 600,
        width: 600,
        parent: mainWindow,
        maximizable: false,
        minimizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    }

    //help window
    ipcMain.on("help-window", function(e, data) {
        console.log(helpWindow)
       // if (helpWindow == "") {
            helpWindow = new BrowserWindow(helpWindowOption);
            helpWindow.loadURL(
                url.format({
                    pathname: path.join(__dirname, "help.html"),
                    protocol: "file",
                    slashes: true
                })
            );

            helpWindow.webContents.once("dom-ready", () => {
                helpWindow.webContents.send("help-window", data);
                console.log(data);
            });
       // }
    });

    //set position of child window relevent to main window
    mainWindow.on('move', function() {
        position = mainWindow.getPosition();
        Object.assign(helpWindowOption, {
            x: position[0] + 100,
            y: position[1] + 100
        })
    });

    //get data from help page
    ipcMain.on("help-data", function(e, data) {
        e.preventDefault();
        console.log(data);
        mainWindow.webContents.send("help-data", data);
        helpWindow.close();
        helpWindow = ""
    });

    //close
    ipcMain.on("close", function(e) {
        helpWindow.close();
        helpWindow = ""
    });


    mainWindow.webContents.once("dom-ready", () => {

        let appVersion = ``;
        console.log(appVersion)
        if (!isDev) {
            appVersion = `v${app.getVersion()}`;
        }

        mainWindow.webContents.send('version', appVersion);

    });

    ipcMain.on('downloaded', (info) => {
        //  mainWindow.webContents.send('download-success', "Successfully Downloaded!");
        dialog.showMessageBox(mainWindow, {
            title: 'Update Available',
            type: 'question',
            message: 'A new version of app is available. Do you want to update now?',
            buttons: ['Yes', 'No']
        }, function(index) {
            console.log(index)
            mainWindow.webContents.send('user-response', index); //send user response to renderer 0 or 1
        })
    });

    ipcMain.on('close-app', () => {
        app.quit()
    });
});