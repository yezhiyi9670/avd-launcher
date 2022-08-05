const {app, Menu} = require('@electron/remote');
const path = require('path');

/**
 * 删除应用标题栏
 */
(() => {
	Menu.setApplicationMenu(null);
})();

/**
 * 获取应用目录
 */
(() => {
	// window.appDir = path.join(__dirname, '../../../');
	window.appDir = path.join(app.getAppPath(), '../../');
})();

/**
 * 引用关键内容
 */
require('./wcl-utils.js');
require('./wcl-components.js');
require('./wcl-settings-provider.js');
require('./wcl-settings-ui.js');
require('./virtual-devices.js');
require('./virtual-devices-ui.js');

/**
 * 初始化
 */
(() => {
	/**
	 * 设置提供器初始化
	 */
	if(!SettingsProvider.init()) {
		console.error('Failed to read settings.');
		mdui.alert('Failed to read settings. If settings are corrupt, please delete data/settings.json.', 'Abnormal state');
	}
	/**
	 * 设置界面初始化
	 */
	$(() => {
		SettingsUI.mutate();
		$('.wcl-page-containers[wcl-page=settings]').on('wcl-page-enter', () => {
			SettingsUI.actuate();
		});
	});
	/**
	 * 设备列表界面初始化
	 */
	$(() => {
		$('.wcl-page-containers[wcl-page=list]').on('wcl-page-enter', () => {
			VirtualDevicesUI.load_devices_async();
		});
	});
})();

require('./wcl-page.js');
