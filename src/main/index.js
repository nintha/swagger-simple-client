import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path';
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    webPreferences: { webSecurity: false },
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('save-file', (event, arg) => {
  dialog.showSaveDialog(function (filename) {
    if (filename) {
      fs.writeFileSync(filename, arg);
      event.returnValue = filename
    } else {
      event.returnValue = null
    }
  })
})

ipcMain.on('open-file', (event, arg) => {
  try {    
    if (arg) {
      event.returnValue = fs.readFileSync(arg).toString()
    } else {
      dialog.showOpenDialog(function (filenames) {
        if (filenames) {
          event.returnValue = fs.readFileSync(filenames[0]).toString()
        } else {
          event.returnValue = null
        }
      })
    }
  } catch (error) {
    event.returnValue = null
  }
})

ipcMain.on('open-directory', (event, arg) => {
  const readFileInDir = (dirPath) => {
    const filenames = fs.readdirSync(dirPath);
    return filenames.map(filename => {
      const filePath = path.join(dirPath, filename)
      const json = fs.readFileSync(filePath).toString()
      return {
        dirPath,
        filePath,
        filename,
        data: JSON.parse(json)
      }
    });
  }
  if (arg) {
    event.returnValue = readFileInDir(arg)
  } else {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, function (directory) {
      if (directory) {
        event.returnValue = readFileInDir(directory[0])
      } else {
        event.returnValue = null;
      }
    });
  }
})


/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
