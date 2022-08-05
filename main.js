const {
	app, BrowserWindow, ipcMain, Menu
} = require('electron');
const fs = require('fs');
const path = require('path');
const electron_remote = require('@electron/remote/main');
electron_remote.initialize();

function createWindow () {
	let sizePath = path.join(app.getAppPath(), '../../data/window-size.json');
	let winSize = {width: 600, height: 480};
	try {
		if(!fs.existsSync(path.join(app.getAppPath(), '../../data/'))) {
			fs.mkdirSync(path.join(app.getAppPath(), '../../data/'));
		}
		if(!fs.existsSync(sizePath)) {
			fs.writeFileSync(sizePath, JSON.stringify({width: 600, height: 480}));
		}
		let data = JSON.parse(fs.readFileSync(sizePath));
		winSize.width = +data.width;
		winSize.height = +data.height;
	} catch(err) {
		console.error('Cannot load window size');
	}

	const win = new BrowserWindow({
		width: winSize.width + (app.isPackaged ? 0 : 500),
		height: winSize.height,
		minWidth: 560,
		minHeight: 400,
		maximizable: false,
		resizable: true,
		frame: true,
		autoHideMenuBar: false,
		title: 'AVD Launcher',
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		}
	});

	Menu.setApplicationMenu(null);

	electron_remote.enable(win.webContents);
	win.loadFile('index.html');
	if(!app.isPackaged) win.webContents.openDevTools();
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});


